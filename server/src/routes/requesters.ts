import { Router } from "express";
import { getPrisma } from "../prisma.js";

const router = Router();

async function getActiveRequesters(_req: unknown, res: any) {
  try {
    const prisma = getPrisma();

    const requesters = await prisma.user.findMany({
      where: {
        isActive: true,
        role: "REQUESTER",
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    res.status(200).json({
      data: requesters.map((r) => ({
        id: r.id,
        fullName: r.name,
        name: r.name,
        email: r.email,
        isActive: r.isActive,
      })),
    });
  } catch (_error) {
    res.status(500).json({
      error: "Failed to fetch development requesters",
    });
  }
}

router.get("/", getActiveRequesters);
router.get("/active", getActiveRequesters);

export default router;
