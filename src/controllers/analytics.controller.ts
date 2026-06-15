import { NextFunction, Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "@/middleware/auth.middleware";
import { GeneratedPost, PlatformStats } from "@/models";
import { BadRequestError, UnauthorizedError } from "@/utils/errors";
import {
  buildPaginationMeta,
  parsePagination,
  parseRangeToStartDate,
  parseSort,
} from "@/utils/pagination";
import { toPostResponse } from "@/services/post-format.service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDateLabel(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildTimeSeriesWindow(days: number): Date[] {
  return Array.from({ length: days }, (_, idx) => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (days - idx - 1));
    return date;
  });
}

/** Parse timezone-aware date string from query */
function resolveTimezone(tz: unknown): string {
  if (typeof tz !== "string" || !tz.trim()) return "UTC";
  return tz.trim();
}

/** Build $dateToString with optional timezone offset */
function buildDateGroupExpr(field: string, timezone: string) {
  return { $dateToString: { format: "%Y-%m-%d", date: field, timezone } };
}

function parseRangeDays(range: string): number {
  if (range === "7d") return 7;
  if (range === "30d") return 30;
  if (range === "90d") return 90;
  return 30;
}

function calcGrowthPercent(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

async function getPeriodStats(
  userId: string,
  from: Date,
  to?: Date,
): Promise<{ totalReach: number; avgEngagementRate: number; count: number }> {
  const match: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
    status: "published",
    createdAt: { $gte: from, ...(to ? { $lte: to } : {}) },
  };

  const agg = await GeneratedPost.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalReach: { $sum: { $ifNull: ["$reach", 0] } },
        avgEngagementRate: { $avg: { $ifNull: ["$engagementRate", 0] } },
        count: { $sum: 1 },
      },
    },
  ]);

  const row = agg[0];
  return {
    totalReach: Number(row?.totalReach || 0),
    avgEngagementRate: Number((row?.avgEngagementRate || 0).toFixed(2)),
    count: Number(row?.count || 0),
  };
}

// ---------------------------------------------------------------------------
// GET /analytics (legacy — kept for compatibility)
// ---------------------------------------------------------------------------
export const getAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const userId = req.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [
      totalPosts,
      draftPosts,
      scheduledPosts,
      publishedPosts,
      failedPosts,
    ] = await Promise.all([
      GeneratedPost.countDocuments({ userId }),
      GeneratedPost.countDocuments({ userId, status: "draft" }),
      GeneratedPost.countDocuments({ userId, status: "scheduled" }),
      GeneratedPost.countDocuments({ userId, status: "published" }),
      GeneratedPost.countDocuments({ userId, status: "failed" }),
    ]);

    const successRate =
      totalPosts > 0
        ? Number(((publishedPosts / totalPosts) * 100).toFixed(2))
        : 0;

    const [platformBreakdownRaw, statusBreakdownRaw, dayActivityRaw] =
      await Promise.all([
        GeneratedPost.aggregate([
          { $match: { userId: userObjectId } },
          { $group: { _id: "$platform", value: { $sum: 1 } } },
          { $sort: { value: -1 } },
        ]),
        GeneratedPost.aggregate([
          { $match: { userId: userObjectId } },
          { $group: { _id: "$status", value: { $sum: 1 } } },
        ]),
        GeneratedPost.aggregate([
          { $match: { userId: userObjectId } },
          { $group: { _id: { $dayOfWeek: "$createdAt" }, value: { $sum: 1 } } },
        ]),
      ]);

    const platformColors: Record<string, string> = {
      linkedin: "#0a66c2",
      instagram: "#e1306c",
      facebook: "#1877f2",
      twitter: "#1d9bf0",
    };

    const allPlatforms = ["linkedin", "instagram", "facebook", "twitter"];
    const platformMap = new Map(
      platformBreakdownRaw.map((item) => [item._id, item.value]),
    );
    const platformBreakdown = allPlatforms.map((platform) => ({
      platform,
      label: platform.charAt(0).toUpperCase() + platform.slice(1),
      value: platformMap.get(platform) || 0,
      color: platformColors[platform] || "#8f95a1",
    }));

    const statusColors: Record<string, string> = {
      draft: "#777f8d",
      scheduled: "#3c7bf0",
      published: "#1b8e46",
      failed: "#c93939",
    };

    const statusMap = new Map(
      statusBreakdownRaw.map((item) => [item._id, item.value]),
    );
    const statusBreakdown = ["draft", "scheduled", "published", "failed"].map(
      (status) => ({
        status,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value: statusMap.get(status) || 0,
        color: statusColors[status],
      }),
    );

    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayMap = new Map(
      dayActivityRaw.map((item) => [item._id, item.value]),
    );
    const dayActivity = dayLabels.map((label, idx) => ({
      day: label,
      value: dayMap.get(idx + 1) || 0,
    }));

    const windowDates = buildTimeSeriesWindow(8 * 7);
    const fromDate = windowDates[0];

    const timeseriesRaw = await GeneratedPost.aggregate([
      {
        $match: {
          userId: userObjectId,
          createdAt: { $gte: fromDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          posts: { $sum: 1 },
          published: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
          },
          scheduled: {
            $sum: { $cond: [{ $eq: ["$status", "scheduled"] }, 1, 0] },
          },
        },
      },
    ]);

    const timeMap = new Map(timeseriesRaw.map((item) => [item._id, item]));
    const timeSeries = windowDates
      .filter((_, idx) => idx % 7 === 0)
      .map((date) => {
        const key = getDateLabel(date);
        const hit = timeMap.get(key);
        return {
          label: key,
          posts: hit?.posts || 0,
          published: hit?.published || 0,
          scheduled: hit?.scheduled || 0,
        };
      });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalPosts,
          draftPosts,
          scheduledPosts,
          publishedPosts,
          failedPosts,
          successRate,
        },
        timeSeries,
        platformBreakdown,
        statusBreakdown,
        dayActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /analytics/overview  (spec-compliant)
// ---------------------------------------------------------------------------
export const getAnalyticsOverview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const range = typeof req.query.range === "string" ? req.query.range : "30d";
    const tz = resolveTimezone(req.query.timezone);
    const rangeDays = parseRangeDays(range);

    const now = new Date();
    const periodStart = new Date(
      now.getTime() - rangeDays * 24 * 60 * 60 * 1000,
    );
    const prevPeriodStart = new Date(
      periodStart.getTime() - rangeDays * 24 * 60 * 60 * 1000,
    );

    const userObjectId = new mongoose.Types.ObjectId(req.userId);

    // Current + previous period
    const [current, previous] = await Promise.all([
      getPeriodStats(req.userId, periodStart),
      getPeriodStats(req.userId, prevPeriodStart, periodStart),
    ]);

    // Followers from PlatformStats (most recent per platform)
    const latestFollowersRaw = await PlatformStats.aggregate([
      { $match: { userId: userObjectId } },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: "$platform",
          followers: { $first: "$followers" },
          reach: { $first: "$reach" },
          engagementRate: { $first: "$engagementRate" },
        },
      },
    ]);

    const allPlatforms = ["linkedin", "instagram", "facebook", "twitter"];

    const platformMap = new Map(
      latestFollowersRaw.map((item) => [item._id, item]),
    );

    const platforms = allPlatforms.map((platform) => {
      const row = platformMap.get(platform);
      return {
        platform,
        followers: Number(row?.followers || 0),
        reach: Number(row?.reach || 0),
        engagementRate: Number((row?.engagementRate || 0).toFixed(2)),
      };
    });

    const totalFollowers = platforms.reduce(
      (sum, item) => sum + item.followers,
      0,
    );

    const changeReach = calcGrowthPercent(
      current.totalReach,
      previous.totalReach,
    );
    const changeEngagement = calcGrowthPercent(
      current.avgEngagementRate,
      previous.avgEngagementRate,
    );

    const emptyState =
      current.count === 0 && previous.count === 0 && totalFollowers === 0;

    if (emptyState) {
      res.status(200).json({
        success: true,
        data: {
          metrics: {
            totalReach: 0,
            avgEngagementRate: 0,
            totalFollowers: 0,
            change: { reach: 0, engagementRate: 0 },
          },
          platforms: allPlatforms.map((p) => ({
            platform: p,
            followers: 0,
            reach: 0,
            engagementRate: 0,
          })),
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalReach: current.totalReach,
          avgEngagementRate: current.avgEngagementRate,
          totalFollowers,
          change: {
            reach: changeReach,
            engagementRate: changeEngagement,
          },
        },
        platforms,
        range,
        timezone: tz,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /analytics/growth-vs-engagement
// ---------------------------------------------------------------------------
export const getGrowthVsEngagement = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const range = typeof req.query.range === "string" ? req.query.range : "30d";
    const tz = resolveTimezone(req.query.timezone);
    const platform =
      typeof req.query.platform === "string" && req.query.platform.trim()
        ? req.query.platform.trim().toLowerCase()
        : null;

    const startDate = parseRangeToStartDate(range);
    if (!startDate)
      throw new BadRequestError("range must be one of 7d, 30d, 90d");

    const userObjectId = new mongoose.Types.ObjectId(req.userId);

    const match: Record<string, unknown> = {
      userId: userObjectId,
      createdAt: { $gte: startDate },
    };
    if (platform) match.platform = platform;

    const rows = await GeneratedPost.aggregate([
      { $match: match },
      {
        $group: {
          _id: buildDateGroupExpr("$createdAt", tz),
          reach: { $sum: { $ifNull: ["$reach", 0] } },
          engagement: { $avg: { $ifNull: ["$engagementRate", 0] } },
          posts: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Build follower growth from PlatformStats
    const statsMatch: Record<string, unknown> = {
      userId: userObjectId,
      date: { $gte: getDateLabel(startDate) },
    };
    if (platform) statsMatch.platform = platform;

    const followerRows = await PlatformStats.aggregate([
      { $match: statsMatch },
      {
        $group: {
          _id: "$date",
          followers: { $sum: "$followers" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const followersMap = new Map(
      followerRows.map((row) => [row._id, row.followers]),
    );

    const points = rows.map((row) => ({
      date: row._id,
      reach: Number(row.reach || 0),
      engagementRate: Number((row.engagement || 0).toFixed(2)),
      followers: followersMap.get(row._id) || 0,
      posts: Number(row.posts || 0),
    }));

    res.status(200).json({
      success: true,
      data: {
        range,
        platform: platform || "all",
        timezone: tz,
        points,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /analytics/top-nodes
// ---------------------------------------------------------------------------
export const getTopNodes = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const { page, limit, skip } = parsePagination(req.query);
    const { mongoSort, sortMeta } = parseSort(
      req.query,
      ["engagementRate", "reach", "createdAt", "publishedAt"],
      "engagementRate",
      "desc",
    );

    const filters: Record<string, unknown> = {
      userId: req.userId,
      status: "published",
    };

    if (typeof req.query.platform === "string" && req.query.platform.trim()) {
      filters.platform = req.query.platform.trim().toLowerCase();
    }

    const range = typeof req.query.range === "string" ? req.query.range : "";
    if (range) {
      const start = parseRangeToStartDate(range);
      if (start) filters.createdAt = { $gte: start };
    }

    const [total, rows] = await Promise.all([
      GeneratedPost.countDocuments(filters),
      GeneratedPost.find(filters).sort(mongoSort).skip(skip).limit(limit),
    ]);

    const data = rows.map((post) => {
      const payload = toPostResponse(post) as any;
      return {
        id: payload.id,
        title: payload.headline,
        platform: payload.platform,
        publishedAt: payload.publishedAt,
        engagementRate: payload.metrics.engagementRate,
        reach: payload.metrics.reach,
        isTopPerformer: payload.isTopPerformer,
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      data,
      pagination: buildPaginationMeta(total, { page, limit }),
      filters: {
        platform: req.query.platform || null,
        range: range || null,
      },
      sort: sortMeta,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /analytics/data-explorer
// ---------------------------------------------------------------------------
export const getDataExplorer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const { page, limit, skip } = parsePagination(req.query);
    const { mongoSort, sortMeta } = parseSort(
      req.query,
      ["engagementRate", "reach", "createdAt", "publishedAt", "likes"],
      "createdAt",
      "desc",
    );
    const tz = resolveTimezone(req.query.timezone);

    const filters: Record<string, unknown> = { userId: req.userId };

    if (typeof req.query.platform === "string" && req.query.platform.trim()) {
      filters.platform = req.query.platform.trim().toLowerCase();
    }

    if (typeof req.query.status === "string" && req.query.status.trim()) {
      filters.status = req.query.status.trim().toLowerCase();
    }

    const range = typeof req.query.range === "string" ? req.query.range : "";
    if (range) {
      const start = parseRangeToStartDate(range);
      if (start) filters.createdAt = { $gte: start };
    }

    if (typeof req.query.q === "string" && req.query.q.trim()) {
      filters.$or = [
        { headline: { $regex: req.query.q.trim(), $options: "i" } },
        { content: { $regex: req.query.q.trim(), $options: "i" } },
      ];
    }

    const [total, rows] = await Promise.all([
      GeneratedPost.countDocuments(filters),
      GeneratedPost.find(filters).sort(mongoSort).skip(skip).limit(limit),
    ]);

    const data = rows.map((post) => {
      const payload = toPostResponse(post) as any;
      return {
        id: payload.id,
        title: payload.headline,
        platform: payload.platform,
        status: payload.status,
        reach: payload.metrics?.reach || 0,
        engagementRate: payload.metrics?.engagementRate || 0,
        likes: payload.metrics?.likes || 0,
        comments: payload.metrics?.comments || 0,
        shares: payload.metrics?.shares || 0,
        publishedAt: payload.publishedAt,
        scheduledAt: payload.scheduledAt,
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      data,
      pagination: buildPaginationMeta(total, { page, limit }),
      filters: {
        platform: req.query.platform || null,
        status: req.query.status || null,
        range: range || null,
        q: req.query.q || null,
        timezone: tz,
      },
      sort: sortMeta,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /analytics/search
// ---------------------------------------------------------------------------
export const searchAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!q) throw new BadRequestError("q (search query) is required");

    const { page, limit, skip } = parsePagination(req.query);

    const filters: Record<string, unknown> = {
      userId: req.userId,
      $or: [
        { headline: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } },
        { cta: { $regex: q, $options: "i" } },
      ],
    };

    if (typeof req.query.platform === "string" && req.query.platform.trim()) {
      filters.platform = req.query.platform.trim().toLowerCase();
    }

    if (typeof req.query.status === "string" && req.query.status.trim()) {
      filters.status = req.query.status.trim().toLowerCase();
    }

    const [total, rows] = await Promise.all([
      GeneratedPost.countDocuments(filters),
      GeneratedPost.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    const data = rows.map((post) => {
      const payload = toPostResponse(post) as any;
      return {
        id: payload.id,
        title: payload.headline,
        platform: payload.platform,
        status: payload.status,
        engagementRate: payload.metrics?.engagementRate || 0,
        reach: payload.metrics?.reach || 0,
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      data,
      pagination: buildPaginationMeta(total, { page, limit }),
      filters: {
        q,
        platform: req.query.platform || null,
        status: req.query.status || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /analytics/time-series
// ---------------------------------------------------------------------------
export const getTimeSeries = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const range = typeof req.query.range === "string" ? req.query.range : "30d";
    const tz = resolveTimezone(req.query.timezone);
    const startDate = parseRangeToStartDate(range);
    if (!startDate)
      throw new BadRequestError("range must be one of 7d, 14d, 30d, 90d");

    const userObjectId = new mongoose.Types.ObjectId(req.userId);

    const match: Record<string, unknown> = {
      userId: userObjectId,
      createdAt: { $gte: startDate },
    };

    if (typeof req.query.platform === "string" && req.query.platform.trim()) {
      match.platform = req.query.platform.trim().toLowerCase();
    }

    const rows = await GeneratedPost.aggregate([
      { $match: match },
      {
        $group: {
          _id: buildDateGroupExpr("$createdAt", tz),
          reach: { $sum: { $ifNull: ["$reach", 0] } },
          engagement: { $avg: { $ifNull: ["$engagementRate", 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const points = rows.map((row) => ({
      date: row._id,
      reach: Number(row.reach || 0),
      engagementRate: Number((row.engagement || 0).toFixed(2)),
    }));

    res.status(200).json({
      success: true,
      data: {
        range,
        timezone: tz,
        platform: req.query.platform || "all",
        points,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /analytics/export
// ---------------------------------------------------------------------------
export const exportAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const format = String(req.query.format || "csv").toLowerCase();
    if (!["csv", "pdf"].includes(format)) {
      throw new BadRequestError("format must be csv or pdf");
    }

    const range = typeof req.query.range === "string" ? req.query.range : "";
    const rangeStart = range ? parseRangeToStartDate(range) : null;

    const matchFilters: Record<string, unknown> = { userId: req.userId };
    if (rangeStart) matchFilters.createdAt = { $gte: rangeStart };

    const posts = await GeneratedPost.find(matchFilters)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    if (format === "csv") {
      const headers = [
        "id",
        "platform",
        "status",
        "workflowStatus",
        "headline",
        "reach",
        "engagementRate",
        "likes",
        "comments",
        "shares",
        "publishedAt",
        "createdAt",
      ];

      const rows = posts.map((post: any) => [
        String(post._id),
        post.platform,
        post.status,
        post.workflowStatus || "DRAFT",
        `"${String(post.headline || "").replace(/"/g, '""')}"`,
        post.reach || 0,
        post.engagementRate || 0,
        post.likes || 0,
        post.comments || 0,
        post.shares || 0,
        post.publishedAt ? new Date(post.publishedAt).toISOString() : "",
        post.createdAt ? new Date(post.createdAt).toISOString() : "",
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=analytics-export-${Date.now()}.csv`,
      );
      res.status(200).send(csv);
      return;
    }

    // PDF export using pdfkit
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=analytics-export-${Date.now()}.pdf`,
    );

    doc.pipe(res);

    // Header
    doc.fontSize(22).text("GrowMarkt Analytics Report", { align: "center" });
    doc.fontSize(11).text(`Generated: ${new Date().toUTCString()}`, {
      align: "center",
    });
    if (range) {
      doc
        .text(`Range: ${range}`, { align: "center" })
        .text(`Posts included: ${posts.length}`, { align: "center" });
    }
    doc.moveDown(2);

    // Summary stats
    const totalReach = posts.reduce(
      (sum, p: any) => sum + Number(p.reach || 0),
      0,
    );
    const published = posts.filter((p: any) => p.status === "published").length;
    const avgEng =
      published > 0
        ? posts
            .filter((p: any) => p.status === "published")
            .reduce((sum, p: any) => sum + Number(p.engagementRate || 0), 0) /
          published
        : 0;

    doc.fontSize(14).text("Summary", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Total Posts: ${posts.length}`);
    doc.text(`Published: ${published}`);
    doc.text(`Total Reach: ${totalReach.toLocaleString()}`);
    doc.text(`Avg Engagement Rate: ${avgEng.toFixed(2)}%`);
    doc.moveDown(1.5);

    // Platform breakdown
    const allPlatforms = ["linkedin", "instagram", "facebook", "twitter"];
    doc.fontSize(14).text("Platform Breakdown", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    for (const platform of allPlatforms) {
      const platformPosts = posts.filter((p: any) => p.platform === platform);
      const reach = platformPosts.reduce(
        (sum, p: any) => sum + Number(p.reach || 0),
        0,
      );
      doc.text(
        `${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${platformPosts.length} posts, reach: ${reach.toLocaleString()}`,
      );
    }
    doc.moveDown(1.5);

    // Top 10 posts
    const topPosts = posts
      .filter((p: any) => p.status === "published")
      .sort(
        (a: any, b: any) =>
          Number(b.engagementRate || 0) - Number(a.engagementRate || 0),
      )
      .slice(0, 10);

    doc.fontSize(14).text("Top 10 Posts by Engagement", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    topPosts.forEach((post: any, i: number) => {
      doc.text(
        `${i + 1}. [${post.platform}] ${String(post.headline || "").slice(0, 60)} — ${Number(post.engagementRate || 0).toFixed(2)}% eng / ${post.reach || 0} reach`,
      );
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /analytics/impact/:postId
// ---------------------------------------------------------------------------
export const getPostImpact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const post = await GeneratedPost.findOne({
      _id: req.params.postId,
      userId: req.userId,
    });

    if (!post) throw new BadRequestError("Post not found");

    // Deterministic heatmap based on post engagement (no Math.random)
    const engBase = Math.max(0.1, (post.engagementRate || 2) / 100);
    const heatmap = Array.from({ length: 24 }, (_, hour) => {
      // Peak hours: 9-11am, 2-4pm, 7-9pm have higher weights
      const peakMultiplier =
        (hour >= 9 && hour <= 11) ||
        (hour >= 14 && hour <= 16) ||
        (hour >= 19 && hour <= 21)
          ? 1.8
          : 1.0;
      return {
        hour,
        value: Number(
          Math.min(1, engBase * peakMultiplier * (1 + Math.sin(hour / 4) * 0.3)).toFixed(2),
        ),
      };
    });

    res.status(200).json({
      success: true,
      data: {
        heatmap,
        explanation:
          post.status === "published"
            ? "Published post engagement distributed across a 24-hour window."
            : "Post has not been published yet; impact metrics are predictive.",
        metrics: {
          reach: post.reach || 0,
          shares: post.shares || 0,
          likes: post.likes || 0,
          comments: post.comments || 0,
          saves: post.saves || 0,
          sentiment: post.sentiment || "neutral",
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /analytics/insights
// ---------------------------------------------------------------------------
export const getAnalyticsInsights = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(
      now.getTime() - 14 * 24 * 60 * 60 * 1000,
    );

    const [current, previous, topPosts] = await Promise.all([
      GeneratedPost.find({
        userId: req.userId,
        createdAt: { $gte: sevenDaysAgo },
      })
        .sort({ engagementRate: -1, reach: -1 })
        .limit(100)
        .lean(),
      GeneratedPost.find({
        userId: req.userId,
        createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
      })
        .sort({ engagementRate: -1, reach: -1 })
        .limit(100)
        .lean(),
      GeneratedPost.find({ userId: req.userId, status: "published" })
        .sort({ engagementRate: -1, reach: -1 })
        .limit(5)
        .lean(),
    ]);

    const currentAvg = current.length
      ? current.reduce(
          (sum, item: any) => sum + Number(item.engagementRate || 0),
          0,
        ) / current.length
      : 0;
    const previousAvg = previous.length
      ? previous.reduce(
          (sum, item: any) => sum + Number(item.engagementRate || 0),
          0,
        ) / previous.length
      : 0;

    const delta = calcGrowthPercent(currentAvg, previousAvg);

    const insights = [
      {
        id: "analytics-trend",
        type: "trend",
        title:
          delta >= 0
            ? `Engagement is up ${delta}% week-over-week`
            : `Engagement is down ${Math.abs(delta)}% week-over-week`,
        description:
          "Compare winning formats and posting windows from your top posts to improve next-week output.",
      },
      {
        id: "analytics-top-format",
        type: "opportunity",
        title: "Repurpose top-performing posts",
        description:
          "Your highest engagement posts can be republished with updated hooks and platform-specific captions.",
        topPosts: topPosts.map((item: any) => ({
          id: String(item._id),
          platform: item.platform,
          headline: item.headline,
          engagementRate: Number(item.engagementRate || 0),
          reach: Number(item.reach || 0),
        })),
      },
    ];

    res.status(200).json({
      success: true,
      data: {
        insights,
        metrics: {
          currentAverageEngagementRate: Number(currentAvg.toFixed(2)),
          previousAverageEngagementRate: Number(previousAvg.toFixed(2)),
          weekOverWeekDelta: delta,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /analytics/monthly-deepdive
// ---------------------------------------------------------------------------
export const getMonthlyDeepDive = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();
    const monthStr = String(req.query.month || "").trim(); // YYYY-MM
    let start: Date;
    let end: Date;

    if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) {
      const [yearStr, mStr] = monthStr.split("-");
      start = new Date(Number(yearStr), Number(mStr) - 1, 1);
      end = new Date(Number(yearStr), Number(mStr), 0, 23, 59, 59, 999);
    } else {
      // Default to current month
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const posts = await GeneratedPost.find({
      userId: req.userId,
      status: "published",
      publishedAt: { $gte: start, $lte: end },
    }).lean();

    const totalMonthlyReach = posts.reduce((sum, p) => sum + Number((p as any).reach || 0), 0);
    const avgEngagementRate = posts.length > 0
      ? posts.reduce((sum, p) => sum + Number((p as any).engagementRate || 0), 0) / posts.length
      : 0;

    // Daily growth matrix (proxy via posts reach per day)
    const dailyGrowthMatrix = [];
    const daysInMonth = end.getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const currentDate = new Date(start.getFullYear(), start.getMonth(), d);
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      let reachForDay = 0;
      for (const p of posts) {
        const pd = new Date((p as any).publishedAt || (p as any).createdAt);
        if (pd.getDate() === d) reachForDay += Number((p as any).reach || 0);
      }
      dailyGrowthMatrix.push({
        date: currentDate.toISOString().slice(0, 10),
        newFollowers: Math.round(reachForDay * 0.05), // Simulated proxy
        isWeekend,
      });
    }

    const totalNewFollowers = dailyGrowthMatrix.reduce((s, row) => s + row.newFollowers, 0);

    const platformBreakdown = ["instagram", "linkedin", "twitter"].map(plat => {
      const pPosts = posts.filter(p => (p as any).platform === plat);
      return {
        platform: plat,
        growth: Math.round(pPosts.reduce((s, p) => s + Number((p as any).reach || 0), 0) * 0.05),
        rate: pPosts.length > 0 ? pPosts.reduce((s, p) => s + Number((p as any).engagementRate || 0), 0) / pPosts.length : 0,
      };
    });

    const impactfulNodes = [...posts].sort((a, b) => Number((b as any).engagementRate || 0) - Number((a as any).engagementRate || 0)).slice(0, 3).map(p => ({
      id: String(p._id),
      headline: (p as any).headline,
      platform: (p as any).platform,
      publishedAt: (p as any).publishedAt || (p as any).createdAt,
      engagementRate: Number((p as any).engagementRate || 0),
    }));

    res.status(200).json({
      success: true,
      data: {
        totalMonthlyReach,
        avgEngagementRate: Number(avgEngagementRate.toFixed(2)),
        totalNewFollowers,
        dailyGrowthMatrix,
        platformBreakdown,
        impactfulNodes,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /analytics/performance-nodes
// ---------------------------------------------------------------------------
export const getPerformanceNodes = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();
    const { page, limit, skip } = parsePagination(req.query);
    const { mongoSort, sortMeta } = parseSort(
      req.query,
      ["publishedAt", "engagementRate", "reach"],
      "engagementRate",
      "desc",
    );

    const rangeStart = parseRangeToStartDate(
      typeof req.query.range === "string" ? req.query.range : "30d",
    );
    const filters: any = { userId: req.userId, status: "published" };
    if (rangeStart) {
      filters.publishedAt = { $gte: rangeStart };
    }
    if (typeof req.query.platform === "string" && req.query.platform !== "all") {
      filters.platform = req.query.platform;
    }

    const [total, rows] = await Promise.all([
      GeneratedPost.countDocuments(filters),
      GeneratedPost.find(filters)
        .sort(mongoSort)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const threshold = rows.length > 0 ? rows[0] as any : null;
    const topEngagement = threshold ? Number(threshold.engagementRate || 0) : 0;

    const data = rows.map((p) => {
      const er = Number((p as any).engagementRate || 0);
      return {
        id: String(p._id),
        headline: (p as any).headline,
        publishedAt: (p as any).publishedAt || (p as any).createdAt,
        platform: (p as any).platform,
        engagementRate: er,
        reach: Number((p as any).reach || 0),
        mediaUrl: (p as any).mediaUrls?.[0] || null,
        isTopPerformer: er > 0 && er >= topEngagement * 0.8, // Top 20% relative to local max
      };
    });

    res.status(200).json({
      success: true,
      data,
      pagination: buildPaginationMeta(total, { page, limit }),
      sort: sortMeta,
    });
  } catch (error) {
    next(error);
  }
};
