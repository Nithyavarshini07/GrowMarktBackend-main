import { Request, Response, NextFunction } from "express";
import { logger } from "@/utils/logger";
import { AppError } from "@/utils/errors";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    logger.warn(`AppError [${err.statusCode}]: ${err.message}`);
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
      },
    });
    return;
  }

  // Log only safe, non-circular fields to prevent logger from crashing
  try {
    logger.error("Unhandled error:", { name: err.name, message: err.message });
  } catch {
    // ignore logger failures
  }

  res.status(500).json({
    success: false,
    error: {
      message: "An unexpected error occurred",
      statusCode: 500,
    },
  });
}
