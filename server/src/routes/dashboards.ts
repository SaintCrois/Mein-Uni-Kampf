import { Router } from "express";
import { getPrisma } from "../prisma.js";
import {
  requireAuth,
  requirePasswordChangeComplete,
  requireRole,
} from "../middleware/auth.js";

const router = Router();
const ACTIVE_STATUS_EXCLUSION = ["Closed", "Cancelled"];
const STATUS_NAMES = ["New", "Open", "In Progress", "Waiting for Requester", "Resolved", "Closed", "Reopened", "Cancelled"];
const PRIORITY_NAMES = ["Low", "Medium", "High", "Urgent"];

router.use(requireAuth);
router.use(requirePasswordChangeComplete);

function countMap(rows: Array<{ name: string; _count: { _all: number } }>, names: string[]) {
  return Object.fromEntries(names.map((name) => [name, 0])) as Record<string, number>;
}

async function buildStaffDashboard(userId: number) {
  const prisma = getPrisma();
  const activeWhere = { currentStatus: { name: { notIn: ACTIVE_STATUS_EXCLUSION } } };
  const [unassignedTickets, myAssignedTickets, followUpRequiredCount, statusRows, priorityRows, urgentTickets, myRecentActions] = await Promise.all([
    prisma.ticket.count({ where: { ...activeWhere, ownerId: null } }),
    prisma.ticket.count({ where: { ...activeWhere, ownerId: userId } }),
    prisma.ticket.count({ where: { ...activeWhere, actionsTaken: { some: { isFollowUpRequired: true } } } }),
    prisma.ticket.groupBy({ by: ["currentStatusId"], where: activeWhere, _count: { _all: true } }),
    prisma.ticket.groupBy({ by: ["itPriorityId"], where: { ...activeWhere, itPriorityId: { not: null } }, _count: { _all: true } }),
    prisma.ticket.findMany({
      where: { ...activeWhere, itPriority: { name: "Urgent" } },
      orderBy: { updatedAt: "desc" }, take: 5,
      select: { id: true, ticketNumber: true, summary: true, updatedAt: true,
        currentStatus: { select: { name: true } }, itPriority: { select: { name: true } }, category: { select: { name: true } },
        owner: { select: { id: true, name: true } }, _count: { select: { actionsTaken: true } } },
    }),
    prisma.actionTaken.findMany({
      where: { performedById: userId }, orderBy: { actionDateTime: "desc" }, take: 5,
      select: { id: true, ticketId: true, actionDescription: true, actionDateTime: true, isFollowUpRequired: true, ticket: { select: { ticketNumber: true } } },
    }),
  ]);

  const statusIds = statusRows.map((row) => row.currentStatusId);
  const priorityIds = priorityRows.map((row) => row.itPriorityId).filter((id): id is number => id !== null);
  const [statuses, priorities] = await Promise.all([
    prisma.status.findMany({ where: { id: { in: statusIds } }, select: { id: true, name: true } }),
    prisma.priority.findMany({ where: { id: { in: priorityIds } }, select: { id: true, name: true } }),
  ]);
  const ticketsByStatus = countMap([], STATUS_NAMES);
  const ticketsByPriority = countMap([], PRIORITY_NAMES);
  const statusById = new Map(statuses.map((status) => [status.id, status.name]));
  const priorityById = new Map(priorities.map((priority) => [priority.id, priority.name]));
  for (const row of statusRows) { const name = statusById.get(row.currentStatusId); if (name) ticketsByStatus[name] = row._count._all; }
  for (const row of priorityRows) { const name = priorityById.get(row.itPriorityId!); if (name) ticketsByPriority[name] = row._count._all; }

  return {
    metrics: { unassignedTickets, myAssignedTickets, followUpRequiredCount }, ticketsByStatus, ticketsByPriority,
    urgentTickets: urgentTickets.map((ticket) => ({ id: ticket.id, ticketNumber: ticket.ticketNumber, summary: ticket.summary,
      status: ticket.currentStatus.name, itPriority: ticket.itPriority?.name ?? null, category: ticket.category.name,
      owner: ticket.owner, updatedAt: ticket.updatedAt, actionsCount: ticket._count.actionsTaken })),
    myRecentActions: myRecentActions.map((action) => ({ id: action.id, ticketId: action.ticketId, ticketNumber: action.ticket.ticketNumber,
      actionDescription: action.actionDescription, actionDateTime: action.actionDateTime, isFollowUpRequired: action.isFollowUpRequired })),
  };
}

router.get("/requester", requireRole("REQUESTER"), async (req, res) => {
  try {
    const prisma = getPrisma();
    const own = { requesterId: req.user!.id };
    const [totalOpenTickets, ticketsWaitingForRequester, recentlyResolvedTickets, attentionRequiredTickets, recentTickets] = await Promise.all([
      prisma.ticket.count({ where: { ...own, currentStatus: { name: { notIn: ACTIVE_STATUS_EXCLUSION } } } }),
      prisma.ticket.count({ where: { ...own, currentStatus: { name: "Waiting for Requester" } } }),
      prisma.ticket.count({ where: { ...own, currentStatus: { name: "Resolved" } } }),
      prisma.ticket.count({ where: { ...own, OR: [{ currentStatus: { name: "Waiting for Requester" } }, { currentStatus: { name: "Resolved" }, requesterResolvedIndicator: false }] } }),
      prisma.ticket.findMany({ where: own, orderBy: { updatedAt: "desc" }, take: 5,
        select: { id: true, ticketNumber: true, summary: true, updatedAt: true, requesterResolvedIndicator: true,
          currentStatus: { select: { name: true } }, requestedPriority: { select: { name: true } }, category: { select: { name: true } },
          _count: { select: { actionsTaken: true } } } }),
    ]);
    return res.json({ metrics: { totalOpenTickets, ticketsWaitingForRequester, recentlyResolvedTickets, attentionRequiredTickets },
      recentTickets: recentTickets.map((ticket) => ({ id: ticket.id, ticketNumber: ticket.ticketNumber, summary: ticket.summary,
        status: ticket.currentStatus.name, requestedPriority: ticket.requestedPriority.name, category: ticket.category.name,
        updatedAt: ticket.updatedAt, hasActionsTaken: ticket._count.actionsTaken > 0, actionsCount: ticket._count.actionsTaken,
        requesterResolvedIndicator: ticket.requesterResolvedIndicator })) });
  } catch (_error) { return res.status(500).json({ error: "Failed to fetch requester dashboard", code: "INTERNAL_SERVER_ERROR", details: [] }); }
});

router.get("/staff", requireRole("IT_STAFF"), async (req, res) => {
  try { return res.json(await buildStaffDashboard(req.user!.id)); }
  catch (_error) { return res.status(500).json({ error: "Failed to fetch staff dashboard", code: "INTERNAL_SERVER_ERROR", details: [] }); }
});

router.get("/admin", requireRole("ADMINISTRATOR"), async (req, res) => {
  try {
    const prisma = getPrisma();
    const [staffDashboard, totalUsers, activeUsers, roleRows] = await Promise.all([
      buildStaffDashboard(req.user!.id), prisma.user.count(), prisma.user.count({ where: { isActive: true } }),
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    ]);
    const usersByRole: Record<string, number> = { REQUESTER: 0, IT_STAFF: 0, ADMINISTRATOR: 0 };
    roleRows.forEach((row) => { usersByRole[row.role] = row._count._all; });
    return res.json({ staffDashboard, userMetrics: { totalUsers, activeUsers, inactiveUsers: totalUsers - activeUsers, usersByRole } });
  } catch (_error) { return res.status(500).json({ error: "Failed to fetch administrator dashboard", code: "INTERNAL_SERVER_ERROR", details: [] }); }
});

export default router;
