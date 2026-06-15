/**
 * Metrics Sync Job — runs every 15 minutes via node-cron.
 *
 * Responsibilities:
 *  1. Find all recently published posts (last 7 days)
 *  2. Simulate social platform metric updates (reach, likes, comments, shares)
 *     In production: replace with real platform API calls (LinkedIn, Instagram, Twitter)
 *  3. Mark posts as isTopPerformer if engagementRate > 5%
 *  4. Emit analytics:updated realtime event
 */

import cron from "node-cron";
import mongoose from "mongoose";
import { GeneratedPost } from "@/models/generated-post.model";
import { PlatformStats } from "@/models/platform-stats.model";
import { logger } from "@/utils/logger";
import { emitRealtime } from "@/realtime";

const ENGAGEMENT_TOP_THRESHOLD = 5.0; // 5% marks a post as top performer

/**
 * Calculate engagement rate from post metrics.
 * engagementRate = ((likes + comments + shares * 2) / reach) * 100
 */
function calcEngagementRate(post: {
  reach: number;
  likes: number;
  comments: number;
  shares: number;
}): number {
  if (!post.reach || post.reach <= 0) return 0;
  const interactions = post.likes + post.comments + post.shares * 2;
  return Number(((interactions / post.reach) * 100).toFixed(2));
}

/**
 * Fetch metrics from social platform API.
 * 
 * In production: call LinkedIn, Instagram, Twitter APIs here.
 * Currently: increment metrics based on time-decay simulation.
 */
async function fetchPlatformMetrics(post: any): Promise<{
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
} | null> {
  // Only update metrics for published posts
  if (post.status !== "published" || !post.publishedAt) return null;

  const hoursSincePublish =
    (Date.now() - new Date(post.publishedAt).getTime()) / (1000 * 60 * 60);

  // Skip posts older than 7 days (stabilized metrics)
  if (hoursSincePublish > 168) return null;

  // Growth curve: logarithmic based on time since publish
  const growthMultiplier = Math.log(1 + hoursSincePublish / 24 + 1);

  // Platform-specific base rates
  const platformRates: Record<
    string,
    { reach: number; likeRate: number; commentRate: number; shareRate: number }
  > = {
    instagram: { reach: 800, likeRate: 0.05, commentRate: 0.008, shareRate: 0.015 },
    linkedin: { reach: 600, likeRate: 0.025, commentRate: 0.012, shareRate: 0.020 },
    twitter: { reach: 1000, likeRate: 0.03, commentRate: 0.006, shareRate: 0.025 },
    facebook: { reach: 500, likeRate: 0.035, commentRate: 0.010, shareRate: 0.018 },
  };

  const rates = platformRates[post.platform] || platformRates.instagram;

  // Only increase metrics (never decrease)
  const newReach = Math.max(
    post.reach || 0,
    Math.round(rates.reach * growthMultiplier),
  );
  const newLikes = Math.max(
    post.likes || 0,
    Math.round(newReach * rates.likeRate),
  );
  const newComments = Math.max(
    post.comments || 0,
    Math.round(newReach * rates.commentRate),
  );
  const newShares = Math.max(
    post.shares || 0,
    Math.round(newReach * rates.shareRate),
  );
  const newSaves = Math.max(
    post.saves || 0,
    Math.round(newReach * 0.01),
  );

  return {
    reach: newReach,
    likes: newLikes,
    comments: newComments,
    shares: newShares,
    saves: newSaves,
  };
}

async function syncPostMetrics(): Promise<void> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const posts = await GeneratedPost.find({
    status: "published",
    publishedAt: { $gte: cutoff },
  }).select(
    "userId platform publishedAt reach engagementRate likes comments shares saves isTopPerformer status",
  );

  if (posts.length === 0) return;

  logger.info(`[MetricsSyncJob] Syncing metrics for ${posts.length} post(s)`);

  const affectedUserIds = new Set<string>();
  let updated = 0;

  for (const post of posts) {
    const metrics = await fetchPlatformMetrics(post);
    if (!metrics) continue;

    const engagementRate = calcEngagementRate(metrics);
    const isTopPerformer = engagementRate >= ENGAGEMENT_TOP_THRESHOLD;

    await GeneratedPost.updateOne(
      { _id: post._id },
      {
        $set: {
          reach: metrics.reach,
          likes: metrics.likes,
          comments: metrics.comments,
          shares: metrics.shares,
          saves: metrics.saves,
          engagementRate,
          isTopPerformer,
        },
      },
    );

    affectedUserIds.add(String(post.userId));
    updated++;
  }

  logger.info(`[MetricsSyncJob] Updated ${updated} post metric(s)`);

  // Emit realtime analytics update for each affected user
  for (const userId of affectedUserIds) {
    emitRealtime("analytics", "updated", {
      userId,
      reason: "metrics-sync",
      updatedCount: updated,
    });
  }
}

async function syncPlatformFollowerStats(): Promise<void> {
  // In production: call social platform APIs to get current follower counts.
  // Here we use PlatformStats to track follower snapshots per user/platform/day.
  //
  // This function should be replaced with real API calls to:
  //   - LinkedIn Analytics API: /v2/organizationalEntityFollowerStatistics
  //   - Instagram Graph API: /me/insights?metric=follower_count
  //   - Twitter API v2: /users/:id
  //   - Facebook Graph API: /me/insights?metric=page_fans

  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  // Get distinct users who have published posts
  const userIds = await GeneratedPost.distinct("userId", {
    status: "published",
  });

  const platforms = ["linkedin", "instagram", "facebook", "twitter"] as const;

  for (const userId of userIds) {
    const userObjectId = new mongoose.Types.ObjectId(String(userId));

    for (const platform of platforms) {
      // Get total reach for this user/platform as a proxy for follower estimate
      const agg = await GeneratedPost.aggregate([
        { $match: { userId: userObjectId, platform, status: "published" } },
        {
          $group: {
            _id: null,
            reach: { $sum: { $ifNull: ["$reach", 0] } },
            avgEngagement: { $avg: { $ifNull: ["$engagementRate", 0] } },
            count: { $sum: 1 },
          },
        },
      ]);

      if (!agg[0] || !agg[0].reach) continue;

      // Estimate followers from reach (in production, use real API)
      const estimatedFollowers = Math.round(agg[0].reach * 0.12);
      const engagementRate = Number((agg[0].avgEngagement || 0).toFixed(2));

      await PlatformStats.updateOne(
        { userId, platform, date: today },
        {
          $setOnInsert: { userId, platform, date: today },
          $set: {
            followers: estimatedFollowers,
            reach: agg[0].reach,
            engagementRate,
          },
        },
        { upsert: true },
      );
    }
  }
}

export function startMetricsSyncJob(): void {
  logger.info("[MetricsSyncJob] Starting metrics sync cron (every 15 min)...");

  // Every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    try {
      await syncPostMetrics();
    } catch (err: any) {
      logger.error("[MetricsSyncJob] Error in syncPostMetrics:", {
        message: err.message,
      });
    }
  });

  // Daily at 2am UTC — sync follower stats snapshot
  cron.schedule("0 2 * * *", async () => {
    try {
      await syncPlatformFollowerStats();
    } catch (err: any) {
      logger.error("[MetricsSyncJob] Error in syncPlatformFollowerStats:", {
        message: err.message,
      });
    }
  });

  logger.info(
    "[MetricsSyncJob] ✓ Metrics sync cron registered (*/15 * * * *) and follower sync (0 2 * * *)",
  );
}
