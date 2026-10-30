import { Router } from "express";
import { getPrisma } from "../prisma.js";

const router = Router();

// Development requester selection was retired when authenticated identities
// replaced it in Lab 3. Keep this endpoint available only for the isolated
// Lab 2 compatibility tests; it must not expose requester identities at
// runtime.
router.use((_req, res, next) => {
  if (process.env.NODE_ENV !== "test") {
    return res.status(404).json({ error: "Not found" });
  }

  return next();
});

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
