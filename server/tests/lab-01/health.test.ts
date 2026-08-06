import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

// WORKED EXAMPLE — this test is written for you. Study it, then implement the
// /api/health route in src/app.ts until this test turns green. Use the same
// pattern to write the categories test yourself (see categories.test.ts).
describe("GET /api/health", () => {
  it("returns 200 with status ok and the service name", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", service: "TokTickIT API" });
  });
});
