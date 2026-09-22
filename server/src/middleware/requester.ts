import type { Request, Response, NextFunction } from "express";
import { requireAuth, requireRole, requirePasswordChangeComplete } from "./auth.js";
import { getPrisma } from "../prisma.js";

export async function requireRequester(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Lab 2's request-selector contract is retained only for the legacy test
  // harness. Runtime clients must present a verified session.
  if (process.env.NODE_ENV === "test" && !req.cookies?.toktickit_session && !req.headers.authorization) {
    const requesterId = Number(req.header("X-Requester-Id"));
    if (!Number.isInteger(requesterId)) return res.status(401).json({ error: "Requester context is required" });
    const user = await getPrisma().user.findUnique({ where: { id: requesterId }, select: { id: true, email: true, name: true, role: true, isActive: true, mustChangePassword: true } });
    if (!user) return res.status(401).json({ error: "Requester context is required" });
    req.user = user;
    req.requesterId = user.id;
    req.isLegacyRequester = true;
    return next();
  }
  return requireAuth(req, res, () =>
    requirePasswordChangeComplete(req, res, () =>
      requireRole("REQUESTER")(req, res, () => {
        req.requesterId = req.user!.id;
        return next();
      }),
    ),
  );
}

/**
 * Temporary bridge for Lab 2 routes while their tests are migrated from the
 * development requester selector to Issue 14 sessions. It is unavailable in
 * every runtime environment.
 */
export async function requireAuthenticatedOrLegacyRequester(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (process.env.NODE_ENV === "test" && !req.cookies?.toktickit_session && !req.headers.authorization) {
    const requesterId = Number(req.header("X-Requester-Id"));
    if (!Number.isInteger(requesterId)) return res.status(401).json({ error: "Requester context is required" });
    const user = await getPrisma().user.findUnique({ where: { id: requesterId }, select: { id: true, email: true, name: true, role: true, isActive: true, mustChangePassword: true } });
    if (!user) return res.status(401).json({ error: "Requester context is required" });
    req.user = user;
    req.requesterId = user.id;
    req.isLegacyRequester = true;
    return next();
  }
  return requireAuth(req, res, () => requirePasswordChangeComplete(req, res, next));
}

export function requireAuthUnlessLegacyTest(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === "test" && !req.cookies?.toktickit_session && !req.headers.authorization) return next();
  return requireAuth(req, res, () => requirePasswordChangeComplete(req, res, next));
}
