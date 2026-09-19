import { Router, type Request, type Response } from "express";
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

const ticketIncludeDetails = {
  category: true,
  relatedSystem: true,
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
      role: true,
    },
  },
  attachments: {
    orderBy: {
      uploadedAt: "asc" as const,
    },
  },
};

const allowedTransitions: Record<string, string[]> = {
  New: ["Open", "Cancelled"],
  Open: ["In Progress", "Waiting for Requester", "Resolved", "Cancelled"],
  "In Progress": ["Open", "Waiting for Requester", "Resolved", "Cancelled"],
  "Waiting for Requester": ["In Progress", "Open", "Resolved", "Cancelled"],
  Resolved: ["Closed", "Reopened", "Cancelled"],
  Reopened: ["In Progress", "Open", "Resolved", "Cancelled"],
  Closed: [],
  Cancelled: [],
};

// ---------------------------------------------------------------------------
// 1. GET /api/staff/tickets (Staff Queue)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// 2. GET /api/staff/assignees (List active IT Staff / Admins for assignment)
// ---------------------------------------------------------------------------
router.get("/assignees", async (_req, res) => {
  try {
    const prisma = getPrisma();
    const assignees = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          in: ["IT_STAFF", "ADMINISTRATOR"],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      data: assignees,
    });
  } catch (_error) {
    return res.status(500).json({
      error: "Failed to fetch assignees",
      code: "INTERNAL_SERVER_ERROR",
      details: [],
    });
  }
});

// ---------------------------------------------------------------------------
// 3. GET /api/staff/tickets/:id (Staff Ticket Detail)
// ---------------------------------------------------------------------------
async function handleGetStaffTicket(req: Request, res: Response) {
  try {
    const ticketId = Number(req.params.id);
    if (!Number.isInteger(ticketId)) {
      return res.status(404).json({
        error: "Ticket not found",
      });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: ticketIncludeDetails,
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
      });
    }

    return res.status(200).json(ticket);
  } catch (_error) {
    return res.status(500).json({
      error: "Failed to fetch ticket detail",
      code: "INTERNAL_SERVER_ERROR",
      details: [],
    });
  }
}
router.get("/tickets/:id", handleGetStaffTicket);
router.get("/:id", handleGetStaffTicket);

// ---------------------------------------------------------------------------
// 4. PATCH /api/staff/tickets/:id/claim (Claim Ticket)
// ---------------------------------------------------------------------------
async function handleClaimTicket(req: Request, res: Response) {
  try {
    const ticketId = Number(req.params.id);
    if (!Number.isInteger(ticketId)) {
      return res.status(400).json({
        error: "Invalid ticket ID",
        code: "INVALID_INPUT",
        details: [],
      });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        currentStatus: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
        code: "NOT_FOUND",
        details: [],
      });
    }

    if (ticket.ownerId !== null) {
      return res.status(409).json({
        error: "Ticket is already assigned",
        code: "TICKET_ALREADY_ASSIGNED",
        details: [],
      });
    }

    let nextStatusId = ticket.currentStatusId;
    if (ticket.currentStatus.name === "New") {
      const openStatus = await prisma.status.findUnique({
        where: { name: "Open" },
      });
      if (!openStatus) {
        return res.status(500).json({
          error: "Open status unavailable",
          code: "INTERNAL_SERVER_ERROR",
          details: [],
        });
      }
      nextStatusId = openStatus.id;
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ownerId: req.user!.id,
        currentStatusId: nextStatusId,
      },
      include: ticketIncludeDetails,
    });

    return res.status(200).json(updated);
  } catch (_error) {
    return res.status(500).json({
      error: "Failed to claim ticket",
      code: "INTERNAL_SERVER_ERROR",
      details: [],
    });
  }
}
router.patch("/tickets/:id/claim", handleClaimTicket);
router.patch("/:id/claim", handleClaimTicket);

// ---------------------------------------------------------------------------
// 5. PATCH /api/staff/tickets/:id/assign (Assign / Reassign Ticket)
// ---------------------------------------------------------------------------
async function handleAssignTicket(req: Request, res: Response) {
  try {
    const ticketId = Number(req.params.id);
    const ownerId = Number(req.body?.ownerId);

    if (!Number.isInteger(ticketId) || !Number.isInteger(ownerId)) {
      return res.status(400).json({
        error: "Invalid ticket ID or owner ID",
        code: "INVALID_INPUT",
        details: [],
      });
    }

    const prisma = getPrisma();

    const newOwner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (
      !newOwner ||
      !newOwner.isActive ||
      !["IT_STAFF", "ADMINISTRATOR"].includes(newOwner.role)
    ) {
      return res.status(400).json({
        error: "Owner must be an active IT Staff or Administrator",
        code: "INVALID_OWNER",
        details: [],
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        currentStatus: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
        code: "NOT_FOUND",
        details: [],
      });
    }

    let nextStatusId = ticket.currentStatusId;
    if (ticket.currentStatus.name === "New") {
      const openStatus = await prisma.status.findUnique({
        where: { name: "Open" },
      });
      if (!openStatus) {
        return res.status(500).json({
          error: "Open status unavailable",
          code: "INTERNAL_SERVER_ERROR",
          details: [],
        });
      }
      nextStatusId = openStatus.id;
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ownerId: newOwner.id,
        currentStatusId: nextStatusId,
      },
      include: ticketIncludeDetails,
    });

    return res.status(200).json(updated);
  } catch (_error) {
    return res.status(500).json({
      error: "Failed to assign ticket",
      code: "INTERNAL_SERVER_ERROR",
      details: [],
    });
  }
}
router.patch("/tickets/:id/assign", handleAssignTicket);
router.patch("/:id/assign", handleAssignTicket);

// ---------------------------------------------------------------------------
// 6. PATCH /api/staff/tickets/:id/priority (Update IT Priority)
// ---------------------------------------------------------------------------
async function handleUpdatePriority(req: Request, res: Response) {
  try {
    const ticketId = Number(req.params.id);
    const rawPriority = req.body?.itPriority;

    if (
      !Number.isInteger(ticketId) ||
      typeof rawPriority !== "string" ||
      !rawPriority.trim()
    ) {
      return res.status(400).json({
        error: "Invalid ticket ID or priority",
        code: "INVALID_INPUT",
        details: [],
      });
    }

    const normalizedPriorityName =
      priorityNormalizationMap[rawPriority.trim().toLowerCase()] ||
      rawPriority.trim();

    const prisma = getPrisma();
    const priority = await prisma.priority.findUnique({
      where: { name: normalizedPriorityName },
    });

    if (!priority) {
      return res.status(400).json({
        error: "Invalid IT priority",
        code: "INVALID_PRIORITY",
        details: [],
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
        code: "NOT_FOUND",
        details: [],
      });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        itPriorityId: priority.id,
      },
      include: ticketIncludeDetails,
    });

    return res.status(200).json(updated);
  } catch (_error) {
    return res.status(500).json({
      error: "Failed to update ticket priority",
      code: "INTERNAL_SERVER_ERROR",
      details: [],
    });
  }
}
router.patch("/tickets/:id/priority", handleUpdatePriority);
router.patch("/:id/priority", handleUpdatePriority);

// ---------------------------------------------------------------------------
// 7. PATCH /api/staff/tickets/:id/status (Update Ticket Status per BR-13)
// ---------------------------------------------------------------------------
async function handleUpdateStatus(req: Request, res: Response) {
  try {
    const ticketId = Number(req.params.id);
    const rawStatus = req.body?.status;

    if (
      !Number.isInteger(ticketId) ||
      typeof rawStatus !== "string" ||
      !rawStatus.trim()
    ) {
      return res.status(400).json({
        error: "Invalid ticket ID or status",
        code: "INVALID_INPUT",
        details: [],
      });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        currentStatus: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
        code: "NOT_FOUND",
        details: [],
      });
    }

    const normalizedTargetStatus =
      statusNormalizationMap[rawStatus.trim().toLowerCase()] ||
      rawStatus.trim();

    const nextStatus = await prisma.status.findUnique({
      where: { name: normalizedTargetStatus },
    });

    if (!nextStatus) {
      return res.status(400).json({
        error: "Invalid status transition",
        code: "INVALID_STATUS",
        details: [],
      });
    }

    const validNextStatuses =
      allowedTransitions[ticket.currentStatus.name] ?? [];

    if (!validNextStatuses.includes(nextStatus.name)) {
      return res.status(400).json({
        error: "Invalid status transition",
        code: "INVALID_STATUS_TRANSITION",
        details: [],
      });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        currentStatusId: nextStatus.id,
      },
      include: ticketIncludeDetails,
    });

    return res.status(200).json(updated);
  } catch (_error) {
    return res.status(500).json({
      error: "Failed to update ticket status",
      code: "INTERNAL_SERVER_ERROR",
      details: [],
    });
  }
}
router.patch("/tickets/:id/status", handleUpdateStatus);
router.patch("/:id/status", handleUpdateStatus);

export default router;
