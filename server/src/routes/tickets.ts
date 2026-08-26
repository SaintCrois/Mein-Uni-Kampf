import { Router } from "express";
import { getPrisma } from "../prisma.js";
import crypto from "node:crypto";
import { requireRequester } from "../middleware/requester.js";


const router = Router();
router.use(requireRequester);

const allowedPriorities = new Set([
  "Low",
  "Medium",
  "High",
  "Urgent",
]);

router.post("/", async (req, res) => {
  try {
    const {
      requesterId,
      categoryId,
      relatedSystemId,
      summary,
      description,
      requestedPriorityId,
    } = req.body;

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

    if (requesterId !== req.requesterId) {
      return res.status(403).json({
        error: "Requester does not match the authenticated requester",
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

    const requester = await prisma.devRequester.findUnique({
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

export default router;