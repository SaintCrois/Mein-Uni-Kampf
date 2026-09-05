import type { Request, Response, NextFunction } from "express";

export function requireRequester(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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

  req.requesterId = requesterId;

  next();
}
