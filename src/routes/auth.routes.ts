import { Router } from "express";
import {
  register,
  login,
  getProfile,
  oauthLogin,
  forgotPassword,
  resetPassword,
  refreshSession,
  logout,
} from "@/controllers/auth.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import {
  registerSchema,
  loginSchema,
  oauthLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from "@/utils/validation";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/oauth", validateBody(oauthLoginSchema), oauthLogin);
router.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  forgotPassword,
);
router.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  resetPassword,
);
router.post("/refresh-token", validateBody(refreshTokenSchema), refreshSession);
router.post("/logout", validateBody(refreshTokenSchema), logout);
router.get("/profile", authenticate, getProfile);

export default router;
