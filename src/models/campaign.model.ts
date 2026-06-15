import mongoose, { Schema, Document, Types } from "mongoose";

export type CampaignStatus =
  | "LIVE"
  | "DRAFT"
  | "READY"
  | "PAUSED"
  | "COMPLETED";
export type CampaignObjective =
  | "reach"
  | "engagement"
  | "conversion"
  | "brand_awareness";

export interface ICampaignCollaborator {
  id: string;
  name: string;
  role: "owner" | "editor" | "analyst";
}

export interface ICampaign extends Document {
  userId: Types.ObjectId;
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  channels: Array<"linkedin" | "instagram" | "facebook" | "twitter">;
  collaborators: ICampaignCollaborator[];

  targetReach: number;
  currentReach: number;

  targetCount: number; // Post count target
  currentCount: number;

  targetEngagementRate: number;
  currentEngagementRate: number;
  goalLabel?: string;
  feedSummary?: string;

  startDate: Date;
  endDate: Date;

  createdAt: Date;
  updatedAt: Date;
}

const CollaboratorSchema = new Schema<ICampaignCollaborator>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["owner", "editor", "analyst"],
      default: "editor",
    },
  },
  { _id: false },
);

const CampaignSchema = new Schema<ICampaign>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    objective: {
      type: String,
      enum: ["reach", "engagement", "conversion", "brand_awareness"],
      default: "reach",
    },
    status: {
      type: String,
      enum: ["LIVE", "DRAFT", "READY", "PAUSED", "COMPLETED"],
      default: "DRAFT",
      index: true,
    },
    channels: {
      type: [String],
      default: ["linkedin"],
      enum: ["linkedin", "instagram", "facebook", "twitter"],
    },
    collaborators: {
      type: [CollaboratorSchema],
      default: [],
    },
    targetReach: { type: Number, default: 0 },
    currentReach: { type: Number, default: 0 },
    targetCount: { type: Number, default: 0 },
    currentCount: { type: Number, default: 0 },
    targetEngagementRate: { type: Number, default: 0 },
    currentEngagementRate: { type: Number, default: 0 },
    goalLabel: { type: String },
    feedSummary: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true },
);

CampaignSchema.index({ userId: 1, status: 1, updatedAt: -1 });

export const Campaign = mongoose.model<ICampaign>("Campaign", CampaignSchema);
