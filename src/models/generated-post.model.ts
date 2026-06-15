import mongoose, { Schema, Document, Types } from "mongoose";

export type Platform = "linkedin" | "instagram" | "facebook" | "twitter";
export type PostStatus = "draft" | "scheduled" | "published" | "failed";
export type WorkflowStatus = "DRAFT" | "READY" | "LIVE";

export interface IGeneratedPost extends Document {
  userId: Types.ObjectId;
  campaignId?: Types.ObjectId;
  contentProjectId?: Types.ObjectId;
  platform: Platform;
  content?: string;
  day: string;
  headline: string;
  points: string[];
  cta: string;
  generatedImageUrl?: string;
  editedImageUrl?: string;
  mediaUrls: string[];
  status: PostStatus;
  workflowStatus: WorkflowStatus;
  scheduledTime?: Date;
  scheduledAt?: Date;
  publishedAt?: Date;
  reach?: number;
  engagementRate?: number;
  sentiment?: "positive" | "neutral" | "negative";
  shares?: number;
  likes?: number;
  comments?: number;
  saves?: number;
  tags?: string[];
  isTopPerformer: boolean;
  aiProvider?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GeneratedPostSchema = new Schema<IGeneratedPost>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      index: true,
    },
    contentProjectId: {
      type: Schema.Types.ObjectId,
      ref: "ContentProject",
      index: true,
    },
    platform: {
      type: String,
      required: true,
      enum: ["linkedin", "instagram", "facebook", "twitter"],
    },
    content: { type: String },
    day: { type: String, required: true },
    headline: { type: String, required: true },
    points: { type: [String], default: [] },
    cta: { type: String, required: true },
    generatedImageUrl: { type: String },
    editedImageUrl: { type: String },
    mediaUrls: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "failed"],
      default: "draft",
    },
    workflowStatus: {
      type: String,
      enum: ["DRAFT", "READY", "LIVE"],
      default: "DRAFT",
      index: true,
    },
    scheduledTime: { type: Date },
    scheduledAt: { type: Date },
    publishedAt: { type: Date },
    reach: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      default: "neutral",
    },
    shares: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
    isTopPerformer: { type: Boolean, default: false, index: true },
    aiProvider: { type: String }, // Gemini or OpenAI
    errorMessage: { type: String }, // Error message if failed
  },
  { timestamps: true },
);

GeneratedPostSchema.index({ userId: 1, status: 1, scheduledTime: 1 });
GeneratedPostSchema.index({ userId: 1, platform: 1, createdAt: -1 });
GeneratedPostSchema.index({ userId: 1, workflowStatus: 1, updatedAt: -1 });
GeneratedPostSchema.index({ userId: 1, isTopPerformer: 1, engagementRate: -1 });
GeneratedPostSchema.index({ userId: 1, contentProjectId: 1, createdAt: -1 });

export const GeneratedPost = mongoose.model<IGeneratedPost>(
  "GeneratedPost",
  GeneratedPostSchema,
);
