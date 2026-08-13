import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

// Issue 4 — write this test yourself, using health.test.ts as the pattern.
// Requires the DB to be migrated and seeded first.
// It should assert: GET /api/categories returns 200 and the four seeded
// category names in id order.
describe("GET /api/categories", () => {
  it("returns the four seeded categories in id order", async () => {
    const response = await request(app).get("/api/categories");

    // 1. Assert HTTP Status Code is 200 OK
    expect(response.status).toBe(200);

    // 2. Assert response body contains exactly 4 categories
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(4);

    // 3. Assert category names match in ID order
    const categoryNames = response.body.map((category: { name: string }) => category.name);
    expect(categoryNames).toEqual([
      "Account and Access",
      "Hardware",
      "Software",
      "Network",
    ]);

    // 4. Assert IDs are sorted in ascending order
    const ids = response.body.map((category: { id: number }) => category.id);
    const sortedIds = [...ids].sort((a, b) => a - b);
    expect(ids).toEqual(sortedIds);
  });
});