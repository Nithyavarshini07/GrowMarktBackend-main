import OpenAI from "openai";
import { config } from "@/config";
import { logger } from "@/utils/logger";

const client = new OpenAI({ apiKey: config.openai.apiKey });

export interface ImageGenerationInput {
  headline: string;
  points: string[];
  cta?: string;
  platform: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
  headline: string;
  points: string[];
  cta: string;
}

/**
 * Generates a complete social media marketing image via DALL-E 3.
 * Returns a temporary URL valid for ~1 hour — save or display immediately.
 */
export async function generateMarketingImage(
  input: ImageGenerationInput,
): Promise<ImageGenerationResult> {
  const { headline, points, cta = "", platform } = input;

  if (!headline?.trim()) throw new Error("headline is required");
  if (!platform?.trim()) throw new Error("platform is required");

  const pointsList = (points ?? [])
    .slice(0, 5)
    .map((p) => `- ${p}`)
    .join("\n");

  const prompt =
    `Design a professional social media marketing image with this exact visual style:\n\n` +
    `VISUAL STYLE:\n` +
    `- Modern, editorial, high-end ${platform} post aesthetic\n` +
    `- Dark navy or deep teal background (#0a2540 or #0d3b4f), OR split layout: ` +
    `left side is a realistic lifestyle/workspace photo, right side is a clean dark card overlay\n` +
    `- Bold clean sans-serif typography, white and bright accent colors (cyan, yellow, or coral)\n` +
    `- Minimal decorative elements: thin lines, geometric shapes, subtle grid patterns\n` +
    `- Feels like a carousel post from a top ${platform} thought leader — NOT clipart, NOT generic\n\n` +
    `LAYOUT — choose the best fit for the content:\n` +
    `OPTION A (SPLIT): Left half = realistic office/laptop/workspace photo; ` +
    `Right half = dark overlay card with category tag, bold italic headline, bullet list, creator handle\n` +
    `OPTION B (DARK CARD): Dark navy gradient background, large decorative number or icon, ` +
    `headline, numbered bullet list with checkmark icons, CTA badge at bottom\n` +
    `OPTION C (INSIGHT): Deep teal background, UI screenshot or diagram illustration, ` +
    `bold insight quote in bottom text box\n\n` +
    `CONTENT TO INCLUDE:\n` +
    `Headline (large, bold, italic): "${headline.slice(0, 120)}"\n` +
    (pointsList
      ? `Key points (bullet list with icons):\n${pointsList}\n`
      : "") +
    `Call to action (highlighted badge or button): "${cta.slice(0, 80)}"\n\n` +
    `TYPOGRAPHY RULES:\n` +
    `- Headline: large bold serif or display font, italic for impact\n` +
    `- Body text: clean readable sans-serif with strong hierarchy\n` +
    `- NO lorem ipsum, NO watermarks, NO generic clipart, NO cartoon art\n\n` +
    `OUTPUT: 1024x1024 PNG designed to look like premium human-made content.`;

  logger.info(`[ImageGen] Generating HD marketing image for ${platform}…`);

  try {
    const response = await client.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      response_format: "url",
    });

    const imageUrl = (response.data ?? [])[0]?.url;
    if (!imageUrl) {
      throw new Error("OpenAI DALL-E did not return an image URL");
    }

    logger.info(`[ImageGen] HD image generated successfully for ${platform}`);

    return { imageUrl, headline, points: points ?? [], cta };
  } catch (err: unknown) {
    const e = err as { code?: string; status?: number; message?: string };
    if (e.code === "content_policy_violation") {
      throw new Error(
        "Image generation blocked by content policy. Try different content.",
      );
    }
    if (e.status === 401) {
      throw new Error("Invalid OpenAI API key. Check OPENAI_API_KEY in .env");
    }
    if (e.status === 429) {
      throw new Error("OpenAI rate limit hit. Wait a moment and try again.");
    }
    throw new Error("Image generation failed: " + (e.message ?? String(err)));
  }
}
