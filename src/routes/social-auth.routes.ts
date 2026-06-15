import { Router } from "express";
import { authenticate } from "@/middleware/auth.middleware";
import {
  linkedinAuthRedirect,
  linkedinCallback,
  metaAuthRedirect,
  metaCallback,
  twitterAuthRedirect,
  twitterCallback,
  disconnectPlatform,
  getSocialStatus,
  mockConnectPlatform,
} from "@/controllers/social-auth.controller";

const router = Router();

// LinkedIn
router.get("/linkedin", authenticate, linkedinAuthRedirect);
router.get("/linkedin/callback", linkedinCallback);

// Meta (Facebook + Instagram)
router.get("/meta", authenticate, metaAuthRedirect);
router.get("/meta/callback", metaCallback);

// Twitter/X
router.get("/twitter", authenticate, twitterAuthRedirect);
router.get("/twitter/callback", twitterCallback);

// Status + disconnect
router.get("/status", authenticate, getSocialStatus);
router.post("/mock/:platform", authenticate, mockConnectPlatform);
router.delete("/disconnect/:platform", authenticate, disconnectPlatform);
router.delete("/:platform", authenticate, disconnectPlatform);

export default router;
