import { Router } from "express";
import { authenticate, requireRole } from "@/middleware/auth.middleware";
import {
  exportAnalytics,
  getAnalytics,
  getAnalyticsInsights,
  getAnalyticsOverview,
  getDataExplorer,
  getGrowthVsEngagement,
  getMonthlyDeepDive,
  getPerformanceNodes,
  getPostImpact,
  getTimeSeries,
  getTopNodes,
  searchAnalytics,
} from "@/controllers/analytics.controller";

const router = Router();

const canView = [authenticate, requireRole("owner", "editor", "viewer")];
const canEdit = [authenticate, requireRole("owner", "editor")];

// Spec-required endpoints
router.get("/overview", ...canView, getAnalyticsOverview);
router.get("/growth-vs-engagement", ...canView, getGrowthVsEngagement);
router.get("/monthly-deepdive", ...canView, getMonthlyDeepDive);
router.get("/performance-nodes", ...canView, getPerformanceNodes);
router.get("/top-nodes", ...canView, getTopNodes);
router.get("/data-explorer", ...canView, getDataExplorer);
router.get("/search", ...canView, searchAnalytics);
router.get("/export", ...canEdit, exportAnalytics);

// Support endpoints
router.get("/insights", ...canView, getAnalyticsInsights);
router.get("/time-series", ...canView, getTimeSeries);
router.get("/impact/:postId", ...canView, getPostImpact);

// Legacy — kept for frontend compatibility
router.get("/", ...canView, getAnalytics);

export default router;
