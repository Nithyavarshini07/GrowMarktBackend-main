import { NextFunction, Response } from "express";
import { AuthRequest } from "@/middleware/auth.middleware";
import { Notification, Settings } from "@/models";
import { NotFoundError, UnauthorizedError } from "@/utils/errors";
import {
  buildPaginationMeta,
  parsePagination,
  parseSort,
} from "@/utils/pagination";
import { emitRealtime } from "@/realtime";



export const getNotifications = async (
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

    if (typeof req.query.type === "string" && req.query.type.trim()) {
      filters.type = req.query.type.trim().toLowerCase();
    }

    if (typeof req.query.category === "string" && req.query.category.trim()) {
      filters.category = req.query.category.trim().toUpperCase();
    }

    const [total, rows] = await Promise.all([
      Notification.countDocuments(filters),
      Notification.find(filters).sort(mongoSort).skip(skip).limit(limit),
    ]);

    const data = rows.map((notification) => ({
      id: String(notification._id),
      type: notification.type,
      category: notification.category,
      title: notification.title,
      description: notification.description,
      message: notification.description,
      actor: notification.actor || "GrowMarket",
      timestamp: notification.timestamp,
      meta: notification.meta || {},
      channels: notification.channels || ["in_app"],
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    }));

    const noQueryMode =
      !req.query.page &&
      !req.query.limit &&
      !req.query.sortBy &&
      !req.query.type &&
      !req.query.category;

    if (noQueryMode) {
      res.status(200).json({ success: true, data });
      return;
    }

    res.status(200).json({
      success: true,
      data,
      pagination: buildPaginationMeta(total, { page, limit }),
      filters: {
        type: req.query.type || null,
        category: req.query.category || null,
      },
      sort: sortMeta,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { isRead: true } },
      { new: true },
    );

    if (!notification) throw new NotFoundError("Notification not found");

    emitRealtime("notifications", "read", {
      id: notification._id,
      isRead: true,
      updatedAt: notification.updatedAt,
    });

    res.status(200).json({
      success: true,
      data: {
        id: String(notification._id),
        isRead: notification.isRead,
        updatedAt: notification.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const clearNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const result = await Notification.deleteMany({
      userId: req.userId,
      isRead: true,
    });

    res.status(200).json({
      success: true,
      data: {
        deletedCount: result.deletedCount || 0,
        message: "Read notifications cleared",
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateNotificationSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const payload = req.body || {};

    const settings = await Settings.findOneAndUpdate(
      { userId: req.userId },
      {
        $set: {
          "notifications.email": payload.email,
          "notifications.push": payload.push,
          "notifications.inApp": payload.inApp,
          "notifications.alerts": payload.alerts,
          "notifications.competitors": payload.competitors,
          "notifications.team": payload.team,
          "notifications.published": payload.published,
        },
      },
      { new: true, upsert: true },
    );

    res.status(200).json({
      success: true,
      data: {
        notifications: settings.notifications,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
