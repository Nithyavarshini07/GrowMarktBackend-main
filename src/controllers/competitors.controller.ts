import crypto from "crypto";
import { NextFunction, Response } from "express";
import { Types } from "mongoose";
import { AuthRequest } from "@/middleware/auth.middleware";
import {
  CompetitorFeedItem,
  CompetitorTarget,
  GeneratedPost,
  User,
} from "@/models";

import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "@/utils/errors";
import {
  buildPaginationMeta,
  parsePagination,
  parseRangeToStartDate,
  parseSort,
} from "@/utils/pagination";
import { emitRealtime } from "@/realtime";
import {
  type LiveDiscoverySource,
} from "@/services/competitor-discovery.service";

const COMPETITOR_STATUS = [
  "aggressive",
  "rising",
  "stable",
  "caution",
  "declining",
] as const;

const COMPETITOR_PLATFORMS = [
  "linkedin",
  "instagram",
  "facebook",
  "twitter",
] as const;

const FEED_SOURCES = ["manual", "sync", "api"] as const;
const DEFAULT_RANGE = "30d";
const DAY_MS = 24 * 60 * 60 * 1000;

type CompetitorStatus = (typeof COMPETITOR_STATUS)[number];
type CompetitorPlatform = (typeof COMPETITOR_PLATFORMS)[number];
type FeedSource = (typeof FEED_SOURCES)[number];
type TargetHandleMap = Partial<Record<CompetitorPlatform, string>>;
type DiscoverySource = "library" | LiveDiscoverySource;

interface DiscoveryLibraryItem {
  name: string;
  platforms: CompetitorPlatform[];
  handles: TargetHandleMap;
  genres: string[];
  tags?: string[];
}

interface DiscoveryCandidate {
  competitorId: string;
  name: string;
  platforms: CompetitorPlatform[];
  handles: TargetHandleMap;
  tags: string[];
  sourceConfidence: number;
  reason: string;
  source: DiscoverySource;
}

const DISCOVERY_LIBRARY: DiscoveryLibraryItem[] = [
  {
    name: "HubSpot",
    platforms: ["linkedin", "instagram", "twitter"],
    handles: { linkedin: "hubspot", instagram: "hubspot", twitter: "hubspot" },
    genres: ["marketing", "saas", "b2b", "crm", "growth"],
    tags: ["martech", "content"],
  },
  {
    name: "Mailchimp",
    platforms: ["linkedin", "instagram", "twitter"],
    handles: {
      linkedin: "mailchimp",
      instagram: "mailchimp",
      twitter: "mailchimp",
    },
    genres: ["email", "marketing", "saas", "automation"],
    tags: ["email", "campaigns"],
  },
  {
    name: "Canva",
    platforms: ["linkedin", "instagram", "facebook", "twitter"],
    handles: {
      linkedin: "canva",
      instagram: "canva",
      facebook: "canva",
      twitter: "canva",
    },
    genres: ["design", "content", "branding", "creative", "social media"],
    tags: ["design", "ugc"],
  },
  {
    name: "Later",
    platforms: ["instagram", "facebook", "linkedin", "twitter"],
    handles: {
      linkedin: "latermedia",
      instagram: "latermedia",
      twitter: "latermedia",
    },
    genres: ["social media", "scheduler", "content planning", "creator"],
    tags: ["publishing", "scheduling"],
  },
  {
    name: "Hootsuite",
    platforms: ["linkedin", "instagram", "facebook", "twitter"],
    handles: {
      linkedin: "hootsuite",
      instagram: "hootsuite",
      twitter: "hootsuite",
    },
    genres: ["social media", "management", "analytics", "marketing"],
    tags: ["monitoring", "engagement"],
  },
  {
    name: "Shopify",
    platforms: ["linkedin", "instagram", "facebook", "twitter"],
    handles: {
      linkedin: "shopify",
      instagram: "shopify",
      facebook: "shopify",
      twitter: "shopify",
    },
    genres: ["ecommerce", "d2c", "retail", "online store"],
    tags: ["commerce", "conversion"],
  },
  {
    name: "Klaviyo",
    platforms: ["linkedin", "instagram", "twitter"],
    handles: { linkedin: "klaviyo", instagram: "klaviyo", twitter: "klaviyo" },
    genres: ["ecommerce", "email", "sms", "retention", "marketing automation"],
    tags: ["retention", "lifecycle"],
  },
  {
    name: "Notion",
    platforms: ["linkedin", "instagram", "twitter"],
    handles: {
      linkedin: "notionhq",
      instagram: "notionhq",
      twitter: "notionhq",
    },
    genres: ["productivity", "startup", "saas", "workspace"],
    tags: ["workflow", "templates"],
  },
  {
    name: "Asana",
    platforms: ["linkedin", "twitter", "facebook"],
    handles: { linkedin: "asana", twitter: "asana", facebook: "asana" },
    genres: ["productivity", "project management", "saas", "b2b"],
    tags: ["ops", "teams"],
  },
  {
    name: "Monday.com",
    platforms: ["linkedin", "instagram", "facebook", "twitter"],
    handles: {
      linkedin: "monday-com",
      instagram: "mondaycom",
      twitter: "mondaydotcom",
    },
    genres: ["project management", "productivity", "workflow", "b2b"],
    tags: ["workflows", "teams"],
  },
  {
    name: "Figma",
    platforms: ["linkedin", "instagram", "twitter"],
    handles: { linkedin: "figma", instagram: "figma", twitter: "figma" },
    genres: ["design", "product", "ui", "ux", "creative"],
    tags: ["design systems", "collaboration"],
  },
  {
    name: "Adobe Creative Cloud",
    platforms: ["linkedin", "instagram", "facebook", "twitter"],
    handles: {
      linkedin: "adobe",
      instagram: "adobe",
      facebook: "adobe",
      twitter: "adobe",
    },
    genres: ["design", "creative", "photo", "video", "content"],
    tags: ["creative", "creator"],
  },
  {
    name: "Stripe",
    platforms: ["linkedin", "twitter"],
    handles: { linkedin: "stripe", twitter: "stripe" },
    genres: ["fintech", "payments", "api", "developer"],
    tags: ["payments", "finance"],
  },
  {
    name: "Wise",
    platforms: ["linkedin", "instagram", "facebook", "twitter"],
    handles: {
      linkedin: "wise",
      instagram: "wise",
      facebook: "wise",
      twitter: "wise",
    },
    genres: ["fintech", "finance", "payments", "international transfer"],
    tags: ["finance", "consumer"],
  },
  {
    name: "Revolut",
    platforms: ["linkedin", "instagram", "facebook", "twitter"],
    handles: {
      linkedin: "revolut",
      instagram: "revolutapp",
      facebook: "revolutapp",
      twitter: "revolutapp",
    },
    genres: ["fintech", "digital bank", "payments", "finance"],
    tags: ["banking", "consumer"],
  },
  {
    name: "Nike",
    platforms: ["instagram", "facebook", "twitter"],
    handles: { instagram: "nike", facebook: "nike", twitter: "nike" },
    genres: ["sports", "fitness", "apparel", "lifestyle"],
    tags: ["brand", "ugc"],
  },
  {
    name: "Gymshark",
    platforms: ["instagram", "facebook", "twitter"],
    handles: {
      instagram: "gymshark",
      facebook: "gymshark",
      twitter: "gymshark",
    },
    genres: ["fitness", "apparel", "gym", "lifestyle"],
    tags: ["community", "creator"],
  },
  {
    name: "Sephora",
    platforms: ["instagram", "facebook", "twitter"],
    handles: { instagram: "sephora", facebook: "sephora", twitter: "sephora" },
    genres: ["beauty", "cosmetics", "retail", "lifestyle"],
    tags: ["beauty", "ugc"],
  },
  {
    name: "Glossier",
    platforms: ["instagram", "facebook", "twitter"],
    handles: {
      instagram: "glossier",
      facebook: "glossier",
      twitter: "glossier",
    },
    genres: ["beauty", "cosmetics", "skincare", "d2c"],
    tags: ["beauty", "creator"],
  },
  {
    name: "Duolingo",
    platforms: ["instagram", "facebook", "twitter", "linkedin"],
    handles: {
      linkedin: "duolingo",
      instagram: "duolingo",
      facebook: "duolingo",
      twitter: "duolingo",
    },
    genres: ["education", "edtech", "learning", "consumer app"],
    tags: ["education", "viral"],
  },
  {
    name: "Coursera",
    platforms: ["linkedin", "facebook", "twitter"],
    handles: {
      linkedin: "coursera",
      facebook: "coursera",
      twitter: "coursera",
    },
    genres: ["education", "edtech", "online course", "career"],
    tags: ["learning", "b2c"],
  },
];

interface UpsertSummary {
  inserted: number;
  updated: number;
  skipped: number;
  invalid: number;
  warnings: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requireUserId(req: AuthRequest): string {
  if (!req.userId) throw new UnauthorizedError();
  return req.userId;
}

function toSafeNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return numeric;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildCompetitorIdFromName(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || `competitor-${Date.now()}`;
}

function normalizeGenreTokens(genre: string): string[] {
  return genre
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function extractConnectedPlatforms(
  socialConnections: Record<string, unknown>,
): CompetitorPlatform[] {
  const connected: CompetitorPlatform[] = [];
  for (const platform of COMPETITOR_PLATFORMS) {
    const value = socialConnections[platform];
    if (!isRecord(value)) continue;
    const accessToken = String(value.accessToken || "").trim();
    if (accessToken) connected.push(platform);
  }
  return connected;
}

function scoreDiscoveryItem(input: {
  item: DiscoveryLibraryItem;
  genreTokens: string[];
  genreText: string;
  connectedPlatforms: CompetitorPlatform[];
}): { score: number; reason: string } {
  const overlap = input.item.platforms.filter((platform) =>
    input.connectedPlatforms.includes(platform),
  );

  if (overlap.length === 0) {
    return { score: 0, reason: "No connected platform overlap" };
  }

  let score = overlap.length * 15;
  const matchedKeywords: string[] = [];

  for (const keyword of input.item.genres) {
    const normalized = keyword.toLowerCase();
    if (
      input.genreText.includes(normalized) ||
      input.genreTokens.some((token) =>
        normalized
          .split(/\s+/)
          .some(
            (kwToken) => kwToken.startsWith(token) || token.startsWith(kwToken),
          ),
      )
    ) {
      score += 18;
      matchedKeywords.push(keyword);
    }
  }

  if (matchedKeywords.length === 0) {
    return { score: 0, reason: "No genre match" };
  }

  return {
    score,
    reason: `Matched genre keywords: ${matchedKeywords.slice(0, 3).join(", ")}; connected on ${overlap.join(", ")}`,
  };
}

function discoverCompetitorCandidates(input: {
  genre: string;
  connectedPlatforms: CompetitorPlatform[];
  limit: number;
}): DiscoveryCandidate[] {
  const genreText = input.genre.trim().toLowerCase();
  const genreTokens = normalizeGenreTokens(genreText);

  const scored = DISCOVERY_LIBRARY.map((item) => {
    const { score, reason } = scoreDiscoveryItem({
      item,
      genreTokens,
      genreText,
      connectedPlatforms: input.connectedPlatforms,
    });
    return { item, score, reason };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit);

  return scored.map(({ item, score, reason }) => {
    const platforms = item.platforms.filter((platform) =>
      input.connectedPlatforms.includes(platform),
    );
    const handles: TargetHandleMap = {};
    for (const platform of platforms) {
      const handle = sanitizeHandle(item.handles[platform]);
      if (handle) handles[platform] = handle;
    }

    return {
      competitorId: buildCompetitorIdFromName(item.name),
      name: item.name,
      platforms,
      handles,
      tags: Array.from(
        new Set([...(item.tags || []), ...normalizeTags(item.genres)]),
      ),
      sourceConfidence: clamp(55 + Math.round(score / 2), 55, 95),
      reason,
      source: "library" as const,
    };
  });
}

function toCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${Math.round(value)}`;
}

function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return Array.from(
    new Set(
      input
        .map((tag) =>
          String(tag || "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean)
        .slice(0, 20),
    ),
  );
}

function sanitizeHandle(input: unknown): string {
  return (
    String(input || "")
      .trim()
      .toLowerCase()
      .replace(/^@+/, "")
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")
      .filter(Boolean)
      .pop() || ""
  );
}

function normalizeHandles(input: unknown): TargetHandleMap {
  if (!input || typeof input !== "object") return {};

  const handles: TargetHandleMap = {};
  for (const platform of COMPETITOR_PLATFORMS) {
    const value = sanitizeHandle((input as Record<string, unknown>)[platform]);
    if (value) handles[platform] = value;
  }
  return handles;
}

function normalizePlatforms(
  input: unknown,
  handles: TargetHandleMap,
): CompetitorPlatform[] {
  const fromPayload = Array.isArray(input)
    ? input
        .map((value) =>
          String(value || "")
            .trim()
            .toLowerCase(),
        )
        .filter((value): value is CompetitorPlatform =>
          (COMPETITOR_PLATFORMS as readonly string[]).includes(value),
        )
    : [];

  const fromHandles = Object.keys(handles).filter(
    (value): value is CompetitorPlatform =>
      (COMPETITOR_PLATFORMS as readonly string[]).includes(value),
  );

  return Array.from(new Set([...fromPayload, ...fromHandles]));
}

function normalizePlatform(value: unknown, index: number): CompetitorPlatform {
  const platform = String(value || "")
    .trim()
    .toLowerCase();
  if (!(COMPETITOR_PLATFORMS as readonly string[]).includes(platform)) {
    throw new BadRequestError(
      `items[${index}].platform must be one of ${COMPETITOR_PLATFORMS.join(", ")}`,
    );
  }
  return platform as CompetitorPlatform;
}

function parseOptionalDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function buildExternalPostId(input: {
  provided?: unknown;
  competitorId: string;
  platform: CompetitorPlatform;
  author: string;
  content: string;
  publishedAt?: Date;
}): string {
  const provided = String(input.provided || "").trim();
  if (provided) return provided;

  const hash = crypto
    .createHash("sha1")
    .update(
      [
        input.competitorId,
        input.platform,
        input.author,
        input.content,
        input.publishedAt ? input.publishedAt.toISOString() : "",
      ].join("|"),
    )
    .digest("hex");

  return hash;
}

async function getActiveTargetMap(userId: string): Promise<Map<string, any>> {
  const targets = await CompetitorTarget.find({ userId, active: true }).lean();
  return new Map(
    targets.map((target) => [
      String(target.competitorId).toLowerCase(),
      target,
    ]),
  );
}

async function upsertCompetitorRows(input: {
  userId: string;
  rows: any[];
  defaultSource: FeedSource;
  strictTargets: boolean;
}): Promise<UpsertSummary> {
  const summary: UpsertSummary = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    invalid: 0,
    warnings: [],
  };

  const targetMap = await getActiveTargetMap(input.userId);
  const touchedTargetIds = new Set<string>();

  for (let index = 0; index < input.rows.length; index += 1) {
    const row = input.rows[index];
    try {
      const competitorId = String(row?.competitorId || "")
        .trim()
        .toLowerCase();
      if (!competitorId) {
        throw new BadRequestError(`items[${index}].competitorId is required`);
      }

      const target = targetMap.get(competitorId);
      if (input.strictTargets && targetMap.size > 0 && !target) {
        summary.skipped += 1;
        summary.warnings.push(
          `items[${index}] skipped: competitorId '${competitorId}' is not in active targets`,
        );
        continue;
      }

      const platform = normalizePlatform(row?.platform, index);
      const author = String(row?.author || target?.name || "").trim();
      if (!author) {
        throw new BadRequestError(`items[${index}].author is required`);
      }

      const content = String(row?.content || "").trim();
      if (!content) {
        throw new BadRequestError(`items[${index}].content is required`);
      }

      const sourceCandidate = String(row?.source || "")
        .trim()
        .toLowerCase();
      const source = (FEED_SOURCES as readonly string[]).includes(
        sourceCandidate,
      )
        ? (sourceCandidate as FeedSource)
        : input.defaultSource;

      const publishedAt = parseOptionalDate(row?.publishedAt);
      const postUrl = String(row?.postUrl || "").trim() || undefined;
      const confidence = clamp(
        toSafeNumber(row?.confidence, target?.sourceConfidence ?? 80),
        0,
        100,
      );

      const externalPostId = buildExternalPostId({
        provided: row?.externalPostId,
        competitorId,
        platform,
        author,
        content,
        publishedAt,
      });

      const updateResult = await CompetitorFeedItem.updateOne(
        {
          userId: input.userId,
          competitorId,
          platform,
          externalPostId,
        },
        {
          $setOnInsert: {
            userId: input.userId,
            competitorId,
            platform,
            externalPostId,
          },
          $set: {
            author,
            content,
            source,
            postUrl,
            publishedAt,
            confidence,
            engagement: Math.max(0, toSafeNumber(row?.engagement, 0)),
            reach: Math.max(0, Math.round(toSafeNumber(row?.reach, 0))),
            shares: Math.max(0, Math.round(toSafeNumber(row?.shares, 0))),
            tags: normalizeTags(row?.tags),
          },
        },
        { upsert: true, setDefaultsOnInsert: true },
      );

      if (updateResult.upsertedCount > 0) {
        summary.inserted += 1;
      } else if (updateResult.modifiedCount > 0) {
        summary.updated += 1;
      } else {
        summary.skipped += 1;
      }

      if (target) touchedTargetIds.add(competitorId);
    } catch (error) {
      summary.invalid += 1;
      summary.warnings.push(
        error instanceof Error
          ? `items[${index}] invalid: ${error.message}`
          : `items[${index}] invalid`,
      );
    }
  }

  if (touchedTargetIds.size > 0) {
    await CompetitorTarget.updateMany(
      {
        userId: input.userId,
        competitorId: { $in: Array.from(touchedTargetIds) },
      },
      {
        $set: {
          lastSyncedAt: new Date(),
          syncStatus: summary.invalid > 0 ? "warning" : "ok",
          syncMessage:
            summary.invalid > 0
              ? `${summary.invalid} records had validation issues`
              : undefined,
        },
      },
    );
  }

  return summary;
}

function normalizeTargetInput(
  row: any,
  index: number,
): {
  competitorId: string;
  name: string;
  platforms: CompetitorPlatform[];
  handles: TargetHandleMap;
  tags: string[];
  active: boolean;
  sourceConfidence: number;
} {
  const competitorId = String(row?.competitorId || row?.id || "")
    .trim()
    .toLowerCase();
  if (!competitorId) {
    throw new BadRequestError(`items[${index}].competitorId is required`);
  }

  const handles = normalizeHandles(row?.handles);
  const platforms = normalizePlatforms(row?.platforms, handles);
  const name = String(row?.name || row?.author || competitorId).trim();

  if (name.length < 2) {
    throw new BadRequestError(`items[${index}].name must be at least 2 chars`);
  }

  return {
    competitorId,
    name,
    platforms,
    handles,
    tags: normalizeTags(row?.tags),
    active: row?.active !== false,
    sourceConfidence: clamp(toSafeNumber(row?.sourceConfidence, 70), 0, 100),
  };
}

function serializeTarget(target: any): Record<string, unknown> {
  return {
    id: String(target._id),
    competitorId: target.competitorId,
    name: target.name,
    platforms: target.platforms || [],
    handles: target.handles || {},
    tags: target.tags || [],
    active: Boolean(target.active),
    sourceConfidence: Number(target.sourceConfidence || 0),
    syncStatus: target.syncStatus,
    syncMessage: target.syncMessage || null,
    lastSyncedAt: target.lastSyncedAt || null,
    createdAt: target.createdAt,
    updatedAt: target.updatedAt,
  };
}

function resolveStatus(score: number): CompetitorStatus {
  if (score >= 80) return "aggressive";
  if (score >= 65) return "rising";
  if (score >= 50) return "stable";
  if (score >= 35) return "caution";
  return "declining";
}

function percentChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

function buildCompetitorQuery(
  userId: string,
  rangeStart?: Date,
): Record<string, unknown> {
  if (!rangeStart) return { userId };
  return {
    userId,
    $or: [
      { publishedAt: { $gte: rangeStart } },
      {
        publishedAt: { $exists: false },
        createdAt: { $gte: rangeStart },
      },
    ],
  };
}

export const upsertCompetitorTargets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const rows = Array.isArray(req.body?.items) ? req.body.items : [req.body];
    if (rows.length === 0) {
      throw new BadRequestError("items array is required");
    }

    const targets = [];
    for (let index = 0; index < rows.length; index += 1) {
      const normalized = normalizeTargetInput(rows[index], index);
      const target = await CompetitorTarget.findOneAndUpdate(
        {
          userId,
          competitorId: normalized.competitorId,
        },
        {
          $set: {
            name: normalized.name,
            platforms: normalized.platforms,
            handles: normalized.handles,
            tags: normalized.tags,
            active: normalized.active,
            sourceConfidence: normalized.sourceConfidence,
          },
          $setOnInsert: {
            syncStatus: "idle",
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      targets.push(target);
    }

    emitRealtime("competitors", "targets_updated", {
      userId,
      count: targets.length,
    });

    res.status(200).json({
      success: true,
      data: {
        targets: targets.map((item) => serializeTarget(item)),
        count: targets.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const discoverCompetitorsByGenre = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const genre = String(req.body?.genre || req.query.genre || "").trim();
    if (!genre) {
      throw new BadRequestError("genre is required");
    }

    const limitRaw = toSafeNumber(req.body?.limit ?? req.query.limit, 10);
    const limit = clamp(Math.round(limitRaw), 1, 25);
    const saveTargets = req.body?.saveTargets !== false;

    const user = await User.findById(userId).select("socialConnections").lean();
    if (!user) throw new NotFoundError("User not found");

    const socialConnections =
      isRecord(user) &&
      isRecord((user as Record<string, unknown>).socialConnections)
        ? ((user as Record<string, unknown>).socialConnections as Record<
            string,
            unknown
          >)
        : {};

    const connectedPlatforms = extractConnectedPlatforms(socialConnections);
    if (connectedPlatforms.length === 0) {
      throw new BadRequestError(
        "No connected social platforms found. Connect at least one platform first.",
      );
    }

    const discovered = discoverCompetitorCandidates({
      genre,
      connectedPlatforms,
      limit,
    });

    if (saveTargets && discovered.length > 0) {
      await Promise.all(
        discovered.map((candidate) =>
          CompetitorTarget.findOneAndUpdate(
            {
              userId,
              competitorId: candidate.competitorId,
            },
            {
              $set: {
                name: candidate.name,
                platforms: candidate.platforms,
                handles: candidate.handles,
                tags: candidate.tags,
                active: true,
                sourceConfidence: candidate.sourceConfidence,
              },
              $setOnInsert: {
                syncStatus: "idle",
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
          ),
        ),
      );

      emitRealtime("competitors", "targets_discovered", {
        userId,
        genre,
        discovered: discovered.length,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        genre,
        connectedPlatforms,
        discovered,
        count: discovered.length,
        savedTargets: saveTargets ? discovered.length : 0,
        message:
          discovered.length > 0
            ? "Competitor candidates discovered from connected platforms and genre"
            : "No confident competitors found for this genre on connected platforms",
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listCompetitorTargets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const rows = await CompetitorTarget.find({ userId })
      .sort({ active: -1, updatedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: rows.map((item) => serializeTarget(item)),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCompetitorTarget = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const id = String(req.params.id || "")
      .trim()
      .toLowerCase();

    if (!id) throw new BadRequestError("target id is required");

    const filter: Record<string, unknown> = { userId, competitorId: id };
    if (Types.ObjectId.isValid(id)) {
      filter.$or = [{ _id: id }, { competitorId: id }];
      delete filter.competitorId;
    }

    const removed = await CompetitorTarget.findOneAndDelete(filter);
    if (!removed) throw new NotFoundError("Competitor target not found");

    emitRealtime("competitors", "target_deleted", {
      userId,
      competitorId: removed.competitorId,
    });

    res.status(200).json({
      success: true,
      data: {
        id: String(removed._id),
        competitorId: removed.competitorId,
        deleted: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const ingestCompetitorFeed = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const rows = Array.isArray(req.body?.items) ? req.body.items : [];
    if (rows.length === 0) {
      throw new BadRequestError("items array is required");
    }

    const summary = await upsertCompetitorRows({
      userId,
      rows,
      defaultSource: "manual",
      strictTargets: req.body?.strictTargets !== false,
    });

    emitRealtime("competitors", "feed_ingested", {
      userId,
      ...summary,
    });

    res.status(201).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

export const syncCompetitorFeed = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const rows = Array.isArray(req.body?.items) ? req.body.items : [];
    if (rows.length === 0) {
      throw new BadRequestError("items array is required for sync");
    }

    const summary = await upsertCompetitorRows({
      userId,
      rows,
      defaultSource: "sync",
      strictTargets: true,
    });

    emitRealtime("competitors", "feed_synced", {
      userId,
      ...summary,
    });

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

export const getCompetitors = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const range =
      typeof req.query.range === "string" && req.query.range.trim()
        ? req.query.range
        : DEFAULT_RANGE;
    const rangeStart =
      parseRangeToStartDate(range) || new Date(Date.now() - 30 * DAY_MS);

    const [targets, feed, publishedCount, userPlatforms] = await Promise.all([
      CompetitorTarget.find({ userId, active: true }).lean(),
      CompetitorFeedItem.find(buildCompetitorQuery(userId, rangeStart))
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(2000)
        .lean(),
      GeneratedPost.countDocuments({ userId, status: "published" }),
      GeneratedPost.distinct("platform", { userId, status: "published" }),
    ]);

    const targetMap = new Map(
      targets.map((target) => [
        String(target.competitorId).toLowerCase(),
        target,
      ]),
    );

    const buckets = new Map<
      string,
      {
        id: string;
        name: string;
        platformSet: Set<string>;
        postCount: number;
        engagementTotal: number;
        reachTotal: number;
        sharesTotal: number;
        confidenceTotal: number;
        lastPostAt?: Date;
        last7Posts: number;
        last7Engagement: number;
        prev7Posts: number;
        prev7Engagement: number;
        tagCount: Map<string, number>;
        identityConfidence: number;
      }
    >();

    const globalTagCount = new Map<string, number>();
    const now = Date.now();

    for (const row of feed) {
      const id = String(row.competitorId || "")
        .trim()
        .toLowerCase();
      if (!id) continue;

      const target = targetMap.get(id);
      const timestamp = new Date(
        row.publishedAt || row.createdAt || new Date().toISOString(),
      );

      const current = buckets.get(id) || {
        id,
        name: String(target?.name || row.author || id),
        platformSet: new Set<string>(),
        postCount: 0,
        engagementTotal: 0,
        reachTotal: 0,
        sharesTotal: 0,
        confidenceTotal: 0,
        lastPostAt: undefined,
        last7Posts: 0,
        last7Engagement: 0,
        prev7Posts: 0,
        prev7Engagement: 0,
        tagCount: new Map<string, number>(),
        identityConfidence: Number(target?.sourceConfidence || 70),
      };

      const engagement = Math.max(0, toSafeNumber(row.engagement, 0));
      const reach = Math.max(0, toSafeNumber(row.reach, 0));
      const shares = Math.max(0, toSafeNumber(row.shares, 0));
      const confidence = clamp(toSafeNumber(row.confidence, 80), 0, 100);

      current.platformSet.add(String(row.platform || "").toLowerCase());
      current.postCount += 1;
      current.engagementTotal += engagement;
      current.reachTotal += reach;
      current.sharesTotal += shares;
      current.confidenceTotal += confidence;

      if (!current.lastPostAt || timestamp > current.lastPostAt) {
        current.lastPostAt = timestamp;
      }

      const daysAgo = (now - timestamp.getTime()) / DAY_MS;
      if (daysAgo <= 7) {
        current.last7Posts += 1;
        current.last7Engagement += engagement;
      } else if (daysAgo <= 14) {
        current.prev7Posts += 1;
        current.prev7Engagement += engagement;
      }

      const tags = normalizeTags(row.tags);
      for (const tag of tags) {
        current.tagCount.set(tag, (current.tagCount.get(tag) || 0) + 1);
        globalTagCount.set(tag, (globalTagCount.get(tag) || 0) + 1);
      }

      buckets.set(id, current);
    }

    for (const target of targets) {
      const id = String(target.competitorId || "")
        .trim()
        .toLowerCase();
      if (!id || buckets.has(id)) continue;
      buckets.set(id, {
        id,
        name: String(target.name || id),
        platformSet: new Set(target.platforms || []),
        postCount: 0,
        engagementTotal: 0,
        reachTotal: 0,
        sharesTotal: 0,
        confidenceTotal: 0,
        lastPostAt: undefined,
        last7Posts: 0,
        last7Engagement: 0,
        prev7Posts: 0,
        prev7Engagement: 0,
        tagCount: new Map<string, number>(),
        identityConfidence: Number(target.sourceConfidence || 70),
      });
    }

    const rawRows = Array.from(buckets.values()).map((bucket) => {
      const avgEngagement =
        bucket.postCount > 0 ? bucket.engagementTotal / bucket.postCount : 0;
      const avgReach =
        bucket.postCount > 0 ? bucket.reachTotal / bucket.postCount : 0;
      const avgShares =
        bucket.postCount > 0 ? bucket.sharesTotal / bucket.postCount : 0;

      const last7Average =
        bucket.last7Posts > 0 ? bucket.last7Engagement / bucket.last7Posts : 0;
      const prev7Average =
        bucket.prev7Posts > 0 ? bucket.prev7Engagement / bucket.prev7Posts : 0;
      const growthPct = percentChange(last7Average, prev7Average);

      const daysSinceLastPost = bucket.lastPostAt
        ? (now - bucket.lastPostAt.getTime()) / DAY_MS
        : 999;

      const engagementScore = clamp(avgEngagement * 10, 0, 100);
      const reachScore = clamp(Math.log10(avgReach + 1) * 20, 0, 100);
      const shareScore = clamp(Math.log10(avgShares + 1) * 32, 0, 100);
      const consistencyScore = clamp((bucket.postCount / 12) * 100, 0, 100);
      const momentumScore = clamp(50 + growthPct * 1.2, 0, 100);

      const score = Number(
        (
          engagementScore * 0.35 +
          reachScore * 0.25 +
          shareScore * 0.15 +
          consistencyScore * 0.15 +
          momentumScore * 0.1
        ).toFixed(1),
      );

      const sampleConfidence = clamp(bucket.postCount * 15, 0, 100);
      const recencyConfidence =
        daysSinceLastPost <= 7
          ? 100
          : daysSinceLastPost <= 14
            ? 80
            : daysSinceLastPost <= 30
              ? 60
              : 35;
      const metricConfidence =
        bucket.postCount > 0
          ? bucket.confidenceTotal / bucket.postCount
          : bucket.identityConfidence;
      const confidence = Math.round(
        clamp(
          sampleConfidence * 0.35 +
            recencyConfidence * 0.25 +
            bucket.identityConfidence * 0.2 +
            metricConfidence * 0.2,
          0,
          100,
        ),
      );

      return {
        id: bucket.id,
        name: bucket.name,
        status: resolveStatus(score),
        score,
        confidence,
        postCount: bucket.postCount,
        last7Posts: bucket.last7Posts,
        avgEngagement,
        avgReach,
        avgShares,
        growthPct,
        platformSet: bucket.platformSet,
        engagementVolume: bucket.engagementTotal,
      };
    });

    const totalEngagementVolume = rawRows.reduce(
      (sum, row) => sum + row.engagementVolume,
      0,
    );

    const leaderboard = rawRows
      .map((row) => {
        const shareOfVoice =
          totalEngagementVolume > 0
            ? (row.engagementVolume / totalEngagementVolume) * 100
            : 0;
        const growth = `${row.growthPct >= 0 ? "+" : ""}${Math.round(row.growthPct)}%`;

        return {
          id: row.id,
          rank: 0,
          name: row.name,
          avatar: row.name.slice(0, 2).toUpperCase(),
          status: row.status,
          isUser: false,
          score: row.score,
          confidence: row.confidence,
          connectedPlatforms: Array.from(row.platformSet),
          postsLast7d: row.last7Posts,
          successRate: `${Math.round(clamp(row.avgEngagement * 10, 0, 100))}%`,
          reach: toCompactNumber(row.avgReach),
          engagementRate: `${row.avgEngagement.toFixed(2)}%`,
          sentiment: `${Math.round(clamp(55 + row.avgEngagement * 3, 0, 98))}%`,
          shareOfVoice: `${Math.round(shareOfVoice)}%`,
          growth,
          isBenchmark: row.postCount > 0,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.confidence - a.confidence;
      })
      .map((row, index) => ({ ...row, rank: index + 1 }));

    const sortedTags = Array.from(globalTagCount.entries()).sort(
      (a, b) => b[1] - a[1],
    );
    const topTag = sortedTags[0]?.[0] || null;

    const topCompetitor = leaderboard[0] || null;
    const growthLeader = rawRows
      .filter((row) => Number.isFinite(row.growthPct))
      .sort((a, b) => b.growthPct - a.growthPct)[0];

    const insights =
      leaderboard.length === 0
        ? targets.length > 0
          ? [
              {
                id: "ins-sync-needed",
                type: "info",
                title: "Targets configured but no synced feed",
                description:
                  "Run POST /api/v1/competitors/sync with source rows to get ranked competitors.",
                message:
                  "No ranked competitor data yet. Sync external rows for configured targets.",
              },
            ]
          : [
              {
                id: "ins-add-targets",
                type: "info",
                title: "No competitor targets configured",
                description:
                  "Add targets with POST /api/v1/competitors/targets, then sync rows via /competitors/sync.",
                message:
                  "Competitor intelligence starts after target setup and first sync.",
              },
            ]
        : [
            {
              id: "ins-top-competitor",
              type: "opportunity",
              title: `Top performer: ${topCompetitor?.name || "Unknown"}`,
              description:
                "This competitor currently leads by weighted score across engagement, reach, and consistency.",
              message: `${topCompetitor?.name || "Top competitor"} currently leads your benchmark set.`,
            },
            {
              id: "ins-top-tag",
              type: "info",
              title: topTag
                ? `Most frequent competitor tag: #${topTag.replace(/^#/, "")}`
                : "Competitor tags available",
              description:
                "Use top competitor themes as directional inputs for your next test cycle.",
              message: topTag
                ? `Competitor activity clusters around #${topTag.replace(/^#/, "")}.`
                : "Review competitor feed tags for recurring themes.",
            },
            {
              id: "ins-growth-leader",
              type: "opportunity",
              title: `Fastest momentum: ${growthLeader?.name || "N/A"}`,
              description:
                "Momentum compares average engagement from the latest 7 days versus the prior 7 days.",
              message: growthLeader
                ? `${growthLeader.name} shows ${Math.round(growthLeader.growthPct)}% momentum.`
                : "Momentum data will appear after enough posts are synced.",
            },
          ];

    const userScore = Math.round(
      clamp(35 + publishedCount * 3 + userPlatforms.length * 8, 10, 100),
    );
    const benchmarkBase = leaderboard.length
      ? Number(
          (
            leaderboard
              .slice(0, 3)
              .reduce((sum, row) => sum + Number(row.score || 0), 0) /
            Math.min(3, leaderboard.length)
          ).toFixed(1),
        )
      : 55;

    const radarData = {
      userScore: [
        { label: "Reach", value: clamp(userScore - 4, 0, 100) },
        { label: "Engagement", value: clamp(userScore - 2, 0, 100) },
        { label: "Consistency", value: clamp(userScore - 8, 0, 100) },
        { label: "Velocity", value: clamp(userScore - 6, 0, 100) },
        { label: "Diversity", value: clamp(userScore - 3, 0, 100) },
      ],
      benchmarkScore: [
        { label: "Reach", value: clamp(Math.round(benchmarkBase + 6), 0, 100) },
        {
          label: "Engagement",
          value: clamp(Math.round(benchmarkBase + 2), 0, 100),
        },
        {
          label: "Consistency",
          value: clamp(Math.round(benchmarkBase - 3), 0, 100),
        },
        { label: "Velocity", value: clamp(Math.round(benchmarkBase), 0, 100) },
        {
          label: "Diversity",
          value: clamp(Math.round(benchmarkBase - 1), 0, 100),
        },
      ],
    };

    res.status(200).json({
      success: true,
      data: {
        leaderboard,
        insights,
        userScore,
        userStats: {
          totalPosts: publishedCount,
          publishedPosts: publishedCount,
          postsLast7d: publishedCount,
          connectedPlatforms: userPlatforms,
          successRate: clamp(publishedCount * 10, 0, 100),
        },
        radarData,
        range,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCompetitorFeed = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const { page, limit, skip } = parsePagination(req.query);
    const { mongoSort, sortMeta } = parseSort(
      req.query,
      [
        "publishedAt",
        "createdAt",
        "engagement",
        "reach",
        "shares",
        "confidence",
      ],
      "publishedAt",
      "desc",
    );

    const filters: Record<string, unknown> = { userId };

    if (
      typeof req.query.platform === "string" &&
      req.query.platform.trim() &&
      req.query.platform !== "all"
    ) {
      filters.platform = req.query.platform.trim().toLowerCase();
    }

    if (
      typeof req.query.competitorId === "string" &&
      req.query.competitorId.trim()
    ) {
      filters.competitorId = req.query.competitorId.trim().toLowerCase();
    }

    if (typeof req.query.type === "string" && req.query.type.trim()) {
      filters.tags = { $in: [req.query.type.trim().toLowerCase()] };
    }

    if (typeof req.query.source === "string" && req.query.source.trim()) {
      const source = req.query.source.trim().toLowerCase();
      if ((FEED_SOURCES as readonly string[]).includes(source)) {
        filters.source = source;
      }
    }

    const rangeStart = parseRangeToStartDate(
      typeof req.query.range === "string" ? req.query.range : undefined,
    );
    if (rangeStart) {
      filters.$or = [
        { publishedAt: { $gte: rangeStart } },
        {
          publishedAt: { $exists: false },
          createdAt: { $gte: rangeStart },
        },
      ];
    }

    const [total, rows] = await Promise.all([
      CompetitorFeedItem.countDocuments(filters),
      CompetitorFeedItem.find(filters).sort(mongoSort).skip(skip).limit(limit),
    ]);

    const data = rows.map((item) => ({
      id: item._id,
      competitorId: item.competitorId,
      author: item.author,
      platform: item.platform,
      source: item.source,
      externalPostId: item.externalPostId || null,
      postUrl: item.postUrl || null,
      publishedAt: item.publishedAt || null,
      confidence: item.confidence,
      content: item.content,
      engagement: item.engagement,
      reach: item.reach,
      shares: item.shares,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      tags: item.tags,
    }));

    emitRealtime("competitors", "feed_snapshot", {
      count: data.length,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data,
      pagination: buildPaginationMeta(total, { page, limit }),
      filters: {
        competitorId: req.query.competitorId || null,
        platform: req.query.platform || "all",
        type: req.query.type || "all",
        source: req.query.source || "all",
        range: req.query.range || null,
      },
      sort: sortMeta,
    });
  } catch (error) {
    next(error);
  }
};

export const getCompetitorAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const competitorId = String(req.params.id || "")
      .trim()
      .toLowerCase();
    if (!competitorId) throw new BadRequestError("competitor id is required");

    const rows = await CompetitorFeedItem.find({
      userId,
      competitorId,
    }).sort({ publishedAt: -1, createdAt: -1 });

    if (rows.length === 0) throw new NotFoundError("Competitor not found");

    const target = await CompetitorTarget.findOne({
      userId,
      competitorId,
    }).lean();

    const avgEngagement =
      rows.reduce((sum, row) => sum + row.engagement, 0) / rows.length;
    const avgReach =
      rows.reduce((sum, row) => sum + row.reach, 0) / rows.length;
    const avgShares =
      rows.reduce((sum, row) => sum + row.shares, 0) / rows.length;
    const avgConfidence =
      rows.reduce((sum, row) => sum + Number(row.confidence || 0), 0) /
      rows.length;

    const platformBreakdown = COMPETITOR_PLATFORMS.map((platform) => {
      const count = rows.filter((item) => item.platform === platform).length;
      return { platform, count };
    });

    const trend = rows
      .slice(0, 12)
      .reverse()
      .map((row, idx) => {
        const ts = row.publishedAt || row.createdAt;
        return {
          point: idx + 1,
          date: ts.toISOString().slice(0, 10),
          engagement: row.engagement,
          reach: row.reach,
          confidence: row.confidence,
        };
      });

    const tagCount = new Map<string, number>();
    for (const row of rows) {
      for (const tag of normalizeTags(row.tags)) {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      }
    }

    const topTags = Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);

    res.status(200).json({
      success: true,
      data: {
        competitor: {
          id: competitorId,
          author: rows[0].author,
          name: target?.name || rows[0].author,
          target: target ? serializeTarget(target) : null,
        },
        summary: {
          averageEngagement: Number(avgEngagement.toFixed(2)),
          averageReach: Math.round(avgReach),
          averageShares: Math.round(avgShares),
          averageConfidence: Number(avgConfidence.toFixed(2)),
          postCount: rows.length,
        },
        platformBreakdown,
        topTags,
        trend,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /competitors/:id/profile  — Deep-Dive Profile
// ---------------------------------------------------------------------------
export const getCompetitorProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const competitorId = String(req.params.id || "").trim().toLowerCase();
    if (!competitorId) throw new BadRequestError("competitor id is required");

    const [target, rows] = await Promise.all([
      CompetitorTarget.findOne({ userId, competitorId }).lean(),
      CompetitorFeedItem.find({ userId, competitorId })
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(200)
        .lean(),
    ]);

    if (!target && rows.length === 0)
      throw new NotFoundError("Competitor not found");

    const name = target?.name || rows[0]?.author || competitorId;

    // ── Follower Growth Curve (30-day daily buckets from reach proxy) ──
    const now = Date.now();
    const dayBuckets = new Map<string, { date: string; reach: number; posts: number }>();
    for (let d = 29; d >= 0; d--) {
      const dt = new Date(now - d * DAY_MS).toISOString().slice(0, 10);
      dayBuckets.set(dt, { date: dt, reach: 0, posts: 0 });
    }
    for (const row of rows) {
      const ts = row.publishedAt || row.createdAt;
      const key = new Date(ts).toISOString().slice(0, 10);
      const bucket = dayBuckets.get(key);
      if (bucket) {
        bucket.reach += toSafeNumber(row.reach, 0);
        bucket.posts += 1;
      }
    }
    const followerGrowthCurve = Array.from(dayBuckets.values()).map((b) => ({
      date: b.date,
      // Estimate followers from cumulative reach (proxy; replace with real API)
      followers: Math.round(b.reach * 0.12),
      industryAvg: Math.round(b.reach * 0.09),
      posts: b.posts,
    }));

    // Peak viral point (max reach day)
    const peakDay = followerGrowthCurve.reduce(
      (best, d) => (d.followers > best.followers ? d : best),
      followerGrowthCurve[0] || { date: "", followers: 0, posts: 0, industryAvg: 0 }
    );

    // ── Interaction Efficiency Heatmap (7 days × 24 hours) ──
    const heatmap: number[][] = Array.from({ length: 7 }, () =>
      Array(24).fill(0),
    );
    const heatmapCounts: number[][] = Array.from({ length: 7 }, () =>
      Array(24).fill(0),
    );
    for (const row of rows) {
      const ts = new Date(row.publishedAt || row.createdAt);
      const dow = ts.getDay(); // 0=Sun
      const hour = ts.getHours();
      heatmap[dow][hour] += toSafeNumber(row.engagement, 0);
      heatmapCounts[dow][hour] += 1;
    }
    const interactionHeatmap = heatmap.map((dayRow, d) =>
      dayRow.map((val, h) => ({
        day: d,
        hour: h,
        avgEngagement: heatmapCounts[d][h] > 0
          ? Number((val / heatmapCounts[d][h]).toFixed(2))
          : 0,
      }))
    );

    // ── Summary metrics ──
    const totalReach = rows.reduce((s, r) => s + toSafeNumber(r.reach, 0), 0);
    const totalEngagement = rows.reduce((s, r) => s + toSafeNumber(r.engagement, 0), 0);
    const avgEngagement = rows.length > 0 ? totalEngagement / rows.length : 0;
    const avgFollowerGrowth = followerGrowthCurve.length > 0
      ? followerGrowthCurve[followerGrowthCurve.length - 1].followers -
        followerGrowthCurve[0].followers
      : 0;
    const shareOfVoice = rows.length > 0 ? clamp(avgEngagement * 5, 0, 50) : 0;

    // ── Trending Content Feed (top 4 posts by reach) ──
    const trendingPosts = [...rows]
      .sort((a, b) => toSafeNumber(b.reach, 0) - toSafeNumber(a.reach, 0))
      .slice(0, 4)
      .map((post) => ({
        id: String(post._id),
        content: post.content,
        platform: post.platform,
        author: post.author,
        publishedAt: post.publishedAt || post.createdAt,
        reach: toSafeNumber(post.reach, 0),
        engagement: toSafeNumber(post.engagement, 0),
        shares: toSafeNumber(post.shares, 0),
        tags: post.tags || [],
        postUrl: post.postUrl || null,
        viralTag: toSafeNumber(post.engagement, 0) > 10 ? "HIGH VIRALITY" : "TRENDING",
        vsAvg: Number(
          ((toSafeNumber(post.reach, 0) - (totalReach / Math.max(rows.length, 1))) 
            / Math.max(totalReach / Math.max(rows.length, 1), 1) * 100).toFixed(0)
        ),
      }));

    res.status(200).json({
      success: true,
      data: {
        competitor: {
          id: competitorId,
          name,
          handle: target?.handles || {},
          platforms: target?.platforms || Array.from(new Set(rows.map((r) => r.platform))),
          tags: target?.tags || [],
          sourceConfidence: target?.sourceConfidence || 70,
          primaryStatus: rows.length > 10 ? "PRIMARY COMPETITOR" : "TRACKED",
          lastSyncedAt: target?.lastSyncedAt || null,
        },
        summary: {
          totalReach,
          engagementRate: Number(avgEngagement.toFixed(2)),
          followerGrowth: avgFollowerGrowth,
          shareOfVoice: Number(shareOfVoice.toFixed(1)),
          postCount: rows.length,
        },
        followerGrowthCurve,
        peakViralPoint: {
          date: peakDay.date,
          value: peakDay.followers,
          label: "Peak Viral Point",
        },
        interactionHeatmap,
        trendingContentFeed: trendingPosts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /competitors/:id/compare-self  — Compare to Self
// ---------------------------------------------------------------------------
export const getCompetitorCompareSelf = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const competitorId = String(req.params.id || "").trim().toLowerCase();
    if (!competitorId) throw new BadRequestError("competitor id is required");

    const [target, competitorRows, myPosts, publishedCount] = await Promise.all([
      CompetitorTarget.findOne({ userId, competitorId }).lean(),
      CompetitorFeedItem.find({ userId, competitorId }).lean(),
      GeneratedPost.find({ userId, status: "published" }).lean(),
      GeneratedPost.countDocuments({ userId, status: "published" }),
    ]);

    if (!target && competitorRows.length === 0)
      throw new NotFoundError("Competitor not found");

    const name = target?.name || competitorRows[0]?.author || competitorId;

    // ── My Stats ──
    const myReach = myPosts.reduce((s, p) => s + toSafeNumber(p.reach, 0), 0);
    const myEngagement = myPosts.length > 0
      ? myPosts.reduce((s, p) => s + toSafeNumber(p.engagementRate, 0), 0) / myPosts.length
      : 0;


    // Weekly post frequency
    const oneWeekAgo = new Date(Date.now() - 7 * DAY_MS);
    const myWeeklyPosts = myPosts.filter(
      (p) => new Date(p.createdAt) >= oneWeekAgo
    ).length;
    const competitorWeeklyPosts = competitorRows.filter(
      (r) => new Date(r.publishedAt || r.createdAt) >= oneWeekAgo
    ).length;

    // ── Competitor Stats ──
    const compReach = competitorRows.reduce((s, r) => s + toSafeNumber(r.reach, 0), 0);
    const compEngagement = competitorRows.length > 0
      ? competitorRows.reduce((s, r) => s + toSafeNumber(r.engagement, 0), 0) / competitorRows.length
      : 0;

    // ── Power Scores ──
    const myScore = clamp(
      35 + publishedCount * 3 + (myPosts[0] ? 8 : 0) + myEngagement * 5,
      10,
      100
    );
    const competitorScore = clamp(
      35 + competitorRows.length * 3 + compEngagement * 5,
      10,
      100
    );

    // ── Comparative Metrics Table ──
    const makeVarianceLabel = (myVal: number, compVal: number) => {
      const diff = myVal - compVal;
      if (Math.abs(diff) < 0.5) return `TIED`;
      return diff > 0 ? `+${diff.toFixed(1)}% LEAD` : `-${Math.abs(diff).toFixed(1)}% LAG`;
    };

    const comparativeMetrics = [
      {
        category: "Reach",
        you: { value: myReach, display: toCompactNumber(myReach), change: "+5%" },
        competitor: { value: compReach, display: toCompactNumber(compReach), change: "+1%" },
        variance: myReach > compReach
          ? `+${(((myReach - compReach) / Math.max(compReach, 1)) * 100).toFixed(1)}% LEAD`
          : `-${(((compReach - myReach) / Math.max(compReach, 1)) * 100).toFixed(1)}% LAG`,
      },
      {
        category: "Engagement Rate",
        you: { value: myEngagement, display: `${myEngagement.toFixed(2)}%`, change: "Stable" },
        competitor: { value: compEngagement, display: `${compEngagement.toFixed(2)}%`, change: "+0.4%" },
        varianceLabel: makeVarianceLabel(myEngagement, compEngagement),
      },
      {
        category: "Audience Growth",
        you: { value: publishedCount * 22, display: toCompactNumber(publishedCount * 22), change: "+14%" },
        competitor: { value: competitorRows.length * 12, display: toCompactNumber(competitorRows.length * 12), change: "Stable" },
        variance: makeVarianceLabel(publishedCount * 22, competitorRows.length * 12),
      },
      {
        category: "Share of Voice",
        you: { value: clamp(myEngagement * 3.5, 0, 100), display: `${clamp(myEngagement * 3.5, 0, 100).toFixed(1)}%`, change: "+2.1%" },
        competitor: { value: clamp(compEngagement * 2.8, 0, 100), display: `${clamp(compEngagement * 2.8, 0, 100).toFixed(1)}%`, change: "-0.8%" },
        variance: makeVarianceLabel(clamp(myEngagement * 3.5, 0, 100), clamp(compEngagement * 2.8, 0, 100)),
      },
    ];

    // ── Performance Gap Analysis ──
    const performanceGap = [
      {
        label: "POST FREQUENCY (WEEKLY)",
        you: myWeeklyPosts,
        competitor: competitorWeeklyPosts,
        gap: `${myWeeklyPosts > competitorWeeklyPosts ? "+" : ""}${myWeeklyPosts - competitorWeeklyPosts} posts/wk`,
        lead: myWeeklyPosts >= competitorWeeklyPosts,
      },
      {
        label: "VIDEO IMPACT SCORE",
        you: clamp(myScore + 10, 0, 100),
        competitor: clamp(competitorScore, 0, 100),
        gap: `${myScore + 10 > competitorScore ? "LEAD" : "LAG"}: ${Math.abs((myScore + 10) - competitorScore).toFixed(1)}%`,
        lead: myScore + 10 >= competitorScore,
      },
      {
        label: "AUDIENCE SENTIMENT (NET)",
        you: clamp(75 + myEngagement * 2, 0, 100),
        competitor: clamp(65 + compEngagement * 2, 0, 100),
        gap: `${myScore >= competitorScore ? "LEAD" : "LAG"}: ${Math.abs((75 + myEngagement * 2) - (65 + compEngagement * 2)).toFixed(1)}%`,
        lead: myEngagement >= compEngagement,
      },
    ];

    res.status(200).json({
      success: true,
      data: {
        you: {
          name: "GrowMarkt (You)",
          powerScore: Number(myScore.toFixed(1)),
          change: "+12%",
          progress: myScore,
        },
        competitor: {
          name,
          id: competitorId,
          powerScore: Number(competitorScore.toFixed(1)),
          change: competitorScore > 60 ? "+2.4%" : "-2.4%",
          progress: competitorScore,
        },
        comparativeMetrics,
        performanceGap,
        strategicWins: [
          {
            title: "Video Dominance",
            description: "Your video retention rates are significantly higher than competitor average.",
          },
          {
            title: "Comment Sentiment",
            description: `${Math.round(clamp(75 + myEngagement * 2, 0, 100))}% positive sentiment in replies vs competitor.`,
          },
        ],
        counterMoves: [
          {
            title: "Increase Volume",
            description: `Increase LinkedIn post frequency by ${Math.abs(myWeeklyPosts - competitorWeeklyPosts) + 2} to match visibility.`,
          },
          {
            title: "Target Ad Segments",
            description: "Redirect spend to keywords where competitor is currently weak.",
          },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /competitors/:id/posts  — List competitor's posts
// ---------------------------------------------------------------------------
export const getCompetitorPosts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const competitorId = String(req.params.id || "").trim().toLowerCase();
    if (!competitorId) throw new BadRequestError("competitor id is required");

    const { page, limit, skip } = parsePagination(req.query);
    const { mongoSort, sortMeta } = parseSort(
      req.query,
      ["publishedAt", "createdAt", "engagement", "reach", "shares"],
      "publishedAt",
      "desc",
    );

    const filters: Record<string, unknown> = { userId, competitorId };

    if (typeof req.query.platform === "string" && req.query.platform.trim() && req.query.platform !== "all") {
      filters.platform = req.query.platform.trim().toLowerCase();
    }

    const rangeStart = parseRangeToStartDate(
      typeof req.query.range === "string" ? req.query.range : "7d",
    );
    if (rangeStart) {
      filters.$or = [
        { publishedAt: { $gte: rangeStart } },
        { publishedAt: { $exists: false }, createdAt: { $gte: rangeStart } },
      ];
    }

    const [total, rows] = await Promise.all([
      CompetitorFeedItem.countDocuments(filters),
      CompetitorFeedItem.find(filters).sort(mongoSort).skip(skip).limit(limit),
    ]);

    const allRows = await CompetitorFeedItem.find({ userId, competitorId }).lean();
    const avgReach = allRows.reduce((s, r) => s + toSafeNumber(r.reach, 0), 0) / Math.max(allRows.length, 1);

    const data = rows.map((item) => {
      const itemReach = toSafeNumber(item.reach, 0);
      const vsAvg = avgReach > 0
        ? Number(((itemReach - avgReach) / avgReach * 100).toFixed(0))
        : 0;
      return {
        id: String(item._id),
        competitorId: item.competitorId,
        author: item.author,
        platform: item.platform,
        content: item.content,
        postUrl: item.postUrl || null,
        publishedAt: item.publishedAt || null,
        engagement: item.engagement,
        reach: item.reach,
        shares: item.shares,
        tags: item.tags || [],
        viralTag: item.engagement > 10 ? "HIGH VIRALITY" : item.engagement > 5 ? "TRENDING" : null,
        vsAvg: `${vsAvg >= 0 ? "+" : ""}${vsAvg}% VS AVG`,
        createdAt: item.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      data,
      pagination: buildPaginationMeta(total, { page, limit }),
      filters: {
        competitorId,
        platform: req.query.platform || "all",
        range: req.query.range || "7d",
      },
      sort: sortMeta,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /competitors/:id/posts/:postId/impact  — Single Competitor Post Deep-Dive
// ---------------------------------------------------------------------------
export const getCompetitorPostImpact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const competitorId = String(req.params.id || "").trim().toLowerCase();
    const postId = String(req.params.postId || "").trim();

    if (!competitorId) throw new BadRequestError("competitor id is required");
    if (!postId) throw new BadRequestError("post id is required");

    const feedItem = await CompetitorFeedItem.findOne({
      _id: Types.ObjectId.isValid(postId) ? postId : undefined,
      userId,
      competitorId,
    }).lean() || await CompetitorFeedItem.findOne({
      externalPostId: postId,
      userId,
      competitorId,
    }).lean();

    if (!feedItem) throw new NotFoundError("Competitor post not found");

    const reach = toSafeNumber(feedItem.reach, 0);
    const engagement = toSafeNumber(feedItem.engagement, 0);
    const shares = toSafeNumber(feedItem.shares, 0);
    const likes = Math.round(reach * 0.05);
    const comments = Math.round(reach * 0.008);
    const saves = Math.round(reach * 0.01);

    // Engagement Velocity curve (simulated over 48 hours using log curve)
    const engagementVelocity = Array.from({ length: 9 }, (_, i) => {
      const hour = i * 6;
      const factor = Math.log(1 + hour / 8 + 1);
      return {
        hour,
        thisPost: Number((engagement * factor * 0.8).toFixed(2)),
        avgPost: Number((engagement * factor * 0.5).toFixed(2)),
      };
    });

    // Audience Sentiment (derived from engagement proxy)
    const positiveScore = Math.min(95, 60 + engagement * 2);
    const negativeScore = Math.max(2, 15 - engagement);
    const neutralScore = 100 - positiveScore - negativeScore;

    // Tags as core context
    const coreContext = (feedItem.tags || []).slice(0, 6);

    res.status(200).json({
      success: true,
      data: {
        post: {
          id: String(feedItem._id),
          competitorId,
          author: feedItem.author,
          platform: feedItem.platform,
          content: feedItem.content,
          postUrl: feedItem.postUrl || null,
          publishedAt: feedItem.publishedAt || null,
        },
        metrics: {
          reach,
          engagementRate: Number(engagement.toFixed(2)),
          saves,
          likes,
          comments,
          shares,
        },
        engagementVelocity,
        audienceSentiment: {
          score: Number(positiveScore.toFixed(0)),
          label: positiveScore > 75 ? "HIGHLY POSITIVE" : positiveScore > 50 ? "POSITIVE" : "MIXED",
          breakdown: {
            positive: Number(positiveScore.toFixed(0)),
            neutral: Number(neutralScore.toFixed(0)),
            negative: Number(negativeScore.toFixed(0)),
          },
        },
        coreContext,
        strategicTakeaway: {
          description: `This post achieved ${engagement > 8 ? "above-average" : "moderate"} engagement through ${coreContext[0] || "content"} positioning.`,
          insights: [
            `${engagement > 5 ? "High-engagement" : "Standard"} content format drove ${toCompactNumber(reach)} reach.`,
            `Content shared ${shares} times, indicating ${shares > 100 ? "strong" : "moderate"} virality.`,
          ],
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /competitors/insight-summary  — AI Insight card for Trending Feed
// ---------------------------------------------------------------------------
export const getCompetitorInsightSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req);

    // Get recent competitor activity in last 24h
    const oneDayAgo = new Date(Date.now() - DAY_MS);
    const [recentCount, totalCount, topPlatforms] = await Promise.all([
      CompetitorFeedItem.countDocuments({
        userId,
        $or: [
          { publishedAt: { $gte: oneDayAgo } },
          { createdAt: { $gte: oneDayAgo } },
        ],
      }),
      CompetitorFeedItem.countDocuments({ userId }),
      CompetitorFeedItem.aggregate([
        { $match: { userId } },
        { $group: { _id: "$platform", count: { $sum: 1 }, avgEngagement: { $avg: "$engagement" } } },
        { $sort: { count: -1 } },
        { $limit: 3 },
      ]),
    ]);

    const topPlatform = topPlatforms[0]?._id || "linkedin";
    const activityChangePercent = totalCount > 0
      ? Number(((recentCount / totalCount) * 100).toFixed(0))
      : 0;

    const visualContent = topPlatforms.find((p) => p._id === "instagram");
    const visualLead = visualContent
      ? Number(((visualContent.avgEngagement || 0) / Math.max(topPlatforms[0]?.avgEngagement || 1, 1) * 3).toFixed(1))
      : 3;

    res.status(200).json({
      success: true,
      data: {
        title: `Competitor activity is up ${activityChangePercent}% today.`,
        description: `Visual content is outperforming text-only posts by ${visualLead}x across ${topPlatform} and X in your specific niche.`,
        liveCount: recentCount,
        suggestedAction: "Post a technical video breakdown to capitalize on the current trend.",
        topPlatform,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

