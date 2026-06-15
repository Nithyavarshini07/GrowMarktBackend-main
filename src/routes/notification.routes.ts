import { Router } from "express";
import * as notificationController from "@/controllers/notification.controller";
import { protect, requireRole } from "@/middleware/auth.middleware";

const router = Router();

router.use(protect);
router.use(requireRole("owner", "editor"));

router.get("/", notificationController.getNotifications);
router.post("/settings", notificationController.updateNotificationSettings);
router.patch("/:id/read", notificationController.markAsRead);
router.delete("/clear", notificationController.clearNotifications);

export default router;
