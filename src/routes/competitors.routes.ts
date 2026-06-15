import { Router } from "express";
import { authenticate, requireRole } from "@/middleware/auth.middleware";
import {
  deleteCompetitorTarget,
  discoverCompetitorsByGenre,
  getCompetitorAnalytics,
  getCompetitorCompareSelf,
  getCompetitorFeed,
  getCompetitorInsightSummary,
  getCompetitorPostImpact,
  getCompetitorPosts,
  getCompetitorProfile,
  getCompetitors,
  ingestCompetitorFeed,
  listCompetitorTargets,
  syncCompetitorFeed,
  upsertCompetitorTargets,
} from "@/controllers/competitors.controller";

const router = Router();

const canView = [authenticate, requireRole("owner", "editor", "viewer")];
const canEdit = [authenticate, requireRole("owner", "editor")];

// ── Discovery & Targets ────────────────────────────────────────────────────
router.post("/discover", ...canEdit, discoverCompetitorsByGenre);
router.get("/targets", ...canView, listCompetitorTargets);
router.post("/targets", ...canEdit, upsertCompetitorTargets);
router.delete("/targets/:id", ...canEdit, deleteCompetitorTarget);

// ── Feed Ingestion & Sync ──────────────────────────────────────────────────
router.post("/ingest", ...canEdit, ingestCompetitorFeed);
router.post("/sync", ...canEdit, syncCompetitorFeed);

// ── Insight Summary (must be before /:id routes) ──────────────────────────
router.get("/insight-summary", ...canView, getCompetitorInsightSummary);

// ── Leaderboard & Feed List ────────────────────────────────────────────────
router.get("/", ...canView, getCompetitors);
router.get("/feed", ...canView, getCompetitorFeed);

// ── Competitor Deep-Dive ───────────────────────────────────────────────────
router.get("/:id/profile", ...canView, getCompetitorProfile);
router.get("/:id/analytics", ...canView, getCompetitorAnalytics);
router.get("/:id/compare-self", ...canView, getCompetitorCompareSelf);
router.get("/:id/posts", ...canView, getCompetitorPosts);
router.get("/:id/posts/:postId/impact", ...canView, getCompetitorPostImpact);

export default router;
