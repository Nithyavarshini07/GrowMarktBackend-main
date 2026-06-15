import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middleware/auth.middleware";
import { config } from "@/config";
import { logger } from "@/utils/logger";
import { GeneratedPost } from "@/models/generated-post.model";
import { UnauthorizedError, BadRequestError } from "@/utils/errors";

const ALLOWED_PLATFORMS = [
  "linkedin",
  "instagram",
  "facebook",
  "twitter",
] as const;
type AllowedPlatform = (typeof ALLOWED_PLATFORMS)[number];

// ── Gemini v1 REST helper ──────────────────────────────────────────────────────
// The @google/genai SDK defaults to v1beta which rejects systemInstruction
// and responseMimeType as unknown fields on v1 API keys. We call v1 directly.

const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_BASE = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function geminiJSON<T = unknown>(
  userPrompt: string,
  systemPrompt: string,
): Promise<T> {
  const apiKey = config.gemini.apiKey;

  // Combine system + user prompt (no generationConfig — not supported on this key tier)
  const combinedPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}\n\nIMPORTANT: Respond ONLY with valid JSON. No explanation, no markdown fences.`;

  const body = {
    contents: [{ parts: [{ text: combinedPrompt }] }],
  };

  const res = await fetch(`${GEMINI_BASE}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json() as any;

  if (!res.ok) {
    const errMsg = data?.error?.message || `Gemini API error ${res.status}`;
    logger.error("[Gemini API Error]", { status: res.status, error: data?.error });
    throw new Error(errMsg);
  }

  const text: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  // Strip any accidental ```json``` fences Gemini sometimes adds
  const clean = text
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/im, "")
    .trim();

  try {
    return JSON.parse(clean) as T;
  } catch (err: any) {
    logger.error("[Gemini JSON Parse Error]", { 
      error: err.message, 
      rawText: text.substring(0, 500) + "..." 
    });
    throw new Error(`Failed to parse AI response as JSON: ${err.message}`);
  }
}

// ── Platform helpers ───────────────────────────────────────────────────────────

function normalizePlatforms(rawPlatforms: unknown): AllowedPlatform[] {
  if (!Array.isArray(rawPlatforms)) {
    return ["linkedin", "instagram", "facebook"];
  }

  const normalized = rawPlatforms
    .map((value) => String(value).toLowerCase())
    .filter((value): value is AllowedPlatform =>
      (ALLOWED_PLATFORMS as readonly string[]).includes(value),
    );

  return normalized.length > 0
    ? Array.from(new Set(normalized))
    : ["linkedin", "instagram", "facebook"];
}

// ── Controllers ────────────────────────────────────────────────────────────────

export async function generateContent(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const { prompt } = req.body;

    const parsed = await geminiJSON<{ posts: any[] }>(
      prompt || "Write a professional post about AI marketing.",
      `You are a high-level social media copywriter. Generate a structured set of posts for LinkedIn, Instagram, and Facebook.
Return VALID JSON exactly in this format:
{
  "posts": [
    {
      "platform": "linkedin",
      "day": "Monday",
      "headline": "Hook/Headline",
      "points": ["point 1", "point 2"],
      "cta": "Call to action"
    }
  ]
}
Avoid any conversational text outside the JSON.`,
    );

    const generatedPosts = parsed.posts || [];

    const postsToInsert = generatedPosts.map((p: any) => ({
      userId: req.userId,
      platform: p.platform || "linkedin",
      day: p.day || "Monday",
      headline: p.headline || "New Post",
      points: p.points || [],
      cta: p.cta || "Click here",
      status: "draft",
    }));

    const insertedPosts = await GeneratedPost.insertMany(postsToInsert);

    res.status(201).json({
      success: true,
      data: insertedPosts,
      message: "Content generated successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function generateWeeklyContent(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const prompt =
      req.body.prompt || "Generate professional social media content for marketing";
      
    logger.info(`[Weekly Content] Starting generation for user ${req.userId} with prompt: ${prompt.substring(0, 50)}...`);

    const parsed = await geminiJSON<Record<string, any[]>>(
      `Generate a full week of social media content (7 days) for LinkedIn, Instagram, and Facebook. Create engaging marketing content for each day and platform.\n\n${prompt}`,
      `You are a social media strategist.
Return JSON with exactly this structure:
{
  "linkedin": [
    {"id": "temp1", "day": "Monday", "hook": "Hook text", "body": ["Point 1", "Point 2"], "cta": "CTA text", "hashtags": ["#tag1", "#tag2"]}
  ],
  "instagram": [ ... 7 days ],
  "facebook": [ ... 7 days ]
}
Generate exactly 7 posts per platform (Monday through Sunday).`,
    );

    const allPosts: any[] = [];
    const platforms = ["linkedin", "instagram", "facebook"];

    for (const platform of platforms) {
      const platformPosts: any[] = parsed[platform] || [];
      for (const post of platformPosts) {
        allPosts.push({
          userId: req.userId,
          platform,
          day: post.day || "Monday",
          headline: post.hook || post.headline || "New Post",
          points: post.body || post.points || [],
          cta: post.cta || "Learn more",
          status: "draft" as const,
        });
      }
    }

    if (allPosts.length === 0) {
      throw new Error("AI failed to generate any content for the week. Please try a more descriptive idea.");
    }

    const insertedPosts = await GeneratedPost.insertMany(allPosts);

    const groupedPosts: any = { linkedin: [], instagram: [], facebook: [] };
    for (const post of insertedPosts) {
      groupedPosts[post.platform].push({
        id: post._id,
        day: post.day,
        hook: post.headline,
        body: post.points,
        cta: post.cta,
        hashtags: [],
        createdAt: post.createdAt,
      });
    }

    res.status(201).json({
      success: true,
      data: groupedPosts,
      message: "Weekly content generated successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function generateSuggestedContent(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const prompt =
      typeof req.body.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt) throw new BadRequestError("prompt is required");

    const tone =
      typeof req.body.tone === "string" ? req.body.tone.trim() : "professional";
    const objective =
      typeof req.body.objective === "string" && req.body.objective.trim()
        ? req.body.objective.trim()
        : "increase engagement";
    const platforms = normalizePlatforms(req.body.platforms);

    const parsed = await geminiJSON<{ suggestions: any[] }>(
      `Create platform-specific social copy from this brief:\n\n${prompt}\n\nTone: ${tone}\nObjective: ${objective}\nTarget platforms: ${platforms.join(", ")}.`,
      `You are an expert social media strategist.
Return JSON with exactly this structure:
{
  "suggestions": [
    {
      "platform": "linkedin",
      "headline": "short hook",
      "points": ["point 1", "point 2", "point 3"],
      "cta": "direct call to action",
      "caption": "full ready-to-post caption",
      "hashtags": ["#tag1", "#tag2", "#tag3"]
    }
  ]
}
Rules:
- Return exactly one suggestion per requested platform.
- Keep captions concise and platform-appropriate.
- Use plain text only, no markdown.`,
    );

    const rawSuggestions = Array.isArray(parsed?.suggestions)
      ? parsed.suggestions
      : [];

    const suggestions = platforms.map((platform) => {
      const found = rawSuggestions.find(
        (entry: any) =>
          String(entry?.platform || "").toLowerCase() === platform,
      );

      const points = Array.isArray(found?.points)
        ? found.points.map((v: any) => String(v)).filter(Boolean).slice(0, 5)
        : [];
      const hashtags = Array.isArray(found?.hashtags)
        ? found.hashtags.map((v: any) => String(v)).filter(Boolean).slice(0, 8)
        : [];
      const headline =
        String(found?.headline || "").trim() || `New ${platform} post`;
      const cta =
        String(found?.cta || "").trim() ||
        "Tell us your thoughts in the comments.";

      return {
        platform,
        headline,
        points,
        cta,
        caption:
          String(found?.caption || "").trim() ||
          [headline, ...points, cta].filter(Boolean).join("\n\n"),
        hashtags,
      };
    });

    res.status(200).json({
      success: true,
      data: { suggestions },
      message: "Content suggestions generated successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function generateIdeaPost(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const prompt =
      typeof req.body.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt) throw new BadRequestError("prompt is required");

    const rawPlatform =
      typeof req.body.platform === "string"
        ? req.body.platform.toLowerCase()
        : "linkedin";
    if (!(ALLOWED_PLATFORMS as readonly string[]).includes(rawPlatform)) {
      throw new BadRequestError(
        `platform must be one of: ${ALLOWED_PLATFORMS.join(", ")}`,
      );
    }

    const day =
      typeof req.body.day === "string" && req.body.day.trim()
        ? req.body.day.trim()
        : "Monday";

    const parsed = await geminiJSON<{
      headline: string;
      points: string[];
      cta: string;
    }>(
      `Create one ${rawPlatform} social media post from this business idea:\n\n${prompt}\n\nTarget day: ${day}.`,
      `You are an expert social media copywriter.
Return JSON with exactly this structure:
{
  "headline": "Short hook",
  "points": ["point 1", "point 2", "point 3"],
  "cta": "A clear call to action"
}
Rules:
- Keep language natural and human.
- Make the copy specific to ${rawPlatform} and the business idea.
- Do not include markdown or extra fields.`,
    );

    const points = Array.isArray(parsed?.points)
      ? parsed.points.map((v: any) => String(v).trim()).filter(Boolean)
      : [];

    const createdPost = await GeneratedPost.create({
      userId: req.userId,
      platform: rawPlatform,
      day,
      headline: String(parsed?.headline || "New Post").trim() || "New Post",
      points: points.slice(0, 6),
      cta:
        String(
          parsed?.cta || "Tell us what you think in the comments.",
        ).trim() || "Tell us what you think in the comments.",
      status: "draft",
    });

    res.status(201).json({
      success: true,
      data: createdPost,
      message: "Idea post generated successfully",
    });
  } catch (error) {
    next(error);
  }
}
