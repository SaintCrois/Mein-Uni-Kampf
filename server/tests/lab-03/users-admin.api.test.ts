import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Issue 19: Administrator User Management", () => {
  const createdIds: number[] = [];
  async function adminCookie() {
    const response = await request(app).post("/api/auth/login").send({ email: "admin@example.com", password: "Password123!" });
    const cookies = response.headers["set-cookie"];
    return Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
  }
  afterEach(async () => {
    if (createdIds.length) await getPrisma().user.deleteMany({ where: { id: { in: createdIds.splice(0) } } });
  });

  it("allows an admin to list, search, and role-filter users without sensitive data", async () => {
    const cookie = await adminCookie();
    for (const query of ["?search=Narin%20Chaiyo", "?search=narin.chaiyo%40example.com", "?role=REQUESTER"]) {
      const response = await request(app).get(`/api/admin/users${query}`).set("Cookie", cookie);
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.every((user: { passwordHash?: string }) => user.passwordHash === undefined)).toBe(true);
    }
  });

  it("creates, edits, resets, and validates managed users", async () => {
    const cookie = await adminCookie();
    const email = `issue19-${Date.now()}@example.com`;
    const create = await request(app).post("/api/admin/users").set("Cookie", cookie).send({ name: "Managed User", email, role: "IT_STAFF", isActive: true, initialPassword: "Password123!" });
    expect(create.status).toBe(201); createdIds.push(create.body.id);
    expect(create.body.mustChangePassword).toBe(true);
    const duplicate = await request(app).post("/api/admin/users").set("Cookie", cookie).send({ name: "Duplicate", email: email.toUpperCase(), role: "REQUESTER", isActive: true, initialPassword: "Password123!" });
    expect(duplicate.status).toBe(409);
    const invalidRole = await request(app).post("/api/admin/users").set("Cookie", cookie).send({ name: "Invalid", email: `invalid-${Date.now()}@example.com`, role: "INVALID", isActive: true, initialPassword: "Password123!" });
    expect(invalidRole.status).toBe(400);
    const update = await request(app).patch(`/api/admin/users/${create.body.id}`).set("Cookie", cookie).send({ name: "Edited User", email: `edited-${Date.now()}@example.com`, role: "REQUESTER", isActive: false });
    expect(update.status).toBe(200); expect(update.body.name).toBe("Edited User"); expect(update.body.isActive).toBe(false);
    const reset = await request(app).post(`/api/admin/users/${create.body.id}/reset-password`).set("Cookie", cookie).send({ initialPassword: "Password123!" });
    expect(reset.status).toBe(200);
    expect((await getPrisma().user.findUniqueOrThrow({ where: { id: create.body.id } })).mustChangePassword).toBe(true);
  });

  it("blocks self-deactivation and deactivation when only one administrator remains", async () => {
    const prisma = getPrisma(); const cookie = await adminCookie();
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@example.com" } });
    const backup = await prisma.user.findUniqueOrThrow({ where: { email: "admin.backup@example.com" } });
    await prisma.user.update({ where: { id: backup.id }, data: { isActive: false } });
    try {
      const lastAdmin = await request(app).patch(`/api/admin/users/${admin.id}`).set("Cookie", cookie).send({ name: admin.name, email: admin.email, role: admin.role, isActive: false });
      expect(lastAdmin.status).toBe(400);
    } finally { await prisma.user.update({ where: { id: backup.id }, data: { isActive: backup.isActive } }); }
  });
});
