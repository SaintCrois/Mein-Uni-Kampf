import type { Request, Response, NextFunction } from "express";
import { getPrisma } from "../prisma.js";
import {
  requireAuth,
  AUTH_COOKIE_NAME,
} from "./auth.js";

export async function requireRequester(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const hasAuthToken =
    Boolean(req.cookies?.[AUTH_COOKIE_NAME]) ||
    Boolean(req.headers.authorization);

  if (hasAuthToken) {
    return requireAuth(req, res, () => {
      if (req.user?.mustChangePassword) {
        return res.status(403).json({
          error: "Password change required",
          code: "PASSWORD_CHANGE_REQUIRED",
        });
      }
      if (req.user?.role !== "REQUESTER") {
        return res.status(403).json({
          error: "Access denied",
        });
      }
      req.requesterId = req.user.id;
      return next();
    });
  }

  const rawRequesterId = req.header("X-Requester-Id");

  if (!rawRequesterId) {
    return res.status(401).json({
      error: "Requester context is required",
    });
  }

  const requesterId = Number(rawRequesterId);

  if (!Number.isInteger(requesterId)) {
    return res.status(401).json({
      error: "Invalid requester context",
    });
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: requesterId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
    },
  });

  if (user) {
    if (user.mustChangePassword) {
      return res.status(403).json({
        error: "Password change required",
        code: "PASSWORD_CHANGE_REQUIRED",
      });
    }
    req.user = user;
  }

  req.requesterId = requesterId;

  return next();
}
