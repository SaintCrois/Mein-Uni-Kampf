import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app.js";

describe("GET /api/dev-requesters", () => {
  it("returns only active development requesters", async () => {
    const response = await request(app).get("/api/dev-requesters");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);

    expect(response.body.data.length).toBeGreaterThanOrEqual(4);

    for (const requester of response.body.data) {
      expect(requester.isActive).toBe(true);
    }

    expect(
      response.body.data.some(
        (requester: { email: string }) =>
          requester.email === "inactive.requester@example.com",
      ),
    ).toBe(false);
  });
});