import { NextFunction, Response } from "express";
import { AuthRequest } from "@/middleware/auth.middleware";
import { GeneratedPost } from "@/models";
import { UnauthorizedError } from "@/utils/errors";
import {
  buildPaginationMeta,
  parsePagination,
  parseSort,
  parseRangeToStartDate,
} from "@/utils/pagination";

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
      ["engagementRate", "reach", "publishedAt", "createdAt"],
      req.query.sortBy === "engagement" ? "engagementRate" : "engagementRate",
      "desc",
    );

    const filters: Record<string, unknown> = {
      userId: req.userId,
      status: "published",
    };

    if (
      typeof req.query.platform === "string" &&
      req.query.platform !== "all"
    ) {
      filters.platform = req.query.platform.toLowerCase();
    }

    const rangeStart = parseRangeToStartDate(
      typeof req.query.range === "string" ? req.query.range : undefined,
    );
    if (rangeStart) {
      filters.publishedAt = { $gte: rangeStart };
    }

    const [total, rows] = await Promise.all([
      GeneratedPost.countDocuments(filters),
      GeneratedPost.find(filters).sort(mongoSort).skip(skip).limit(limit),
    ]);

    const data = rows.map((post) => ({
      id: post._id,
      title: post.headline,
      platform: post.platform,
      publishedAt: post.publishedAt || post.createdAt,
      engagementRate: Number((post.engagementRate || 0).toFixed(2)),
      reach: post.reach || 0,
      isTopPerformer: Boolean(post.isTopPerformer),
      workflowStatus: post.workflowStatus,
      status: post.status,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data,
      pagination: buildPaginationMeta(total, { page, limit }),
      filters: {
        platform: req.query.platform || "all",
        range: req.query.range || null,
      },
      sort: sortMeta,
    });
  } catch (error) {
    next(error);
  }
};
