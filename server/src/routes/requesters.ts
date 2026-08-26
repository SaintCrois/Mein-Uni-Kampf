import { Router } from "express";
import { getPrisma } from "../prisma.js";

const router = Router();

async function getActiveRequesters(_req: unknown, res: any) {
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
}

router.get("/", getActiveRequesters);
router.get("/active", getActiveRequesters);

export default router;
