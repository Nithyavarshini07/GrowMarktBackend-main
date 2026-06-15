import mongoose, { Document, Schema, Types } from "mongoose";

export interface ISettings extends Document {
  userId: Types.ObjectId;
  profile: {
    name: string;
    email: string;
    timezone: string;
    avatarUrl?: string;
  };
  team: Array<{
    id: string;
    name: string;
    email: string;
    role: "owner" | "admin" | "editor" | "viewer";
    status: "active" | "invited";
  }>;
  connectedChannels: Array<"linkedin" | "instagram" | "facebook" | "twitter">;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
    alerts: boolean;
    competitors: boolean;
    team: boolean;
    published: boolean;
  };
  support: {
    contactEmail: string;
    prioritySupport: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: {
      type: String,
      enum: ["owner", "admin", "editor", "viewer"],
      default: "viewer",
    },
    status: {
      type: String,
      enum: ["active", "invited"],
      default: "active",
    },
  },
  { _id: false },
);

const SettingsSchema = new Schema<ISettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    profile: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      timezone: { type: String, default: "UTC" },
      avatarUrl: { type: String },
    },
    team: {
      type: [TeamMemberSchema],
      default: [],
    },
    connectedChannels: {
      type: [String],
      enum: ["linkedin", "instagram", "facebook", "twitter"],
      default: [],
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
      alerts: { type: Boolean, default: true },
      competitors: { type: Boolean, default: true },
      team: { type: Boolean, default: true },
      published: { type: Boolean, default: true },
    },
    support: {
      contactEmail: { type: String, default: "support@growmarket.ai" },
      prioritySupport: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

export const Settings = mongoose.model<ISettings>("Settings", SettingsSchema);
