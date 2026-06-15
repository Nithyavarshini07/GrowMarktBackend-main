import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes";
import contentRoutes from "./content.routes";
import imageRoutes from "./image.routes";
import schedulerRoutes from "./scheduler.routes";
import socialAuthRoutes from "./social-auth.routes";
import accountsRoutes from "./accounts.routes";
import analyticsRoutes from "@/routes/analytics.routes";
import competitorsRoutes from "@/routes/competitors.routes";
import campaignRoutes from "./campaign.routes";
import notificationRoutes from "./notification.routes";
import dashboardRoutes from "./dashboard.routes";
import nodesRoutes from "./nodes.routes";
import activityRoutes from "./activity.routes";
import billingRoutes from "./billing.routes";
import settingsRoutes from "./settings.routes";
import aiContentRoutes from "./ai-content.routes";
import bookmarksRoutes from "./bookmarks.routes";
import insightsRoutes from "./insights.routes";

const router = Router();

// Health check
router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.API_VERSION || "v1",
    },
  });
});

router.use("/auth", authRoutes);
router.use("/ai/content", aiContentRoutes);
router.use("/content", contentRoutes);
router.use("/image", imageRoutes);

// Post management — available under both /posts and /schedule (spec + legacy)
router.use("/posts", schedulerRoutes);
router.use("/schedule", schedulerRoutes);
// Legacy /scheduler also supported
router.use("/scheduler", schedulerRoutes);

router.use("/social-auth", socialAuthRoutes);
router.use("/accounts", accountsRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/competitors", competitorsRoutes);
router.use("/campaigns", campaignRoutes);
router.use("/notifications", notificationRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/nodes", nodesRoutes);
router.use("/activity", activityRoutes);
router.use("/billing", billingRoutes);
router.use("/settings", settingsRoutes);
router.use("/bookmarks", bookmarksRoutes);
router.use("/insights", insightsRoutes);

export default router;
