import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app.js";

describe("GET /api/related-systems", () => {
  it("returns only active related systems", async () => {
    const response = await request(app).get("/api/related-systems");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    for (const system of response.body) {
      expect(system.isActive).toBeUndefined();
      expect(system).toHaveProperty("id");
      expect(system).toHaveProperty("name");
    }
  });
});
