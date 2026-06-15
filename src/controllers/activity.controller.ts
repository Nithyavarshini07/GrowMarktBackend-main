import { NextFunction, Response } from "express";
import { AuthRequest } from "@/middleware/auth.middleware";
import { Activity } from "@/models";
import { UnauthorizedError } from "@/utils/errors";
import {
  buildPaginationMeta,
  parsePagination,
  parseSort,
} from "@/utils/pagination";

const VALID_CATEGORIES = ["ALL", "PUBLISHED", "COMPETITORS", "TEAM", "ALERTS"];

export const getActivityFeed = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const { page, limit, skip } = parsePagination(req.query);
    const { mongoSort, sortMeta } = parseSort(
      req.query,
      ["timestamp", "createdAt", "updatedAt"],
      "timestamp",
      "desc",
    );

    const filters: Record<string, unknown> = { userId: req.userId };

    // ?type=PUBLISHED | COMPETITORS | TEAM | ALERTS (or ALL / omitted)
    const category =
      typeof req.query.type === "string"
        ? req.query.type.trim().toUpperCase()
        : "ALL";
    if (category && category !== "ALL" && VALID_CATEGORIES.includes(category)) {
      filters.category = category;
    }

    // ?eventType=success | warning | error
    const eventType =
      typeof req.query.eventType === "string"
        ? req.query.eventType.trim().toLowerCase()
        : "";
    if (eventType) {
      filters.type = eventType;
    }

    // ?platform=instagram
    if (typeof req.query.platform === "string" && req.query.platform.trim()) {
      filters["meta.platform"] = req.query.platform.trim().toLowerCase();
    }

    const [total, rows] = await Promise.all([
      Activity.countDocuments(filters),
      Activity.find(filters).sort(mongoSort).skip(skip).limit(limit),
    ]);

    const data = rows.map((item) => ({
      id: String(item._id),
      type: item.type,
      category: item.category,
      title: item.title,
      description: item.description,
      actor: item.actor,
      timestamp: item.timestamp,
      meta: item.meta,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data,
      pagination: buildPaginationMeta(total, { page, limit }),
      filters: {
        type: category || "ALL",
        eventType: eventType || "all",
        platform: req.query.platform || null,
      },
      sort: sortMeta,
    });
  } catch (error) {
    next(error);
  }
};
