import { Router } from "express";
import bcrypt from "bcrypt";
import { Prisma, Role } from "@prisma/client";
import { getPrisma } from "../prisma.js";
import {
  requireAuth,
  requireRole,
  requirePasswordChangeComplete,
} from "../middleware/auth.js";

const router = Router();
const roles = new Set<Role>(["REQUESTER", "IT_STAFF", "ADMINISTRATOR"]);
const userSelect = { id: true, name: true, email: true, role: true, isActive: true, mustChangePassword: true, createdAt: true, updatedAt: true } as const;
const invalid = (res: any, error: string) => res.status(400).json({ error, code: "VALIDATION_ERROR", details: [] });
const duplicateEmail = (res: any) => res.status(409).json({ error: "Email already in use", code: "DUPLICATE_EMAIL", details: [] });
function normalizedEmail(value: unknown): string | null { if (typeof value !== "string") return null; const email = value.trim().toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null; }
function validName(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function validRole(value: unknown): value is Role { return typeof value === "string" && roles.has(value as Role); }
router.use(requireAuth);
router.use(requirePasswordChangeComplete);
router.use(requireRole("ADMINISTRATOR"));

router.get("/users", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const requestedRole = req.query.role;
  if (requestedRole !== undefined && !validRole(requestedRole)) return invalid(res, "Invalid role");
  try {
    const prisma = getPrisma();
    const users = await prisma.user.findMany({
      where: {
        ...(requestedRole ? { role: requestedRole } : {}),
        ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] } : {}),
      },
      select: userSelect,
      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json({
      data: users,
      total: users.length,
    });
  } catch (_error) {
    return res.status(500).json({
      error: "Failed to fetch users",
      code: "INTERNAL_SERVER_ERROR",
      details: [],
    });
  }
});

router.post("/users", async (req, res) => {
  const { name, email, role, initialPassword, isActive } = req.body ?? {};
  const normalized = normalizedEmail(email);
  if (!validName(name)) return invalid(res, "Name is required");
  if (!normalized) return invalid(res, "A valid email is required");
  if (!validRole(role)) return invalid(res, "Invalid role");
  if (typeof isActive !== "boolean") return invalid(res, "Activation state is required");
  if (typeof initialPassword !== "string" || initialPassword.length < 8) return invalid(res, "Initial password must be at least 8 characters");
  try {
    const prisma = getPrisma();
    const existing = await prisma.user.findFirst({ where: { email: { equals: normalized, mode: "insensitive" } }, select: { id: true } });
    if (existing) return duplicateEmail(res);
    const user = await prisma.user.create({ data: { name: name.trim(), email: normalized, role, isActive, passwordHash: await bcrypt.hash(initialPassword, 12), mustChangePassword: true }, select: userSelect });
    return res.status(201).json(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return duplicateEmail(res);
    return res.status(500).json({ error: "Failed to create user", code: "INTERNAL_SERVER_ERROR", details: [] });
  }
});

router.patch("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, role, isActive } = req.body ?? {};
  const normalized = normalizedEmail(email);
  if (!Number.isInteger(id) || id < 1) return invalid(res, "Invalid user ID");
  if (!validName(name)) return invalid(res, "Name is required");
  if (!normalized) return invalid(res, "A valid email is required");
  if (!validRole(role)) return invalid(res, "Invalid role");
  if (typeof isActive !== "boolean") return invalid(res, "Activation state is required");
  if (id === req.user!.id && !isActive) return invalid(res, "You cannot deactivate your own account");
  try {
    const prisma = getPrisma();
    const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, isActive: true } });
    if (!target) return res.status(404).json({ error: "User not found", code: "NOT_FOUND", details: [] });
    const removesActiveAdmin = target.role === "ADMINISTRATOR" && target.isActive && (role !== "ADMINISTRATOR" || !isActive);
    if (removesActiveAdmin && await prisma.user.count({ where: { role: "ADMINISTRATOR", isActive: true } }) <= 1) return invalid(res, "System must retain at least one active Administrator");
    const existing = await prisma.user.findFirst({ where: { email: { equals: normalized, mode: "insensitive" }, NOT: { id } }, select: { id: true } });
    if (existing) return duplicateEmail(res);
    const user = await prisma.user.update({ where: { id }, data: { name: name.trim(), email: normalized, role, isActive }, select: userSelect });
    return res.status(200).json(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return duplicateEmail(res);
    return res.status(500).json({ error: "Failed to update user", code: "INTERNAL_SERVER_ERROR", details: [] });
  }
});

router.post("/users/:id/reset-password", async (req, res) => {
  const id = Number(req.params.id);
  const { initialPassword } = req.body ?? {};
  if (!Number.isInteger(id) || id < 1) return invalid(res, "Invalid user ID");
  if (typeof initialPassword !== "string" || initialPassword.length < 8) return invalid(res, "Initial password must be at least 8 characters");
  try {
    const prisma = getPrisma();
    if (!await prisma.user.findUnique({ where: { id }, select: { id: true } })) return res.status(404).json({ error: "User not found", code: "NOT_FOUND", details: [] });
    await prisma.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(initialPassword, 12), mustChangePassword: true } });
    return res.status(200).json({ message: "Initial password set. User must change password at next login." });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to reset password", code: "INTERNAL_SERVER_ERROR", details: [] });
  }
});

export default router;

