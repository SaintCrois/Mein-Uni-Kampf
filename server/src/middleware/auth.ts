import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getPrisma } from "../prisma.js";

export const AUTH_COOKIE_NAME = "toktickit_session";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const jwtSecret: string = JWT_SECRET;


type AuthenticatedUser = {
  id: number;
  email: string;
  name: string;
  role: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";
  isActive: boolean;
  mustChangePassword: boolean;
};

type AuthTokenPayload = {
  userId: number;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

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
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied",
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
    });
  }

  if (req.user.mustChangePassword) {
    return res.status(403).json({
      error: "Password change required",
      code: "PASSWORD_CHANGE_REQUIRED",
    });
  }

  return next();
}

