import { Router } from "express";
import { authenticate, requireRole } from "@/middleware/auth.middleware";
import { getPerformanceNodes } from "@/controllers/nodes.controller";

const router = Router();

router.get(
  "/",
  authenticate,
  requireRole("owner", "editor"),
  getPerformanceNodes,
);

export default router;
