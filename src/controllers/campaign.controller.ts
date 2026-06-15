import { NextFunction, Response } from "express";
import { AuthRequest } from "@/middleware/auth.middleware";
import { Campaign, GeneratedPost, MonthlyObjective } from "@/models";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "@/utils/errors";
import {
  buildPaginationMeta,
  parsePagination,
  parseSort,
} from "@/utils/pagination";
import { createActivityEvent } from "@/services/activity-notification.service";

const CAMPAIGN_STATUSES = [
  "LIVE",
  "DRAFT",
  "READY",
  "PAUSED",
  "COMPLETED",
] as const;

function normalizeCampaignStatus(
  value: string,
): (typeof CAMPAIGN_STATUSES)[number] {
  const status = value.toUpperCase();
  if (!CAMPAIGN_STATUSES.includes(status as any)) {
    throw new BadRequestError(
      `status must be one of: ${CAMPAIGN_STATUSES.join(", ")}`,
    );
  }
  return status as (typeof CAMPAIGN_STATUSES)[number];
}

function toCampaignResponse(campaign: any): Record<string, unknown> {
  return {
    id: String(campaign._id),
    name: campaign.name,
    objective: campaign.objective,
    status: campaign.status,
    channels: campaign.channels || [],
    collaborators: campaign.collaborators || [],
    goals: {
      targetReach: campaign.targetReach || 0,
      currentReach: campaign.currentReach || 0,
      targetCount: campaign.targetCount || 0,
      currentCount: campaign.currentCount || 0,
      targetEngagementRate: campaign.targetEngagementRate || 0,
      currentEngagementRate: campaign.currentEngagementRate || 0,
      goalLabel: campaign.goalLabel || null,
    },
    feedSummary: campaign.feedSummary || "",
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// GET /campaigns
// ---------------------------------------------------------------------------
export const getCampaigns = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const { page, limit, skip } = parsePagination(req.query);
    const { mongoSort, sortMeta } = parseSort(
      req.query,
      ["createdAt", "updatedAt", "startDate", "endDate", "currentReach"],
      "updatedAt",
      "desc",
    );

    const filters: Record<string, unknown> = { userId: req.userId };

    if (typeof req.query.status === "string" && req.query.status.trim()) {
      filters.status = normalizeCampaignStatus(req.query.status.trim());
    }

    if (typeof req.query.q === "string" && req.query.q.trim()) {
      filters.name = { $regex: req.query.q.trim(), $options: "i" };
    }

    const [total, rows] = await Promise.all([
      Campaign.countDocuments(filters),
      Campaign.find(filters).sort(mongoSort).skip(skip).limit(limit),
    ]);

    const data = rows.map((item) => toCampaignResponse(item));

    res.status(200).json({
      success: true,
      data,
      pagination: buildPaginationMeta(total, { page, limit }),
      filters: {
        status: req.query.status || null,
        q: req.query.q || null,
      },
      sort: sortMeta,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /campaigns/:id
// ---------------------------------------------------------------------------
export const getCampaignById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!campaign) throw new NotFoundError("Campaign not found");

    res.status(200).json({
      success: true,
      data: toCampaignResponse(campaign),
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /campaigns/:id/timeline
// ---------------------------------------------------------------------------
export const getCampaignTimeline = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!campaign) throw new NotFoundError("Campaign not found");

    const posts = await GeneratedPost.find({
      userId: req.userId,
      campaignId: campaign._id,
    }).sort({ scheduledAt: 1, scheduledTime: 1, createdAt: 1 });

    const timeline = posts.map((post) => ({
      id: String(post._id),
      campaignId: String(campaign._id),
      title: post.headline,
      platform: post.platform,
      status: post.workflowStatus || "DRAFT",
      postStatus: post.status,
      scheduledAt: post.scheduledAt || post.scheduledTime || null,
      publishedAt: post.publishedAt || null,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        campaign: toCampaignResponse(campaign),
        timeline,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /campaigns/:id/analytics
// ---------------------------------------------------------------------------
export const getCampaignAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!campaign) throw new NotFoundError("Campaign not found");

    const posts = await GeneratedPost.find({
      userId: req.userId,
      campaignId: campaign._id,
    }).sort({ createdAt: 1 });

    const totalPosts = posts.length;
    const publishedPosts = posts.filter(
      (item) => item.status === "published",
    ).length;
    const scheduledPosts = posts.filter(
      (item) => item.status === "scheduled",
    ).length;
    const draftPosts = posts.filter((item) => item.status === "draft").length;
    const failedPosts = posts.filter((item) => item.status === "failed").length;

    const totalReach = posts.reduce(
      (sum, item) => sum + Number(item.reach || 0),
      0,
    );
    const averageEngagementRate = totalPosts
      ? Number(
          (
            posts.reduce(
              (sum, item) => sum + Number(item.engagementRate || 0),
              0,
            ) / totalPosts
          ).toFixed(2),
        )
      : 0;

    const platformBreakdown = [
      "linkedin",
      "instagram",
      "facebook",
      "twitter",
    ].map((platform) => {
      const scoped = posts.filter((item) => item.platform === platform);
      return {
        platform,
        count: scoped.length,
        reach: scoped.reduce((sum, item) => sum + Number(item.reach || 0), 0),
        engagementRate: scoped.length
          ? Number(
              (
                scoped.reduce(
                  (sum, item) => sum + Number(item.engagementRate || 0),
                  0,
                ) / scoped.length
              ).toFixed(2),
            )
          : 0,
      };
    });

    const timeSeriesMap = new Map<
      string,
      { date: string; posts: number; published: number; reach: number }
    >();

    for (const post of posts) {
      const key = new Date(post.createdAt).toISOString().slice(0, 10);
      const current = timeSeriesMap.get(key) || {
        date: key,
        posts: 0,
        published: 0,
        reach: 0,
      };

      current.posts += 1;
      current.reach += Number(post.reach || 0);
      if (post.status === "published") {
        current.published += 1;
      }

      timeSeriesMap.set(key, current);
    }

    const timeSeries = Array.from(timeSeriesMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    res.status(200).json({
      success: true,
      data: {
        campaign: toCampaignResponse(campaign),
        summary: {
          totalPosts,
          draftPosts,
          scheduledPosts,
          publishedPosts,
          failedPosts,
          totalReach,
          averageEngagementRate,
        },
        platformBreakdown,
        timeSeries,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /campaigns
// ---------------------------------------------------------------------------
export const createCampaign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const payload = req.body || {};

    if (!payload.name || !String(payload.name).trim()) {
      throw new BadRequestError("name is required");
    }
    if (!payload.startDate) throw new BadRequestError("startDate is required");
    if (!payload.endDate) throw new BadRequestError("endDate is required");

    const campaign = await Campaign.create({
      userId: req.userId,
      name: String(payload.name).trim(),
      objective: payload.objective || "reach",
      status: payload.status
        ? normalizeCampaignStatus(payload.status)
        : "DRAFT",
      channels: Array.isArray(payload.channels)
        ? payload.channels
        : ["linkedin"],
      collaborators: Array.isArray(payload.collaborators)
        ? payload.collaborators
        : [],
      targetReach: Number(payload.targetReach || 0),
      currentReach: Number(payload.currentReach || 0),
      targetCount: Number(payload.targetCount || 0),
      currentCount: Number(payload.currentCount || 0),
      targetEngagementRate: Number(payload.targetEngagementRate || 0),
      currentEngagementRate: Number(payload.currentEngagementRate || 0),
      goalLabel: payload.goalLabel || "",
      feedSummary: payload.feedSummary || "",
      startDate: new Date(payload.startDate),
      endDate: new Date(payload.endDate),
    });

    await createActivityEvent({
      userId: req.userId,
      category: "TEAM",
      type: "success",
      title: "Campaign created",
      description: `Campaign "${campaign.name}" was created with status ${campaign.status}.`,
      actor: "Campaign Manager",
      meta: { campaignId: campaign._id, status: campaign.status },
    });

    res.status(201).json({
      success: true,
      data: toCampaignResponse(campaign),
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PATCH /campaigns/:id
// ---------------------------------------------------------------------------
export const updateCampaign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const payload = req.body || {};
    const allowedFields = [
      "name",
      "objective",
      "status",
      "channels",
      "collaborators",
      "targetReach",
      "currentReach",
      "targetCount",
      "currentCount",
      "targetEngagementRate",
      "currentEngagementRate",
      "goalLabel",
      "feedSummary",
      "startDate",
      "endDate",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        updates[field] = payload[field];
      }
    }

    if (typeof updates.status === "string") {
      updates.status = normalizeCampaignStatus(updates.status);
    }
    if (updates.startDate) updates.startDate = new Date(String(updates.startDate));
    if (updates.endDate) updates.endDate = new Date(String(updates.endDate));

    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!campaign) throw new NotFoundError("Campaign not found");

    res.status(200).json({
      success: true,
      data: toCampaignResponse(campaign),
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /campaigns/:id
// ---------------------------------------------------------------------------
export const deleteCampaign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const campaign = await Campaign.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!campaign) throw new NotFoundError("Campaign not found");

    await createActivityEvent({
      userId: req.userId,
      category: "TEAM",
      type: "warning",
      title: "Campaign deleted",
      description: `Campaign "${campaign.name}" was removed.`,
      actor: "Campaign Manager",
      meta: { campaignId: req.params.id },
    });

    res.status(200).json({
      success: true,
      data: { message: "Campaign deleted successfully", id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /campaigns/objectives?month=YYYY-MM
// ---------------------------------------------------------------------------
export const getMonthlyObjective = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();
    const month = String(req.query.month || "").trim();
    if (!month) throw new BadRequestError("month query parameter is required (YYYY-MM)");

    const objective = await MonthlyObjective.findOne({
      userId: req.userId,
      month,
    }).lean();

    if (!objective) {
      res.status(200).json({
        success: true,
        data: null, // No objective set yet
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: String(objective._id),
        month: objective.month,
        targetReach: objective.targetReach,
        postCount: objective.postCount,
        targetEngagementRate: objective.targetEngagementRate,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /campaigns/objectives
// ---------------------------------------------------------------------------
export const upsertMonthlyObjective = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();
    const { month, targetReach, postCount, targetEngagementRate } = req.body;

    if (!month || typeof month !== "string") {
      throw new BadRequestError("month is required (YYYY-MM)");
    }

    const doc = await MonthlyObjective.findOneAndUpdate(
      { userId: req.userId, month: month.trim() },
      {
        $set: {
          targetReach: Number(targetReach) || 0,
          postCount: Number(postCount) || 0,
          targetEngagementRate: Number(targetEngagementRate) || 0,
        },
      },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    res.status(200).json({
      success: true,
      data: {
        id: String(doc._id),
        month: doc.month,
        targetReach: doc.targetReach,
        postCount: doc.postCount,
        targetEngagementRate: doc.targetEngagementRate,
      },
    });
  } catch (error) {
    next(error);
  }
};
