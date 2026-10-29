import crypto from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

async function login(email: string) {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "Password123!" });
  const cookies = response.headers["set-cookie"];
  return Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
}

describe("Requester dashboard API", () => {
  let requester: string[];
  let requesterId: number;
  let staff: string[];
  let otherRequesterId: number;
  let isolationTicketId: number | undefined;
  let isolationTicketNumber: string;

  beforeAll(async () => {
    requester = await login("narin.chaiyo@example.com");
    staff = await login("somchai.jaidee@example.com");

    const [authenticatedRequester, otherRequester] = await Promise.all([
      getPrisma().user.findUniqueOrThrow({
        where: { email: "narin.chaiyo@example.com" },
        select: { id: true },
      }),
      getPrisma().user.findUniqueOrThrow({
        where: { email: "pimchanok.rattanakul@example.com" },
        select: { id: true },
      }),
    ]);
    requesterId = authenticatedRequester.id;
    otherRequesterId = otherRequester.id;
  });

  afterAll(async () => {
    if (isolationTicketId) {
      await getPrisma().ticket.delete({ where: { id: isolationTicketId } });
    }
  });

  it("returns concise metrics and only the authenticated requester's ticket data", async () => {
    const prisma = getPrisma();
    const [category, relatedSystem, priority, status] = await Promise.all([
      prisma.category.findFirstOrThrow({ where: { isActive: true } }),
      prisma.relatedSystem.findFirstOrThrow({ where: { isActive: true } }),
      prisma.priority.findFirstOrThrow({ where: { name: "Low" } }),
      prisma.status.findFirstOrThrow({ where: { name: "New" } }),
    ]);
    isolationTicketNumber = `TKT-ISO-${crypto.randomUUID().slice(0, 12)}`;
    const otherTicket = await prisma.ticket.create({
      data: {
        ticketNumber: isolationTicketNumber,
        requesterId: otherRequesterId,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Requester dashboard isolation verification",
        description: "This ticket belongs to a different requester.",
        requestedPriorityId: priority.id,
        itPriorityId: priority.id,
        currentStatusId: status.id,
      },
    });
    isolationTicketId = otherTicket.id;

    const [totalOpenTickets, ticketsWaitingForRequester, recentlyResolvedTickets, attentionRequiredTickets] = await Promise.all([
      prisma.ticket.count({ where: { requesterId, currentStatus: { name: { notIn: ["Closed", "Cancelled"] } } } }),
      prisma.ticket.count({ where: { requesterId, currentStatus: { name: "Waiting for Requester" } } }),
      prisma.ticket.count({ where: { requesterId, currentStatus: { name: "Resolved" } } }),
      prisma.ticket.count({ where: { requesterId, OR: [{ currentStatus: { name: "Waiting for Requester" } }, { currentStatus: { name: "Resolved" }, requesterResolvedIndicator: false }] } }),
    ]);

    const afterOtherRequesterWrite = await request(app)
      .get("/api/dashboards/requester")
      .set("Cookie", requester);

    expect(afterOtherRequesterWrite.status).toBe(200);
    expect(afterOtherRequesterWrite.body.metrics).toEqual({
      totalOpenTickets,
      ticketsWaitingForRequester,
      recentlyResolvedTickets,
      attentionRequiredTickets,
    });
    expect(Array.isArray(afterOtherRequesterWrite.body.recentTickets)).toBe(true);
    expect(afterOtherRequesterWrite.body.recentTickets.length).toBeLessThanOrEqual(5);
    if (afterOtherRequesterWrite.body.recentTickets.length > 0) {
      expect(afterOtherRequesterWrite.body.recentTickets[0]).not.toHaveProperty("description");
    }
    expect(afterOtherRequesterWrite.body.recentTickets).not.toContainEqual(
      expect.objectContaining({ ticketNumber: isolationTicketNumber }),
    );
  });

  it("rejects staff access", async () => {
    const response = await request(app)
      .get("/api/dashboards/requester")
      .set("Cookie", staff);
    expect(response.status).toBe(403);
  });
});
