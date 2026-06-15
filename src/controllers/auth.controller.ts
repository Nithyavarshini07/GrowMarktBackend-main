import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { User } from "@/models";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "@/utils/errors";
import { AuthRequest } from "@/middleware/auth.middleware";
import { logger } from "@/utils/logger";
import {
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  hashToken,
} from "@/services/auth-token.service";
import { ensureUserWorkspace } from "@/services/workspace-bootstrap.service";
import { createActivityEvent } from "@/services/activity-notification.service";
import { config } from "@/config";

function sanitizeUser(user: any): {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role || "owner",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function buildSessionTokens(
  user: any,
  req: Request,
): Promise<{ token: string; refreshToken: string }> {
  const token = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role || "owner",
  });

  const generated = generateRefreshToken();
  const refreshTokens = Array.isArray(user.refreshTokens)
    ? user.refreshTokens
    : [];

  refreshTokens.push({
    tokenHash: generated.hash,
    expiresAt: generated.expiresAt,
    createdAt: new Date(),
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });

  user.refreshTokens = refreshTokens.slice(-10);
  await user.save();

  return {
    token,
    refreshToken: generated.raw,
  };
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError("Email already registered");
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "owner",
    });

    const { token, refreshToken } = await buildSessionTokens(user, req);
    await ensureUserWorkspace(user._id.toString());

    await createActivityEvent({
      userId: user._id.toString(),
      category: "TEAM",
      type: "success",
      title: "Account created",
      description: "Welcome to GrowMarket. Your workspace is ready.",
      actor: user.name,
    });

    logger.info(`User registered: ${email}`);

    res.status(201).json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const { token, refreshToken } = await buildSessionTokens(user, req);
    await ensureUserWorkspace(user._id.toString());

    logger.info(`User logged in: ${email}`);

    res.status(200).json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function oauthLogin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { provider, providerId, email, name } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = await bcrypt.hash(
        `oauth_${provider}_${providerId}_${Date.now()}`,
        12,
      );
      user = await User.create({
        name,
        email,
        password: randomPassword,
        role: "owner",
      });
    }

    const providerKey = provider === "google" ? "google" : "linkedin";
    const oauthProviders = user.oauthProviders || {};
    oauthProviders[providerKey] = {
      providerId,
      email,
      connectedAt: new Date(),
    };
    user.oauthProviders = oauthProviders;

    const { token, refreshToken } = await buildSessionTokens(user, req);
    await ensureUserWorkspace(user._id.toString());

    await createActivityEvent({
      userId: user._id.toString(),
      category: "TEAM",
      type: "success",
      title: `${provider} OAuth login`,
      description: `${provider} session established successfully.`,
      actor: user.name,
      meta: { provider },
    });

    logger.info(`OAuth login via ${provider}: ${email}`);

    res.status(200).json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      const reset = generateResetToken();
      user.resetPasswordTokenHash = reset.hash;
      user.resetPasswordExpiresAt = reset.expiresAt;
      await user.save();

      await createActivityEvent({
        userId: user._id.toString(),
        category: "ALERTS",
        type: "warning",
        title: "Password reset requested",
        description: "A reset password request was generated for your account.",
        actor: user.name,
      });

      res.status(200).json({
        success: true,
        data: {
          message: "If this email exists, a reset link has been generated.",
          expiresAt: reset.expiresAt,
          // Dev-friendly token to complete flow without email provider integration.
          resetToken: config.env === "production" ? undefined : reset.raw,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        message: "If this email exists, a reset link has been generated.",
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { token, newPassword } = req.body;
    const tokenHash = hashToken(token);

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestError("Invalid or expired reset token");
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    user.refreshTokens = [];

    const { token: accessToken, refreshToken } = await buildSessionTokens(
      user,
      req,
    );

    await createActivityEvent({
      userId: user._id.toString(),
      category: "ALERTS",
      type: "success",
      title: "Password reset completed",
      description: "Your password was updated and old sessions were revoked.",
      actor: user.name,
    });

    res.status(200).json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token: accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshSession(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { refreshToken } = req.body;
    const tokenHash = hashToken(refreshToken);

    const user = await User.findOne({
      refreshTokens: {
        $elemMatch: {
          tokenHash,
          expiresAt: { $gt: new Date() },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    user.refreshTokens = (user.refreshTokens || []).filter(
      (item: any) => item.tokenHash !== tokenHash,
    );

    const { token, refreshToken: nextRefreshToken } = await buildSessionTokens(
      user,
      req,
    );

    res.status(200).json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
        refreshToken: nextRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(200).json({ success: true, data: { message: "Logged out" } });
      return;
    }

    const tokenHash = hashToken(refreshToken);
    await User.updateOne(
      { "refreshTokens.tokenHash": tokenHash },
      { $pull: { refreshTokens: { tokenHash } } },
    );

    res.status(200).json({
      success: true,
      data: { message: "Logged out" },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      throw new BadRequestError("User not found");
    }

    res.status(200).json({
      success: true,
      data: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
}
