/**
 * worker.service.ts  — backwards-compatibility shim
 *
 * This file previously contained all scheduling and publishing logic.
 * That logic has been refactored into:
 *
 *   src/jobs/scheduler.job.ts  — cron scheduling (node-cron)
 *   src/services/social-post.service.ts  — platform publishing
 *
 * This file re-exports startWorker() so that existing callers (src/index.ts)
 * continue to work without modification.
 */

export { startSchedulerJob as startWorker } from "@/jobs/scheduler.job";
