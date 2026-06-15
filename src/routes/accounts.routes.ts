import { Router, Response, NextFunction } from "express";
import { authenticate, AuthRequest } from "@/middleware/auth.middleware";
import { User } from "@/models";
import { logger } from "@/utils/logger";

const router = Router();

/**
 * GET /api/v1/accounts/:userId
 * Returns connected social accounts for the authenticated user.
 * Users may only query their own accounts.
 */
router.get(
  "/:userId",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.userId !== req.params.userId) {
        res.status(403).json({
          success: false,
          error: { message: "Forbidden", statusCode: 403 },
        });
        return;
      }

      const user = await User.findById(req.params.userId)
        .select("socialConnections")
        .lean();

      if (!user) {
        res.status(404).json({
          success: false,
          error: { message: "User not found", statusCode: 404 },
        });
        return;
      }

      const connections = (user as any).socialConnections || {};
      const accounts = Object.entries(connections)
        .filter(([, v]) => v != null)
        .map(([platform, data]: [string, any]) => ({
          platform,
          profileName: data.profileName || data.pageName || null,
          profileId: data.profileId || null,
          pageId: data.pageId || null,
          connectedAt: data.connectedAt,
          expiresAt: data.expiresAt || null,
        }));

      res.status(200).json({ success: true, data: accounts });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /api/v1/accounts/:userId/:platform
 * Disconnects a social account for the authenticated user.
 */
router.delete(
  "/:userId/:platform",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.userId !== req.params.userId) {
        res.status(403).json({
          success: false,
          error: { message: "Forbidden", statusCode: 403 },
        });
        return;
      }

      const { userId, platform } = req.params;
      const allowed = ["linkedin", "facebook", "instagram", "twitter"];
      if (!allowed.includes(platform)) {
        res.status(400).json({
          success: false,
          error: { message: "Invalid platform", statusCode: 400 },
        });
        return;
      }

      await User.findByIdAndUpdate(userId, {
        $unset: { [`socialConnections.${platform}`]: "" },
      });

      logger.info(`[Accounts] Disconnected ${platform} for user ${userId}`);

      res.status(200).json({
        success: true,
        data: { message: `${platform} disconnected` },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
