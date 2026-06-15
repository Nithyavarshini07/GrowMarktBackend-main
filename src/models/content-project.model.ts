import mongoose, { Document, Schema, Types } from "mongoose";

export type ContentProjectStatus =
  | "IDEA"
  | "ANALYZED"
  | "IMAGE_GENERATED"
  | "EDITED"
  | "CAPTION_GENERATED"
  | "READY"
  | "PUBLISHED";

export type PipelineErrorStep = "IMAGE_GENERATION" | "CAPTION" | "ANALYSIS";

export type ContentAssetKind = "generated" | "uploaded" | "edited";

export interface IContentProjectAsset {
  assetId: string;
  kind: ContentAssetKind;
  url: string;
  prompt?: string;
  sourceAssetId?: string;
  version: number;
  createdAt: Date;
  meta?: Record<string, unknown>;
}

export interface IContentCaptionOption {
  id: string;
  text: string;
  isSelected: boolean;
  hashtags: string[];
  tone?: string;
  source: "ai" | "user";
  createdAt: Date;
}

export interface IContentProjectError {
  step: PipelineErrorStep;
  message: string;
  retryable: boolean;
  failedAt: Date;
}

export interface IContentProjectHistoryEntry {
  fromStatus?: ContentProjectStatus;
  toStatus: ContentProjectStatus;
  action: string;
  actor: "ai" | "user" | "system";
  timestamp: Date;
  meta?: Record<string, unknown>;
}

export interface IContentProject extends Document {
  userId: Types.ObjectId;
  campaignId?: Types.ObjectId;
  status: ContentProjectStatus;
  ideaInput: string;
  analysis: {
    targetAudience?: string;
    contentAngles: string[];
    hooks: string[];
    hashtags: string[];
    engagementPrediction?: number;
  };
  assets: IContentProjectAsset[];
  selectedAssetId?: string;
  captions: IContentCaptionOption[];
  platforms: Array<"linkedin" | "instagram" | "facebook" | "twitter">;
  scheduledAt?: Date;
  postIds: Types.ObjectId[];
  error?: IContentProjectError;
  history: IContentProjectHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const AnalysisSchema = new Schema(
  {
    targetAudience: { type: String },
    contentAngles: { type: [String], default: [] },
    hooks: { type: [String], default: [] },
    hashtags: { type: [String], default: [] },
    engagementPrediction: { type: Number },
  },
  { _id: false },
);

const AssetSchema = new Schema(
  {
    assetId: { type: String, required: true },
    kind: {
      type: String,
      enum: ["generated", "uploaded", "edited"],
      required: true,
    },
    url: { type: String, required: true },
    prompt: { type: String },
    sourceAssetId: { type: String },
    version: { type: Number, required: true, default: 1 },
    createdAt: { type: Date, default: Date.now },
    meta: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

const CaptionOptionSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    isSelected: { type: Boolean, default: false },
    hashtags: { type: [String], default: [] },
    tone: { type: String },
    source: { type: String, enum: ["ai", "user"], required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const PipelineErrorSchema = new Schema(
  {
    step: {
      type: String,
      enum: ["IMAGE_GENERATION", "CAPTION", "ANALYSIS"],
      required: true,
    },
    message: { type: String, required: true },
    retryable: { type: Boolean, default: true },
    failedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const HistorySchema = new Schema(
  {
    fromStatus: {
      type: String,
      enum: [
        "IDEA",
        "ANALYZED",
        "IMAGE_GENERATED",
        "EDITED",
        "CAPTION_GENERATED",
        "READY",
        "PUBLISHED",
      ],
    },
    toStatus: {
      type: String,
      enum: [
        "IDEA",
        "ANALYZED",
        "IMAGE_GENERATED",
        "EDITED",
        "CAPTION_GENERATED",
        "READY",
        "PUBLISHED",
      ],
      required: true,
    },
    action: { type: String, required: true },
    actor: { type: String, enum: ["ai", "user", "system"], required: true },
    timestamp: { type: Date, default: Date.now },
    meta: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

const ContentProjectSchema = new Schema<IContentProject>(
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
    status: {
      type: String,
      enum: [
        "IDEA",
        "ANALYZED",
        "IMAGE_GENERATED",
        "EDITED",
        "CAPTION_GENERATED",
        "READY",
        "PUBLISHED",
      ],
      default: "IDEA",
      index: true,
    },
    ideaInput: { type: String, required: true },
    analysis: { type: AnalysisSchema, default: () => ({}) },
    assets: { type: [AssetSchema], default: [] },
    selectedAssetId: { type: String },
    captions: { type: [CaptionOptionSchema], default: [] },
    platforms: {
      type: [String],
      enum: ["linkedin", "instagram", "facebook", "twitter"],
      default: [],
    },
    scheduledAt: { type: Date },
    postIds: {
      type: [Schema.Types.ObjectId],
      ref: "GeneratedPost",
      default: [],
    },
    error: { type: PipelineErrorSchema, default: undefined },
    history: { type: [HistorySchema], default: [] },
  },
  { timestamps: true },
);

ContentProjectSchema.index({ userId: 1, status: 1, updatedAt: -1 });
ContentProjectSchema.index({ userId: 1, createdAt: -1 });

export const ContentProject = mongoose.model<IContentProject>(
  "ContentProject",
  ContentProjectSchema,
);
