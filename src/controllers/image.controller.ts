import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middleware/auth.middleware";
import { GeneratedPost } from "@/models/generated-post.model";
import {
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} from "@/utils/errors";
import { config } from "@/config";
import { generateImageWithFallback } from "@/services/ai-image-orchestrator.service";
import { logger } from "@/utils/logger";
import path from "path";
import fs from "fs";

export async function uploadCustomDesign(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const { base64Image } = req.body;
    if (
      typeof base64Image !== "string" ||
      !base64Image.startsWith("data:image/")
    ) {
      throw new BadRequestError("base64Image must be a valid data URL image");
    }

    const formatMatch = base64Image.match(
      /^data:image\/(png|jpeg|jpg|webp);base64,/i,
    );
    if (!formatMatch) {
      throw new BadRequestError(
        "Only png, jpeg, jpg, and webp images are supported",
      );
    }

    const extension =
      formatMatch[1].toLowerCase() === "jpeg"
        ? "jpg"
        : formatMatch[1].toLowerCase();
    const rawBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const uploadsDir = path.resolve(config.uploads.dir);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `custom-${req.userId}-${Date.now()}.${extension}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(rawBase64, "base64"));

    const imageUrl = `${config.uploads.baseUrl}/uploads/designs/${fileName}`;

    res.status(201).json({
      success: true,
      data: { imageUrl },
      message: "Custom design uploaded successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function generateImage(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const { postId } = req.body;
    const post = await GeneratedPost.findOne({
      _id: postId,
      userId: req.userId,
    });
    if (!post) throw new NotFoundError("Post not found");

    // Build prompt for image generation
    const shortPrompt = `Professional social media infographic for ${post.platform} with headline "${post.headline}".
${post.points.length > 0 ? `Key points: ${post.points.slice(0, 3).join(", ")}.` : ""}
Clean typography, minimal layout, professional color scheme, perfect for social media marketing.
High quality, 1080x1080 square format.`;

    logger.info(
      "[Image Controller] Generating image with AI fallback (Gemini → OpenAI)...",
    );

    // Use orchestrator with Gemini → OpenAI fallback
    const { imageBase64, provider } = await generateImageWithFallback(
      shortPrompt,
      {
        headline: post.headline,
        points: post.points,
        cta: post.cta,
        platform: post.platform,
      },
    );

    const imageBuffer = Buffer.from(imageBase64, "base64");

    // Save the binary straight to the disk
    const uploadsDir = path.resolve(config.uploads.dir);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `generated-${postId}-${Date.now()}.png`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, imageBuffer);

    const localImageUrl = `${config.uploads.baseUrl}/uploads/designs/${fileName}`;

    post.generatedImageUrl = localImageUrl;
    post.aiProvider = provider; // Track which provider succeeded
    await post.save();

    res.status(200).json({
      success: true,
      data: post,
      message: `Image generated successfully via ${provider} AI`,
      provider, // Include provider in response
    });
  } catch (error) {
    next(error);
  }
}

export async function saveImage(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.userId) throw new UnauthorizedError();

    const { postId, base64Image } = req.body;
    const post = await GeneratedPost.findOne({
      _id: postId,
      userId: req.userId,
    });
    if (!post) throw new NotFoundError("Post not found");

    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const uploadsDir = path.resolve(config.uploads.dir);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `${postId}-${Date.now()}.png`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

    const savedImageUrl = `${config.uploads.baseUrl}/uploads/designs/${fileName}`;
    post.editedImageUrl = savedImageUrl;
    await post.save();

    res.status(200).json({
      success: true,
      data: post,
      message: "Image saved successfully",
    });
  } catch (error) {
    next(error);
  }
}
