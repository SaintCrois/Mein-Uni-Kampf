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

const statusNormalizationMap: Record<string, string> = {
  new: "New",
  open: "Open",
  in_progress: "In Progress",
  "in progress": "In Progress",
  waiting_for_requester: "Waiting for Requester",
  "waiting for requester": "Waiting for Requester",
  resolved: "Resolved",
  closed: "Closed",
  reopened: "Reopened",
  cancelled: "Cancelled",
};

const priorityNormalizationMap: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

router.get("/tickets", async (req, res) => {
  try {
    const prisma = getPrisma();

    const {
      search,
      status,
      categoryId,
      requestedPriority,
      itPriority,
      ownership = "all",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const rawPage = Number(req.query.page);
    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

    const rawPageSize = Number(req.query.pageSize);
    const pageSize =
      Number.isInteger(rawPageSize) && rawPageSize > 0
        ? Math.min(rawPageSize, 50)
        : 10;

    const where: any = {};

    if (typeof search === "string" && search.trim()) {
      const keyword = search.trim();
      where.OR = [
        {
          ticketNumber: {
            contains: keyword,
            mode: "insensitive",
          },
        },
        {
          summary: {
            contains: keyword,
            mode: "insensitive",
          },
        },
      ];
    }

    if (typeof status === "string" && status.trim()) {
      const rawStatuses = status
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      const normalizedStatuses = rawStatuses.map(
        (s) => statusNormalizationMap[s.toLowerCase()] || s,
      );

      where.currentStatus = {
        name: {
          in: normalizedStatuses,
          mode: "insensitive",
        },
      };
    }

    if (typeof categoryId === "string" && categoryId.trim()) {
      const id = Number(categoryId);
      if (Number.isInteger(id)) {
        where.categoryId = id;
      }
    } else if (typeof categoryId === "number" && Number.isInteger(categoryId)) {
      where.categoryId = categoryId;
    }

    if (
      typeof requestedPriority === "string" &&
      requestedPriority.trim()
    ) {
      const norm =
        priorityNormalizationMap[requestedPriority.trim().toLowerCase()] ||
        requestedPriority.trim();
      where.requestedPriority = {
        name: {
          equals: norm,
          mode: "insensitive",
        },
      };
    }

    if (typeof itPriority === "string" && itPriority.trim()) {
      const norm =
        priorityNormalizationMap[itPriority.trim().toLowerCase()] ||
        itPriority.trim();
      where.itPriority = {
        name: {
          equals: norm,
          mode: "insensitive",
        },
      };
    }

    if (ownership === "unassigned") {
      where.ownerId = null;
    } else if (ownership === "mine") {
      where.ownerId = req.user!.id;
    }

    const safeSortOrder = sortOrder === "asc" ? "asc" : "desc";

    let orderBy: any = { createdAt: safeSortOrder };
    if (sortBy === "ticketNumber") {
      orderBy = { ticketNumber: safeSortOrder };
    } else if (sortBy === "itPriority") {
      orderBy = { itPriority: { sortOrder: safeSortOrder } };
    } else if (sortBy === "status") {
      orderBy = { currentStatus: { name: safeSortOrder } };
    } else if (sortBy === "createdAt") {
      orderBy = { createdAt: safeSortOrder };
    }

    const [tickets, totalItems] = await Promise.all([
      prisma.ticket.findMany({
        where,
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
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),

      prisma.ticket.count({ where }),
    ]);

    return res.status(200).json({
      items: tickets,
      data: tickets,
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
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
