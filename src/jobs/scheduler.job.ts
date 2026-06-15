/**
 * Scheduler Job — runs every minute via node-cron.
 *
 * Flow:
 *  1. Query GeneratedPost where status = "scheduled" AND scheduledTime <= now
 *  2. Publish each post to the appropriate social media platform
 *  3. Mark status as "published" (success) or "failed" (error)
 *  4. Retry up to MAX_RETRIES before marking as failed
 */

import cron from "node-cron";
import { GeneratedPost } from "@/models/generated-post.model";
import { logger } from "@/utils/logger";
import { publishPost } from "@/services/social-post.service";
import { emitRealtime } from "@/realtime";

const MAX_RETRIES = 2;

async function processScheduledPosts(): Promise<void> {
  const now = new Date();

  const pendingPosts = await GeneratedPost.find({
    status: "scheduled",
    $or: [{ scheduledTime: { $lte: now } }, { scheduledAt: { $lte: now } }],
  });

  if (pendingPosts.length === 0) return;

  logger.info(
    `[SchedulerJob] Found ${pendingPosts.length} post(s) due for publishing`,
  );

  for (const post of pendingPosts) {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        logger.info(
          `[SchedulerJob] Publishing post ${post._id} to ${post.platform} (attempt ${attempt}/${MAX_RETRIES})`,
        );
        await publishPost(post);

        post.status = "published";
        post.workflowStatus = "LIVE";
        post.publishedAt = new Date();
        post.errorMessage = undefined;
        await post.save();

        emitRealtime("post", "published", {
          postId: String(post._id),
          userId: String(post.userId),
          platform: post.platform,
          source: "scheduler",
        });

        emitRealtime("analytics", "updated", {
          userId: String(post.userId),
          reason: "scheduled-publish",
          postId: String(post._id),
        });

        logger.info(
          `[SchedulerJob] ✓ Post ${post._id} published to ${post.platform}`,
        );
        lastError = null;
        break; // success — stop retrying
      } catch (err: any) {
        lastError = err;
        logger.warn(
          `[SchedulerJob] ✗ Attempt ${attempt} failed for post ${post._id}: ${err.message}`,
        );
        if (attempt < MAX_RETRIES) {
          // Wait 3 seconds between retries
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }

    if (lastError) {
      post.status = "failed";
      post.errorMessage = lastError.message;
      await post.save();
      logger.error(
        `[SchedulerJob] Post ${post._id} marked as FAILED after ${MAX_RETRIES} attempts: ${lastError.message}`,
      );
    }
  }
}

export function startSchedulerJob(): void {
  logger.info("[SchedulerJob] Starting cron scheduler (every minute)...");

  // Run every minute: * * * * *
  cron.schedule("* * * * *", async () => {
    try {
      await processScheduledPosts();
    } catch (err: any) {
      logger.error("[SchedulerJob] Unhandled error in cron tick:", {
        message: err.message,
      });
    }
  });
}
