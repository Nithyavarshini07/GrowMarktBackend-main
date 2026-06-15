import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { AuthRequest } from "@/middleware/auth.middleware";
import { User } from "@/models";
import { config } from "@/config";
import { UnauthorizedError, BadRequestError } from "@/utils/errors";
import { logger } from "@/utils/logger";

// ── LinkedIn ──────────────────────────────────────────────────────────────────
export function linkedinAuthRedirect(req: AuthRequest, res: Response): void {
  if (!req.userId) {
    res
      .status(401)
      .json({
        success: false,
        error: { message: "Unauthorized", statusCode: 401 },
      });
    return;
  }

  if (
    !config.linkedin.clientId ||
    config.linkedin.clientId.startsWith("YOUR_")
  ) {
    res.status(503).json({
      success: false,
      error: {
        message:
          "LinkedIn OAuth is not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in .env",
        statusCode: 503,
      },
    });
    return;
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.linkedin.clientId,
    redirect_uri: config.linkedin.redirectUri,
    scope: "w_member_social",
    state: req.userId,
  });

  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
}

export async function linkedinCallback(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { code, state: userId, error, error_description } = req.query as Record<string, string>;
    if (error || !code || !userId) {
      logger.error(`[SocialAuth] LinkedIn callback error: ${error} - ${error_description}`);
      res.redirect(`${config.cors.origin}/settings?error=linkedin_denied`);
      return;
    }

    logger.info(`[SocialAuth] LinkedIn exchanging code for token. Redirect URI: ${config.linkedin.redirectUri}`);
    // Exchange code for token
    const tokenRes = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: config.linkedin.redirectUri,
        client_id: config.linkedin.clientId,
        client_secret: config.linkedin.clientSecret,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    const { access_token, expires_in } = tokenRes.data as {
      access_token: string;
      expires_in: number;
    };

    logger.info(`[SocialAuth] LinkedIn token received. Using restricted scope defaults since profile fetch requires OpenID product.`);
    
    // We only requested w_member_social, so we cannot fetch /v2/me or /v2/userinfo
    // Instead of throwing an error for missing profile, we store a generic profile identity.
    const profileId = `li_${userId}`;
    const profileName = `LinkedIn Post Access`;

    await User.findByIdAndUpdate(userId, {
      "socialConnections.linkedin": {
        accessToken: access_token,
        expiresAt: new Date(Date.now() + expires_in * 1000),
        profileId,
        profileName,
        connectedAt: new Date(),
      },
    });

    logger.info(`[SocialAuth] LinkedIn connected for user ${userId}`);
    res.redirect(`${config.cors.origin}/settings?connected=linkedin`);
  } catch (err: any) {
    logger.error("[SocialAuth] LinkedIn callback exception:", err.response?.data || err.message);
    res.redirect(`${config.cors.origin}/settings?error=linkedin_error`);
  }
}

// ── Meta (Facebook + Instagram) ───────────────────────────────────────────────
export function metaAuthRedirect(req: AuthRequest, res: Response): void {
  if (!req.userId) {
    res
      .status(401)
      .json({
        success: false,
        error: { message: "Unauthorized", statusCode: 401 },
      });
    return;
  }

  if (!config.meta.appId || config.meta.appId.startsWith("YOUR_")) {
    res.status(503).json({
      success: false,
      error: {
        message:
          "Meta OAuth is not configured. Set META_APP_ID and META_APP_SECRET in .env",
        statusCode: 503,
      },
    });
    return;
  }

  const params = new URLSearchParams({
    client_id: config.meta.appId,
    redirect_uri: config.meta.redirectUri,
    scope:
      "pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish",
    response_type: "code",
    state: req.userId,
  });

  res.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params}`);
}

export async function metaCallback(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { code, state: userId, error } = req.query as Record<string, string>;
    if (error || !code || !userId) {
      res.redirect(`${config.cors.origin}/settings?error=meta_denied`);
      return;
    }

    // Exchange code for user token
    const tokenRes = await axios.get(
      "https://graph.facebook.com/v19.0/oauth/access_token",
      {
        params: {
          client_id: config.meta.appId,
          client_secret: config.meta.appSecret,
          redirect_uri: config.meta.redirectUri,
          code,
        },
      },
    );

    const userAccessToken: string = (tokenRes.data as { access_token: string })
      .access_token;

    // Get user's pages
    const pagesRes = await axios.get(
      "https://graph.facebook.com/v19.0/me/accounts",
      {
        params: { access_token: userAccessToken },
      },
    );

    const pages =
      (
        pagesRes.data as {
          data?: Array<{ id: string; name: string; access_token: string }>;
        }
      ).data || [];
    const firstPage = pages[0];

    const fbConnection = {
      accessToken: firstPage?.access_token || userAccessToken,
      profileId: userId,
      profileName: firstPage?.name || "Connected",
      pageId: firstPage?.id,
      pageName: firstPage?.name,
      connectedAt: new Date(),
    };

    await User.findByIdAndUpdate(userId, {
      "socialConnections.facebook": fbConnection,
    });

    // Check for Instagram business account linked to page
    if (firstPage?.id) {
      try {
        const igRes = await axios.get(
          `https://graph.facebook.com/v19.0/${firstPage.id}`,
          {
            params: {
              fields: "instagram_business_account",
              access_token: firstPage.access_token,
            },
          },
        );
        const igAccountId = (
          igRes.data as { instagram_business_account?: { id: string } }
        ).instagram_business_account?.id;
        if (igAccountId) {
          await User.findByIdAndUpdate(userId, {
            "socialConnections.instagram": {
              accessToken: firstPage.access_token,
              profileId: igAccountId,
              pageId: igAccountId,
              pageName: firstPage.name,
              connectedAt: new Date(),
            },
          });
        }
      } catch (_) {
        /* Instagram linking is optional */
      }
    }

    logger.info(`[SocialAuth] Meta connected for user ${userId}`);
    res.redirect(`${config.cors.origin}/settings?connected=facebook`);
  } catch (err) {
    logger.error("[SocialAuth] Meta callback error:", err);
    res.redirect(`${config.cors.origin}/settings?error=meta_error`);
  }
}

// ── Twitter/X ───────────────────────────────────────────────────────────────
/**
 * Twitter OAuth 2.0 uses PKCE (Proof Key for Code Exchange) for security.
 * We need to store the code_verifier temporarily in session.
 */
export function twitterAuthRedirect(req: AuthRequest, res: Response): void {
  if (!req.userId) {
    res
      .status(401)
      .json({
        success: false,
        error: { message: "Unauthorized", statusCode: 401 },
      });
    return;
  }

  if (!config.twitter?.clientId) {
    res.status(503).json({
      success: false,
      error: {
        message:
          "Twitter OAuth is not configured. Set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET in .env",
        statusCode: 503,
      },
    });
    return;
  }

  // Generate PKCE code verifier and challenge
  const crypto = require("crypto");
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  // Store code verifier in session (we'll need it in callback)
  (req as any).session = (req as any).session || {};
  (req as any).session.twitterCodeVerifier = codeVerifier;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.twitter.clientId,
    redirect_uri: config.twitter.redirectUri,
    scope: "tweet.read tweet.write users.read offline.access",
    state: req.userId, // pass userId for callback
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  res.redirect(`https://twitter.com/i/oauth2/authorize?${params}`);
}

export async function twitterCallback(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { code, state: userId, error } = req.query as Record<string, string>;
    if (error || !code || !userId) {
      logger.error(`[SocialAuth] Twitter callback error: ${error}`);
      res.redirect(`${config.cors.origin}/settings?error=twitter_denied`);
      return;
    }

    // Retrieve code_verifier from session
    const codeVerifier = (req as any).session?.twitterCodeVerifier;
    logger.info(`[SocialAuth] Twitter callback received. Session Code Verifier: ${codeVerifier ? 'Present' : 'MISSING'}`);
    
    if (!codeVerifier) {
      throw new Error("Code verifier not found in session. Ensure cookies are enabled and frontend/backend domains match.");
    }

    logger.info(`[SocialAuth] Twitter exchanging code for token...`);
    // Exchange code for access token
    const tokenRes = await axios.post(
      "https://api.twitter.com/2/oauth2/token",
      new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: config.twitter.clientId,
        redirect_uri: config.twitter.redirectUri,
        code_verifier: codeVerifier,
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        auth: {
          username: config.twitter.clientId,
          password: config.twitter.clientSecret,
        },
      },
    );

    const { access_token, refresh_token } = tokenRes.data as {
      access_token: string;
      refresh_token?: string;
    };

    logger.info(`[SocialAuth] Twitter token received. Fetching profile...`);
    // Get user profile
    const profileRes = await axios.get("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = profileRes.data.data as { id: string; username: string };

    await User.findByIdAndUpdate(userId, {
      "socialConnections.twitter": {
        accessToken: access_token,
        refreshToken: refresh_token,
        profileId: profile.id,
        profileName: profile.username,
        connectedAt: new Date(),
      },
    });

    // Clear code verifier from session
    delete (req as any).session.twitterCodeVerifier;

    logger.info(`[SocialAuth] Twitter connected for user ${userId}`);
    res.redirect(`${config.cors.origin}/settings?connected=twitter`);
  } catch (err: any) {
    logger.error("[SocialAuth] Twitter callback exception:", err.response?.data || err.message);
    res.redirect(`${config.cors.origin}/settings?error=twitter_error`);
  }
}

export async function disconnectPlatform(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.userId) throw new UnauthorizedError();
    const { platform } = req.params;
    if (!["linkedin", "facebook", "instagram", "twitter"].includes(platform)) {
      throw new BadRequestError("Invalid platform");
    }

    await User.findByIdAndUpdate(req.userId, {
      $unset: { [`socialConnections.${platform}`]: "" },
    });

    res.status(200).json({ success: true, data: { disconnected: platform } });
  } catch (error) {
    next(error);
  }
}

export async function getSocialStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const user = await User.findById(req.userId)
      .select("socialConnections")
      .lean();

    const conn =
      (
        user as {
          socialConnections?: {
            linkedin?: { profileName?: string };
            facebook?: { pageName?: string };
            instagram?: { pageName?: string };
            twitter?: { profileName?: string };
          };
        } | null
      )?.socialConnections || {};

    res.status(200).json({
      success: true,
      data: {
        linkedin: {
          connected: !!conn.linkedin,
          profileName: conn.linkedin?.profileName || null,
        },
        facebook: {
          connected: !!conn.facebook,
          pageName: conn.facebook?.pageName || null,
        },
        instagram: {
          connected: !!conn.instagram,
          pageName: conn.instagram?.pageName || null,
        },
        twitter: {
          connected: !!conn.twitter,
          profileName: conn.twitter?.profileName || null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function mockConnectPlatform(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.userId) throw new UnauthorizedError();
    const { platform } = req.params;
    
    const mockDataMap: Record<string, any> = {
      linkedin: {
        accessToken: "mock_token_" + Math.random(),
        profileId: "mock_id_" + platform,
        profileName: "Demo Curator",
        connectedAt: new Date(),
      },
      facebook: {
        accessToken: "mock_token_" + Math.random(),
        profileId: "mock_id_" + platform,
        profileName: "Brand Showcase",
        pageId: "mock_page_id",
        pageName: "GrowMarket Main Store",
        connectedAt: new Date(),
      },
      instagram: {
        accessToken: "mock_token_ig_" + Math.random(),
        profileId: "mock_id_ig",
        pageId: "mock_page_id_ig",
        pageName: "GrowMarket Brand",
        connectedAt: new Date(),
      },
      twitter: {
        accessToken: "mock_token_" + Math.random(),
        profileId: "mock_id_" + platform,
        profileName: "@GrowMarketAI",
        connectedAt: new Date(),
      }
    };

    const mockData = mockDataMap[platform];
    if (!mockData) throw new BadRequestError("Invalid platform");

    await User.findByIdAndUpdate(req.userId, {
      [`socialConnections.${platform}`]: mockData,
    });

    res.status(200).json({ success: true, data: { connected: platform, mock: true } });
  } catch (error) {
    next(error);
  }
}
