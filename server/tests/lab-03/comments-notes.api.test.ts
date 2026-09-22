import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

/**
 * API-COM-01, API-COM-02: Public Comments
 * API-NOTE-01, API-NOTE-02: Internal Notes
 * API-SEC-04 (requester blocked from notes) is also covered here in addition to authorization.api.test.ts
 */
describe("Lab 3 - Issue 16: Public Comments and Internal Notes", () => {
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

  async function getOwnedTicket(requesterEmail: string) {
    const requester = await prisma.user.findUniqueOrThrow({
      where: { email: requesterEmail },
    });
    const ticket = await prisma.ticket.findFirstOrThrow({
      where: { requesterId: requester.id },
      orderBy: { id: "asc" },
    });
    return { requester, ticket };
  }

  // ---------------------------------------------------------------------------
  // API-COM-01: Post and retrieve Public Comments
  // ---------------------------------------------------------------------------
  describe("API-COM-01: Public Comments - post and retrieve", () => {
    it("Requester can post a Public Comment on their own ticket", async () => {
      const { ticket } = await getOwnedTicket("narin.chaiyo@example.com");
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/comments`)
        .set("Cookie", requesterCookie)
        .send({ content: "The issue started after the last system update." });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("content", "The issue started after the last system update.");
      expect(response.body.data.author).toHaveProperty("role", "REQUESTER");
    });

    it("IT Staff can post a Public Comment on any ticket", async () => {
      const ticket = await prisma.ticket.findFirstOrThrow({ orderBy: { id: "asc" } });
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/comments`)
        .set("Cookie", staffCookie)
        .send({ content: "We have received your request and are investigating." });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.author).toHaveProperty("role", "IT_STAFF");
    });

    it("Requester can retrieve Public Comments on their own ticket", async () => {
      const { ticket } = await getOwnedTicket("narin.chaiyo@example.com");
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

      // Post a comment first to ensure at least one exists
      await request(app)
        .post(`/api/tickets/${ticket.id}/comments`)
        .set("Cookie", requesterCookie)
        .send({ content: "Checking status of my ticket." });

      const response = await request(app)
        .get(`/api/tickets/${ticket.id}/comments`)
        .set("Cookie", requesterCookie);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("content");
      expect(response.body[0]).toHaveProperty("createdAt");
      expect(response.body[0].author).toHaveProperty("id");
      expect(response.body[0].author).toHaveProperty("name");
      expect(response.body[0].author).toHaveProperty("role");
    });

    it("IT Staff can retrieve Public Comments on any ticket", async () => {
      const ticket = await prisma.ticket.findFirstOrThrow({ orderBy: { id: "asc" } });
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .get(`/api/tickets/${ticket.id}/comments`)
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("Requester cannot retrieve Public Comments on another user's ticket", async () => {
      const { requester } = await getOwnedTicket("narin.chaiyo@example.com");
      // Find a ticket NOT owned by narin
      const otherTicket = await prisma.ticket.findFirstOrThrow({
        where: { requesterId: { not: requester.id } },
        orderBy: { id: "asc" },
      });
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

      const response = await request(app)
        .get(`/api/tickets/${otherTicket.id}/comments`)
        .set("Cookie", requesterCookie);

      expect(response.status).toBe(403);
    });

    it("Requester cannot post a Public Comment on another user's ticket", async () => {
      const { requester } = await getOwnedTicket("narin.chaiyo@example.com");
      const otherTicket = await prisma.ticket.findFirstOrThrow({
        where: { requesterId: { not: requester.id } },
        orderBy: { id: "asc" },
      });
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

      const response = await request(app)
        .post(`/api/tickets/${otherTicket.id}/comments`)
        .set("Cookie", requesterCookie)
        .send({ content: "Trying to comment on someone else's ticket." });

      expect(response.status).toBe(403);
    });

    it("comment author and timestamp are assigned server-side (not from client)", async () => {
      const { ticket } = await getOwnedTicket("narin.chaiyo@example.com");
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/comments`)
        .set("Cookie", requesterCookie)
        .send({ content: "Server-side author assignment test.", authorId: 999999 });

      expect(response.status).toBe(201);
      // author must be the actual authenticated user, not the spoofed one
      const requester = await prisma.user.findUniqueOrThrow({ where: { email: "narin.chaiyo@example.com" } });
      expect(response.body.data.author.id).toBe(requester.id);
    });
  });

  // ---------------------------------------------------------------------------
  // API-COM-02: Comment validation - empty or > 2000 chars
  // ---------------------------------------------------------------------------
  describe("API-COM-02: Public Comment validation", () => {
    it("rejects an empty Public Comment", async () => {
      const { ticket } = await getOwnedTicket("narin.chaiyo@example.com");
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/comments`)
        .set("Cookie", requesterCookie)
        .send({ content: "" });

      expect(response.status).toBe(400);
    });

    it("rejects a whitespace-only Public Comment", async () => {
      const { ticket } = await getOwnedTicket("narin.chaiyo@example.com");
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/comments`)
        .set("Cookie", requesterCookie)
        .send({ content: "   " });

      expect(response.status).toBe(400);
    });

    it("rejects a Public Comment exceeding 2000 characters", async () => {
      const { ticket } = await getOwnedTicket("narin.chaiyo@example.com");
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/comments`)
        .set("Cookie", requesterCookie)
        .send({ content: "A".repeat(2001) });

      expect(response.status).toBe(400);
    });

    it("accepts a Public Comment of exactly 2000 characters", async () => {
      const { ticket } = await getOwnedTicket("narin.chaiyo@example.com");
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/comments`)
        .set("Cookie", requesterCookie)
        .send({ content: "A".repeat(2000) });

      expect(response.status).toBe(201);
    });
  });

  // ---------------------------------------------------------------------------
  // API-NOTE-01: IT Staff posts and retrieves Internal Notes
  // ---------------------------------------------------------------------------
  describe("API-NOTE-01: Internal Notes - IT Staff post and retrieve", () => {
    it("IT Staff can post an Internal Note on any ticket", async () => {
      const ticket = await prisma.ticket.findFirstOrThrow({ orderBy: { id: "asc" } });
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/notes`)
        .set("Cookie", staffCookie)
        .send({ content: "Internal: checked switch configuration on port 3." });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("content", "Internal: checked switch configuration on port 3.");
      expect(response.body.data.author).toHaveProperty("role", "IT_STAFF");
    });

    it("IT Staff can retrieve Internal Notes on any ticket", async () => {
      const ticket = await prisma.ticket.findFirstOrThrow({ orderBy: { id: "asc" } });
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      // Ensure at least one note exists
      await request(app)
        .post(`/api/tickets/${ticket.id}/notes`)
        .set("Cookie", staffCookie)
        .send({ content: "Internal note for retrieval test." });

      const response = await request(app)
        .get(`/api/tickets/${ticket.id}/notes`)
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty("id");
      expect(response.body.data[0]).toHaveProperty("content");
      expect(response.body.data[0]).toHaveProperty("createdAt");
      expect(response.body.data[0].author).toHaveProperty("id");
      expect(response.body.data[0].author).toHaveProperty("name");
      expect(response.body.data[0].author).toHaveProperty("role");
    });

    it("Administrator can post an Internal Note", async () => {
      const ticket = await prisma.ticket.findFirstOrThrow({ orderBy: { id: "asc" } });
      const adminCookie = await getSessionCookie("admin@example.com");

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/notes`)
        .set("Cookie", adminCookie)
        .send({ content: "Admin internal note for audit trail." });

      expect(response.status).toBe(201);
      expect(response.body.data.author).toHaveProperty("role", "ADMINISTRATOR");
    });

    it("Administrator can retrieve Internal Notes", async () => {
      const ticket = await prisma.ticket.findFirstOrThrow({ orderBy: { id: "asc" } });
      const adminCookie = await getSessionCookie("admin@example.com");

      const response = await request(app)
        .get(`/api/tickets/${ticket.id}/notes`)
        .set("Cookie", adminCookie);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("Requester is blocked from reading Internal Notes with 403", async () => {
      const ticket = await prisma.ticket.findFirstOrThrow({ orderBy: { id: "asc" } });
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

      const response = await request(app)
        .get(`/api/tickets/${ticket.id}/notes`)
        .set("Cookie", requesterCookie);

      expect(response.status).toBe(403);
      // Internal note content must not be disclosed
      expect(response.body).not.toHaveProperty("data");
    });

    it("Requester is blocked from posting Internal Notes with 403", async () => {
      const ticket = await prisma.ticket.findFirstOrThrow({ orderBy: { id: "asc" } });
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/notes`)
        .set("Cookie", requesterCookie)
        .send({ content: "Requester attempting to post an internal note." });

      expect(response.status).toBe(403);
    });

    it("Internal Notes are not included in Public Comments response", async () => {
      const ticket = await prisma.ticket.findFirstOrThrow({ orderBy: { id: "asc" } });
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

      // Staff posts internal note
      const SECRET_CONTENT = `SECRET-NOTE-${Date.now()}`;
      await request(app)
        .post(`/api/tickets/${ticket.id}/notes`)
        .set("Cookie", staffCookie)
        .send({ content: SECRET_CONTENT });

      // Find a ticket the requester owns so they can view comments
      const requester = await prisma.user.findUniqueOrThrow({ where: { email: "narin.chaiyo@example.com" } });
      const ownedTicket = await prisma.ticket.findFirstOrThrow({
        where: { requesterId: requester.id },
        orderBy: { id: "asc" },
      });

      // Requester reads comments on their own ticket - internal note must NOT appear
      const commentsRes = await request(app)
        .get(`/api/tickets/${ownedTicket.id}/comments`)
        .set("Cookie", requesterCookie);

      expect(commentsRes.status).toBe(200);
      const contents = (commentsRes.body as Array<{ content: string }>).map(c => c.content);
      expect(contents).not.toContain(SECRET_CONTENT);
    });
  });

  // ---------------------------------------------------------------------------
  // API-NOTE-02: Internal Note validation - empty or > 2000 chars
  // ---------------------------------------------------------------------------
  describe("API-NOTE-02: Internal Note validation", () => {
    it("rejects an empty Internal Note", async () => {
      const ticket = await prisma.ticket.findFirstOrThrow({ orderBy: { id: "asc" } });
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/notes`)
        .set("Cookie", staffCookie)
        .send({ content: "" });

      expect(response.status).toBe(400);
    });

    it("rejects a whitespace-only Internal Note", async () => {
      const ticket = await prisma.ticket.findFirstOrThrow({ orderBy: { id: "asc" } });
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/notes`)
        .set("Cookie", staffCookie)
        .send({ content: "   " });

      expect(response.status).toBe(400);
    });

    it("rejects an Internal Note exceeding 2000 characters", async () => {
      const ticket = await prisma.ticket.findFirstOrThrow({ orderBy: { id: "asc" } });
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/notes`)
        .set("Cookie", staffCookie)
        .send({ content: "N".repeat(2001) });

      expect(response.status).toBe(400);
    });

    it("accepts an Internal Note of exactly 2000 characters", async () => {
      const ticket = await prisma.ticket.findFirstOrThrow({ orderBy: { id: "asc" } });
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/notes`)
        .set("Cookie", staffCookie)
        .send({ content: "N".repeat(2000) });

      expect(response.status).toBe(201);
    });
  });
});

