import { Billing, Settings, User } from "@/models";
import { Types } from "mongoose";

function toStringId(userId: string | Types.ObjectId): string {
  return typeof userId === "string" ? userId : userId.toString();
}

export async function ensureUserWorkspace(
  userId: string | Types.ObjectId,
): Promise<void> {
  const id = toStringId(userId);

  const user = await User.findById(id)
    .select("name email role socialConnections")
    .lean();
  if (!user) return;

  const connectedChannels = Object.entries(
    (user as any).socialConnections || {},
  )
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key) as Array<
    "linkedin" | "instagram" | "facebook" | "twitter"
  >;

  await Settings.updateOne(
    { userId: id },
    {
      $setOnInsert: {
        userId: id,
        team: [
          {
            id: id,
            name: (user as any).name,
            email: (user as any).email,
            role: (user as any).role || "owner",
            status: "active",
          },
        ],
        notifications: {
          email: true,
          push: true,
          inApp: true,
          alerts: true,
          competitors: true,
          team: true,
          published: true,
        },
        support: {
          contactEmail: "support@growmarket.ai",
          prioritySupport: false,
        },
      },
      $set: {
        connectedChannels,
        "profile.name": (user as any).name,
        "profile.email": (user as any).email,
        "profile.timezone": "UTC",
      },
    },
    { upsert: true, setDefaultsOnInsert: false },
  );

  await Billing.updateOne(
    { userId: id },
    {
      $setOnInsert: {
        userId: id,
        plan: "Pro Curator",
        price: 129,
        currency: "USD",
        billingCycle: "monthly",
        "usage.channelsLimit": 5,
        "usage.postsUsed": 0,
        "usage.postsLimit": 100,
        status: "active",
        nextInvoiceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      $set: {
        "usage.channelsUsed": connectedChannels.length,
      },
    },
    { upsert: true, setDefaultsOnInsert: false },
  );
}
