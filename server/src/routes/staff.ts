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
router.use(requireRole("IT_STAFF", "ADMINISTRATOR"));

router.get("/tickets", async (_req, res) => {
  try {
    const prisma = getPrisma();
    const tickets = await prisma.ticket.findMany({
      include: {
        category: true,
        requestedPriority: true,
        itPriority: true,
        currentStatus: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      data: tickets,
      total: tickets.length,
    });
  } catch (_error) {
    return res.status(500).json({
      error: "Failed to fetch staff ticket queue",
      code: "INTERNAL_SERVER_ERROR",
      details: [],
    });
  }
});

export default router;

