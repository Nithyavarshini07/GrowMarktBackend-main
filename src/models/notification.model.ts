import mongoose, { Schema, Document, Types } from "mongoose";

export type NotificationType = "success" | "warning" | "error";
export type NotificationCategory =
  | "ALL"
  | "PUBLISHED"
  | "COMPETITORS"
  | "TEAM"
  | "ALERTS";

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  description: string;
  actor?: string;
  meta?: Record<string, unknown>;
  channels: Array<"in_app" | "email" | "push">;
  isRead: boolean;
  link?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["success", "warning", "error"],
      required: true,
    },
    category: {
      type: String,
      enum: ["ALL", "PUBLISHED", "COMPETITORS", "TEAM", "ALERTS"],
      default: "ALL",
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    actor: { type: String },
    meta: { type: Schema.Types.Mixed, default: {} },
    channels: {
      type: [String],
      enum: ["in_app", "email", "push"],
      default: ["in_app"],
    },
    isRead: { type: Boolean, default: false },
    link: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

NotificationSchema.index({ userId: 1, isRead: 1, timestamp: -1 });

export const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema,
);
