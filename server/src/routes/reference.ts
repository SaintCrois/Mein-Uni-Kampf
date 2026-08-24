import { Router } from "express";
import { getPrisma } from "../prisma.js";

const router = Router();

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
