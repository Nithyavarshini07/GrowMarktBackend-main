import { Router } from "express";
import { authenticate, requireRole } from "@/middleware/auth.middleware";
import { getSettings, updateSettings } from "@/controllers/settings.controller";

const router = Router();

router.get("/", authenticate, requireRole("owner", "editor"), getSettings);
router.patch("/", authenticate, requireRole("owner", "editor"), updateSettings);

export default router;
