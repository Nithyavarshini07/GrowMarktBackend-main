import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { NextFunction, Response } from "express";
import { AuthRequest } from "@/middleware/auth.middleware";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "@/utils/errors";
import { config } from "@/config";
import {
  Campaign,
  ContentProject,
  ContentProjectStatus,
  GeneratedPost,
  PipelineErrorStep,
} from "@/models";
import { emitRealtime } from "@/realtime";
import { enqueueTaskWithResult } from "@/services/simple-queue.service";
import {
  analyzeIdea,
  captionFromImage,
  editImage,
  generateCaptionOptions,
  generateImage,
  predictEngagement,
} from "@/services/ai-content-pipeline.service";
import {
  createActivityEvent,
  createNotificationEvent,
} from "@/services/activity-notification.service";
import { toPostResponse } from "@/services/post-format.service";

const STAGE_ORDER: ContentProjectStatus[] = [
  "IDEA",
  "ANALYZED",
  "IMAGE_GENERATED",
  "EDITED",
  "CAPTION_GENERATED",
  "READY",
  "PUBLISHED",
];

const PLATFORM_VALUES = [
  "linkedin",
  "instagram",
  "facebook",
  "twitter",
] as const;
type PlatformValue = (typeof PLATFORM_VALUES)[number];

const CONTENT_PROJECT_STATUSES = new Set<string>(STAGE_ORDER);

function requireUserId(req: AuthRequest): string {
  if (!req.userId) throw new UnauthorizedError();
  return req.userId;
}

function statusIndex(status: ContentProjectStatus): number {
  return STAGE_ORDER.indexOf(status);
}

function assertStage(
  project: any,
  allowed: ContentProjectStatus[],
  action: string,
): void {
  const current = project.status as ContentProjectStatus;
  if (!allowed.includes(current)) {
    throw new BadRequestError(
      `Invalid stage for ${action}. Current: ${current}. Allowed: ${allowed.join(", ")}`,
    );
  }
}

function normalizePlatforms(value: unknown): PlatformValue[] {
  if (!Array.isArray(value)) return [];

  const normalized = value
    .map((item) => String(item).toLowerCase())
    .filter((item): item is PlatformValue =>
      (PLATFORM_VALUES as readonly string[]).includes(item),
    );

  return Array.from(new Set(normalized));
}

function getFileExtension(mimeType: string): string {
  const lower = mimeType.toLowerCase();
  if (lower.includes("png")) return "png";
  if (lower.includes("jpeg") || lower.includes("jpg")) return "jpg";
  if (lower.includes("webp")) return "webp";
  if (lower.includes("svg")) return "svg";
  return "bin";
}

function ensureUploadsDir(): string {
  const uploadsDir = path.resolve(config.uploads.dir);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
}

function saveAssetFile(input: {
  buffer: Buffer;
  mimeType: string;
  prefix: string;
}): string {
  const uploadsDir = ensureUploadsDir();
  const extension = getFileExtension(input.mimeType);
  const fileName = `${input.prefix}-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, input.buffer);

  const base = config.uploads.baseUrl.replace(/\/$/, "");
  return `${base}/uploads/designs/${fileName}`;
}

function sanitizeHashtags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((item) => String(item).trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag.replace(/\s+/g, "")}`))
    .slice(0, 15);
}

function pushHistory(
  project: any,
  input: {
    fromStatus?: ContentProjectStatus;
    toStatus: ContentProjectStatus;
    action: string;
    actor: "ai" | "user" | "system";
    meta?: Record<string, unknown>;
  },
): void {
  project.history.push({
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    action: input.action,
    actor: input.actor,
    timestamp: new Date(),
    meta: input.meta || {},
  });
}

function transitionStrict(
  project: any,
  toStatus: ContentProjectStatus,
  action: string,
  actor: "ai" | "user" | "system",
  meta?: Record<string, unknown>,
): void {
  if (project.status === toStatus) return;

  const fromStatus = project.status as ContentProjectStatus;
  const fromIndex = statusIndex(fromStatus);
  const toIndex = statusIndex(toStatus);

  if (toIndex !== fromIndex + 1) {
    throw new BadRequestError(
      `Invalid pipeline transition from ${fromStatus} to ${toStatus}`,
    );
  }

  project.status = toStatus;
  pushHistory(project, {
    fromStatus,
    toStatus,
    action,
    actor,
    meta,
  });
}

function clearPipelineError(project: any): void {
  if (project.error) {
    project.error = undefined;
  }
}

function shouldRecordPipelineFailure(error: unknown): boolean {
  if (error instanceof BadRequestError) {
    return !error.message.startsWith("Invalid stage for");
  }

  if (error instanceof NotFoundError || error instanceof UnauthorizedError) {
    return false;
  }

  return true;
}

async function recordPipelineError(
  project: any,
  step: PipelineErrorStep,
  error: unknown,
  retryable = true,
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  project.error = {
    step,
    message,
    retryable,
    failedAt: new Date(),
  };

  pushHistory(project, {
    fromStatus: project.status,
    toStatus: project.status,
    action: "step_failed",
    actor: "system",
    meta: { step, message, retryable },
  });

  await project.save();
  emitPipelineEvent(project, "updated", {
    failedStep: step,
    errorMessage: message,
    retryable,
  });
}

function resolveRootAssetId(asset: any, lookup: Map<string, any>): string {
  let current = asset;
  const visited = new Set<string>();

  while (current?.sourceAssetId) {
    const parentId = String(current.sourceAssetId);
    const parent = lookup.get(parentId);
    if (!parent) break;
    if (visited.has(parentId)) break;
    visited.add(parentId);
    current = parent;
  }

  return String(current.assetId);
}

function toFlatAsset(
  asset: any,
  selectedAssetId?: string,
): Record<string, unknown> {
  const assetId = String(asset.assetId);
  return {
    id: assetId,
    assetId,
    kind: asset.kind,
    url: asset.url,
    sourceAssetId: asset.sourceAssetId || null,
    version: Number(asset.version || 1),
    prompt: asset.prompt || null,
    selected: selectedAssetId ? selectedAssetId === assetId : false,
    createdAt: asset.createdAt,
    meta: asset.meta || {},
  };
}

function buildGroupedAssets(project: any): Array<Record<string, unknown>> {
  const assets = Array.isArray(project.assets) ? project.assets : [];
  const selectedAssetId = project.selectedAssetId
    ? String(project.selectedAssetId)
    : undefined;

  if (!assets.length) return [];

  const lookup = new Map<string, any>();
  for (const asset of assets) {
    lookup.set(String(asset.assetId), asset);
  }

  const groups = new Map<string, any[]>();
  for (const asset of assets) {
    const rootId = resolveRootAssetId(asset, lookup);
    const current = groups.get(rootId) || [];
    current.push(asset);
    groups.set(rootId, current);
  }

  return Array.from(groups.entries()).map(([groupId, items]) => {
    const sorted = items
      .slice()
      .sort((a, b) => {
        const va = Number(a.version || 1);
        const vb = Number(b.version || 1);
        if (va !== vb) return va - vb;
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      })
      .map((item) => toFlatAsset(item, selectedAssetId));

    const selected = sorted.some((item: any) => item.selected === true);

    return {
      id: groupId,
      selected,
      versions: sorted,
    };
  });
}

function ensureCaptionSelection(captions: any[]): any[] {
  const normalized = Array.isArray(captions) ? captions.slice() : [];
  if (!normalized.length) return [];

  const selectedIndex = normalized.findIndex((item) =>
    Boolean(item?.isSelected),
  );
  const keepIndex = selectedIndex >= 0 ? selectedIndex : 0;

  return normalized.map((item, idx) => ({
    ...item,
    isSelected: idx === keepIndex,
  }));
}

function getCaptionOptions(project: any): any[] {
  const current = ensureCaptionSelection(
    Array.isArray(project.captions) ? project.captions : [],
  );

  if (current.length > 0) return current;

  const legacyCaption = String(project.caption || "").trim();
  if (!legacyCaption) return [];

  return [
    {
      id: `legacy-${randomUUID().slice(0, 8)}`,
      text: legacyCaption,
      isSelected: true,
      hashtags: [],
      tone: "legacy",
      source: "user",
      createdAt: project.updatedAt || new Date(),
    },
  ];
}

function getSelectedCaption(project: any): any | null {
  const captions = getCaptionOptions(project);
  if (!captions.length) return null;
  return captions.find((item) => item.isSelected) || captions[0];
}

function projectResponse(project: any): Record<string, unknown> {
  const captions = getCaptionOptions(project).map((item) => ({
    id: String(item.id),
    text: String(item.text || ""),
    isSelected: Boolean(item.isSelected),
    hashtags: sanitizeHashtags(item.hashtags || []),
    tone: item.tone || null,
    source: item.source || "ai",
    createdAt: item.createdAt,
  }));

  const selectedCaption =
    captions.find((item) => item.isSelected) || captions[0] || null;

  const selectedAssetId = project.selectedAssetId
    ? String(project.selectedAssetId)
    : null;

  return {
    projectId: String(project._id),
    id: String(project._id),
    status: project.status,
    ideaInput: project.ideaInput,
    analysis: project.analysis || {},
    selectedAssetId,
    assets: buildGroupedAssets(project),
    assetItems: (project.assets || []).map((asset: any) =>
      toFlatAsset(asset, selectedAssetId || undefined),
    ),
    captions,
    caption: selectedCaption?.text || "",
    hashtags: selectedCaption?.hashtags || [],
    selectedCaptionId: selectedCaption?.id || null,
    platforms: project.platforms || [],
    scheduledAt: project.scheduledAt || null,
    campaignId: project.campaignId ? String(project.campaignId) : null,
    postIds: (project.postIds || []).map((id: any) => String(id)),
    error: project.error
      ? {
          step: project.error.step,
          message: project.error.message,
          retryable: Boolean(project.error.retryable),
          failedAt: project.error.failedAt,
        }
      : null,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

function emitPipelineEvent(
  project: any,
  event: "updated" | "completed",
  extra?: Record<string, unknown>,
): void {
  emitRealtime("pipeline", event, {
    projectId: String(project._id),
    status: project.status,
    ...extra,
  });
}

function nextAssetVersion(project: any, sourceAssetId?: string): number {
  if (!sourceAssetId) {
    const topLevel = (project.assets || []).filter(
      (asset: any) => !asset.sourceAssetId,
    );
    if (topLevel.length === 0) return 1;
    return (
      Math.max(...topLevel.map((asset: any) => Number(asset.version || 1))) + 1
    );
  }

  const related = (project.assets || []).filter(
    (asset: any) =>
      asset.assetId === sourceAssetId || asset.sourceAssetId === sourceAssetId,
  );

  if (related.length === 0) return 1;
  return (
    Math.max(...related.map((asset: any) => Number(asset.version || 1))) + 1
  );
}

function latestAsset(project: any): any | null {
  const assets = project.assets || [];
  if (!assets.length) return null;

  if (project.selectedAssetId) {
    const selected = assets.find(
      (asset: any) => String(asset.assetId) === String(project.selectedAssetId),
    );
    if (selected) return selected;
  }

  return assets[assets.length - 1];
}

function normalizeStatusFilter(value: unknown): ContentProjectStatus | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.trim().toUpperCase();
  if (!CONTENT_PROJECT_STATUSES.has(normalized)) {
    throw new BadRequestError(
      `status must be one of: ${Array.from(CONTENT_PROJECT_STATUSES).join(", ")}`,
    );
  }
  return normalized as ContentProjectStatus;
}

async function findProjectForUser(
  projectId: string,
  userId: string,
): Promise<any> {
  const project = await ContentProject.findOne({ _id: projectId, userId });
  if (!project) throw new NotFoundError("Content project not found");
  return project;
}

async function runAnalysisStep(project: any, projectId: string): Promise<void> {
  const analysis = await enqueueTaskWithResult(
    `pipeline:analyze:${projectId}:${Date.now()}`,
    () => analyzeIdea(project.ideaInput),
  );

  project.analysis = {
    targetAudience: analysis.targetAudience,
    contentAngles: analysis.contentAngles,
    hooks: analysis.hooks,
    hashtags: sanitizeHashtags(analysis.hashtags),
  };

  clearPipelineError(project);

  if (project.status === "IDEA") {
    transitionStrict(project, "ANALYZED", "analysis_generated", "ai", {
      task: "analyzeIdea",
    });
  } else {
    pushHistory(project, {
      fromStatus: project.status,
      toStatus: project.status,
      action: "analysis_refreshed",
      actor: "ai",
    });
  }
}

async function runImageGenerationStep(input: {
  project: any;
  projectId: string;
  style: "modern" | "minimal" | "3d" | "marketing";
  count: number;
}): Promise<Array<{ id: string; url: string }>> {
  const images: Array<{ id: string; url: string }> = [];

  for (let index = 0; index < input.count; index += 1) {
    const generated = await enqueueTaskWithResult(
      `pipeline:generate-image:${input.projectId}:${Date.now()}:${index}`,
      () =>
        generateImage({
          idea: input.project.ideaInput,
          style: input.style,
          analysis: input.project.analysis,
        }),
    );

    const imageBuffer = Buffer.from(generated.imageBase64, "base64");
    const imageUrl = saveAssetFile({
      buffer: imageBuffer,
      mimeType: generated.mimeType,
      prefix: `project-${input.projectId}-generated`,
    });

    const assetId = randomUUID();
    input.project.assets.push({
      assetId,
      kind: "generated",
      url: imageUrl,
      prompt: generated.prompt,
      version: nextAssetVersion(input.project),
      createdAt: new Date(),
      meta: { provider: generated.provider, style: input.style },
    });

    if (!input.project.selectedAssetId) {
      input.project.selectedAssetId = assetId;
    }

    images.push({ id: assetId, url: imageUrl });
  }

  clearPipelineError(input.project);

  if (input.project.status === "ANALYZED") {
    transitionStrict(
      input.project,
      "IMAGE_GENERATED",
      "image_generated",
      "ai",
      {
        generatedCount: images.length,
        style: input.style,
      },
    );
  } else {
    pushHistory(input.project, {
      fromStatus: input.project.status,
      toStatus: input.project.status,
      action: "image_regenerated",
      actor: "ai",
      meta: { generatedCount: images.length, style: input.style },
    });
  }

  return images;
}

async function runCaptionGenerationStep(input: {
  project: any;
  projectId: string;
  tone: "professional" | "viral" | "storytelling";
  count: number;
}): Promise<{ selectedCaption: string; hashtags: string[] }> {
  const generated = await enqueueTaskWithResult(
    `pipeline:generate-caption:${input.projectId}:${Date.now()}`,
    () =>
      generateCaptionOptions({
        idea: input.project.ideaInput,
        tone: input.tone,
        analysis: input.project.analysis,
        count: input.count,
      }),
  );

  const hashtags = sanitizeHashtags(generated.hashtags);
  const options = (generated.captions || [])
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, input.count);

  if (!options.length) {
    throw new BadRequestError("Caption generation returned no options");
  }

  input.project.captions = options.map((text, idx) => ({
    id: randomUUID(),
    text,
    isSelected: idx === 0,
    hashtags,
    tone: input.tone,
    source: "ai",
    createdAt: new Date(),
  }));

  clearPipelineError(input.project);

  if (input.project.status === "EDITED") {
    transitionStrict(
      input.project,
      "CAPTION_GENERATED",
      "caption_generated",
      "ai",
      {
        tone: input.tone,
        optionCount: options.length,
      },
    );
  } else {
    pushHistory(input.project, {
      fromStatus: input.project.status,
      toStatus: input.project.status,
      action: "caption_regenerated",
      actor: "ai",
      meta: { tone: input.tone, optionCount: options.length },
    });
  }

  const selectedCaption = options[0];
  input.project.analysis = {
    ...(input.project.analysis || {}),
    hashtags: hashtags.length
      ? hashtags
      : input.project.analysis?.hashtags || [],
    engagementPrediction: predictEngagement({
      caption: selectedCaption,
      hashtags,
      platforms: (input.project.platforms || []) as string[],
    }),
  };

  return { selectedCaption, hashtags };
}

export async function createIdeaProject(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const idea = String(req.body?.idea || "").trim();

    if (!idea) throw new BadRequestError("idea is required");

    const project = await ContentProject.create({
      userId,
      campaignId: req.body?.campaignId || undefined,
      status: "IDEA",
      ideaInput: idea,
      analysis: {
        contentAngles: [],
        hooks: [],
        hashtags: [],
      },
      assets: [],
      captions: [],
      platforms: [],
      postIds: [],
      history: [
        {
          toStatus: "IDEA",
          action: "idea_created",
          actor: "user",
          timestamp: new Date(),
          meta: { ideaLength: idea.length },
        },
      ],
    });

    await createActivityEvent({
      userId,
      category: "TEAM",
      type: "success",
      title: "Content project created",
      description: "A new content workflow was started from your idea.",
      actor: "Composer",
      meta: { projectId: String(project._id) },
    });

    emitPipelineEvent(project, "updated", { action: "idea_created" });

    res.status(201).json({
      success: true,
      data: projectResponse(project),
    });
  } catch (error) {
    next(error);
  }
}

export async function analyzeProjectIdea(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  let project: any;
  try {
    const userId = requireUserId(req);
    const projectId = String(req.body?.projectId || "").trim();
    if (!projectId) throw new BadRequestError("projectId is required");

    project = await findProjectForUser(projectId, userId);
    assertStage(project, ["IDEA"], "analyze");

    await runAnalysisStep(project, projectId);
    await project.save();

    await createActivityEvent({
      userId,
      category: "TEAM",
      type: "success",
      title: "Idea analyzed",
      description: "AI analysis completed for your content project.",
      actor: "AI Strategist",
      meta: { projectId: String(project._id) },
    });

    emitPipelineEvent(project, "updated", { action: "analysis_generated" });

    res.status(200).json({
      success: true,
      data: projectResponse(project),
    });
  } catch (error) {
    if (project && shouldRecordPipelineFailure(error)) {
      await recordPipelineError(project, "ANALYSIS", error, true).catch(
        () => undefined,
      );
    }
    next(error);
  }
}

export async function generateProjectImage(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  let project: any;
  try {
    const userId = requireUserId(req);
    const projectId = String(req.body?.projectId || "").trim();
    const style = String(req.body?.style || "modern").toLowerCase();
    const count = Math.min(6, Math.max(1, Number(req.body?.count || 3)));

    if (!projectId) throw new BadRequestError("projectId is required");
    if (!["modern", "minimal", "3d", "marketing"].includes(style)) {
      throw new BadRequestError(
        "style must be one of modern, minimal, 3d, marketing",
      );
    }

    project = await findProjectForUser(projectId, userId);
    assertStage(project, ["ANALYZED", "IMAGE_GENERATED"], "generate-image");

    const images = await runImageGenerationStep({
      project,
      projectId,
      style: style as "modern" | "minimal" | "3d" | "marketing",
      count,
    });

    await project.save();
    emitPipelineEvent(project, "updated", {
      action: "image_generated",
      generatedCount: images.length,
    });

    res.status(200).json({
      success: true,
      data: {
        ...projectResponse(project),
        images,
      },
    });
  } catch (error) {
    if (project && shouldRecordPipelineFailure(error)) {
      await recordPipelineError(project, "IMAGE_GENERATION", error, true).catch(
        () => undefined,
      );
    }
    next(error);
  }
}

export async function selectProjectImage(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const projectId = String(req.body?.projectId || "").trim();
    const assetId = String(req.body?.assetId || "").trim();

    if (!projectId) throw new BadRequestError("projectId is required");
    if (!assetId) throw new BadRequestError("assetId is required");

    const project = await findProjectForUser(projectId, userId);
    assertStage(
      project,
      ["IMAGE_GENERATED", "EDITED", "CAPTION_GENERATED", "READY"],
      "select-image",
    );

    const exists = (project.assets || []).find(
      (item: any) => String(item.assetId) === assetId,
    );
    if (!exists) {
      throw new NotFoundError("Asset not found in project");
    }

    project.selectedAssetId = assetId;

    if (project.status === "IMAGE_GENERATED") {
      transitionStrict(project, "EDITED", "image_selected", "user", {
        assetId,
      });
    } else {
      pushHistory(project, {
        fromStatus: project.status,
        toStatus: project.status,
        action: "image_selected",
        actor: "user",
        meta: { assetId },
      });
    }

    await project.save();

    emitPipelineEvent(project, "updated", {
      action: "image_selected",
      assetId,
    });

    res.status(200).json({
      success: true,
      data: projectResponse(project),
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadProjectImage(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const projectId = String(req.body?.projectId || "").trim();

    if (!projectId) throw new BadRequestError("projectId is required");

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) throw new BadRequestError("image file is required");

    if (!file.mimetype?.startsWith("image/")) {
      throw new BadRequestError("uploaded file must be an image");
    }

    const project = await findProjectForUser(projectId, userId);
    assertStage(
      project,
      ["ANALYZED", "IMAGE_GENERATED", "EDITED", "CAPTION_GENERATED", "READY"],
      "upload-image",
    );

    const imageUrl = saveAssetFile({
      buffer: file.buffer,
      mimeType: file.mimetype,
      prefix: `project-${projectId}-upload`,
    });

    const assetId = randomUUID();
    project.assets.push({
      assetId,
      kind: "uploaded",
      url: imageUrl,
      version: nextAssetVersion(project),
      createdAt: new Date(),
      meta: {
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      },
    });
    project.selectedAssetId = assetId;

    if (project.status === "ANALYZED") {
      transitionStrict(
        project,
        "IMAGE_GENERATED",
        "manual_image_seeded",
        "user",
        {
          assetId,
        },
      );
      transitionStrict(project, "EDITED", "manual_image_uploaded", "user", {
        assetId,
      });
    } else if (project.status === "IMAGE_GENERATED") {
      transitionStrict(project, "EDITED", "manual_image_uploaded", "user", {
        assetId,
      });
    } else {
      pushHistory(project, {
        fromStatus: project.status,
        toStatus: project.status,
        action: "manual_image_uploaded",
        actor: "user",
        meta: { assetId },
      });
    }

    await project.save();

    emitPipelineEvent(project, "updated", {
      action: "manual_image_uploaded",
      assetId,
    });

    res.status(201).json({
      success: true,
      data: {
        ...projectResponse(project),
        assetId,
        url: imageUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function editProjectImageWithAI(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  let project: any;
  try {
    const userId = requireUserId(req);
    const projectId = String(req.body?.projectId || "").trim();
    const assetId = String(req.body?.assetId || "").trim();
    const prompt = String(req.body?.prompt || "").trim();

    if (!projectId) throw new BadRequestError("projectId is required");
    if (!assetId) throw new BadRequestError("assetId is required");
    if (!prompt) throw new BadRequestError("prompt is required");

    project = await findProjectForUser(projectId, userId);
    assertStage(project, ["IMAGE_GENERATED", "EDITED"], "edit-image");

    const sourceAsset = (project.assets || []).find(
      (item: any) => String(item.assetId) === assetId,
    );
    if (!sourceAsset) throw new NotFoundError("Asset not found in project");

    const edited = await enqueueTaskWithResult(
      `pipeline:edit-image:${projectId}:${Date.now()}`,
      () =>
        editImage({
          idea: project.ideaInput,
          sourceUrl: sourceAsset.url,
          editPrompt: prompt,
        }),
    );

    const editedBuffer = Buffer.from(edited.imageBase64, "base64");
    const editedUrl = saveAssetFile({
      buffer: editedBuffer,
      mimeType: edited.mimeType,
      prefix: `project-${projectId}-edited`,
    });

    const newAssetId = randomUUID();
    project.assets.push({
      assetId: newAssetId,
      kind: "edited",
      url: editedUrl,
      sourceAssetId: assetId,
      prompt,
      version: nextAssetVersion(project, assetId),
      createdAt: new Date(),
      meta: { provider: edited.provider },
    });
    project.selectedAssetId = newAssetId;

    clearPipelineError(project);

    if (project.status === "IMAGE_GENERATED") {
      transitionStrict(project, "EDITED", "image_edited", "ai", {
        sourceAssetId: assetId,
        newAssetId,
      });
    } else {
      pushHistory(project, {
        fromStatus: project.status,
        toStatus: project.status,
        action: "image_reedited",
        actor: "ai",
        meta: { sourceAssetId: assetId, newAssetId },
      });
    }

    await project.save();

    emitPipelineEvent(project, "updated", {
      action: "image_edited",
      sourceAssetId: assetId,
      newAssetId,
    });

    res.status(200).json({
      success: true,
      data: {
        ...projectResponse(project),
        editedUrl,
      },
    });
  } catch (error) {
    if (project && shouldRecordPipelineFailure(error)) {
      await recordPipelineError(project, "IMAGE_GENERATION", error, true).catch(
        () => undefined,
      );
    }
    next(error);
  }
}

export async function generateProjectCaption(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  let project: any;
  try {
    const userId = requireUserId(req);
    const projectId = String(req.body?.projectId || "").trim();
    const tone = String(req.body?.tone || "professional").toLowerCase();
    const count = Math.min(5, Math.max(2, Number(req.body?.count || 3)));

    if (!projectId) throw new BadRequestError("projectId is required");
    if (!["professional", "viral", "storytelling"].includes(tone)) {
      throw new BadRequestError(
        "tone must be one of professional, viral, storytelling",
      );
    }

    project = await findProjectForUser(projectId, userId);
    assertStage(project, ["EDITED", "CAPTION_GENERATED"], "generate-caption");

    const result = await runCaptionGenerationStep({
      project,
      projectId,
      tone: tone as "professional" | "viral" | "storytelling",
      count,
    });

    await project.save();

    emitPipelineEvent(project, "updated", {
      action: "caption_generated",
      optionCount: project.captions?.length || 0,
    });

    res.status(200).json({
      success: true,
      data: {
        ...projectResponse(project),
        caption: result.selectedCaption,
        hashtags: result.hashtags,
      },
    });
  } catch (error) {
    if (project && shouldRecordPipelineFailure(error)) {
      await recordPipelineError(project, "CAPTION", error, true).catch(
        () => undefined,
      );
    }
    next(error);
  }
}

export async function generateCaptionFromImage(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    requireUserId(req);

    const imageUrl = String(req.body?.imageUrl || "").trim();
    const platform = String(req.body?.platform || "instagram").toLowerCase();

    if (!imageUrl) throw new BadRequestError("imageUrl is required");
    if (!(PLATFORM_VALUES as readonly string[]).includes(platform)) {
      throw new BadRequestError(
        `platform must be one of: ${PLATFORM_VALUES.join(", ")}`,
      );
    }

    const generated = await enqueueTaskWithResult(
      `pipeline:caption-from-image:${Date.now()}`,
      () => captionFromImage({ imageUrl, platform }),
    );

    const hashtags = sanitizeHashtags(generated.hashtags);

    res.status(200).json({
      success: true,
      data: {
        projectId: null,
        status: null,
        assets: [],
        captions: [
          {
            id: randomUUID(),
            text: generated.caption,
            isSelected: true,
            hashtags,
            tone: "auto",
            source: "ai",
            createdAt: new Date(),
          },
        ],
        caption: generated.caption,
        hashtags,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function selectProjectCaption(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const projectId = String(req.body?.projectId || "").trim();
    const captionId = String(req.body?.captionId || "").trim();

    if (!projectId) throw new BadRequestError("projectId is required");
    if (!captionId) throw new BadRequestError("captionId is required");

    const project = await findProjectForUser(projectId, userId);
    assertStage(
      project,
      ["CAPTION_GENERATED", "READY"],
      "select-caption",
    );

    const captionIndex = (project.captions || []).findIndex(
      (item: any) => String(item.id) === captionId,
    );

    if (captionIndex < 0) {
      throw new NotFoundError("captionId not found in project captions");
    }

    // Mark the chosen caption as selected, unselect others
    project.captions = (project.captions || []).map((item: any, idx: number) => ({
      ...item,
      isSelected: idx === captionIndex,
    }));

    clearPipelineError(project);

    if (project.status === "CAPTION_GENERATED") {
      transitionStrict(project, "READY", "caption_selected", "user", {
        captionId,
      });
    } else {
      pushHistory(project, {
        fromStatus: project.status,
        toStatus: project.status,
        action: "caption_reselected",
        actor: "user",
        meta: { captionId },
      });
    }

    await project.save();

    emitPipelineEvent(project, "updated", {
      action: "caption_selected",
      captionId,
    });

    res.status(200).json({
      success: true,
      data: projectResponse(project),
    });
  } catch (error) {
    next(error);
  }
}


export async function saveProjectDraft(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {

  try {
    const userId = requireUserId(req);
    const projectId = String(req.body?.projectId || "").trim();

    if (!projectId) throw new BadRequestError("projectId is required");

    const project = await findProjectForUser(projectId, userId);
    assertStage(project, ["CAPTION_GENERATED", "READY"], "save-draft");

    const captionId =
      typeof req.body?.captionId === "string" ? req.body.captionId.trim() : "";

    if (captionId) {
      const exists = (project.captions || []).some(
        (item: any) => String(item.id) === captionId,
      );
      if (!exists) {
        throw new NotFoundError("captionId not found in project");
      }

      project.captions = ensureCaptionSelection(
        (project.captions || []).map((item: any) => ({
          ...item,
          isSelected: String(item.id) === captionId,
        })),
      );
    }

    const userCaption =
      typeof req.body?.caption === "string" ? req.body.caption.trim() : "";

    if (userCaption) {
      const hashtags = sanitizeHashtags(req.body?.hashtags || []);
      const existing = ensureCaptionSelection(project.captions || []).map(
        (item: any) => ({
          ...item,
          isSelected: false,
        }),
      );

      existing.push({
        id: randomUUID(),
        text: userCaption,
        isSelected: true,
        hashtags,
        source: "user",
        tone: "custom",
        createdAt: new Date(),
      });

      project.captions = ensureCaptionSelection(existing);
    }

    if (!Array.isArray(project.captions) || project.captions.length === 0) {
      project.captions = [
        {
          id: randomUUID(),
          text: project.ideaInput,
          isSelected: true,
          hashtags: sanitizeHashtags(project.analysis?.hashtags || []),
          source: "user",
          tone: "fallback",
          createdAt: new Date(),
        },
      ];
    }

    const platforms = normalizePlatforms(req.body?.platforms);
    if (platforms.length > 0) {
      project.platforms = platforms;
    }

    if (req.body?.scheduledAt) {
      const scheduleDate = new Date(String(req.body.scheduledAt));
      if (Number.isNaN(scheduleDate.getTime())) {
        throw new BadRequestError("scheduledAt must be a valid datetime");
      }
      project.scheduledAt = scheduleDate;
    }

    const providedAssets = Array.isArray(req.body?.assets)
      ? req.body.assets
      : [];
    for (const item of providedAssets) {
      if (!item) continue;
      const assetUrl = String(item.url || item).trim();
      if (!assetUrl) continue;

      const existing = (project.assets || []).find(
        (asset: any) => asset.url === assetUrl,
      );
      if (existing) continue;

      const assetId = randomUUID();
      project.assets.push({
        assetId,
        kind: "uploaded",
        url: assetUrl,
        version: nextAssetVersion(project),
        createdAt: new Date(),
        meta: { source: "save-draft" },
      });

      if (!project.selectedAssetId) {
        project.selectedAssetId = assetId;
      }
    }

    if (project.status === "CAPTION_GENERATED") {
      transitionStrict(project, "READY", "draft_saved", "user", {
        captionUpdated: Boolean(userCaption),
      });
    } else {
      pushHistory(project, {
        fromStatus: project.status,
        toStatus: project.status,
        action: "draft_updated",
        actor: "user",
      });
    }

    const selectedCaption = getSelectedCaption(project);
    const hashtags = sanitizeHashtags(selectedCaption?.hashtags || []);

    project.analysis = {
      ...(project.analysis || {}),
      engagementPrediction: predictEngagement({
        caption: selectedCaption?.text || project.ideaInput,
        hashtags,
        platforms: (project.platforms || []) as string[],
      }),
      hashtags: hashtags.length ? hashtags : project.analysis?.hashtags || [],
    };

    await project.save();

    await createActivityEvent({
      userId,
      category: "TEAM",
      type: "success",
      title: "Draft saved",
      description: "Your AI content project draft is ready for publishing.",
      actor: "Composer",
      meta: { projectId: String(project._id) },
    });

    emitPipelineEvent(project, "updated", { action: "draft_saved" });

    res.status(200).json({
      success: true,
      data: projectResponse(project),
    });
  } catch (error) {
    next(error);
  }
}

export async function publishProject(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const projectId = String(req.body?.projectId || "").trim();
    if (!projectId) throw new BadRequestError("projectId is required");

    const project = await findProjectForUser(projectId, userId);
    assertStage(project, ["READY"], "publish");

    const requestedPlatforms = normalizePlatforms(req.body?.platforms);
    const platforms = requestedPlatforms.length
      ? requestedPlatforms
      : (project.platforms as PlatformValue[]);

    if (!platforms.length) {
      throw new BadRequestError("platforms are required before publishing");
    }

    const explicitSchedule = req.body?.scheduledAt
      ? new Date(String(req.body.scheduledAt))
      : null;

    if (explicitSchedule && Number.isNaN(explicitSchedule.getTime())) {
      throw new BadRequestError("scheduledAt must be a valid datetime");
    }

    const scheduleDate = explicitSchedule || project.scheduledAt || null;

    let campaignId = req.body?.campaignId || project.campaignId || null;
    if (campaignId) {
      const campaign = await Campaign.findOne({ _id: campaignId, userId });
      if (!campaign) throw new NotFoundError("Campaign not found");
      campaignId = campaign._id;
    }

    const primaryAsset = latestAsset(project);
    const mediaUrls = primaryAsset ? [primaryAsset.url] : [];

    const selectedCaption = getSelectedCaption(project);
    const caption =
      String(selectedCaption?.text || "").trim() ||
      String(project.ideaInput || "").trim() ||
      "New post";

    const headline =
      caption
        .split(/\n|\.|\!/)
        .map((v) => v.trim())
        .filter(Boolean)[0] || "New Post";

    const engagementPrediction = Number(
      project.analysis?.engagementPrediction || 45,
    );
    const isTopPerformer = engagementPrediction >= 65;

    const docs = platforms.map((platform) => {
      const publishedNow = !scheduleDate;

      return {
        userId,
        campaignId: campaignId || undefined,
        contentProjectId: project._id,
        platform,
        day: new Date().toLocaleDateString("en-US", { weekday: "long" }),
        content: caption,
        headline,
        points: (project.analysis?.contentAngles || []).slice(0, 5),
        cta: "Learn more",
        mediaUrls,
        generatedImageUrl: primaryAsset?.url || undefined,
        editedImageUrl:
          primaryAsset?.kind === "edited" ? primaryAsset.url : undefined,
        status: publishedNow ? "published" : "scheduled",
        workflowStatus: publishedNow ? "LIVE" : "READY",
        scheduledAt: scheduleDate || undefined,
        scheduledTime: scheduleDate || undefined,
        publishedAt: publishedNow ? new Date() : undefined,
        reach: publishedNow
          ? Math.floor(1000 + Math.random() * 8000)
          : Math.floor(300 + Math.random() * 2000),
        engagementRate: Number((2 + Math.random() * 6).toFixed(2)),
        likes: Math.floor(40 + Math.random() * 700),
        comments: Math.floor(5 + Math.random() * 180),
        shares: Math.floor(2 + Math.random() * 120),
        saves: Math.floor(0 + Math.random() * 90),
        isTopPerformer,
      };
    });

    const createdPosts = await GeneratedPost.insertMany(docs);

    project.platforms = platforms;
    project.scheduledAt = scheduleDate || undefined;
    if (campaignId) project.campaignId = campaignId;
    project.postIds = [
      ...(project.postIds || []),
      ...createdPosts.map((post) => post._id),
    ];

    clearPipelineError(project);
    transitionStrict(project, "PUBLISHED", "project_published", "user", {
      postCount: createdPosts.length,
      scheduled: Boolean(scheduleDate),
    });

    await project.save();

    if (campaignId) {
      await Campaign.updateOne(
        { _id: campaignId, userId },
        {
          $inc: {
            currentCount: createdPosts.length,
            currentReach: createdPosts.reduce(
              (sum, item) => sum + Number(item.reach || 0),
              0,
            ),
          },
        },
      );
    }

    await createActivityEvent({
      userId,
      category: "PUBLISHED",
      type: "success",
      title: scheduleDate ? "Project scheduled" : "Project published",
      description: scheduleDate
        ? `${createdPosts.length} post(s) scheduled from your content project.`
        : `${createdPosts.length} post(s) published from your content project.`,
      actor: "Publisher",
      meta: {
        projectId: String(project._id),
        postIds: createdPosts.map((item) => String(item._id)),
      },
    });

    await createNotificationEvent({
      userId,
      category: "PUBLISHED",
      type: "success",
      title: scheduleDate ? "Content scheduled" : "Content published",
      description: scheduleDate
        ? "Your content project has been scheduled successfully."
        : "Your content project has been published successfully.",
      actor: "Publisher",
      meta: {
        projectId: String(project._id),
        postCount: createdPosts.length,
      },
    });

    emitPipelineEvent(project, "updated", {
      action: "project_published",
      postCount: createdPosts.length,
    });
    emitPipelineEvent(project, "completed", {
      postCount: createdPosts.length,
      postIds: createdPosts.map((post) => String(post._id)),
    });

    emitRealtime("post", "published", {
      projectId: String(project._id),
      postIds: createdPosts.map((post) => String(post._id)),
      platforms,
      scheduled: Boolean(scheduleDate),
    });

    emitRealtime("analytics", "updated", {
      reason: "publish",
      projectId: String(project._id),
      postCount: createdPosts.length,
      userId,
    });

    res.status(200).json({
      success: true,
      data: {
        ...projectResponse(project),
        postIds: createdPosts.map((post) => String(post._id)),
        posts: createdPosts.map((post) => toPostResponse(post)),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function retryProjectStep(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const projectId = String(req.params.id || "").trim();
    if (!projectId) throw new BadRequestError("project id is required");

    const project = await findProjectForUser(projectId, userId);
    if (!project.error) {
      throw new BadRequestError("Project has no failed pipeline step to retry");
    }

    const step = project.error.step as PipelineErrorStep;

    if (step === "ANALYSIS") {
      assertStage(project, ["IDEA"], "retry-analysis");
      await runAnalysisStep(project, projectId);
    } else if (step === "IMAGE_GENERATION") {
      assertStage(project, ["ANALYZED", "IMAGE_GENERATED"], "retry-image");
      const style = String(req.body?.style || "modern").toLowerCase();
      if (!["modern", "minimal", "3d", "marketing"].includes(style)) {
        throw new BadRequestError(
          "style must be one of modern, minimal, 3d, marketing",
        );
      }

      await runImageGenerationStep({
        project,
        projectId,
        style: style as "modern" | "minimal" | "3d" | "marketing",
        count: 1,
      });
    } else if (step === "CAPTION") {
      assertStage(project, ["EDITED", "CAPTION_GENERATED"], "retry-caption");
      const tone = String(req.body?.tone || "professional").toLowerCase();
      if (!["professional", "viral", "storytelling"].includes(tone)) {
        throw new BadRequestError(
          "tone must be one of professional, viral, storytelling",
        );
      }

      await runCaptionGenerationStep({
        project,
        projectId,
        tone: tone as "professional" | "viral" | "storytelling",
        count: 3,
      });
    } else {
      throw new BadRequestError(`Unsupported retry step: ${step}`);
    }

    clearPipelineError(project);
    pushHistory(project, {
      fromStatus: project.status,
      toStatus: project.status,
      action: "retry_succeeded",
      actor: "system",
      meta: { step },
    });

    await project.save();

    emitPipelineEvent(project, "updated", {
      action: "retry_succeeded",
      step,
    });

    res.status(200).json({
      success: true,
      data: {
        retriedStep: step,
        ...projectResponse(project),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProjectById(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const project = await findProjectForUser(req.params.id, userId);

    res.status(200).json({
      success: true,
      data: projectResponse(project),
    });
  } catch (error) {
    next(error);
  }
}

export async function listProjects(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;

    const statusFilter = normalizeStatusFilter(req.query.status);
    const filters: Record<string, unknown> = { userId };
    if (statusFilter) {
      filters.status = statusFilter;
    }

    const [total, rows] = await Promise.all([
      ContentProject.countDocuments(filters),
      ContentProject.find(filters)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json({
      success: true,
      data: rows.map((item) => projectResponse(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      filters: {
        status: statusFilter || null,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function batchCreateProjects(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);

    const inputItems = Array.isArray(req.body?.items)
      ? req.body.items
      : Array.isArray(req.body?.ideas)
        ? req.body.ideas.map((idea: unknown) => ({ idea }))
        : [];

    if (!inputItems.length) {
      throw new BadRequestError("items or ideas must be a non-empty array");
    }

    const docs = inputItems
      .map((item: any) => {
        const idea = String(item?.idea || item || "").trim();
        if (!idea) return null;

        return {
          userId,
          campaignId: item?.campaignId || undefined,
          status: "IDEA" as const,
          ideaInput: idea,
          analysis: {
            contentAngles: [],
            hooks: [],
            hashtags: [],
          },
          assets: [],
          captions: [],
          platforms: [],
          postIds: [],
          history: [
            {
              toStatus: "IDEA",
              action: "idea_created_batch",
              actor: "user",
              timestamp: new Date(),
              meta: { ideaLength: idea.length },
            },
          ],
        };
      })
      .filter(Boolean);

    if (!docs.length) {
      throw new BadRequestError("No valid ideas found in input array");
    }

    const created = await ContentProject.insertMany(docs);

    for (const project of created) {
      emitPipelineEvent(project, "updated", { action: "idea_created_batch" });
    }

    res.status(201).json({
      success: true,
      data: {
        count: created.length,
        projects: created.map((item) => projectResponse(item)),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function duplicateProject(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const source = await findProjectForUser(req.params.id, userId);

    const duplicate = await ContentProject.create({
      userId,
      campaignId: source.campaignId,
      status: "IDEA",
      ideaInput: source.ideaInput,
      analysis: {
        contentAngles: [],
        hooks: [],
        hashtags: [],
      },
      assets: [],
      captions: [],
      platforms: source.platforms,
      scheduledAt: source.scheduledAt,
      postIds: [],
      history: [
        {
          toStatus: "IDEA",
          action: "project_duplicated",
          actor: "user",
          timestamp: new Date(),
          meta: { sourceProjectId: String(source._id) },
        },
      ],
    });

    await createActivityEvent({
      userId,
      category: "TEAM",
      type: "success",
      title: "Project duplicated",
      description: "A previous content project was duplicated as a new idea.",
      actor: "Composer",
      meta: {
        sourceProjectId: String(source._id),
        duplicateProjectId: String(duplicate._id),
      },
    });

    emitPipelineEvent(duplicate, "updated", { action: "project_duplicated" });

    res.status(201).json({
      success: true,
      data: {
        newProjectId: String(duplicate._id),
        status: duplicate.status,
      },
    });
  } catch (error) {
    next(error);
  }
}
