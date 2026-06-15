/**
 * Social Post Service
 *
 * Canonical publishing service for all social media platforms.
 * Called by the scheduler job (jobs/scheduler.job.ts).
 *
 * publishPost(post) — routes to the correct platform publisher.
 *
 * Supported platforms: linkedin, facebook, instagram, twitter
 */

import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { logger } from "@/utils/logger";
import { User, ISocialConnection } from "@/models";
import { IGeneratedPost } from "@/models/generated-post.model";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert a stored localhost image URL to a local file path, if it exists. */
function resolveLocalImagePath(url: string | undefined): string | null {
  if (!url) return null;
  const parts = url.split("/uploads/designs/");
  if (parts.length < 2) return null;
  const localPath = path.resolve("uploads", "designs", parts[1]);
  return fs.existsSync(localPath) ? localPath : null;
}

/** Build plain-text post body from a GeneratedPost document. */
function buildTextContent(post: IGeneratedPost): string {
  return [post.headline, ...post.points, post.cta]
    .filter(Boolean)
    .join("\n\n");
}

// ── LinkedIn ──────────────────────────────────────────────────────────────────

async function publishToLinkedIn(
  post: IGeneratedPost,
  connection: ISocialConnection,
): Promise<void> {
  const { accessToken, profileId } = connection;
  if (!accessToken || !profileId) {
    throw new Error("LinkedIn not connected: missing accessToken or profileId");
  }

  const urn = `urn:li:person:${profileId}`;
  const textContent = buildTextContent(post);
  const localImgPath = resolveLocalImagePath(
    post.editedImageUrl || post.generatedImageUrl,
  );

  let assetUrn: string | null = null;

  if (localImgPath) {
    // Step 1 — Register image upload
    const regRes = await axios.post(
      "https://api.linkedin.com/v2/assets?action=registerUpload",
      {
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: urn,
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const mechanism =
      regRes.data.value.uploadMechanism[
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
      ];
    const uploadUrl = mechanism.uploadUrl;
    assetUrn = regRes.data.value.asset;

    // Step 2 — Upload binary
    const fileBinary = fs.readFileSync(localImgPath);
    await axios.put(uploadUrl, fileBinary, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "image/png",
      },
    });
  }

  // Step 3 — Create UGC post
  await axios.post(
    "https://api.linkedin.com/v2/ugcPosts",
    {
      author: urn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: textContent },
          shareMediaCategory: assetUrn ? "IMAGE" : "NONE",
          media: assetUrn
            ? [{ status: "READY", media: assetUrn }]
            : [],
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
    },
  );

  logger.info(`[SocialPost] ✓ LinkedIn post published for post ${post._id}`);
}

// ── Facebook ──────────────────────────────────────────────────────────────────

async function publishToFacebook(
  post: IGeneratedPost,
  connection: ISocialConnection,
): Promise<void> {
  const { accessToken, pageId } = connection;
  if (!accessToken || !pageId) {
    throw new Error("Facebook not connected: missing accessToken or pageId");
  }

  const textContent = buildTextContent(post);
  const localImgPath = resolveLocalImagePath(
    post.editedImageUrl || post.generatedImageUrl,
  );

  if (localImgPath) {
    const form = new FormData();
    form.append("message", textContent);
    form.append("source", fs.createReadStream(localImgPath));
    form.append("access_token", accessToken);

    await axios.post(
      `https://graph.facebook.com/v19.0/${pageId}/photos`,
      form,
      { headers: form.getHeaders() },
    );
  } else {
    await axios.post(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      message: textContent,
      access_token: accessToken,
    });
  }

  logger.info(`[SocialPost] ✓ Facebook post published for post ${post._id}`);
}

// ── Instagram ─────────────────────────────────────────────────────────────────

async function publishToInstagram(
  post: IGeneratedPost,
  connection: ISocialConnection,
): Promise<void> {
  const { accessToken, pageId: igAccountId } = connection;
  if (!accessToken || !igAccountId) {
    throw new Error("Instagram not connected: missing accessToken or accountId");
  }

  const imgUrl = post.editedImageUrl || post.generatedImageUrl;
  if (!imgUrl) {
    throw new Error("Instagram requires an image URL to publish");
  }

  if (imgUrl.includes("localhost")) {
    throw new Error(
      "Cannot publish to Instagram from localhost — Instagram requires a publicly accessible image URL. " +
        "Use a tunnel (e.g. ngrok) or deploy to a live server.",
    );
  }

  const textContent = buildTextContent(post);

  // Step 1 — Create media container
  const containerRes = await axios.post(
    `https://graph.facebook.com/v19.0/${igAccountId}/media`,
    {
      image_url: imgUrl,
      caption: textContent,
      access_token: accessToken,
    },
  );

  // Step 2 — Publish container
  await axios.post(
    `https://graph.facebook.com/v19.0/${igAccountId}/media_publish`,
    {
      creation_id: containerRes.data.id,
      access_token: accessToken,
    },
  );

  logger.info(`[SocialPost] ✓ Instagram post published for post ${post._id}`);
}

// ── Twitter / X ───────────────────────────────────────────────────────────────

async function publishToTwitter(
  post: IGeneratedPost,
  connection: ISocialConnection,
): Promise<void> {
  const { accessToken } = connection;
  if (!accessToken) {
    throw new Error("Twitter not connected: missing accessToken");
  }

  const MAX_CHARS = 280;
  const rawText = buildTextContent(post);
  const text =
    rawText.length > MAX_CHARS
      ? rawText.substring(0, MAX_CHARS - 3) + "..."
      : rawText;

  let mediaId: string | undefined;
  const imgUrl = post.editedImageUrl || post.generatedImageUrl;

  if (imgUrl) {
    try {
      const imgRes = await axios.get(imgUrl, { responseType: "arraybuffer" });
      const base64 = Buffer.from(imgRes.data).toString("base64");

      const uploadRes = await axios.post(
        "https://upload.twitter.com/1.1/media/upload.json",
        `media_data=${encodeURIComponent(base64)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );
      mediaId = uploadRes.data.media_id_string;
    } catch (err: any) {
      logger.warn(
        `[SocialPost] Twitter media upload failed (continuing without image): ${err.message}`,
      );
    }
  }

  const tweetPayload: Record<string, unknown> = { text };
  if (mediaId) tweetPayload.media = { media_ids: [mediaId] };

  await axios.post("https://api.twitter.com/2/tweets", tweetPayload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  logger.info(`[SocialPost] ✓ Twitter post published for post ${post._id}`);
}

// ── Main Entry Point ──────────────────────────────────────────────────────────

/**
 * publishPost — routes a scheduled GeneratedPost to the correct platform publisher.
 * Fetches the user's social connection from the database.
 */
export async function publishPost(post: IGeneratedPost): Promise<void> {
  const user = await User.findById(post.userId).select("socialConnections");
  if (!user) throw new Error(`User ${post.userId} not found`);

  const connections = (user as any).socialConnections || {};
  const platform = post.platform;

  logger.info(`[SocialPost] Publishing post ${post._id} → ${platform}`);

  switch (platform) {
    case "linkedin":
      if (!connections.linkedin)
        throw new Error("LinkedIn account not connected");
      await publishToLinkedIn(post, connections.linkedin);
      break;

    case "facebook":
      if (!connections.facebook)
        throw new Error("Facebook account not connected");
      await publishToFacebook(post, connections.facebook);
      break;

    case "instagram":
      if (!connections.instagram)
        throw new Error("Instagram account not connected");
      await publishToInstagram(post, connections.instagram);
      break;

    case "twitter":
      if (!connections.twitter)
        throw new Error("Twitter account not connected");
      await publishToTwitter(post, connections.twitter);
      break;

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}
