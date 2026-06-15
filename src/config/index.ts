import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

function loadDotEnv(): void {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env"),
    path.resolve(__dirname, "..", "..", ".env"),
  ];

  const envPath = candidates.find((p) => fs.existsSync(p));
  if (envPath) {
    dotenv.config({ path: envPath });
    return;
  }

  dotenv.config();
}

loadDotEnv();

function requireEnv(key: string): string {
  const rawValue = process.env[key];
  const value = rawValue?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key]?.trim() || fallback;
}

export const config = {
  env: optionalEnv("NODE_ENV", "development"),
  port: parseInt(optionalEnv("PORT", "3000"), 10),
  apiVersion: optionalEnv("API_VERSION", "v1"),
    mongodb: {
    uri: (() => {
      console.log("MONGODB_URI =", process.env.MONGODB_URI);
      return requireEnv("MONGODB_URI");
    })(),
  },

  jwt: {
    secret: requireEnv("JWT_SECRET"),
    expiresIn: optionalEnv("JWT_EXPIRES_IN", "7d"),
  },
  session: {
    secret: optionalEnv("SESSION_SECRET", "change-this-session-secret"),
  },
  claude: {
    apiKey: optionalEnv("ANTHROPIC_API_KEY", ""),
    model: optionalEnv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514"),
    maxTokens: parseInt(optionalEnv("ANTHROPIC_MAX_TOKENS", "4096"), 10),
  },
  gemini: {
    apiKey: optionalEnv("GEMINI_API_KEY", ""),
  },
  openai: {
    apiKey: optionalEnv("OPENAI_API_KEY", ""),
  },
  freepik: {
    apiKey: optionalEnv("FREEPIK_API_KEY", ""),
  },
  uploads: {
    baseUrl: optionalEnv("UPLOADS_BASE_URL", "http://localhost:3000"),
    dir: optionalEnv("UPLOADS_DIR", "./uploads/designs"),
  },
  unsplash: { accessKey: optionalEnv("UNSPLASH_ACCESS_KEY", "") },
  pexels: { apiKey: optionalEnv("PEXELS_API_KEY", "") },
  encryption: { key: requireEnv("ENCRYPTION_KEY") },
  linkedin: {
    clientId: optionalEnv("LINKEDIN_CLIENT_ID", ""),
    clientSecret: optionalEnv("LINKEDIN_CLIENT_SECRET", ""),
    redirectUri: optionalEnv(
      "LINKEDIN_REDIRECT_URI",
      "http://localhost:3000/api/v1/social-auth/linkedin/callback",
    ),
  },
  meta: {
    appId: optionalEnv("META_APP_ID", ""),
    appSecret: optionalEnv("META_APP_SECRET", ""),
    redirectUri: optionalEnv(
      "META_REDIRECT_URI",
      "http://localhost:3000/api/v1/social-auth/meta/callback",
    ),
  },
  twitter: {
    clientId: optionalEnv("TWITTER_CLIENT_ID", ""),
    clientSecret: optionalEnv("TWITTER_CLIENT_SECRET", ""),
    redirectUri: optionalEnv(
      "TWITTER_REDIRECT_URI",
      "http://localhost:3000/api/v1/social-auth/twitter/callback",
    ),
  },
  facebook: {
    appId: optionalEnv("FACEBOOK_APP_ID", ""),
    appSecret: optionalEnv("FACEBOOK_APP_SECRET", ""),
    callbackUrl: optionalEnv(
      "FACEBOOK_CALLBACK_URL",
      "http://localhost:3000/api/v1/auth/facebook/callback",
    ),
    instagramCallbackUrl: optionalEnv(
      "INSTAGRAM_CALLBACK_URL",
      "http://localhost:3000/api/v1/auth/instagram/callback",
    ),
  },
  logging: {
    level: optionalEnv("LOG_LEVEL", "info"),
    filePath: optionalEnv("LOG_FILE_PATH", "./logs"),
  },
  rateLimit: {
    windowMs: parseInt(optionalEnv("RATE_LIMIT_WINDOW_MS", "900000"), 10),
    maxRequests: parseInt(optionalEnv("RATE_LIMIT_MAX_REQUESTS", "100"), 10),
  },
  cors: { origin: optionalEnv("CORS_ORIGIN", "http://localhost:3001") },
} as const;
