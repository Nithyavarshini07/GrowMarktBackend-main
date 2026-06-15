import { Activity, Notification } from "@/models";
import { emitRealtime } from "@/realtime";

export async function createActivityEvent(input: {
  userId: string;
  category: "ALL" | "PUBLISHED" | "COMPETITORS" | "TEAM" | "ALERTS";
  type: "success" | "warning" | "error";
  title: string;
  description: string;
  actor?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  const activity = await Activity.create({
    userId: input.userId,
    category: input.category,
    type: input.type,
    title: input.title,
    description: input.description,
    actor: input.actor || "GrowMarket",
    meta: input.meta || {},
    timestamp: new Date(),
  });

  emitRealtime("activity", "created", {
    id: activity._id,
    type: activity.type,
    category: activity.category,
    title: activity.title,
    description: activity.description,
    actor: activity.actor,
    timestamp: activity.timestamp,
    meta: activity.meta,
  });
}

export async function createNotificationEvent(input: {
  userId: string;
  type: "success" | "warning" | "error";
  category: "ALL" | "PUBLISHED" | "COMPETITORS" | "TEAM" | "ALERTS";
  title: string;
  description: string;
  actor?: string;
  channels?: Array<"in_app" | "email" | "push">;
  meta?: Record<string, unknown>;
}): Promise<void> {
  const notification = await Notification.create({
    userId: input.userId,
    type: input.type,
    category: input.category,
    title: input.title,
    description: input.description,
    actor: input.actor || "GrowMarket",
    channels: input.channels || ["in_app"],
    meta: input.meta || {},
    timestamp: new Date(),
    isRead: false,
  });

  emitRealtime("notifications", "created", {
    id: notification._id,
    type: notification.type,
    category: notification.category,
    title: notification.title,
    description: notification.description,
    actor: notification.actor,
    timestamp: notification.timestamp,
    channels: notification.channels,
    meta: notification.meta,
  });
}
