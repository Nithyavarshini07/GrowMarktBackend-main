import { Router } from "express";
import { authenticate, requireRole } from "@/middleware/auth.middleware";
import { getInsights } from "@/controllers/insights.controller";

const router = Router();

router.get("/", authenticate, requireRole("owner", "editor"), getInsights);

export default router;
