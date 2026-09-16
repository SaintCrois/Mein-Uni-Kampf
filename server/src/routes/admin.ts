import { Router } from "express";
import { getPrisma } from "../prisma.js";
import {
  requireAuth,
  requireRole,
  requirePasswordChangeComplete,
} from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);
router.use(requirePasswordChangeComplete);
router.use(requireRole("ADMINISTRATOR"));

router.get("/users", async (_req, res) => {
  try {
    const prisma = getPrisma();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
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

export default router;

