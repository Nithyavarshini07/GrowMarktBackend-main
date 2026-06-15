import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import { ForbiddenError, UnauthorizedError } from "@/utils/errors";

export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
}

interface JwtPayload {
  userId: string;
  email: string;
  role?: string;
  iat: number;
  exp: number;
}

export function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization;
    // Allow token via query param for browser redirect flows (e.g. OAuth initiation)
    const queryToken =
      typeof req.query?.token === "string" ? req.query.token : null;

    if (!authHeader?.startsWith("Bearer ") && !queryToken) {
      if (process.env.NODE_ENV !== "production") {
        // [DEV MODE ONLY]: Auto-bypass missing tokens using test user ID 
        // to specifically allow easy browser URL bar testing.
        req.userId = "69eb17ef47f53c6ffd8e90c7"; 
        req.role = "owner";
        return next();
      }
      throw new UnauthorizedError("Missing or invalid authorization header");
    }

    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : queryToken!;

    if (!token) {
      if (process.env.NODE_ENV !== "production") {
        req.userId = "69eb17ef47f53c6ffd8e90c7"; 
        req.role = "owner";
        return next();
      }
      throw new UnauthorizedError("Token not provided");
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError("Invalid token"));
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError("Token expired"));
      return;
    }
    next(error);
  }
}

export const protect = authenticate;

export function requireRole(...allowedRoles: string[]) {
  const normalized = allowedRoles.map((role) => role.toLowerCase());

  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.userId) {
      next(new UnauthorizedError());
      return;
    }

    const role = String(req.role || "").toLowerCase();
    if (!role || !normalized.includes(role)) {
      next(new ForbiddenError("Insufficient role permissions"));
      return;
    }

    next();
  };
}
