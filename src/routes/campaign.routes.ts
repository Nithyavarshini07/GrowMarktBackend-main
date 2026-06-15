import { Router } from "express";
import * as campaignController from "@/controllers/campaign.controller";
import { authenticate, requireRole } from "@/middleware/auth.middleware";

const router = Router();

const canView = [authenticate, requireRole("owner", "editor", "viewer")];
const canEdit = [authenticate, requireRole("owner", "editor")];

// ── Monthly Objectives ──
router.get("/objectives", ...canView, campaignController.getMonthlyObjective);
router.post("/objectives", ...canEdit, campaignController.upsertMonthlyObjective);

// ── Campaigns ──
router.get("/", ...canView, campaignController.getCampaigns);
router.get("/:id", ...canView, campaignController.getCampaignById);
router.get("/:id/analytics", ...canView, campaignController.getCampaignAnalytics);
router.get("/:id/timeline", ...canView, campaignController.getCampaignTimeline);
router.post("/", ...canEdit, campaignController.createCampaign);
router.patch("/:id", ...canEdit, campaignController.updateCampaign);
router.delete("/:id", ...canEdit, campaignController.deleteCampaign);

export default router;
