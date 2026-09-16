import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getPrisma } from "../prisma.js";
import type { AuthenticatedUser } from "../types/express.js";

export const AUTH_COOKIE_NAME = "toktickit_session";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const jwtSecret: string = JWT_SECRET;

type AuthTokenPayload = {
  userId: number;
};

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token =
      req.cookies?.[AUTH_COOKIE_NAME] ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : undefined);

    if (!token) {
      return res.status(401).json({
        error: "Authentication required",
        code: "AUTH_REQUIRED",
        details: [],
      });
    }

    const payload = jwt.verify(token, jwtSecret) as unknown as AuthTokenPayload;

    if (typeof payload.userId !== "number") {
      return res.status(401).json({
        error: "Invalid authentication credentials",
        code: "INVALID_AUTH",
        details: [],
      });
    }

    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "Invalid authentication credentials",
        code: "INVALID_AUTH",
        details: [],
      });
    }

    req.user = user;

    return next();
  } catch (_error) {
    return res.status(401).json({
      error: "Invalid authentication credentials",
      code: "INVALID_AUTH",
      details: [],
    });
  }
}

export function requireRole(
  ...allowedRoles: AuthenticatedUser["role"][]
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        code: "AUTH_REQUIRED",
        details: [],
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied",
        code: "ACCESS_DENIED",
        details: [],
      });
    }

    return next();
  };
}

export function requirePasswordChangeComplete(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      code: "AUTH_REQUIRED",
      details: [],
    });
  }

  if (req.user.mustChangePassword) {
    return res.status(403).json({
      error: "Password change required",
      code: "PASSWORD_CHANGE_REQUIRED",
      details: [],
    });
  }

  return next();
}

