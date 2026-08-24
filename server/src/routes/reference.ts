import { Router } from "express";
import { getPrisma } from "../prisma.js";

const router = Router();
router.get("/priorities", async (_req, res) => {
  try {
    const prisma = getPrisma();

    const priorities = await prisma.priority.findMany({
      where: {
        name: {
          in: ["Low", "Medium", "High", "Urgent"],
        },
      },
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
      },
    });

    return res.status(200).json(priorities);
  } catch (_error) {
    return res.status(500).json({
      error: "Failed to fetch priorities",
    });
  }
});
router.get("/related-systems", async (_req, res) => {
  try {
    const prisma = getPrisma();

    const systems = await prisma.relatedSystem.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
      },
    });

    return res.status(200).json(systems);
  } catch (_error) {
    return res.status(500).json({
      error: "Failed to fetch related systems",
    });
  }
});

export default router;
