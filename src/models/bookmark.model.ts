import mongoose, { Document, Schema, Types } from "mongoose";

export type BookmarkType = "post" | "competitor" | "insight" | "project";

export interface IBookmark extends Document {
  userId: Types.ObjectId;
  entityId: string;
  type: BookmarkType;
  title?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    entityId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["post", "competitor", "insight", "project"],
      required: true,
      index: true,
    },
    title: { type: String },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

BookmarkSchema.index({ userId: 1, type: 1, createdAt: -1 });
BookmarkSchema.index({ userId: 1, entityId: 1, type: 1 }, { unique: true });

export const Bookmark = mongoose.model<IBookmark>("Bookmark", BookmarkSchema);
