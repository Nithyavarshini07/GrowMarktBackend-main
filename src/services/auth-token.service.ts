import crypto from "crypto";
import jwt from "jsonwebtoken";
import { config } from "@/config";

function hashValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateAccessToken(payload: {
  userId: string;
  email: string;
  role: string;
}): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as string | number,
  } as jwt.SignOptions);
}

export function generateRefreshToken(): {
  raw: string;
  hash: string;
  expiresAt: Date;
} {
  const raw = crypto.randomBytes(48).toString("hex");
  const hash = hashValue(raw);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return { raw, hash, expiresAt };
}

export function hashToken(token: string): string {
  return hashValue(token);
}

export function generateResetToken(): {
  raw: string;
  hash: string;
  expiresAt: Date;
} {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = hashValue(raw);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  return { raw, hash, expiresAt };
}
