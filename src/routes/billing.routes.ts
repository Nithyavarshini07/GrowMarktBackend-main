import { Router } from "express";
import { authenticate, requireRole } from "@/middleware/auth.middleware";
import { getBilling } from "@/controllers/billing.controller";

const router = Router();

router.get("/", authenticate, requireRole("owner", "editor"), getBilling);

export default router;
