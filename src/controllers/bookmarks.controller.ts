import { NextFunction, Response } from "express";
import { AuthRequest } from "@/middleware/auth.middleware";
import { Bookmark } from "@/models";
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

const BOOKMARK_TYPES = ["post", "competitor", "insight", "project"] as const;

type BookmarkType = (typeof BOOKMARK_TYPES)[number];

function normalizeBookmarkType(input: unknown): BookmarkType {
  const value = String(input || "")
    .trim()
    .toLowerCase();
  if (!(BOOKMARK_TYPES as readonly string[]).includes(value)) {
    throw new BadRequestError(
      `type must be one of: ${BOOKMARK_TYPES.join(", ")}`,
    );
  }
  return value as BookmarkType;
}

function toBookmarkResponse(item: any): Record<string, unknown> {
  return {
    id: String(item._id),
    entityId: item.entityId,
    type: item.type,
    title: item.title || null,
    meta: item.meta || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export const createBookmark = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const entityId = String(req.body?.entityId || "").trim();
    if (!entityId) throw new BadRequestError("entityId is required");

    const type = normalizeBookmarkType(req.body?.type);

    const bookmark = await Bookmark.findOneAndUpdate(
      { userId: req.userId, entityId, type },
      {
        $set: {
          title: req.body?.title ? String(req.body.title) : undefined,
          meta:
            req.body?.meta && typeof req.body.meta === "object"
              ? req.body.meta
              : {},
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.status(201).json({
      success: true,
      data: toBookmarkResponse(bookmark),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBookmark = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const removed = await Bookmark.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!removed) throw new NotFoundError("Bookmark not found");

    res.status(200).json({
      success: true,
      data: {
        id: String(removed._id),
        deleted: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listBookmarks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const { page, limit, skip } = parsePagination(req.query);
    const { mongoSort, sortMeta } = parseSort(
      req.query,
      ["createdAt", "updatedAt", "type"],
      "createdAt",
      "desc",
    );

    const filters: Record<string, unknown> = { userId: req.userId };

    if (typeof req.query.type === "string" && req.query.type.trim()) {
      filters.type = normalizeBookmarkType(req.query.type);
    }

    const [total, rows] = await Promise.all([
      Bookmark.countDocuments(filters),
      Bookmark.find(filters).sort(mongoSort).skip(skip).limit(limit),
    ]);

    res.status(200).json({
      success: true,
      data: rows.map((item) => toBookmarkResponse(item)),
      pagination: buildPaginationMeta(total, { page, limit }),
      filters: {
        type: req.query.type || null,
      },
      sort: sortMeta,
    });
  } catch (error) {
    next(error);
  }
};
