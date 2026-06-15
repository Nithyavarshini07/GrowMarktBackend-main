import { config } from "@/config";
import { logger } from "@/utils/logger";
import { generateImageWithFallback } from "@/services/ai-image-orchestrator.service";

export type ImageStyle = "modern" | "minimal" | "3d" | "marketing";
export type CaptionTone = "professional" | "viral" | "storytelling";

type GeminiJsonResult<T> = {
  value: T;
  source: "gemini" | "fallback";
};

function stripCodeFence(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

async function runGeminiJson<T>(
  systemPrompt: string,
  userPrompt: string,
  fallback: T,
): Promise<GeminiJsonResult<T>> {
  if (!config.gemini.apiKey) {
    logger.warn("[AIPipeline] GEMINI_API_KEY missing, using fallback output");
    return { value: fallback, source: "fallback" };
  }

  try {
    const body = {
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\n${userPrompt}\n\nRespond with valid JSON only.`,
            },
          ],
        },
      ],
    };

    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    const response = await fetch(`${endpoint}?key=${config.gemini.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as any;
    if (!response.ok) {
      const errMessage =
        data?.error?.message || `Gemini error ${response.status}`;
      throw new Error(errMessage);
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      JSON.stringify(fallback);

    const parsed = JSON.parse(stripCodeFence(text)) as T;
    return { value: parsed, source: "gemini" };
  } catch (error: any) {
    logger.warn("[AIPipeline] Gemini JSON failed, fallback output used", {
      message: error?.message || String(error),
    });
    return { value: fallback, source: "fallback" };
  }
}

function normalizeHashtags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((item) => String(item).trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag.replace(/\s+/g, "")}`))
    .slice(0, 15);
}

export async function analyzeIdea(idea: string): Promise<{
  targetAudience: string;
  contentAngles: string[];
  hooks: string[];
  hashtags: string[];
}> {
  const fallback = {
    targetAudience: "Founders and marketing teams building B2B products",
    contentAngles: [
      "Behind-the-scenes execution",
      "Real metrics and lessons learned",
      "Actionable playbook breakdown",
    ],
    hooks: [
      "What changed after we shared our process in public",
      "The strategy that improved traction in 30 days",
      "Mistakes we made so you do not repeat them",
    ],
    hashtags: ["#buildinpublic", "#saas", "#marketing", "#founders"],
  };

  const result = await runGeminiJson(
    "You are a senior social strategist.",
    `Analyze this business idea for social content planning: ${idea}

Return JSON:
{
  "targetAudience": "",
  "contentAngles": [""],
  "hooks": [""],
  "hashtags": ["#tag"]
}`,
    fallback,
  );

  return {
    targetAudience: String(
      result.value.targetAudience || fallback.targetAudience,
    ),
    contentAngles: Array.isArray(result.value.contentAngles)
      ? result.value.contentAngles
          .map((v) => String(v))
          .filter(Boolean)
          .slice(0, 8)
      : fallback.contentAngles,
    hooks: Array.isArray(result.value.hooks)
      ? result.value.hooks
          .map((v) => String(v))
          .filter(Boolean)
          .slice(0, 8)
      : fallback.hooks,
    hashtags: normalizeHashtags(
      result.value.hashtags?.length ? result.value.hashtags : fallback.hashtags,
    ),
  };
}

function buildImageStylePrompt(style: ImageStyle): string {
  switch (style) {
    case "minimal":
      return "minimal layout, clean typography, high whitespace, subtle gradients";
    case "3d":
      return "3d lighting, depth, smooth shadows, polished modern render style";
    case "marketing":
      return "marketing creative, campaign-focused composition, strong CTA visual hierarchy";
    case "modern":
    default:
      return "modern editorial style, premium visual quality, bold and clean design";
  }
}

function buildSvgPlaceholderBase64(text: string): string {
  const safe = text.replace(/[<>&]/g, " ").slice(0, 80);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a2540"/>
      <stop offset="100%" stop-color="#0d3b4f"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect x="96" y="128" width="832" height="768" rx="28" fill="#ffffff" fill-opacity="0.08"/>
  <text x="128" y="240" fill="#e5f3ff" font-size="40" font-family="Arial, sans-serif" font-weight="700">AI Creative Placeholder</text>
  <text x="128" y="320" fill="#d7e9ff" font-size="28" font-family="Arial, sans-serif">${safe}</text>
</svg>`;

  return Buffer.from(svg, "utf8").toString("base64");
}

export async function generateImage(input: {
  idea: string;
  style: ImageStyle;
  analysis?: {
    hooks?: string[];
    contentAngles?: string[];
  };
}): Promise<{
  imageBase64: string;
  provider: "Gemini" | "OpenAI";
  prompt: string;
  mimeType: "image/png" | "image/svg+xml";
}> {
  const hook = input.analysis?.hooks?.[0] || input.idea;
  const points = (input.analysis?.contentAngles || []).slice(0, 3);

  const prompt = [
    `Create a social media creative based on: ${input.idea}`,
    `Primary hook: ${hook}`,
    `Visual direction: ${buildImageStylePrompt(input.style)}`,
    "Square composition, 1024x1024, no watermark, no random text blocks.",
  ].join("\n");

  try {
    const result = await generateImageWithFallback(prompt, {
      headline: hook.slice(0, 120),
      points,
      cta: "Learn more",
      platform: "instagram",
    });

    return {
      imageBase64: result.imageBase64,
      provider: result.provider,
      prompt,
      mimeType: "image/png",
    };
  } catch (error: any) {
    logger.warn("[AIPipeline] Image generation fallback placeholder used", {
      message: error?.message || String(error),
    });
    return {
      imageBase64: buildSvgPlaceholderBase64(hook),
      provider: "OpenAI",
      prompt,
      mimeType: "image/svg+xml",
    };
  }
}

export async function editImage(input: {
  idea: string;
  sourceUrl: string;
  editPrompt: string;
}): Promise<{
  imageBase64: string;
  provider: "Gemini" | "OpenAI";
  prompt: string;
  mimeType: "image/png" | "image/svg+xml";
}> {
  const mergedPrompt = [
    `Use this existing creative as reference: ${input.sourceUrl}`,
    `Original idea: ${input.idea}`,
    `Apply edit request: ${input.editPrompt}`,
    "Keep layout social-friendly and visually consistent.",
  ].join("\n");

  try {
    const result = await generateImageWithFallback(mergedPrompt, {
      headline: input.idea.slice(0, 120),
      points: [input.editPrompt],
      cta: "Learn more",
      platform: "instagram",
    });

    return {
      imageBase64: result.imageBase64,
      provider: result.provider,
      prompt: mergedPrompt,
      mimeType: "image/png",
    };
  } catch (error: any) {
    logger.warn("[AIPipeline] Edit-image fallback placeholder used", {
      message: error?.message || String(error),
    });
    return {
      imageBase64: buildSvgPlaceholderBase64(input.editPrompt),
      provider: "OpenAI",
      prompt: mergedPrompt,
      mimeType: "image/svg+xml",
    };
  }
}

function fallbackCaption(
  idea: string,
  tone: CaptionTone,
): {
  caption: string;
  hashtags: string[];
} {
  const base =
    tone === "viral"
      ? `Nobody talks about this enough: ${idea}. Here is the exact framework we use and what changed after applying it.`
      : tone === "storytelling"
        ? `A year ago we were stuck. Then we focused on one thing: ${idea}. This is the story of what we changed and what actually worked.`
        : `Practical insight for teams building in public: ${idea}. Here is a concise breakdown you can implement today.`;

  return {
    caption: base,
    hashtags: ["#marketing", "#growth", "#buildinpublic", "#saas"],
  };
}

function captionVariants(
  base: string,
  tone: CaptionTone,
  count: number,
): string[] {
  const trimmed = base.trim();
  const variants = [
    trimmed,
    tone === "viral"
      ? `${trimmed} Save this if you want the exact framework.`
      : `${trimmed} What would you test first?`,
    tone === "storytelling"
      ? `${trimmed} The turning point was focusing on execution over noise.`
      : `${trimmed} Here are the practical steps we used this week.`,
    `${trimmed} Comment your take and I will share the template.`,
  ]
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(variants)).slice(0, Math.max(1, count));
}

export async function generateCaptionOptions(input: {
  idea: string;
  tone: CaptionTone;
  analysis?: {
    targetAudience?: string;
    hooks?: string[];
    hashtags?: string[];
  };
  count?: number;
}): Promise<{ captions: string[]; hashtags: string[] }> {
  const requestedCount = Math.min(5, Math.max(1, Number(input.count || 3)));
  const fallback = fallbackCaption(input.idea, input.tone);
  const fallbackCaptions = captionVariants(
    fallback.caption,
    input.tone,
    requestedCount,
  );

  const result = await runGeminiJson(
    "You are a senior social copywriter.",
    `Generate ${requestedCount} distinct ${input.tone} captions for this idea: ${input.idea}
Audience: ${input.analysis?.targetAudience || "general professional audience"}
Preferred hooks: ${(input.analysis?.hooks || []).join(" | ")}

Return JSON:
{
  "captions": [""],
  "hashtags": ["#tag"]
}`,
    {
      captions: fallbackCaptions,
      hashtags: fallback.hashtags,
    },
  );

  const rawOptions = Array.isArray(result.value.captions)
    ? result.value.captions
    : typeof (result.value as any).caption === "string"
      ? [(result.value as any).caption]
      : fallbackCaptions;

  const captions = Array.from(
    new Set(rawOptions.map((item) => String(item).trim()).filter(Boolean)),
  ).slice(0, requestedCount);

  const safeCaptions = captions.length
    ? captions
    : captionVariants(fallback.caption, input.tone, requestedCount);

  const hashtags = normalizeHashtags(
    result.value.hashtags?.length
      ? result.value.hashtags
      : input.analysis?.hashtags?.length
        ? input.analysis.hashtags
        : fallback.hashtags,
  );

  return {
    captions: safeCaptions,
    hashtags,
  };
}

export async function generateCaption(input: {
  idea: string;
  tone: CaptionTone;
  analysis?: {
    targetAudience?: string;
    hooks?: string[];
    hashtags?: string[];
  };
}): Promise<{ caption: string; hashtags: string[] }> {
  const generated = await generateCaptionOptions({
    ...input,
    count: 1,
  });

  return {
    caption: generated.captions[0] || "",
    hashtags: generated.hashtags,
  };
}

export async function captionFromImage(input: {
  imageUrl: string;
  platform: string;
}): Promise<{ caption: string; hashtags: string[] }> {
  const fallback = {
    caption: `Visual update for ${input.platform}: a concise story, a clear lesson, and one practical next step.`,
    hashtags: ["#content", "#branding", "#socialmedia", `#${input.platform}`],
  };

  const result = await runGeminiJson(
    "You are a social media caption generator.",
    `Generate caption ideas for this image URL: ${input.imageUrl}
Platform: ${input.platform}

Return JSON:
{
  "caption": "",
  "hashtags": ["#tag"]
}`,
    fallback,
  );

  return {
    caption: String(result.value.caption || fallback.caption).trim(),
    hashtags: normalizeHashtags(
      result.value.hashtags?.length ? result.value.hashtags : fallback.hashtags,
    ),
  };
}

export function predictEngagement(input: {
  caption: string;
  hashtags: string[];
  platforms: string[];
}): number {
  const captionLength = input.caption.trim().length;
  const hashtagScore = Math.min(20, input.hashtags.length * 2.5);
  const platformScore = Math.min(20, input.platforms.length * 6);
  const lengthScore = Math.max(10, Math.min(40, captionLength / 6));
  const raw = lengthScore + hashtagScore + platformScore;
  return Number(Math.min(95, Math.max(15, raw)).toFixed(2));
}
