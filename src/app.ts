import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import path from "path";
import rateLimit from "express-rate-limit";
import session from "express-session";
import cookieParser from "cookie-parser";
import { config } from "@/config";
import routes from "@/routes";
import { errorHandler } from "@/middleware/error.middleware";
import { logger } from "@/utils/logger";

export function createApp(): express.Application {
  const app = express();
  app.set("trust proxy", 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: [
        config.cors.origin,
        "https://nonreductive-amiee-besotted.ngrok-free.dev",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "ngrok-skip-browser-warning",
      ],
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());

  app.use(
    session({
      secret: config.session.secret || "GrowMarket_default_secret_123",
      resave: false,
      saveUninitialized: false,
      name: "GrowMarket.sid",
      cookie: {
        secure: config.env === "production",
        sameSite: config.env === "production" ? "none" : "lax",
        maxAge: 3600000,
      },
    }),
  );

  const morganStream = {
    write: (message: string) => logger.http(message.trim()),
  };
  app.use(morgan("combined", { stream: morganStream }));

  app.use(
    rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: { message: "Too many requests", statusCode: 429 },
      },
    }),
  );

  app.use(`/api/${config.apiVersion}`, routes);

  // Serve uploaded design images publicly with cross-origin headers
  app.use(
    "/uploads",
    (_req, res, next) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      next();
    },
    express.static(path.resolve("uploads")),
  );

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: { message: "Route not found", statusCode: 404 },
    });
  });

  app.use(errorHandler);
  return app;
}
