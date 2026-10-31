import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

/**
 * Lab 4 - Issue 25: Final Ticket Status Workflow (API-WF-01 .. API-WF-10)
 *
 * The BR-11 status-transition matrix in docs/lab-04/specification.md is the
 * source of truth. Only documented transitions may be accepted; every other
 * pair must be rejected by the backend regardless of what any UI exposes.
 */
describe("Lab 4 - Issue 25: Ticket Workflow API", () => {
  const prisma = getPrisma();

  // Exact BR-11 matrix (Issue 23 specification). Kept literal here so the
  // tests fail if the backend ever drifts from the documented contract.
  const BR11: Record<string, string[]> = {
    New: ["Open", "Cancelled"],
    Open: ["In Progress", "Waiting for Requester", "Resolved", "Cancelled"],
    "In Progress": ["Open", "Waiting for Requester", "Resolved", "Cancelled"],
    "Waiting for Requester": ["In Progress", "Resolved", "Cancelled"],
    Resolved: ["Closed", "Reopened"],
    Reopened: ["In Progress", "Resolved", "Cancelled"],
    Closed: [],
    Cancelled: [],
  };
  const STATUSES = Object.keys(BR11);

  async function getSessionCookie(email: string): Promise<string[]> {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "Password123!" });

    const rawCookies = loginRes.headers["set-cookie"] as unknown;
    const cookieArray: string[] = Array.isArray(rawCookies)
      ? rawCookies
      : typeof rawCookies === "string"
        ? [rawCookies]
        : [];
    return cookieArray;
  }

  async function createTestTicket(
    statusName: keyof typeof BR11,
    ownerId: number | null = null,
  ) {
    const requester = await prisma.user.findUniqueOrThrow({
      where: { email: "narin.chaiyo@example.com" },
    });
    const category = await prisma.category.findFirstOrThrow({
      where: { isActive: true },
    });
    const system = await prisma.relatedSystem.findFirstOrThrow({
      where: { isActive: true },
    });
    const priority = await prisma.priority.findFirstOrThrow({
      where: { name: "Medium" },
    });
    const status = await prisma.status.findUniqueOrThrow({
      where: { name: statusName },
    });

    return prisma.ticket.create({
      data: {
        ticketNumber: `TKT-WF-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        summary: `Lab4 Workflow Test Ticket (${statusName})`,
        description: "Test ticket for Lab 4 workflow enforcement tests.",
        requesterId: requester.id,
        categoryId: category.id,
        relatedSystemId: system.id,
        requestedPriorityId: priority.id,
        itPriorityId: priority.id,
        currentStatusId: status.id,
        ownerId,
        requesterResolvedIndicator: false,
      },
      include: {
        currentStatus: true,
        requester: true,
      },
    });
  }

  async function getStatusName(ticketId: number): Promise<string> {
    const ticket = await prisma.ticket.findUniqueOrThrow({
      where: { id: ticketId },
      include: { currentStatus: true },
    });
    return ticket.currentStatus.name;
  }

  function transition(
    cookie: string[],
    ticketId: number,
    status: string,
    extra: Record<string, unknown> = {},
  ) {
    return request(app)
      .patch(`/api/staff/tickets/${ticketId}/status`)
      .set("Cookie", cookie)
      .send({ status, ...extra });
  }

  // ---------------------------------------------------------------------------
  // API-WF-01 .. API-WF-05: Documented permitted transitions
  // ---------------------------------------------------------------------------
  it("API-WF-01: permits Open -> In Progress", async () => {
    const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
    const ticket = await createTestTicket("Open");

    const response = await transition(staffCookie, ticket.id, "In Progress");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("In Progress");
    expect(response.body.permittedNextStatuses).toEqual(BR11["In Progress"]);
  });

    it("API-WF-02: permits In Progress -> Waiting for Requester", async () => {
    const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
    const ticket = await createTestTicket("In Progress");

    const response = await transition(
      staffCookie,
      ticket.id,
      "Waiting for Requester",
    );

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("Waiting for Requester");
  });

  it("API-WF-03: permits In Progress -> Resolved (formal staff resolution)", async () => {
    const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
    const ticket = await createTestTicket("In Progress");

    const response = await transition(staffCookie, ticket.id, "Resolved");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("Resolved");
    expect(response.body.permittedNextStatuses).toEqual(BR11["Resolved"]);
  });

  it("API-WF-04: permits Resolved -> Closed", async () => {
    const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
    const ticket = await createTestTicket("Resolved");

    const response = await transition(staffCookie, ticket.id, "Closed");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("Closed");
    expect(response.body.permittedNextStatuses).toEqual([]);
  });

  it("API-WF-05: permits Resolved -> Reopened", async () => {
    const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
    const ticket = await createTestTicket("Resolved");

    const response = await transition(staffCookie, ticket.id, "Reopened");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("Reopened");
    expect(response.body.permittedNextStatuses).toEqual(BR11["Reopened"]);
  });

  // ---------------------------------------------------------------------------
  // API-WF-06: Invalid transition rejection
  // ---------------------------------------------------------------------------
  it("API-WF-06: rejects New -> In Progress with 400 INVALID_STATUS_TRANSITION", async () => {
    const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
    const ticket = await createTestTicket("New");

    const response = await transition(staffCookie, ticket.id, "In Progress");

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_STATUS_TRANSITION");
    expect(response.body.error).toMatch(/invalid status transition/i);
    expect(response.body.details).toMatchObject({
      currentStatus: "New",
      attemptedStatus: "In Progress",
      permittedTransitions: BR11["New"],
    });
    expect(await getStatusName(ticket.id)).toBe("New");
  });

  // ---------------------------------------------------------------------------
  // API-WF-07: BR-13 ownership gate for New -> Open
  // ---------------------------------------------------------------------------
  it("API-WF-07: rejects New -> Open without an owner and allows it once assigned", async () => {
    const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
    const ticket = await createTestTicket("New", null);

    const rejected = await transition(staffCookie, ticket.id, "Open");
    expect(rejected.status).toBe(400);
    expect(rejected.body.code).toBe("INVALID_STATUS_TRANSITION");
    expect(rejected.body.error).toMatch(/claimed or assigned/i);
    expect(await getStatusName(ticket.id)).toBe("New");

    // Simulate claim/assign: owner is set, then New -> Open is documented.
    const staff = await prisma.user.findUniqueOrThrow({
      where: { email: "somchai.jaidee@example.com" },
    });
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { ownerId: staff.id },
    });

    const accepted = await transition(staffCookie, ticket.id, "Open");
    expect(accepted.status).toBe(200);
    expect(accepted.body.status).toBe("Open");
  });

    // ---------------------------------------------------------------------------
  // API-WF-08 / API-WF-09: Terminal state immutability
  // ---------------------------------------------------------------------------
  it("API-WF-08: Closed is a terminal state (every transition rejected)", async () => {
    const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
    const ticket = await createTestTicket("Closed");

    for (const target of STATUSES) {
      const response = await transition(staffCookie, ticket.id, target);
      expect(response.status).toBe(400);
      expect(response.body.code).toBe("INVALID_STATUS_TRANSITION");
      expect(response.body.error).toMatch(/terminal status/i);
    }

    expect(await getStatusName(ticket.id)).toBe("Closed");
  });

  it("API-WF-09: Cancelled is a terminal state (every transition rejected)", async () => {
    const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
    const ticket = await createTestTicket("Cancelled");

    for (const target of STATUSES) {
      const response = await transition(staffCookie, ticket.id, target);
      expect(response.status).toBe(400);
      expect(response.body.code).toBe("INVALID_STATUS_TRANSITION");
    }

    expect(await getStatusName(ticket.id)).toBe("Cancelled");
  });

  // ---------------------------------------------------------------------------
  // API-WF-10: Advisory resolution indicator decoupling (BR-12)
  // ---------------------------------------------------------------------------
  it("API-WF-10: requester indicator toggle never changes the formal status", async () => {
    const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");
    const ticket = await createTestTicket("Open");

    const toggle = await request(app)
      .post(`/api/tickets/${ticket.id}/resolve-indicator`)
      .set("Cookie", requesterCookie)
      .send({ resolved: true });

    expect(toggle.status).toBe(200);
    expect(toggle.body.data.requesterResolvedIndicator).toBe(true);

    // Advisory only: formal status is untouched.
    expect(await getStatusName(ticket.id)).toBe("Open");

    const detail = await request(app)
      .get(`/api/tickets/${ticket.id}`)
      .set("Cookie", requesterCookie);
    expect(detail.status).toBe(200);
    expect(detail.body.requesterResolvedIndicator).toBe(true);
    expect(detail.body.currentStatus.name).toBe("Open");
  });

  // ---------------------------------------------------------------------------
  // Exhaustive BR-11 coverage: every documented edge is accepted
  // ---------------------------------------------------------------------------
  it("accepts every documented BR-11 transition and reports the new permitted set", async () => {
    const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
    const staff = await prisma.user.findUniqueOrThrow({
      where: { email: "somchai.jaidee@example.com" },
    });

    for (const from of STATUSES) {
      for (const to of BR11[from]) {
        // New -> Open requires a non-null owner (BR-13).
        const ticket = await createTestTicket(
          from as keyof typeof BR11,
          from === "New" ? staff.id : null,
        );

        const response = await transition(staffCookie, ticket.id, to);
        expect(
          response.status,
          `${from} -> ${to} should be accepted`,
        ).toBe(200);
        expect(response.body.status).toBe(to);
        expect(response.body.permittedNextStatuses).toEqual(BR11[to]);
        expect(await getStatusName(ticket.id)).toBe(to);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // Exhaustive BR-11 coverage: every undocumented pair is rejected
  // ---------------------------------------------------------------------------
  it("rejects every transition not documented in BR-11 with structured details", async () => {
    const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

    for (const from of STATUSES) {
      const ticket = await createTestTicket(from as keyof typeof BR11);

      for (const to of STATUSES) {
        if (BR11[from].includes(to)) continue;

        const response = await transition(staffCookie, ticket.id, to);
        expect(
          response.status,
          `${from} -> ${to} should be rejected`,
        ).toBe(400);
        expect(response.body.code).toBe("INVALID_STATUS_TRANSITION");
        expect(response.body.details).toMatchObject({
          currentStatus: from,
          attemptedStatus: to,
          permittedTransitions: BR11[from],
        });
      }

      // Rejected attempts must never mutate the ticket.
      expect(await getStatusName(ticket.id)).toBe(from);
    }
  });

    // ---------------------------------------------------------------------------
  // Authorization: only staff/admin may transition statuses
  // ---------------------------------------------------------------------------
  it("rejects unauthenticated status transitions with 401", async () => {
    const ticket = await createTestTicket("Open");

    const response = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/status`)
      .send({ status: "Resolved" });

    expect(response.status).toBe(401);
    expect(await getStatusName(ticket.id)).toBe("Open");
  });

  it("rejects Requester attempts to resolve, close, or otherwise transition tickets with 403", async () => {
    const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

    for (const target of ["Resolved", "Closed", "In Progress", "Cancelled"]) {
      const ticket = await createTestTicket("Open");

      const response = await transition(requesterCookie, ticket.id, target);

      expect(response.status).toBe(403);
      expect(response.body.code).toBe("ACCESS_DENIED");
      // The requester must not be able to force any status change.
      expect(await getStatusName(ticket.id)).toBe("Open");
    }
  });

  // ---------------------------------------------------------------------------
  // Resolution gate: advisory indication + formal staff/admin resolution
  // ---------------------------------------------------------------------------
  it("allows IT Staff and Administrators to perform the formal resolution after an advisory indication", async () => {
    const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");
    const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
    const adminCookie = await getSessionCookie("admin@example.com");

    // Requester signals the problem appears resolved (advisory).
    const ticket = await createTestTicket("In Progress");
    const toggle = await request(app)
      .post(`/api/tickets/${ticket.id}/resolve-indicator`)
      .set("Cookie", requesterCookie)
      .send({ resolved: true });
    expect(toggle.status).toBe(200);
    expect(await getStatusName(ticket.id)).toBe("In Progress");

    // IT Staff formally resolves the ticket.
    const staffResolve = await transition(staffCookie, ticket.id, "Resolved");
    expect(staffResolve.status).toBe(200);
    expect(await getStatusName(ticket.id)).toBe("Resolved");

    // Staff detail reflects both the formal status and the advisory flag.
    const staffDetail = await request(app)
      .get(`/api/staff/tickets/${ticket.id}`)
      .set("Cookie", staffCookie);
    expect(staffDetail.body.currentStatus.name).toBe("Resolved");
    expect(staffDetail.body.requesterResolvedIndicator).toBe(true);

    // Administrator performs the final closure.
    const adminClose = await transition(adminCookie, ticket.id, "Closed");
    expect(adminClose.status).toBe(200);
    expect(await getStatusName(ticket.id)).toBe("Closed");
  });

  // ---------------------------------------------------------------------------
  // Conflict / stale update handling (FR-19)
  // ---------------------------------------------------------------------------
  it("rejects stale status updates with 409 CONCURRENCY_CONFLICT", async () => {
    const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
    const ticket = await createTestTicket("Open");

    const staleTimestamp = new Date(
      new Date(ticket.updatedAt).getTime() - 10000,
    ).toISOString();

    const headerConflict = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/status`)
      .set("Cookie", staffCookie)
      .set("If-Unmodified-Since", staleTimestamp)
      .send({ status: "In Progress" });
    expect(headerConflict.status).toBe(409);
    expect(headerConflict.body.code).toBe("CONCURRENCY_CONFLICT");

    const bodyConflict = await transition(staffCookie, ticket.id, "In Progress", {
      expectedUpdatedAt: staleTimestamp,
    });
    expect(bodyConflict.status).toBe(409);
    expect(bodyConflict.body.code).toBe("CONCURRENCY_CONFLICT");

    // No partial write happened.
    expect(await getStatusName(ticket.id)).toBe("Open");

    // A fresh version token succeeds.
    const fresh = await transition(staffCookie, ticket.id, "In Progress", {
      expectedUpdatedAt: new Date(ticket.updatedAt).toISOString(),
    });
    expect(fresh.status).toBe(200);
    expect(fresh.body.status).toBe("In Progress");
  });

  // ---------------------------------------------------------------------------
  // Response contract
  // ---------------------------------------------------------------------------
  it("returns the documented success payload (id, ticketNumber, status, updatedAt, permittedNextStatuses)", async () => {
    const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
    const ticket = await createTestTicket("Open");

    const response = await transition(staffCookie, ticket.id, "In Progress");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: "In Progress",
    });
    expect(typeof response.body.updatedAt).toBe("string");
    expect(Array.isArray(response.body.permittedNextStatuses)).toBe(true);
    expect(response.body.permittedNextStatuses).toEqual(
      BR11["In Progress"],
    );
  });
});



