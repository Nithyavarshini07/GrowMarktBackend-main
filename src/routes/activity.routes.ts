import { Router } from "express";
import { authenticate, requireRole } from "@/middleware/auth.middleware";
import { getActivityFeed } from "@/controllers/activity.controller";

const router = Router();

router.get("/", authenticate, requireRole("owner", "editor"), getActivityFeed);

export default router;
