import { Router } from "express";
import { authenticate, requireRole } from "@/middleware/auth.middleware";
import {
  getDashboardOverview,
  getPostImpact,
} from "@/controllers/dashboard.controller";

const router = Router();

const canView = [authenticate, requireRole("owner", "editor", "viewer")];

router.get("/overview", ...canView, getDashboardOverview);
router.get("/post-impact/:id", ...canView, getPostImpact);

export default router;
