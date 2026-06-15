import mongoose, { Document, Schema, Types } from "mongoose";

export type PlatformStatsPlatform =
  | "linkedin"
  | "instagram"
  | "facebook"
  | "twitter";

export interface IPlatformStats extends Document {
  userId: Types.ObjectId;
  platform: PlatformStatsPlatform;
  date: string; // YYYY-MM-DD (UTC)
  followers: number;
  reach: number;
  engagementRate: number;
  impressions: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformStatsSchema = new Schema<IPlatformStats>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ["linkedin", "instagram", "facebook", "twitter"],
      required: true,
    },
    date: { type: String, required: true }, // "2024-03-15"
    followers: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Unique snapshot per user/platform/date
PlatformStatsSchema.index(
  { userId: 1, platform: 1, date: 1 },
  { unique: true },
);
PlatformStatsSchema.index({ userId: 1, date: -1 });
PlatformStatsSchema.index({ userId: 1, platform: 1, date: -1 });

export const PlatformStats = mongoose.model<IPlatformStats>(
  "PlatformStats",
  PlatformStatsSchema,
);
