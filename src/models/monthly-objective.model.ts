import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMonthlyObjective extends Document {
  userId: Types.ObjectId;
  /** ISO year-month string, e.g. "2023-10" */
  month: string;
  targetReach: number;
  postCount: number;
  targetEngagementRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const MonthlyObjectiveSchema = new Schema<IMonthlyObjective>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    month: { type: String, required: true }, // "YYYY-MM"
    targetReach: { type: Number, required: true, min: 0 },
    postCount: { type: Number, required: true, min: 0 },
    targetEngagementRate: { type: Number, required: true, min: 0, max: 100 },
  },
  { timestamps: true },
);

MonthlyObjectiveSchema.index({ userId: 1, month: 1 }, { unique: true });

export const MonthlyObjective = mongoose.model<IMonthlyObjective>(
  "MonthlyObjective",
  MonthlyObjectiveSchema,
);
