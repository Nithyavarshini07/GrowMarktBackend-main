import axios from "axios";
import { GeminiService } from "./gemini.service";
import {
  generateMarketingImage,
  ImageGenerationInput,
} from "./imageGeneration.service";
import { logger } from "@/utils/logger";

export interface ImageResult {
  imageBase64: string;
  provider: "Gemini" | "OpenAI";
}

/**
 * Orchestrates AI image generation with automatic fallback.
 * Try Gemini (Imagen) first → If fails, fallback to OpenAI (DALL-E 3).
 *
 * @param prompt - Text prompt for image generation
 * @param input - Structured input for OpenAI (headline, points, platform)
 * @returns Image as base64 string with provider info
 */
export async function generateImageWithFallback(
  prompt: string,
  input: ImageGenerationInput,
): Promise<ImageResult> {
  // Provider 1: Try Gemini (Imagen 3.0)
  try {
    logger.info("[ImageOrchestrator] Attempting Gemini (Imagen 3.0)...");
    const imageBase64 = await GeminiService.generateImage(prompt);
    logger.info("[ImageOrchestrator] ✓ Gemini succeeded");
    return { imageBase64, provider: "Gemini" };
  } catch (geminiError: any) {
    logger.warn(`[ImageOrchestrator] ✗ Gemini failed: ${geminiError.message}`);
  }

  // Provider 2: Fallback to OpenAI (DALL-E 3)
  try {
    logger.info("[ImageOrchestrator] Attempting OpenAI (DALL-E 3)...");
    const result = await generateMarketingImage(input);

    // Download image from URL and convert to base64
    logger.info("[ImageOrchestrator] Downloading OpenAI image...");
    const response = await axios.get(result.imageUrl, {
      responseType: "arraybuffer",
      timeout: 30000, // 30 second timeout for download
    });
    const imageBase64 = Buffer.from(response.data).toString("base64");

    logger.info("[ImageOrchestrator] ✓ OpenAI succeeded");
    return { imageBase64, provider: "OpenAI" };
  } catch (openaiError: any) {
    logger.error(`[ImageOrchestrator] ✗ OpenAI failed: ${openaiError.message}`);
  }

  // Both providers failed
  throw new Error(
    "All AI image providers failed. Please check API keys (GEMINI_API_KEY, OPENAI_API_KEY) and try again.",
  );
}
