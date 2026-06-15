import { NextFunction, Response } from "express";
import { AuthRequest } from "@/middleware/auth.middleware";
import { Billing, GeneratedPost, Settings } from "@/models";
import { UnauthorizedError } from "@/utils/errors";

const DEFAULT_PLAN = {
  plan: "Starter",
  price: 0,
  currency: "USD",
  billingCycle: "monthly",
  status: "active",
  usage: {
    channelsLimit: 2,
    postsLimit: 50,
  },
};

export const getBilling = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const [settings, postsUsed] = await Promise.all([
      Settings.findOne({ userId: req.userId }).select("connectedChannels"),
      GeneratedPost.countDocuments({ userId: req.userId }),
    ]);

    const channelsUsed = settings?.connectedChannels?.length || 0;

    // Upsert a default billing record if none exists
    let billing = await Billing.findOne({ userId: req.userId });
    if (!billing) {
      billing = await Billing.findOneAndUpdate(
        { userId: req.userId },
        {
          $setOnInsert: {
            userId: req.userId,
            plan: DEFAULT_PLAN.plan,
            price: DEFAULT_PLAN.price,
            currency: DEFAULT_PLAN.currency,
            billingCycle: DEFAULT_PLAN.billingCycle,
            status: DEFAULT_PLAN.status,
            usage: {
              channelsLimit: DEFAULT_PLAN.usage.channelsLimit,
              postsLimit: DEFAULT_PLAN.usage.postsLimit,
            },
            nextInvoiceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
      if (!billing) {
        throw new Error("Failed to create default billing record");
      }
    }



    res.status(200).json({
      success: true,
      data: {
        plan: billing.plan,
        price: billing.price,
        currency: billing.currency,
        billingCycle: billing.billingCycle,
        usage: {
          channelsUsed,
          channelsLimit: billing.usage?.channelsLimit || DEFAULT_PLAN.usage.channelsLimit,
          postsUsed,
          postsLimit: billing.usage?.postsLimit || DEFAULT_PLAN.usage.postsLimit,
        },
        status: billing.status,
        nextInvoiceDate: billing.nextInvoiceDate,
        createdAt: billing.createdAt,
        updatedAt: billing.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
