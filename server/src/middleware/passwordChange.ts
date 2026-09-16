import type { Request, Response, NextFunction } from "express";

export function requirePasswordChangeComplete(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      code: "AUTHENTICATION_REQUIRED",
      details: [],
    });
  }

  if (req.user.mustChangePassword) {
    return res.status(403).json({
      error: "Password change required before accessing this resource.",
      code: "PASSWORD_CHANGE_REQUIRED",
      details: [],
    });
  }

  return next();
}
