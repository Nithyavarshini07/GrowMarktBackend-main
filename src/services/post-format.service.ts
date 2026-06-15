import { IGeneratedPost } from "@/models";

export function toPostResponse(
  post: IGeneratedPost | any,
): Record<string, unknown> {
  const source: any =
    typeof post.toObject === "function" ? post.toObject() : post;
  const scheduledAt = source.scheduledAt || source.scheduledTime || null;
  const mediaUrls = Array.isArray(source.mediaUrls)
    ? source.mediaUrls
    : [source.editedImageUrl || source.generatedImageUrl].filter(Boolean);

  return {
    id: String(source._id),
    userId: source.userId,
    campaignId: source.campaignId || null,
    platform: source.platform,
    day: source.day,
    headline: source.headline,
    content:
      source.content ||
      [source.headline, ...(source.points || []), source.cta]
        .filter(Boolean)
        .join("\n\n"),
    points: source.points || [],
    cta: source.cta,
    mediaUrls,
    generatedImageUrl: source.generatedImageUrl || null,
    editedImageUrl: source.editedImageUrl || null,
    status: source.status,
    workflowStatus: source.workflowStatus || "DRAFT",
    scheduledTime: scheduledAt,
    scheduledAt,
    publishedAt: source.publishedAt || null,
    errorMessage: source.errorMessage || null,
    aiProvider: source.aiProvider || null,
    metrics: {
      reach: source.reach || 0,
      engagementRate: source.engagementRate || 0,
      likes: source.likes || 0,
      comments: source.comments || 0,
      shares: source.shares || 0,
      saves: source.saves || 0,
      sentiment: source.sentiment || "neutral",
    },
    isTopPerformer: Boolean(source.isTopPerformer),
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}
