import request from "supertest";
import { describe, expect, it, beforeEach, afterAll } from "vitest";
import bcrypt from "bcrypt";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 3 - Issue 14: Authentication and First-Login Password Change", () => {
  const prisma = getPrisma();

  async function resetTestUser() {
    const defaultPasswordHash = await bcrypt.hash("Password123!", 10);
    await prisma.user.update({
      where: { email: "thanawat.saelim@example.com" },
      data: {
        passwordHash: defaultPasswordHash,
        mustChangePassword: true,
      },
    });
  }

  beforeEach(async () => {
    await resetTestUser();
  });

  afterAll(async () => {
    const defaultPasswordHash = await bcrypt.hash("Password123!", 10);
    await prisma.user.update({
      where: { email: "thanawat.saelim@example.com" },
      data: {
        passwordHash: defaultPasswordHash,
        mustChangePassword: true,
      },
    });
  });

  // API-AUTH-01: Valid credential authentication
  it("API-AUTH-01: authenticates valid credentials, sets session cookie, and returns user profile without passwordHash", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "narin.chaiyo@example.com",
        password: "Password123!",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("user");
    expect(response.body.user.email).toBe("narin.chaiyo@example.com");
    expect(response.body.user.role).toBe("REQUESTER");
    expect(response.body.user).not.toHaveProperty("passwordHash");
    expect(response.body.user).not.toHaveProperty("password");

    const rawCookies = response.headers["set-cookie"] as unknown;
    const cookieArray: string[] = Array.isArray(rawCookies)
      ? rawCookies
      : typeof rawCookies === "string"
        ? [rawCookies]
        : [];
    expect(cookieArray.length).toBeGreaterThan(0);
    expect(cookieArray.some((c: string) => c.startsWith("toktickit_session="))).toBe(true);
  });

  // API-AUTH-02: Invalid password or unknown email
  it("API-AUTH-02: rejects invalid password with 401 without leaking details", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "narin.chaiyo@example.com",
        password: "WrongPassword999!",
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid email or password");
    expect(response.headers["set-cookie"]).toBeUndefined();
  });

  it("API-AUTH-02: rejects non-existent email with 401", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "doesnotexist@example.com",
        password: "Password123!",
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid email or password");
  });

  // API-AUTH-03: Deactivated account authentication
  it("API-AUTH-03: rejects inactive account with safe 401 message", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "inactive.requester@example.com",
        password: "Password123!",
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid email or password");
    expect(response.headers["set-cookie"]).toBeUndefined();
  });

  // API-AUTH-07: Current user retrieval (GET /api/auth/me)
  it("API-AUTH-07: rejects /api/auth/me without authentication", async () => {
    const response = await request(app).get("/api/auth/me");
    expect(response.status).toBe(401);
  });

  it("API-AUTH-07: returns current authenticated user profile via session cookie", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "somchai.jaidee@example.com",
        password: "Password123!",
      });

    const cookie = loginRes.headers["set-cookie"];

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user).toBeDefined();
    expect(meRes.body.user.email).toBe("somchai.jaidee@example.com");
    expect(meRes.body.user.role).toBe("IT_STAFF");
    expect(meRes.body.user).not.toHaveProperty("passwordHash");
  });

  // API-AUTH-08: Logout action
  it("API-AUTH-08: clears session cookie on logout and prevents subsequent access", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@example.com",
        password: "Password123!",
      });

    const cookie = loginRes.headers["set-cookie"];

    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookie);

    expect(logoutRes.status).toBe(200);

    const rawCleared = logoutRes.headers["set-cookie"] as unknown;
    const clearedArray: string[] = Array.isArray(rawCleared)
      ? rawCleared
      : typeof rawCleared === "string"
        ? [rawCleared]
        : [];
    expect(clearedArray.length).toBeGreaterThan(0);
    expect(clearedArray.some((c: string) => c.includes("toktickit_session=;"))).toBe(true);

    // Using cleared cookie fails
    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Cookie", clearedArray);

    expect(meRes.status).toBe(401);
  });

  // API-AUTH-04: User with mustChangePassword tries normal API
  it("API-AUTH-04: blocks normal API access for user with mustChangePassword: true", async () => {
    // Ensure thanawat.saelim has mustChangePassword: true
    await prisma.user.update({
      where: { email: "thanawat.saelim@example.com" },
      data: { mustChangePassword: true },
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "thanawat.saelim@example.com",
        password: "Password123!",
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.mustChangePassword).toBe(true);

    const cookie = loginRes.headers["set-cookie"];

    // Attempt to access tickets endpoint
    const ticketsRes = await request(app)
      .get("/api/tickets")
      .set("Cookie", cookie);

    expect(ticketsRes.status).toBe(403);
    expect(ticketsRes.body.error).toMatch(/password change required/i);
  });

  // API-AUTH-06: Change password validation failures
  it("API-AUTH-06: rejects password change with less than 8 characters", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "thanawat.saelim@example.com",
        password: "Password123!",
      });

    const cookie = loginRes.headers["set-cookie"];

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Cookie", cookie)
      .send({
        currentPassword: "Password123!",
        newPassword: "short",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 8 characters/i);
  });

  it("API-AUTH-06: rejects password change when current password is wrong", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "thanawat.saelim@example.com",
        password: "Password123!",
      });

    const cookie = loginRes.headers["set-cookie"];

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Cookie", cookie)
      .send({
        currentPassword: "WrongCurrentPassword!",
        newPassword: "BrandNewPassword123!",
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/current password verification failed/i);
  });

  it("API-AUTH-06: rejects password change when new password is same as current", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "thanawat.saelim@example.com",
        password: "Password123!",
      });

    const cookie = loginRes.headers["set-cookie"];

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Cookie", cookie)
      .send({
        currentPassword: "Password123!",
        newPassword: "Password123!",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/different/i);
  });

  // API-AUTH-05: Valid first-login password change
  it("API-AUTH-05: successfully updates password, clears mustChangePassword, and unlocks normal API", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "thanawat.saelim@example.com",
        password: "Password123!",
      });

    const cookie = loginRes.headers["set-cookie"];

    const changeRes = await request(app)
      .post("/api/auth/change-password")
      .set("Cookie", cookie)
      .send({
        currentPassword: "Password123!",
        newPassword: "FreshPassword2026!",
      });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.message).toMatch(/success/i);

    // In DB, mustChangePassword is now false
    const updatedUser = await prisma.user.findUnique({
      where: { email: "thanawat.saelim@example.com" },
    });
    expect(updatedUser?.mustChangePassword).toBe(false);

    // Old password no longer works
    const oldLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: "thanawat.saelim@example.com",
        password: "Password123!",
      });
    expect(oldLogin.status).toBe(401);

    // New password works
    const newLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: "thanawat.saelim@example.com",
        password: "FreshPassword2026!",
      });
    expect(newLogin.status).toBe(200);
    expect(newLogin.body.user.mustChangePassword).toBe(false);

    const newCookie = newLogin.headers["set-cookie"];

    // Normal API is now accessible
    const ticketsRes = await request(app)
      .get("/api/tickets")
      .set("Cookie", newCookie);

    expect(ticketsRes.status).toBe(200);
  });
});
