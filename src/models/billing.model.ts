import mongoose, { Document, Schema, Types } from "mongoose";

export interface IBilling extends Document {
  userId: Types.ObjectId;
  plan: string;
  price: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
  usage: {
    channelsUsed: number;
    channelsLimit: number;
    postsUsed: number;
    postsLimit: number;
  };
  nextInvoiceDate: Date;
  status: "active" | "past_due" | "canceled";
  createdAt: Date;
  updatedAt: Date;
}

const BillingSchema = new Schema<IBilling>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    plan: { type: String, default: "Pro Curator" },
    price: { type: Number, default: 129 },
    currency: { type: String, default: "USD" },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    usage: {
      channelsUsed: { type: Number, default: 0 },
      channelsLimit: { type: Number, default: 5 },
      postsUsed: { type: Number, default: 0 },
      postsLimit: { type: Number, default: 100 },
    },
    nextInvoiceDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    status: {
      type: String,
      enum: ["active", "past_due", "canceled"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true },
);

export const Billing = mongoose.model<IBilling>("Billing", BillingSchema);
