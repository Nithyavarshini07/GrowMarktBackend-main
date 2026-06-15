import { config } from "@/config";
import { createApp } from "@/app";
import { connectDatabase, disconnectDatabase } from "@/utils/database";
import { logger } from "@/utils/logger";
import { startSchedulerJob } from "@/jobs/scheduler.job";
import { startMetricsSyncJob } from "@/jobs/metrics-sync.job";
import { attachRealtimeWebSocketServer } from "@/realtime";

async function main(): Promise<void> {
  try {
    // 1. Connect to database
    await connectDatabase();

    // 2. Start background cron scheduler (every minute, processes pending posts)
    startSchedulerJob();

    // 2b. Start metrics sync job (every 15 min, syncs reach/engagement/followers)
    startMetricsSyncJob();

    // 3. Create and start HTTP server
    const app = createApp();

    const server = app.listen(config.port, () => {
      logger.info(
        `Server running on port ${config.port} in ${config.env} mode`,
      );
      logger.info(
        `API available at http://localhost:${config.port}/api/${config.apiVersion}`,
      );
      logger.info(
        `Health check: http://localhost:${config.port}/api/${config.apiVersion}/health`,
      );
      logger.info(`WebSocket endpoint: ws://localhost:${config.port}/ws`);
    });

    attachRealtimeWebSocketServer(server);

    // 4. Graceful shutdown handler
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info("HTTP server closed");
        await disconnectDatabase();
        process.exit(0);
      });

      // Force exit if shutdown takes too long
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10_000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("unhandledRejection", (reason: unknown) => {
      logger.error("Unhandled Rejection:", { reason: String(reason) });
    });

    process.on("uncaughtException", (error: Error) => {
      logger.error("Uncaught Exception:", {
        name: error.name,
        message: error.message,
      });
      process.exit(1);
    });
  } catch (error: any) {
    logger.error("Failed to start server:", { message: error.message });
    process.exit(1);
  }
}

main();
