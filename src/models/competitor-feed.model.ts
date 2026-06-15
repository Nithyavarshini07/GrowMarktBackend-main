import mongoose, { Document, Schema, Types } from "mongoose";

export type CompetitorPlatform =
  | "linkedin"
  | "instagram"
  | "facebook"
  | "twitter";

export type CompetitorFeedSource = "manual" | "sync" | "api";

export interface ICompetitorFeedItem extends Document {
  userId: Types.ObjectId;
  competitorId: string;
  author: string;
  platform: CompetitorPlatform;
  source: CompetitorFeedSource;
  externalPostId?: string;
  postUrl?: string;
  publishedAt?: Date;
  confidence: number;
  content: string;
  engagement: number;
  reach: number;
  shares: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CompetitorFeedSchema = new Schema<ICompetitorFeedItem>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    competitorId: { type: String, required: true, index: true },
    author: { type: String, required: true },
    platform: {
      type: String,
      enum: ["linkedin", "instagram", "facebook", "twitter"],
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["manual", "sync", "api"],
      default: "manual",
      index: true,
    },
    externalPostId: { type: String, index: true },
    postUrl: { type: String },
    publishedAt: { type: Date, index: true },
    confidence: { type: Number, default: 80, min: 0, max: 100 },
    content: { type: String, required: true },
    engagement: { type: Number, default: 0, index: true },
    reach: { type: Number, default: 0, index: true },
    shares: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

CompetitorFeedSchema.index({ userId: 1, platform: 1, createdAt: -1 });
CompetitorFeedSchema.index({ userId: 1, competitorId: 1, publishedAt: -1 });
CompetitorFeedSchema.index(
  {
    userId: 1,
    competitorId: 1,
    platform: 1,
    externalPostId: 1,
  },
  {
    unique: true,
    partialFilterExpression: { externalPostId: { $type: "string" } },
  },
);

export const CompetitorFeedItem = mongoose.model<ICompetitorFeedItem>(
  "CompetitorFeedItem",
  CompetitorFeedSchema,
);
