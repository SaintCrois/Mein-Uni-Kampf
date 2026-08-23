import { Router } from "express";
import { getPrisma } from "../prisma.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const prisma = getPrisma();

    const requesters = await prisma.devRequester.findMany({
      where: { isActive: true },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
      },
    });

    res.status(200).json({ data: requesters });
  } catch (_error) {
    res.status(500).json({
      error: "Failed to fetch development requesters",
    });
  }
});

export default router;