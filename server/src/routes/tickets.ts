import { Router } from "express";
import { getPrisma } from "../prisma.js";

const router = Router();

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

    // -----------------------------
    // Basic validation
    // -----------------------------

    if (
      !Number.isInteger(requesterId) ||
      !Number.isInteger(categoryId) ||
      !Number.isInteger(relatedSystemId) ||
      !Number.isInteger(requestedPriorityId)
    ) {
      return res.status(400).json({
        error: "Invalid ID field",
      });
    }

    if (
      typeof summary !== "string" ||
      summary.trim().length === 0 ||
      summary.length > 150
    ) {
      return res.status(400).json({
        error: "Summary is required and must be 150 characters or fewer",
      });
    }

    if (
      typeof description !== "string" ||
      description.trim().length === 0 ||
      description.length > 2000
    ) {
      return res.status(400).json({
        error:
          "Description is required and must be 2000 characters or fewer",
      });
    }

    const prisma = getPrisma();

    // -----------------------------
    // Validate requester
    // -----------------------------

    const requester = await prisma.devRequester.findUnique({
      where: { id: requesterId },
    });

    if (!requester) {
      return res.status(400).json({
        error: "Requester not found",
      });
    }

    if (!requester.isActive) {
      return res.status(400).json({
        error: "Requester is inactive",
      });
    }

    // -----------------------------
    // Validate category
    // -----------------------------

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || !category.isActive) {
      return res.status(400).json({
        error: "Category is invalid or inactive",
      });
    }

    // -----------------------------
    // Validate related system
    // -----------------------------

    const relatedSystem = await prisma.relatedSystem.findUnique({
      where: { id: relatedSystemId },
    });

    if (!relatedSystem || !relatedSystem.isActive) {
      return res.status(400).json({
        error: "Related system is invalid or inactive",
      });
    }

    // -----------------------------
    // Validate requested priority
    // -----------------------------

    const priority = await prisma.priority.findUnique({
      where: { id: requestedPriorityId },
    });

    if (!priority) {
      return res.status(400).json({
        error: "Requested priority is invalid",
      });
    }

    // -----------------------------
    // Initial status = New
    // -----------------------------

    const newStatus = await prisma.status.findUnique({
      where: { name: "New" },
    });

    if (!newStatus) {
      return res.status(500).json({
        error: "Ticket creation is currently unavailable",
      });
    }

    // -----------------------------
    // Generate Ticket Number
    // -----------------------------

    const year = new Date().getFullYear();

    const latestTicket = await prisma.ticket.findFirst({
      where: {
        ticketNumber: {
          startsWith: `TKT-${year}-`,
        },
      },
      orderBy: {
        ticketNumber: "desc",
      },
    });

    let nextNumber = 1;

    if (latestTicket) {
      const lastPart = latestTicket.ticketNumber.split("-").pop();

      if (lastPart) {
        const parsed = Number.parseInt(lastPart, 10);

        if (Number.isInteger(parsed)) {
          nextNumber = parsed + 1;
        }
      }
    }

    const ticketNumber = `TKT-${year}-${String(nextNumber).padStart(6, "0")}`;

    // -----------------------------
    // Create Ticket
    // -----------------------------

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
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

    return res.status(201).json({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      requesterId: ticket.requesterId,
      categoryId: ticket.categoryId,
      relatedSystemId: ticket.relatedSystemId,
      summary: ticket.summary,
      description: ticket.description,
      requestedPriorityId: ticket.requestedPriorityId,
      status: newStatus.name,
    });
  } catch (_error) {
    return res.status(500).json({
      error: "Failed to create ticket",
    });
  }
});

export default router;