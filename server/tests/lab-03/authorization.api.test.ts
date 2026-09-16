import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 3 - Issue 15: Role-Based Authorization and Access Control", () => {
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

  // 1. Unauthenticated checks
  it("rejects unauthenticated requests to staff and admin endpoints with 401", async () => {
    const staffRes = await request(app).get("/api/staff/tickets");
    expect(staffRes.status).toBe(401);

    const adminRes = await request(app).get("/api/admin/users");
    expect(adminRes.status).toBe(401);
  });

  // 2. API-SEC-02: Requester accesses /api/staff/tickets -> 403 Forbidden
  it("API-SEC-02: blocks Requester from accessing IT Staff queue (/api/staff/tickets) with 403", async () => {
    const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

    const response = await request(app)
      .get("/api/staff/tickets")
      .set("Cookie", requesterCookie);

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/access denied/i);
  });

  // 3. API-SEC-03: Requester and IT Staff access /api/admin/users -> 403 Forbidden
  it("API-SEC-03: blocks Requester from accessing Admin user management (/api/admin/users) with 403", async () => {
    const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

    const response = await request(app)
      .get("/api/admin/users")
      .set("Cookie", requesterCookie);

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/access denied/i);
  });

  it("API-SEC-03: blocks IT Staff from accessing Admin user management (/api/admin/users) with 403", async () => {
    const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

    const response = await request(app)
      .get("/api/admin/users")
      .set("Cookie", staffCookie);

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/access denied/i);
  });

  // 4. Permitted Staff and Admin access
  it("allows IT Staff to access IT Staff queue (/api/staff/tickets)", async () => {
    const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

    const response = await request(app)
      .get("/api/staff/tickets")
      .set("Cookie", staffCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it("allows Administrator to access Admin user management (/api/admin/users)", async () => {
    const adminCookie = await getSessionCookie("admin@example.com");

    const response = await request(app)
      .get("/api/admin/users")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  // 5. API-SEC-01: Cross-requester ticket access rejection
  it("API-SEC-01: prevents Requester B from accessing Requester A's ticket with 403", async () => {
    const requesterA = await prisma.user.findUniqueOrThrow({
      where: { email: "narin.chaiyo@example.com" },
    });
    const ticketA = await prisma.ticket.findFirstOrThrow({
      where: { requesterId: requesterA.id },
    });

    const requesterBCookie = await getSessionCookie(
      "pimchanok.rattanakul@example.com",
    );

    const response = await request(app)
      .get(`/api/tickets/${ticketA.id}`)
      .set("Cookie", requesterBCookie);

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/access denied/i);
  });

  // 6. API-SEC-04: Internal note protection
  it("API-SEC-04: prevents Requester from reading or posting Internal Notes with 403", async () => {
    const ticket = await prisma.ticket.findFirstOrThrow();
    const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

    const readRes = await request(app)
      .get(`/api/tickets/${ticket.id}/notes`)
      .set("Cookie", requesterCookie);

    expect(readRes.status).toBe(403);
    expect(readRes.body.error).toMatch(/access denied/i);

    const postRes = await request(app)
      .post(`/api/tickets/${ticket.id}/notes`)
      .set("Cookie", requesterCookie)
      .send({ content: "Illegal internal note attempt" });

    expect(postRes.status).toBe(403);
    expect(postRes.body.error).toMatch(/access denied/i);
  });

  it("allows IT Staff to post and read Internal Notes", async () => {
    const ticket = await prisma.ticket.findFirstOrThrow();
    const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

    const postRes = await request(app)
      .post(`/api/tickets/${ticket.id}/notes`)
      .set("Cookie", staffCookie)
      .send({ content: "Operational internal note for authorization test" });

    expect(postRes.status).toBe(201);
    expect(postRes.body.data.content).toBe(
      "Operational internal note for authorization test",
    );

    const readRes = await request(app)
      .get(`/api/tickets/${ticket.id}/notes`)
      .set("Cookie", staffCookie);

    expect(readRes.status).toBe(200);
    expect(Array.isArray(readRes.body.data)).toBe(true);
    expect(
      readRes.body.data.some(
        (n: { content: string }) =>
          n.content === "Operational internal note for authorization test",
      ),
    ).toBe(true);
  });
});

