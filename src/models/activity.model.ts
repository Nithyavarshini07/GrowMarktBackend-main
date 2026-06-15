import mongoose, { Document, Schema, Types } from "mongoose";

export type ActivityCategory =
  | "ALL"
  | "PUBLISHED"
  | "COMPETITORS"
  | "TEAM"
  | "ALERTS";
export type ActivityEventType = "success" | "warning" | "error";

export interface IActivity extends Document {
  userId: Types.ObjectId;
  category: ActivityCategory;
  type: ActivityEventType;
  title: string;
  description: string;
  actor: string;
  meta: Record<string, unknown>;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["ALL", "PUBLISHED", "COMPETITORS", "TEAM", "ALERTS"],
      default: "ALL",
      index: true,
    },
    type: {
      type: String,
      enum: ["success", "warning", "error"],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    actor: { type: String, default: "GrowMarket" },
    meta: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

ActivitySchema.index({ userId: 1, category: 1, timestamp: -1 });

export const Activity = mongoose.model<IActivity>("Activity", ActivitySchema);
