import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

/**
 * API-REG-01: Requester creates ticket using authenticated identity
 * API-REG-02: Requester lists only their own tickets
 * API-REG-03: Requester attachment upload, download, and soft removal
 * API-STAFF-06: Requester sets "Problem Appears Resolved" flag
 * API-SEC-01: Requester cannot access another Requester's ticket (authenticated path)
 */
describe("Lab 3 - Issue 16: Requester Regression and Authenticated Identity", () => {
  const prisma = getPrisma();

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

  async function getRequesterWithTicket(email: string) {
    const requester = await prisma.user.findUniqueOrThrow({ where: { email } });
    const ticket = await prisma.ticket.findFirstOrThrow({
      // Attachment lifecycle scenarios need a clean ticket. Selecting the
      // oldest ticket allowed repeated runs to exhaust its five-file limit.
      where: {
        requesterId: requester.id,
        attachments: { none: { status: "ACTIVE" } },
      },
      orderBy: { id: "asc" },
    });
    return { requester, ticket };
  }

  async function getTestRefs() {
    const category = await prisma.category.findFirstOrThrow({ where: { isActive: true }, orderBy: { id: "asc" } });
    const relatedSystem = await prisma.relatedSystem.findFirstOrThrow({ where: { isActive: true }, orderBy: { id: "asc" } });
    const priority = await prisma.priority.findFirstOrThrow({ where: { name: "High" } });
    return { category, relatedSystem, priority };
  }

  // ---------------------------------------------------------------------------
  // API-REG-01: Requester creates ticket using authenticated identity
  // ---------------------------------------------------------------------------
  describe("API-REG-01: Authenticated ticket creation", () => {
    it("creates a ticket and assigns requesterId from the authenticated session", async () => {
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");
      const requester = await prisma.user.findUniqueOrThrow({ where: { email: "narin.chaiyo@example.com" } });
      const { category, relatedSystem, priority } = await getTestRefs();

      const response = await request(app)
        .post("/api/tickets")
        .set("Cookie", requesterCookie)
        .send({
          categoryId: category.id,
          relatedSystemId: relatedSystem.id,
          summary: "REG-01: Authenticated ticket creation test",
          description: "Verifying that requesterId is assigned from the session, not the body.",
          requestedPriorityId: priority.id,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("ticketNumber");
      expect(response.body.ticketNumber).toMatch(/^TKT-/);
      expect(response.body).toHaveProperty("status", "New");
      // requesterId must come from session, not any client-supplied value
      expect(response.body.requesterId).toBe(requester.id);
    });

    it("ignores a client-supplied requesterId in the body and uses the session identity", async () => {
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");
      const requester = await prisma.user.findUniqueOrThrow({ where: { email: "narin.chaiyo@example.com" } });
      const { category, relatedSystem, priority } = await getTestRefs();

      // Try to spoof a different requesterId in the body
      const response = await request(app)
        .post("/api/tickets")
        .set("Cookie", requesterCookie)
        .send({
          categoryId: category.id,
          relatedSystemId: relatedSystem.id,
          summary: "REG-01: Spoofed requesterId test",
          description: "Server must ignore the body requesterId and use the session.",
          requestedPriorityId: priority.id,
          requesterId: 999999,
        });

      // Should succeed and assign the real session user's id
      expect(response.status).toBe(201);
      expect(response.body.requesterId).toBe(requester.id);
    });

    it("rejects ticket creation without authentication", async () => {
      const { category, relatedSystem, priority } = await getTestRefs();

      const response = await request(app)
        .post("/api/tickets")
        .send({
          categoryId: category.id,
          relatedSystemId: relatedSystem.id,
          summary: "No auth test",
          description: "This should be rejected.",
          requestedPriorityId: priority.id,
        });

      expect(response.status).toBe(401);
    });

    it("rejects ticket creation by IT Staff (REQUESTER role required)", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const { category, relatedSystem, priority } = await getTestRefs();

      const response = await request(app)
        .post("/api/tickets")
        .set("Cookie", staffCookie)
        .send({
          categoryId: category.id,
          relatedSystemId: relatedSystem.id,
          summary: "IT Staff ticket creation attempt",
          description: "This should be forbidden - only REQUESTERs can create tickets.",
          requestedPriorityId: priority.id,
        });

      expect(response.status).toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // API-REG-02: Requester lists only their own tickets
  // ---------------------------------------------------------------------------
  describe("API-REG-02: Authenticated ticket listing - requester isolation", () => {
    it("returns only tickets belonging to the authenticated requester", async () => {
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");
      const requester = await prisma.user.findUniqueOrThrow({ where: { email: "narin.chaiyo@example.com" } });

      const response = await request(app)
        .get("/api/tickets")
        .set("Cookie", requesterCookie);

      expect(response.status).toBe(200);
      // All returned tickets must belong to the authenticated requester
      const tickets = response.body.data as Array<{ id: number }>;
      expect(Array.isArray(tickets)).toBe(true);

      // Verify each returned ticket has requesterId === requester.id
      for (const ticket of tickets) {
        const dbTicket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
        expect(dbTicket.requesterId).toBe(requester.id);
      }
    });

    it("does not return tickets owned by other requesters", async () => {
      const requesterA = await prisma.user.findUniqueOrThrow({ where: { email: "narin.chaiyo@example.com" } });
      const requesterB = await prisma.user.findUniqueOrThrow({ where: { email: "pimchanok.rattanakul@example.com" } });

      // Ensure B has at least one ticket that A does not own
      const bTicket = await prisma.ticket.findFirstOrThrow({ where: { requesterId: requesterB.id } });

      const requesterACookie = await getSessionCookie("narin.chaiyo@example.com");

      const response = await request(app)
        .get("/api/tickets")
        .set("Cookie", requesterACookie);

      expect(response.status).toBe(200);
      const ticketIds = (response.body.data as Array<{ id: number }>).map(t => t.id);
      // Requester B's ticket must NOT appear in Requester A's list
      expect(ticketIds).not.toContain(bTicket.id);
    });

    it("rejects unauthenticated access to ticket list with 401", async () => {
      const response = await request(app).get("/api/tickets");
      expect(response.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // API-SEC-01: Cross-requester ticket access (authenticated path)
  // ---------------------------------------------------------------------------
  describe("API-SEC-01: Authenticated cross-requester ownership enforcement", () => {
    it("blocks an authenticated Requester from viewing another Requester's ticket detail", async () => {
      const { ticket } = await getRequesterWithTicket("narin.chaiyo@example.com");
      const requesterBCookie = await getSessionCookie("pimchanok.rattanakul@example.com");

      const response = await request(app)
        .get(`/api/tickets/${ticket.id}`)
        .set("Cookie", requesterBCookie);

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/access denied/i);
    });

    it("allows an authenticated Requester to view their own ticket detail", async () => {
      const { ticket } = await getRequesterWithTicket("narin.chaiyo@example.com");
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

      const response = await request(app)
        .get(`/api/tickets/${ticket.id}`)
        .set("Cookie", requesterCookie);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", ticket.id);
    });
  });

  // ---------------------------------------------------------------------------
  // API-REG-03: Attachment upload, download, and soft removal with authenticated session
  // ---------------------------------------------------------------------------
  describe("API-REG-03: Authenticated attachment lifecycle", () => {
    it("Requester can upload an attachment to their own ticket", async () => {
      const { ticket } = await getRequesterWithTicket("narin.chaiyo@example.com");
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/attachments`)
        .set("Cookie", requesterCookie)
        .attach("files", Buffer.from("authenticated upload test"), {
          filename: "auth-upload.pdf",
          contentType: "application/pdf",
        });

      expect(response.status).toBe(201);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0]).toHaveProperty("originalFileName", "auth-upload.pdf");
      expect(response.body.data[0]).toHaveProperty("status", "ACTIVE");
    });

    it("Requester cannot upload an attachment to another Requester's ticket", async () => {
      const { ticket } = await getRequesterWithTicket("narin.chaiyo@example.com");
      const requesterBCookie = await getSessionCookie("pimchanok.rattanakul@example.com");

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/attachments`)
        .set("Cookie", requesterBCookie)
        .attach("files", Buffer.from("unauthorized upload"), {
          filename: "bad-upload.pdf",
          contentType: "application/pdf",
        });

      expect(response.status).toBe(403);
    });

    it("Requester can download an active attachment from their own ticket", async () => {
      const { ticket } = await getRequesterWithTicket("narin.chaiyo@example.com");
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

      // Upload first
      const uploadRes = await request(app)
        .post(`/api/tickets/${ticket.id}/attachments`)
        .set("Cookie", requesterCookie)
        .attach("files", Buffer.from("download me"), {
          filename: "download-test.pdf",
          contentType: "application/pdf",
        });

      expect(uploadRes.status).toBe(201);
      const attachmentId = uploadRes.body.data[0].id;

      const downloadRes = await request(app)
        .get(`/api/tickets/${ticket.id}/attachments/${attachmentId}/download`)
        .set("Cookie", requesterCookie);

      expect(downloadRes.status).toBe(200);
      expect(downloadRes.headers["content-type"]).toContain("application/pdf");
    });

    it("Requester cannot download an attachment from another Requester's ticket", async () => {
      const { ticket } = await getRequesterWithTicket("narin.chaiyo@example.com");
      const requesterACookie = await getSessionCookie("narin.chaiyo@example.com");
      const requesterBCookie = await getSessionCookie("pimchanok.rattanakul@example.com");

      // A uploads
      const uploadRes = await request(app)
        .post(`/api/tickets/${ticket.id}/attachments`)
        .set("Cookie", requesterACookie)
        .attach("files", Buffer.from("owner only"), {
          filename: "owner-only.pdf",
          contentType: "application/pdf",
        });

      expect(uploadRes.status).toBe(201);
      const attachmentId = uploadRes.body.data[0].id;

      // B tries to download
      const downloadRes = await request(app)
        .get(`/api/tickets/${ticket.id}/attachments/${attachmentId}/download`)
        .set("Cookie", requesterBCookie);

      expect([403, 404]).toContain(downloadRes.status);
    });

    it("Requester can soft-remove an attachment on their own ticket", async () => {
      const { ticket } = await getRequesterWithTicket("narin.chaiyo@example.com");
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

      // Upload
      const uploadRes = await request(app)
        .post(`/api/tickets/${ticket.id}/attachments`)
        .set("Cookie", requesterCookie)
        .attach("files", Buffer.from("to be removed"), {
          filename: "to-remove.pdf",
          contentType: "application/pdf",
        });

      expect(uploadRes.status).toBe(201);
      const attachmentId = uploadRes.body.data[0].id;

      // Soft-remove
      const deleteRes = await request(app)
        .delete(`/api/tickets/${ticket.id}/attachments/${attachmentId}`)
        .set("Cookie", requesterCookie)
        .send({ reason: "Uploaded the wrong file" });

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data).toHaveProperty("status", "REMOVED");
      expect(deleteRes.body.data).toHaveProperty("removalReason", "Uploaded the wrong file");

      // Subsequent download must be blocked
      const downloadRes = await request(app)
        .get(`/api/tickets/${ticket.id}/attachments/${attachmentId}/download`)
        .set("Cookie", requesterCookie);

      expect([403, 404]).toContain(downloadRes.status);
    });

    it("rejects soft-removal without a reason", async () => {
      const { ticket } = await getRequesterWithTicket("narin.chaiyo@example.com");
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

      const uploadRes = await request(app)
        .post(`/api/tickets/${ticket.id}/attachments`)
        .set("Cookie", requesterCookie)
        .attach("files", Buffer.from("removal reason test"), {
          filename: "reason-test.pdf",
          contentType: "application/pdf",
        });

      expect(uploadRes.status).toBe(201);
      const attachmentId = uploadRes.body.data[0].id;

      const deleteRes = await request(app)
        .delete(`/api/tickets/${ticket.id}/attachments/${attachmentId}`)
        .set("Cookie", requesterCookie)
        .send({});

      expect(deleteRes.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------------
  // API-STAFF-06: Requester sets "Problem Appears Resolved" indicator
  // ---------------------------------------------------------------------------
  describe("API-STAFF-06: Requester resolve indicator", () => {
    it("Requester can set the resolve indicator to true on their own ticket", async () => {
      const { ticket } = await getRequesterWithTicket("narin.chaiyo@example.com");
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/resolve-indicator`)
        .set("Cookie", requesterCookie)
        .send({ resolved: true });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("requesterResolvedIndicator", true);
      // The ticket status must NOT have changed to Resolved or Closed
      const dbTicket = await prisma.ticket.findUniqueOrThrow({
        where: { id: ticket.id },
        include: { currentStatus: true },
      });
      expect(["New", "Open", "In Progress", "Waiting for Requester", "Reopened"]).toContain(
        dbTicket.currentStatus.name,
      );
      expect(["Resolved", "Closed"]).not.toContain(dbTicket.currentStatus.name);
    });

    it("Requester can clear the resolve indicator (set to false)", async () => {
      const { ticket } = await getRequesterWithTicket("narin.chaiyo@example.com");
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

      // Set true first
      await request(app)
        .post(`/api/tickets/${ticket.id}/resolve-indicator`)
        .set("Cookie", requesterCookie)
        .send({ resolved: true });

      // Then clear it
      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/resolve-indicator`)
        .set("Cookie", requesterCookie)
        .send({ resolved: false });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("requesterResolvedIndicator", false);
    });

    it("Requester cannot set the resolve indicator on another Requester's ticket", async () => {
      const { ticket } = await getRequesterWithTicket("narin.chaiyo@example.com");
      const requesterBCookie = await getSessionCookie("pimchanok.rattanakul@example.com");

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/resolve-indicator`)
        .set("Cookie", requesterBCookie)
        .send({ resolved: true });

      expect(response.status).toBe(403);
    });

    it("rejects the resolve indicator if the body resolved field is missing or not boolean", async () => {
      const { ticket } = await getRequesterWithTicket("narin.chaiyo@example.com");
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/resolve-indicator`)
        .set("Cookie", requesterCookie)
        .send({ resolved: "yes" }); // string, not boolean

      expect(response.status).toBe(400);
    });

    it("IT Staff cannot use the requester resolve-indicator endpoint", async () => {
      const { ticket } = await getRequesterWithTicket("narin.chaiyo@example.com");
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/resolve-indicator`)
        .set("Cookie", staffCookie)
        .send({ resolved: true });

      // Staff does not have REQUESTER role, must be 403
      expect(response.status).toBe(403);
    });
  });
});

