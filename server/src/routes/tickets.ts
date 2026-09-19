import { Router } from "express";
import { getPrisma } from "../prisma.js";
import crypto from "node:crypto";
import { requireRequester, requireAuthenticatedOrLegacyRequester } from "../middleware/requester.js";
import { requireRole } from "../middleware/auth.js";


const router = Router();

const allowedPriorities = new Set([
  "Low",
  "Medium",
  "High",
  "Urgent",
]);

router.get("/", requireRequester, async (req, res) => {
  try {
    const prisma = getPrisma();

    const tickets = await prisma.ticket.findMany({
      where: {
        requesterId: req.requesterId,
      },
      include: {
        category: true,
        requestedPriority: true,
        currentStatus: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      data: tickets.map((ticket) => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        summary: ticket.summary,
        category: {
          id: ticket.category.id,
          name: ticket.category.name,
        },
        requestedPriority: {
          id: ticket.requestedPriority.id,
          name: ticket.requestedPriority.name,
        },
        currentStatus: {
          id: ticket.currentStatus.id,
          name: ticket.currentStatus.name,
        },
        status: ticket.currentStatus.name,
        createdAt: ticket.createdAt,
      })),
    });
  } catch (_error) {
    return res.status(500).json({
      error: "Failed to fetch tickets",
    });
  }
});


router.post("/", requireRequester, async (req, res) => {

  try {
    const {
      categoryId,
      relatedSystemId,
      summary,
      description,
      requestedPriorityId,
    } = req.body;

    // The requester is always derived from the verified session, never the body.
    const requesterId = req.user!.id;

    if (req.isLegacyRequester && req.body.requesterId !== undefined && req.body.requesterId !== requesterId) {
      return res.status(403).json({ error: "Requester does not match the authenticated requester" });
    }

    if (
      !Number.isInteger(requesterId) ||
      !Number.isInteger(categoryId) ||
      !Number.isInteger(relatedSystemId) ||
      !Number.isInteger(requestedPriorityId)
    ) {
      return res.status(400).json({
        error: "Invalid reference ID",
      });
    }

    if (
      typeof summary !== "string" ||
      summary.trim().length === 0 ||
      summary.trim().length > 150
    ) {

      return res.status(400).json({
        error: "Summary is required and must be 150 characters or fewer",
      });
    }

    if (
      typeof description !== "string" ||
      description.trim().length === 0 ||
      description.trim().length > 2000
    ) {
      return res.status(400).json({
        error: "Description is required and must be 2000 characters or fewer",
      });
    }

    const prisma = getPrisma();

    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
    });

    if (!requester || !requester.isActive) {
      return res.status(400).json({
        error: "Requester is invalid or inactive",
      });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || !category.isActive) {
      return res.status(400).json({
        error: "Category is invalid or inactive",
      });
    }

    const relatedSystem = await prisma.relatedSystem.findUnique({
      where: { id: relatedSystemId },
    });

    if (!relatedSystem || !relatedSystem.isActive) {
      return res.status(400).json({
        error: "Related system is invalid or inactive",
      });
    }

    const priority = await prisma.priority.findUnique({
      where: { id: requestedPriorityId },
    });

    if (!priority || !allowedPriorities.has(priority.name)) {
      return res.status(400).json({
        error: "Requested priority is invalid",
      });
    }

    const newStatus = await prisma.status.findUnique({
      where: { name: "New" },
    });

    if (!newStatus) {
      return res.status(500).json({
        error: "Ticket creation is currently unavailable",
      });
    }

    /*
     * Create with a temporary unique number first.
     * Prisma/PostgreSQL generates the unique Ticket ID.
     * We then derive the official number from that ID.
     *
     * This avoids the race condition of:
     * SELECT MAX(number) -> +1 -> INSERT
     */
    const ticket = await prisma.$transaction(async (tx) => {
      const temporaryNumber = `TMP-${crypto.randomUUID()}`;

      const created = await tx.ticket.create({
        data: {
          ticketNumber: temporaryNumber,
          requesterId,
          categoryId,
          relatedSystemId,
          summary: summary.trim(),
          description: description.trim(),
          requestedPriorityId,
          currentStatusId: newStatus.id,
          itPriorityId: null,
          ownerId: null,
        },
      });

      const year = new Date().getFullYear();
      const officialNumber =
        `TKT-${year}-${String(created.id).padStart(6, "0")}`;

      return tx.ticket.update({
        where: { id: created.id },
        data: {
          ticketNumber: officialNumber,
        },
      });
    });

    return res.status(201).json({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      createdAt: ticket.createdAt,
      requesterId: ticket.requesterId,
      categoryId: ticket.categoryId,
      relatedSystemId: ticket.relatedSystemId,
      summary: ticket.summary,
      description: ticket.description,
      requestedPriorityId: ticket.requestedPriorityId,
      status: "New",
    });

  } catch (_error) {
    return res.status(500).json({
      error: "Failed to create ticket",
    });
  }
});

router.get("/:id", requireAuthenticatedOrLegacyRequester, async (req, res) => {
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
      include: {
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
            uploadedAt: "asc",
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
      });
    }

    if (req.user!.role === "REQUESTER" && ticket.requesterId !== req.user!.id) {
      return res.status(403).json({
        error: "Access denied",
      });
    }

    return res.status(200).json({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      summary: ticket.summary,
      description: ticket.description,
      category: {
        id: ticket.category.id,
        name: ticket.category.name,
      },
      relatedSystem: {
        id: ticket.relatedSystem.id,
        name: ticket.relatedSystem.name,
      },
      requestedPriority: {
        id: ticket.requestedPriority.id,
        name: ticket.requestedPriority.name,
      },
      itPriority: ticket.itPriority
        ? {
            id: ticket.itPriority.id,
            name: ticket.itPriority.name,
          }
        : null,
      currentStatus: {
        id: ticket.currentStatus.id,
        name: ticket.currentStatus.name,
      },
      owner: ticket.owner
        ? {
            id: ticket.owner.id,
            name: ticket.owner.name,
            email: ticket.owner.email,
            role: ticket.owner.role,
          }
        : null,
      requester: ticket.requester
        ? {
            id: ticket.requester.id,
            name: ticket.requester.name,
            email: ticket.requester.email,
            role: ticket.requester.role,
          }
        : null,
      requesterResolvedIndicator: ticket.requesterResolvedIndicator,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      attachments: ticket.attachments.map((attachment) => ({
        id: attachment.id,
        originalFileName: attachment.originalFileName,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        status: attachment.status,
        removalReason: attachment.removalReason,
        removedAt: attachment.removedAt,
        uploadedAt: attachment.uploadedAt,
      })),
    });
  } catch (_error) {
    return res.status(500).json({
      error: "Failed to fetch ticket",
    });
  }
});

// Internal Notes (Strictly IT_STAFF and ADMINISTRATOR)
router.get("/:id/notes", requireAuthenticatedOrLegacyRequester, requireRole("IT_STAFF", "ADMINISTRATOR"), async (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    if (!Number.isInteger(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        internalNotes: {
          include: {
            author: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    return res.status(200).json({ data: ticket.internalNotes });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to fetch internal notes" });
  }
});

router.post("/:id/notes", requireAuthenticatedOrLegacyRequester, requireRole("IT_STAFF", "ADMINISTRATOR"), async (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    if (!Number.isInteger(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    const { content } = req.body ?? {};
    if (
      typeof content !== "string" ||
      content.trim().length === 0 ||
      content.trim().length > 2000
    ) {
      return res.status(400).json({
        error: "Content is required and must be 2000 characters or fewer",
      });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const note = await prisma.internalNote.create({
      data: {
        ticketId,
        authorId: req.user!.id,
        content: content.trim(),
      },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return res.status(201).json({
      message: "Internal note created",
      data: note,
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to create internal note" });
  }
});

// Public Comments (Requester, IT Staff, and Admin)
router.get("/:id/comments", requireAuthenticatedOrLegacyRequester, async (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    if (!Number.isInteger(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        publicComments: {
          include: {
            author: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (
      req.user!.role === "REQUESTER" &&
      ticket.requesterId !== req.user!.id
    ) {
      return res.status(403).json({
        error: "Access denied",
        code: "ACCESS_DENIED",
      });
    }

    return res.status(200).json({ data: ticket.publicComments });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to fetch comments" });
  }
});

router.post("/:id/comments", requireAuthenticatedOrLegacyRequester, async (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    if (!Number.isInteger(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    const { content } = req.body ?? {};
    if (
      typeof content !== "string" ||
      content.trim().length === 0 ||
      content.trim().length > 2000
    ) {
      return res.status(400).json({
        error: "Content is required and must be 2000 characters or fewer",
      });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (
      req.user!.role === "REQUESTER" &&
      ticket.requesterId !== req.user!.id
    ) {
      return res.status(403).json({
        error: "Access denied",
        code: "ACCESS_DENIED",
      });
    }

    const authorId = req.user!.id;
    const comment = await prisma.publicComment.create({
      data: {
        ticketId,
        authorId,
        content: content.trim(),
      },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return res.status(201).json({
      message: "Public comment created",
      data: comment,
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to post comment" });
  }
});

router.post("/:id/resolve-indicator", requireRequester, async (req, res) => {
  const ticketId = Number(req.params.id);
  if (!Number.isInteger(ticketId) || typeof req.body?.resolved !== "boolean") {
    return res.status(400).json({ error: "Invalid resolution indicator", code: "INVALID_INPUT", details: [] });
  }

  const prisma = getPrisma();
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return res.status(404).json({ error: "Ticket not found", code: "NOT_FOUND", details: [] });
  if (ticket.requesterId !== req.user!.id) {
    return res.status(403).json({ error: "Access denied", code: "ACCESS_DENIED", details: [] });
  }

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: { requesterResolvedIndicator: req.body.resolved },
  });
  return res.status(200).json({ data: { id: updated.id, requesterResolvedIndicator: updated.requesterResolvedIndicator } });
});

export default router;
