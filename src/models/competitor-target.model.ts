import mongoose, { Document, Schema, Types } from "mongoose";
import { CompetitorPlatform } from "./competitor-feed.model";

export type CompetitorSyncStatus = "idle" | "ok" | "warning" | "error";

export interface ICompetitorTarget extends Document {
  userId: Types.ObjectId;
  competitorId: string;
  name: string;
  platforms: CompetitorPlatform[];
  handles: Partial<Record<CompetitorPlatform, string>>;
  tags: string[];
  active: boolean;
  sourceConfidence: number;
  lastSyncedAt?: Date;
  syncStatus: CompetitorSyncStatus;
  syncMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompetitorHandlesSchema = new Schema(
  {
    linkedin: { type: String, trim: true, lowercase: true },
    instagram: { type: String, trim: true, lowercase: true },
    facebook: { type: String, trim: true, lowercase: true },
    twitter: { type: String, trim: true, lowercase: true },
  },
  { _id: false },
);

const CompetitorTargetSchema = new Schema<ICompetitorTarget>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    competitorId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    platforms: {
      type: [String],
      enum: ["linkedin", "instagram", "facebook", "twitter"],
      default: [],
    },
    handles: {
      type: CompetitorHandlesSchema,
      default: {},
    },
    tags: {
      type: [String],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    sourceConfidence: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    lastSyncedAt: {
      type: Date,
    },
    syncStatus: {
      type: String,
      enum: ["idle", "ok", "warning", "error"],
      default: "idle",
      index: true,
    },
    syncMessage: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true },
);

CompetitorTargetSchema.index({ userId: 1, competitorId: 1 }, { unique: true });
CompetitorTargetSchema.index({ userId: 1, active: 1, updatedAt: -1 });

export const CompetitorTarget = mongoose.model<ICompetitorTarget>(
  "CompetitorTarget",
  CompetitorTargetSchema,
);
