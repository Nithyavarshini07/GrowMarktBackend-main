import { NextFunction, Response } from "express";
import { AuthRequest } from "@/middleware/auth.middleware";
import { CompetitorFeedItem, GeneratedPost } from "@/models";
import { UnauthorizedError } from "@/utils/errors";

function percentChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

export const getInsights = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      competitorCurrent,
      competitorPrevious,
      postsCurrent,
      postsPrevious,
      topCompetitorPosts,
      topUserPosts,
    ] = await Promise.all([
      CompetitorFeedItem.countDocuments({
        userId: req.userId,
        createdAt: { $gte: sevenDaysAgo },
      }),
      CompetitorFeedItem.countDocuments({
        userId: req.userId,
        createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
      }),
      GeneratedPost.countDocuments({
        userId: req.userId,
        createdAt: { $gte: sevenDaysAgo },
      }),
      GeneratedPost.countDocuments({
        userId: req.userId,
        createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
      }),
      CompetitorFeedItem.find({ userId: req.userId })
        .sort({ engagement: -1, reach: -1 })
        .limit(5)
        .lean(),
      GeneratedPost.find({ userId: req.userId, status: "published" })
        .sort({ engagementRate: -1, reach: -1 })
        .limit(5)
        .lean(),
    ]);

    const competitorDelta = percentChange(
      competitorCurrent,
      competitorPrevious,
    );
    const postDelta = percentChange(postsCurrent, postsPrevious);

    const alerts: Array<Record<string, unknown>> = [];
    if (competitorDelta >= 15) {
      alerts.push({
        id: "alert-competitor-velocity",
        type: "competitor_activity",
        title: `Competitor activity is up ${competitorDelta}%`,
        description:
          "Competitor posting velocity increased in the last 7 days. Consider accelerating your publishing cadence.",
        meta: {
          competitorCurrent,
          competitorPrevious,
          delta: competitorDelta,
        },
      });
    }

    if (postDelta < 0) {
      alerts.push({
        id: "alert-post-velocity",
        type: "post_velocity",
        title: "Your posting velocity dropped",
        description:
          "Your team published fewer posts compared to the previous 7-day window.",
        meta: {
          postsCurrent,
          postsPrevious,
          delta: postDelta,
        },
      });
    }

    const recommendations = [
      {
        id: "rec-cross-platform",
        type: "distribution",
        title: "Increase cross-platform republishing",
        description:
          "High-performing competitor posts are frequently adapted across multiple channels. Reuse top assets with platform-specific captions.",
        meta: {
          topCompetitorSample: topCompetitorPosts.map((item) => ({
            author: item.author,
            platform: item.platform,
            engagement: item.engagement,
          })),
        },
      },
      {
        id: "rec-caption-variants",
        type: "creative",
        title: "Run caption A/B experiments",
        description:
          "Generate at least 3 caption variants per selected image and compare engagement before committing to one default style.",
        meta: {
          topUserPostCount: topUserPosts.length,
        },
      },
    ];

    const opportunities = [
      {
        id: "opp-hook-gap",
        type: "content_gap",
        title: "Opportunity: educational hooks",
        description:
          "Competitor leaders are using short educational hooks. This is a chance to publish how-to carousel content this week.",
        meta: {
          topTags: topCompetitorPosts
            .flatMap((item: any) => item.tags || [])
            .slice(0, 8),
        },
      },
      {
        id: "opp-timing",
        type: "timing",
        title: "Opportunity: consistent publishing slots",
        description:
          "Set consistent scheduling slots to improve audience expectation and recurring engagement.",
        meta: {
          suggestedSlots: ["09:00", "13:00", "18:00"],
        },
      },
    ];

    res.status(200).json({
      success: true,
      data: {
        alerts,
        recommendations,
        opportunities,
      },
    });
  } catch (error) {
    next(error);
  }
};
