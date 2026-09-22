import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

/**
 * Lab 3 - Issue 18: IT Staff Ticket Detail and Ticket Operations
 * Tests covering API-STAFF-01 to API-STAFF-06, authorization guards,
 * valid/invalid status transitions, assignment/reassignment, and priority updates.
 */
describe("Lab 3 - Issue 18: IT Staff Ticket Detail & Operations API", () => {
  const prisma = getPrisma();

  async function getSessionCookie(email: string): Promise<string[]> {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password: "Password123!",
      });

    const rawCookies = loginRes.headers["set-cookie"] as unknown;
    const cookieArray: string[] = Array.isArray(rawCookies)
      ? rawCookies
      : typeof rawCookies === "string"
        ? [rawCookies]
        : [];
    return cookieArray;
  }

  async function createTestTicket(statusName = "New", ownerId: number | null = null) {
    const requester = await prisma.user.findFirstOrThrow({
      where: { role: "REQUESTER", isActive: true },
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

    const ticketNumber = `TKT-TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return prisma.ticket.create({
      data: {
        ticketNumber,
        summary: `Issue 18 Test Ticket (${statusName})`,
        description: "Test description for staff ticket operations.",
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
        category: true,
        relatedSystem: true,
        requestedPriority: true,
        itPriority: true,
        currentStatus: true,
        owner: true,
        requester: true,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // 1. Staff Ticket Detail Retrieval (GET)
  // ---------------------------------------------------------------------------
  describe("Staff Ticket Detail Retrieval", () => {
    it("allows IT Staff to view complete Ticket Detail with all metadata", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const ticket = await createTestTicket("New");

      const response = await request(app)
        .get(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", ticket.id);
      expect(response.body).toHaveProperty("ticketNumber", ticket.ticketNumber);
      expect(response.body).toHaveProperty("summary", ticket.summary);
      expect(response.body).toHaveProperty("description", ticket.description);
      expect(response.body).toHaveProperty("category");
      expect(response.body).toHaveProperty("relatedSystem");
      expect(response.body).toHaveProperty("requestedPriority");
      expect(response.body).toHaveProperty("itPriority");
      expect(response.body).toHaveProperty("currentStatus");
      expect(response.body).toHaveProperty("requester");
      expect(response.body.requester).toHaveProperty("name");
      expect(response.body.requester).toHaveProperty("email");
      expect(response.body).toHaveProperty("requesterResolvedIndicator", false);
      expect(response.body).toHaveProperty("attachments");
    });

    it("returns 404 for nonexistent ticket ID", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .get("/api/staff/tickets/9999999")
        .set("Cookie", staffCookie);

      expect(response.status).toBe(404);
      expect(response.body.error).toMatch(/ticket not found/i);
    });

    it("rejects Requester role from staff ticket detail with 403 Forbidden", async () => {
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");
      const ticket = await createTestTicket("New");

      const response = await request(app)
        .get(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", requesterCookie);

      expect(response.status).toBe(403);
    });

    it("returns active assignees list via GET /api/staff/assignees", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .get("/api/staff/assignees")
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      for (const user of response.body.data) {
        expect(["IT_STAFF", "ADMINISTRATOR"]).toContain(user.role);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 2. API-STAFF-01: Claim Ticket (PATCH /claim)
  // ---------------------------------------------------------------------------
  describe("API-STAFF-01: Claim Ticket", () => {
    it("claims an unassigned ticket: sets ownerId to current staff and advances New -> Open", async () => {
      const staff = await prisma.user.findUniqueOrThrow({
        where: { email: "somchai.jaidee@example.com" },
      });
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const ticket = await createTestTicket("New", null);

      const response = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/claim`)
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      expect(response.body.owner).toHaveProperty("id", staff.id);
      expect(response.body.owner).toHaveProperty("name", staff.name);
      expect(response.body.currentStatus).toHaveProperty("name", "Open");

      // Verify in DB
      const dbTicket = await prisma.ticket.findUniqueOrThrow({
        where: { id: ticket.id },
        include: { currentStatus: true },
      });
      expect(dbTicket.ownerId).toBe(staff.id);
      expect(dbTicket.currentStatus.name).toBe("Open");
    });

    it("claims a ticket that is already Open without changing its status", async () => {
      const staff = await prisma.user.findUniqueOrThrow({
        where: { email: "somchai.jaidee@example.com" },
      });
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const ticket = await createTestTicket("Open", null);

      const response = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/claim`)
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      expect(response.body.owner).toHaveProperty("id", staff.id);
      expect(response.body.currentStatus).toHaveProperty("name", "Open");
    });

    it("rejects claiming a ticket that is already assigned", async () => {
      const assignedStaff = await prisma.user.findUniqueOrThrow({
        where: { email: "somchai.jaidee@example.com" },
      });
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const ticket = await createTestTicket("Open", assignedStaff.id);

      const response = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/claim`)
        .set("Cookie", staffCookie);

      expect(response.status).toBe(409);
      expect(response.body.error).toMatch(/already assigned/i);
    });

    it("rejects Requester from claiming a ticket with 403 Forbidden", async () => {
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");
      const ticket = await createTestTicket("New", null);

      const response = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/claim`)
        .set("Cookie", requesterCookie);

      expect(response.status).toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. API-STAFF-02: Assign & Reassign Ticket (PATCH /assign)
  // ---------------------------------------------------------------------------
  describe("API-STAFF-02: Assign & Reassign Ticket", () => {
    it("assigns an unassigned ticket to another active IT Staff member and advances New -> Open", async () => {
      const targetStaff = await prisma.user.findFirstOrThrow({
        where: { role: "IT_STAFF", isActive: true },
      });
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const ticket = await createTestTicket("New", null);

      const response = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/assign`)
        .set("Cookie", staffCookie)
        .send({ ownerId: targetStaff.id });

      expect(response.status).toBe(200);
      expect(response.body.owner).toHaveProperty("id", targetStaff.id);
      expect(response.body.currentStatus).toHaveProperty("name", "Open");
    });

    it("reassigns an already assigned ticket to an Administrator without changing status", async () => {
      const adminUser = await prisma.user.findFirstOrThrow({
        where: { role: "ADMINISTRATOR", isActive: true },
      });
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const ticket = await createTestTicket("In Progress", 2);

      const response = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/assign`)
        .set("Cookie", staffCookie)
        .send({ ownerId: adminUser.id });

      expect(response.status).toBe(200);
      expect(response.body.owner).toHaveProperty("id", adminUser.id);
      expect(response.body.currentStatus).toHaveProperty("name", "In Progress");
    });

    it("rejects assignment to a user with REQUESTER role with 400 Bad Request", async () => {
      const requester = await prisma.user.findFirstOrThrow({
        where: { role: "REQUESTER", isActive: true },
      });
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const ticket = await createTestTicket("New", null);

      const response = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/assign`)
        .set("Cookie", staffCookie)
        .send({ ownerId: requester.id });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/active IT Staff or Administrator/i);
    });

    it("rejects assignment to an inactive user or nonexistent user ID with 400 Bad Request", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const ticket = await createTestTicket("New", null);

      const response = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/assign`)
        .set("Cookie", staffCookie)
        .send({ ownerId: 999999 });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/active IT Staff or Administrator/i);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. API-STAFF-03: Update IT Priority (PATCH /priority)
  // ---------------------------------------------------------------------------
  describe("API-STAFF-03: Update IT Priority", () => {
    it("updates itPriority while keeping requestedPriority unchanged", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const ticket = await createTestTicket("Open");

      const response = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/priority`)
        .set("Cookie", staffCookie)
        .send({ itPriority: "Urgent" });

      expect(response.status).toBe(200);
      expect(response.body.itPriority).toHaveProperty("name", "Urgent");
      expect(response.body.requestedPriority).toHaveProperty("name", ticket.requestedPriority.name);

      // Verify in DB
      const dbTicket = await prisma.ticket.findUniqueOrThrow({
        where: { id: ticket.id },
        include: { itPriority: true, requestedPriority: true },
      });
      expect(dbTicket.itPriority?.name).toBe("Urgent");
      expect(dbTicket.requestedPriority.name).toBe(ticket.requestedPriority.name);
    });

    it("rejects invalid IT priority with 400 Bad Request", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const ticket = await createTestTicket("Open");

      const response = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/priority`)
        .set("Cookie", staffCookie)
        .send({ itPriority: "CRITICAL_SUPER_HIGH" });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/invalid it priority/i);
    });

    it("rejects Requester role from updating IT Priority with 403 Forbidden", async () => {
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");
      const ticket = await createTestTicket("Open");

      const response = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/priority`)
        .set("Cookie", requesterCookie)
        .send({ itPriority: "High" });

      expect(response.status).toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. API-STAFF-04 & API-STAFF-05: Status Transitions (PATCH /status)
  // ---------------------------------------------------------------------------
  describe("Status Transitions (BR-13)", () => {
    it("API-STAFF-04: executes valid status transitions: Open -> In Progress -> Resolved -> Closed", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const ticket = await createTestTicket("Open");

      // 1. Open -> In Progress
      const step1 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "In Progress" });
      expect(step1.status).toBe(200);
      expect(step1.body.currentStatus).toHaveProperty("name", "In Progress");

      // 2. In Progress -> Resolved
      const step2 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "Resolved" });
      expect(step2.status).toBe(200);
      expect(step2.body.currentStatus).toHaveProperty("name", "Resolved");

      // 3. Resolved -> Closed
      const step3 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "Closed" });
      expect(step3.status).toBe(200);
      expect(step3.body.currentStatus).toHaveProperty("name", "Closed");
    });

    it("API-STAFF-05: rejects invalid status transition New -> Closed with 400 Bad Request", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const ticket = await createTestTicket("New");

      const response = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "Closed" });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/invalid status transition/i);
    });

    it("rejects transition from terminal state Closed with 400 Bad Request", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const ticket = await createTestTicket("Closed");

      const response = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "Open" });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/invalid status transition/i);
    });

    it("supports reopening a Resolved ticket (Resolved -> Reopened)", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const ticket = await createTestTicket("Resolved");

      const response = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "Reopened" });

      expect(response.status).toBe(200);
      expect(response.body.currentStatus).toHaveProperty("name", "Reopened");
    });

    it("supports transitioning to Waiting for Requester and back to In Progress", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const ticket = await createTestTicket("In Progress");

      // In Progress -> Waiting for Requester
      const step1 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "Waiting for Requester" });
      expect(step1.status).toBe(200);
      expect(step1.body.currentStatus).toHaveProperty("name", "Waiting for Requester");

      // Waiting for Requester -> In Progress
      const step2 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "In Progress" });
      expect(step2.status).toBe(200);
      expect(step2.body.currentStatus).toHaveProperty("name", "In Progress");
    });

    it("supports cancellation from non-closed state (Open -> Cancelled)", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const ticket = await createTestTicket("Open");

      const response = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "Cancelled" });

      expect(response.status).toBe(200);
      expect(response.body.currentStatus).toHaveProperty("name", "Cancelled");
    });

    it("rejects Requester role from updating ticket status with 403 Forbidden", async () => {
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");
      const ticket = await createTestTicket("Open");

      const response = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Cookie", requesterCookie)
        .send({ status: "Resolved" });

      expect(response.status).toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. API-STAFF-06: Problem Appears Resolved Indicator Reflection
  // ---------------------------------------------------------------------------
  describe("API-STAFF-06: Problem Appears Resolved Reflection", () => {
    it("reflects requesterResolvedIndicator=true in Staff Ticket Detail when requester toggles it", async () => {
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const requester = await prisma.user.findUniqueOrThrow({
        where: { email: "narin.chaiyo@example.com" },
      });
      const ticket = await prisma.ticket.findFirstOrThrow({
        where: { requesterId: requester.id },
      });

      // Requester sets resolve indicator
      await request(app)
        .post(`/api/tickets/${ticket.id}/resolve-indicator`)
        .set("Cookie", requesterCookie)
        .send({ resolved: true });

      // Staff fetches ticket detail
      const staffDetailRes = await request(app)
        .get(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staffCookie);

      expect(staffDetailRes.status).toBe(200);
      expect(staffDetailRes.body).toHaveProperty("requesterResolvedIndicator", true);
    });
  });
});
