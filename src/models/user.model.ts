import mongoose, { Document, Schema } from "mongoose";

export type UserRole = "owner" | "admin" | "editor" | "viewer";

export interface ISocialConnection {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  profileId?: string;
  profileName?: string;
  pageId?: string;
  pageName?: string;
  connectedAt: Date;
}

export interface IStoredRefreshToken {
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  userAgent?: string;
  ip?: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  socialConnections: {
    linkedin?: ISocialConnection;
    facebook?: ISocialConnection;
    instagram?: ISocialConnection;
    twitter?: ISocialConnection;
  };
  oauthProviders: {
    google?: { providerId: string; email?: string; connectedAt: Date };
    linkedin?: { providerId: string; email?: string; connectedAt: Date };
  };
  refreshTokens: IStoredRefreshToken[];
  resetPasswordTokenHash?: string;
  resetPasswordExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SocialConnectionSchema = new Schema<ISocialConnection>(
  {
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    expiresAt: { type: Date },
    profileId: { type: String },
    profileName: { type: String },
    pageId: { type: String },
    pageName: { type: String },
    connectedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const RefreshTokenSchema = new Schema<IStoredRefreshToken>(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    userAgent: { type: String },
    ip: { type: String },
  },
  { _id: false },
);

const OAuthProviderSchema = new Schema(
  {
    providerId: { type: String, required: true },
    email: { type: String },
    connectedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["owner", "admin", "editor", "viewer"],
      default: "owner",
      index: true,
    },
    socialConnections: {
      linkedin: { type: SocialConnectionSchema },
      facebook: { type: SocialConnectionSchema },
      instagram: { type: SocialConnectionSchema },
      twitter: { type: SocialConnectionSchema },
    },
    oauthProviders: {
      google: { type: OAuthProviderSchema },
      linkedin: { type: OAuthProviderSchema },
    },
    refreshTokens: {
      type: [RefreshTokenSchema],
      default: [],
    },
    resetPasswordTokenHash: { type: String },
    resetPasswordExpiresAt: { type: Date },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", UserSchema);

