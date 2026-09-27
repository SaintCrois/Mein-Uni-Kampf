import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 4 - Issue 24: Actions Taken Backend API", () => {
  const prisma = getPrisma();

let requesterCookie: string[];
  let requester2Cookie: string[];
  let staffCookie: string[];
  let staff2Cookie: string[];
  let adminCookie: string[];
  let ticketWithActions: number;
  let ticketWithoutActions: number;
  let requesterOwnedTicketWithActions: number;
  let actionIdByStaff: number;
  let actionIdByAdmin = 0;

  async function loginAndGetCookie(email: string): Promise<string[]> {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "Password123!" });
    const rawCookies = loginRes.headers["set-cookie"];
    if (Array.isArray(rawCookies)) return rawCookies;
    if (typeof rawCookies === "string") return [rawCookies];
    return [];
  }

  beforeAll(async () => {
    requesterCookie = await loginAndGetCookie("narin.chaiyo@example.com");
    requester2Cookie = await loginAndGetCookie("pimchanok.rattanakul@example.com");
    staffCookie = await loginAndGetCookie("somchai.jaidee@example.com");
    staff2Cookie = await loginAndGetCookie("anong.prasert@example.com");
    adminCookie = await loginAndGetCookie("admin@example.com");

    // Find tickets for testing
    const vpnTicket = await prisma.ticket.findUnique({
      where: { ticketNumber: "TKT-2026-000002" },
    });
    const emailTicket = await prisma.ticket.findUnique({
      where: { ticketNumber: "TKT-2026-000007" }, // New, no owner, no actions
    });

    if (!vpnTicket || !emailTicket) {
      throw new Error("Required seed tickets not found");
    }

    ticketWithActions = vpnTicket.id;
    ticketWithoutActions = emailTicket.id!;

    // Get existing action IDs for update tests on VPN ticket
    const actions = await prisma.actionTaken.findMany({
      where: { ticketId: ticketWithActions },
      orderBy: { id: "asc" },
    });
    const somchaiUser = await prisma.user.findUnique({ where: { email: "somchai.jaidee@example.com" } });
    actionIdByStaff = actions.find((a) => a.performedById === somchaiUser?.id)?.id ?? actions[0]?.id;

    // For admin action, use the action on reopened ticket (TKT-2026-000009)
    const reopenedTicket = await prisma.ticket.findUnique({
      where: { ticketNumber: "TKT-2026-000009" },
    });
    if (reopenedTicket) {
      const adminActions = await prisma.actionTaken.findMany({
        where: { ticketId: reopenedTicket.id },
      });
      const adminUser = await prisma.user.findUnique({ where: { email: "admin@example.com" } });
      actionIdByAdmin = adminActions.find((a) => a.performedById === adminUser?.id)?.id ?? 0;
    }
  });

  // API-ACT-01: Create valid Action Taken by IT Staff
  it("API-ACT-01: IT Staff creates valid Action Taken with authenticated performer", async () => {
    const response = await request(app)
      .post(`/api/tickets/${ticketWithoutActions}/actions-taken`)
      .set("Cookie", staffCookie)
      .send({
        actionDateTime: "2026-09-25T10:00:00.000Z",
        actionDescription: "Initial diagnostic performed on reported issue.",
        result: "Root cause identified as configuration drift.",
        isFollowUpRequired: false,
        attachmentNotes: "diagnostic-log-2026-09-25.txt",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.ticketId).toBe(ticketWithoutActions);
    expect(response.body.actionDescription).toBe("Initial diagnostic performed on reported issue.");
    expect(response.body.result).toBe("Root cause identified as configuration drift.");
    expect(response.body.isFollowUpRequired).toBe(false);
    expect(response.body.followUpNote).toBeNull();
    expect(response.body.attachmentNotes).toBe("diagnostic-log-2026-09-25.txt");
    expect(response.body.performedBy).toHaveProperty("id");
    expect(response.body.performedBy.role).toBe("IT_STAFF");
    expect(response.body.performedBy.name).toBe("Somchai Jaidee");
    expect(response.body.createdAt).toBeDefined();
    expect(response.body.updatedAt).toBeDefined();
  });

  // API-ACT-02: Reject/ignore client-supplied performedById
  it("API-ACT-02: ignores client-supplied performedById and uses session user", async () => {
    const response = await request(app)
      .post(`/api/tickets/${ticketWithoutActions}/actions-taken`)
      .set("Cookie", staffCookie)
      .send({
        actionDescription: "Test action to verify performer binding.",
        result: "Verified performer is from session.",
        performedById: 99999, // Should be ignored
      });

    expect(response.status).toBe(201);
    expect(response.body.performedBy.id).not.toBe(99999);
    expect(response.body.performedBy.name).toBe("Somchai Jaidee");
  });

  // API-ACT-03: Validation - follow-up required needs note
  it("API-ACT-03: rejects creation when isFollowUpRequired=true but followUpNote is missing", async () => {
    const response = await request(app)
      .post(`/api/tickets/${ticketWithoutActions}/actions-taken`)
      .set("Cookie", staffCookie)
      .send({
        actionDescription: "Action requiring follow up but missing note.",
        result: "Testing validation.",
        isFollowUpRequired: true,
        // followUpNote intentionally omitted
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.error).toMatch(/follow.?up note is required/i);
  });

  // API-ACT-04: Setting follow-up false clears note
  it("API-ACT-04: setting isFollowUpRequired=false clears followUpNote", async () => {
    // Create with follow-up
    const createRes = await request(app)
      .post(`/api/tickets/${ticketWithoutActions}/actions-taken`)
      .set("Cookie", staffCookie)
      .send({
        actionDescription: "Action with follow up to test clearing.",
        result: "Initial result.",
        isFollowUpRequired: true,
        followUpNote: "This note should be cleared on update.",
      });
    expect(createRes.status).toBe(201);
    const createdId = createRes.body.id;

    // Update to remove follow-up
    const updateRes = await request(app)
      .patch(`/api/tickets/${ticketWithoutActions}/actions-taken/${createdId}`)
      .set("Cookie", staffCookie)
      .send({
        isFollowUpRequired: false,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.isFollowUpRequired).toBe(false);
    expect(updateRes.body.followUpNote).toBeNull();
  });

  // API-ACT-05: Valid attachmentNotes
  it("API-ACT-05: accepts valid attachmentNotes within length limit", async () => {
    const response = await request(app)
      .post(`/api/tickets/${ticketWithoutActions}/actions-taken`)
      .set("Cookie", staffCookie)
      .send({
        actionDescription: "Action with attachment notes.",
        result: "Completed with references.",
        attachmentNotes: "ref-doc-1.pdf, ref-doc-2.xlsx, screenshot.png",
      });

    expect(response.status).toBe(201);
    expect(response.body.attachmentNotes).toBe("ref-doc-1.pdf, ref-doc-2.xlsx, screenshot.png");
  });

  // API-ACT-06: Requester retrieves Actions Taken on owned ticket
  it("API-ACT-06: Requester can retrieve Actions Taken on owned ticket", async () => {
    // First, create an action on one of narin's tickets
    const narinTicket = await prisma.ticket.findFirst({
      where: { requester: { email: "narin.chaiyo@example.com" } },
    });
    if (!narinTicket) {
      throw new Error("Test setup failed: no ticket for narin");
    }

    // Create action as staff on narin's ticket
    const createRes = await request(app)
      .post(`/api/tickets/${narinTicket.id}/actions-taken`)
      .set("Cookie", staffCookie)
      .send({
        actionDescription: "Action on requester's ticket for retrieval test.",
        result: "Created for retrieval test.",
      });
    expect(createRes.status).toBe(201);
    requesterOwnedTicketWithActions = narinTicket.id;

    // Now retrieve as requester
    const response = await request(app)
      .get(`/api/tickets/${narinTicket.id}/actions-taken`)
      .set("Cookie", requesterCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    // Should be in chronological order
    for (let i = 1; i < response.body.length; i++) {
      const prev = new Date(response.body[i - 1].actionDateTime).getTime();
      const curr = new Date(response.body[i].actionDateTime).getTime();
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
    // Check structure
    const action = response.body[0];
    expect(action).toHaveProperty("id");
    expect(action).toHaveProperty("actionDescription");
    expect(action).toHaveProperty("result");
    expect(action).toHaveProperty("performedBy");
    expect(action.performedBy).toHaveProperty("name");
    expect(action.performedBy).toHaveProperty("role");
  });

  // API-ACT-07: Requester POST -> 403
  it("API-ACT-07: Requester attempting to create Action Taken gets 403", async () => {
    const response = await request(app)
      .post(`/api/tickets/${ticketWithoutActions}/actions-taken`)
      .set("Cookie", requesterCookie)
      .send({
        actionDescription: "Requester should not be able to create.",
        result: "Forbidden test.",
      });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("ACCESS_DENIED");
  });

  // API-ACT-08: Requester PATCH -> 403
  it("API-ACT-08: Requester attempting to edit Action Taken gets 403", async () => {
    const response = await request(app)
      .patch(`/api/tickets/${ticketWithActions}/actions-taken/${actionIdByStaff}`)
      .set("Cookie", requesterCookie)
      .send({
        actionDescription: "Attempted edit by requester.",
      });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("ACCESS_DENIED");
  });

  // API-ACT-09: Requester views another user's ticket actions -> 403
  it("API-ACT-09: Requester cannot view Actions Taken on another user's ticket", async () => {
    // Find a ticket owned by requester2
    const ticket = await prisma.ticket.findFirst({
      where: { requester: { email: "pimchanok.rattanakul@example.com" } },
    });

    if (!ticket) {
      throw new Error("Test setup failed: no ticket for requester2");
    }

    const response = await request(app)
      .get(`/api/tickets/${ticket.id}/actions-taken`)
      .set("Cookie", requesterCookie);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("ACCESS_DENIED");
  });

  // API-ACT-10: Non-owner IT Staff logs Action Taken on assigned ticket
  it("API-ACT-10: Non-owner IT Staff can create Action Taken on accessible ticket", async () => {
    // ticketWithActions is owned by somchai (staffCookie), test with anong (staff2Cookie)
    const response = await request(app)
      .post(`/api/tickets/${ticketWithActions}/actions-taken`)
      .set("Cookie", staff2Cookie)
      .send({
        actionDescription: "Action by different staff member (Anong) on ticket owned by Somchai.",
        result: "Multi-staff collaboration verified.",
        isFollowUpRequired: false,
      });

    expect(response.status).toBe(201);
    expect(response.body.performedBy.name).toBe("Anong Prasert");
    expect(response.body.performedBy.role).toBe("IT_STAFF");
  });

  // API-ACT-11: Update preserves performer immutability
  it("API-ACT-11: Update preserves initial performedById (immutable)", async () => {
    // Create an action by admin on a ticket, then update it
    const createRes = await request(app)
      .post(`/api/tickets/${ticketWithoutActions}/actions-taken`)
      .set("Cookie", adminCookie)
      .send({
        actionDescription: "Admin action for immutability test.",
        result: "Initial result.",
      });
    expect(createRes.status).toBe(201);
    const actionId = createRes.body.id;
    const originalPerformerId = createRes.body.performedBy.id;

    // Update the action
    const response = await request(app)
      .patch(`/api/tickets/${ticketWithoutActions}/actions-taken/${actionId}`)
      .set("Cookie", adminCookie)
      .send({
        actionDescription: "Updated description by admin.",
        result: "Updated result.",
      });

    expect(response.status).toBe(200);
    expect(response.body.performedBy.id).toBe(originalPerformerId);
    expect(response.body.actionDescription).toBe("Updated description by admin.");
    expect(response.body.result).toBe("Updated result.");
  });

  // Additional: Validation - actionDescription required and length
  it("rejects creation with missing actionDescription", async () => {
    const response = await request(app)
      .post(`/api/tickets/${ticketWithoutActions}/actions-taken`)
      .set("Cookie", staffCookie)
      .send({
        result: "Missing description test.",
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("rejects creation with actionDescription too short (< 3 chars)", async () => {
    const response = await request(app)
      .post(`/api/tickets/${ticketWithoutActions}/actions-taken`)
      .set("Cookie", staffCookie)
      .send({
        actionDescription: "AB",
        result: "Short description test.",
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("rejects creation with actionDescription too long (> 2000 chars)", async () => {
    const response = await request(app)
      .post(`/api/tickets/${ticketWithoutActions}/actions-taken`)
      .set("Cookie", staffCookie)
      .send({
        actionDescription: "A".repeat(2001),
        result: "Long description test.",
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("rejects creation with missing result", async () => {
    const response = await request(app)
      .post(`/api/tickets/${ticketWithoutActions}/actions-taken`)
      .set("Cookie", staffCookie)
      .send({
        actionDescription: "Valid description but missing result.",
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("rejects creation with invalid actionDateTime", async () => {
    const response = await request(app)
      .post(`/api/tickets/${ticketWithoutActions}/actions-taken`)
      .set("Cookie", staffCookie)
      .send({
        actionDescription: "Valid description.",
        result: "Valid result.",
        actionDateTime: "not-a-date",
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("rejects creation with attachmentNotes too long (> 1000 chars)", async () => {
    const response = await request(app)
      .post(`/api/tickets/${ticketWithoutActions}/actions-taken`)
      .set("Cookie", staffCookie)
      .send({
        actionDescription: "Valid description.",
        result: "Valid result.",
        attachmentNotes: "A".repeat(1001),
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  // Additional: Invalid ticket reference
  it("rejects creation for non-existent ticket (404)", async () => {
    const response = await request(app)
      .post("/api/tickets/999999/actions-taken")
      .set("Cookie", staffCookie)
      .send({
        actionDescription: "Valid description.",
        result: "Valid result.",
      });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("NOT_FOUND");
  });

  // Additional: Invalid action ID for update
  it("rejects update for non-existent action (404)", async () => {
    const response = await request(app)
      .patch(`/api/tickets/${ticketWithoutActions}/actions-taken/999999`)
      .set("Cookie", staffCookie)
      .send({
        actionDescription: "Updated description.",
      });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("NOT_FOUND");
  });

  // Additional: Authentication required
  it("rejects unauthenticated requests with 401", async () => {
    const getRes = await request(app).get(`/api/tickets/${ticketWithActions}/actions-taken`);
    expect(getRes.status).toBe(401);

    const postRes = await request(app)
      .post(`/api/tickets/${ticketWithoutActions}/actions-taken`)
      .send({ actionDescription: "Test", result: "Test" });
    expect(postRes.status).toBe(401);

    const patchRes = await request(app)
      .patch(`/api/tickets/${ticketWithActions}/actions-taken/1`)
      .send({ actionDescription: "Test" });
    expect(patchRes.status).toBe(401);
  });

  // Additional: Duplicate submission idempotency
  it("handles duplicate submissions within 5 seconds idempotently", async () => {
    const payload = {
      actionDescription: "Duplicate test action for idempotency.",
      result: "Testing duplicate protection.",
    };

    const res1 = await request(app)
      .post(`/api/tickets/${ticketWithoutActions}/actions-taken`)
      .set("Cookie", staffCookie)
      .send(payload);
    expect(res1.status).toBe(201);
    const id1 = res1.body.id;

    const res2 = await request(app)
      .post(`/api/tickets/${ticketWithoutActions}/actions-taken`)
      .set("Cookie", staffCookie)
      .send(payload);
    expect(res2.status).toBe(200); // Returns 200 for duplicate
    expect(res2.body.id).toBe(id1); // Same ID returned
  });

  // Additional: Concurrency conflict detection (optimistic locking)
  it("detects concurrent update conflict with If-Unmodified-Since header", async () => {
    // Create an action first
    const createRes = await request(app)
      .post(`/api/tickets/${ticketWithoutActions}/actions-taken`)
      .set("Cookie", staffCookie)
      .send({
        actionDescription: "Action for concurrency test.",
        result: "Initial result.",
      });
    expect(createRes.status).toBe(201);
    const actionId = createRes.body.id;
    const currentUpdatedAt = createRes.body.updatedAt;

    // Update with stale timestamp (older than current)
    const staleTimestamp = new Date(new Date(currentUpdatedAt).getTime() - 10000).toISOString();
    const conflictRes = await request(app)
      .patch(`/api/tickets/${ticketWithoutActions}/actions-taken/${actionId}`)
      .set("Cookie", staffCookie)
      .set("If-Unmodified-Since", staleTimestamp)
      .send({
        actionDescription: "Conflict test update.",
      });

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.code).toBe("CONCURRENCY_CONFLICT");
  });

  // Additional: Administrator can also perform actions
  it("allows Administrator to create and update Actions Taken", async () => {
    const createRes = await request(app)
      .post(`/api/tickets/${ticketWithoutActions}/actions-taken`)
      .set("Cookie", adminCookie)
      .send({
        actionDescription: "Admin action on ticket.",
        result: "Admin verified.",
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.performedBy.role).toBe("ADMINISTRATOR");

    const updateRes = await request(app)
      .patch(`/api/tickets/${ticketWithoutActions}/actions-taken/${createRes.body.id}`)
      .set("Cookie", adminCookie)
      .send({
        actionDescription: "Admin updated action.",
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.actionDescription).toBe("Admin updated action.");
  });
});