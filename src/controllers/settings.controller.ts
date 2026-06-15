import { NextFunction, Response } from "express";
import { AuthRequest } from "@/middleware/auth.middleware";
import { Settings, User } from "@/models";
import { UnauthorizedError } from "@/utils/errors";
import { ensureUserWorkspace } from "@/services/workspace-bootstrap.service";

export const getSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    await ensureUserWorkspace(req.userId);

    const settings = await Settings.findOne({ userId: req.userId });
    const user = await User.findById(req.userId).select(
      "name email role socialConnections",
    );

    const connectedChannels = Object.entries(
      (user as any)?.socialConnections || {},
    )
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => ({
        platform: key,
        connected: true,
        profileName:
          (value as any).profileName || (value as any).pageName || null,
      }));

    res.status(200).json({
      success: true,
      data: {
        profile: settings?.profile || {
          name: user?.name,
          email: user?.email,
          timezone: "UTC",
          avatarUrl: null,
        },
        team: settings?.team || [],
        connectedChannels,
        billing: {
          plan: "Pro Curator",
          status: "active",
        },
        notifications: settings?.notifications || {
          email: true,
          push: true,
          inApp: true,
          alerts: true,
          competitors: true,
          team: true,
          published: true,
        },
        support: settings?.support || {
          contactEmail: "support@growmarket.ai",
          prioritySupport: false,
        },
        createdAt: settings?.createdAt || new Date(),
        updatedAt: settings?.updatedAt || new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) throw new UnauthorizedError();

    await ensureUserWorkspace(req.userId);

    const payload = req.body || {};

    const updates: Record<string, unknown> = {};

    if (payload.profile) updates.profile = payload.profile;
    if (payload.team) updates.team = payload.team;
    if (payload.notifications) updates.notifications = payload.notifications;
    if (payload.support) updates.support = payload.support;

    const settings = await Settings.findOneAndUpdate(
      { userId: req.userId },
      { $set: updates },
      { new: true, upsert: true },
    );

    if (payload.profile?.name || payload.profile?.email) {
      await User.findByIdAndUpdate(req.userId, {
        ...(payload.profile?.name ? { name: payload.profile.name } : {}),
        ...(payload.profile?.email ? { email: payload.profile.email } : {}),
      });
    }

    res.status(200).json({
      success: true,
      data: {
        profile: settings.profile,
        team: settings.team,
        connectedChannels: settings.connectedChannels,
        notifications: settings.notifications,
        support: settings.support,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
