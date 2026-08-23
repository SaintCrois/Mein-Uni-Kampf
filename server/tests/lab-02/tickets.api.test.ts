import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app.js";

describe("POST /api/tickets", () => {
  it("creates a ticket with a generated ticket number and New status", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .send({
        requesterId: 1,
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Test ticket creation",
        description: "This is a test ticket created by the API test.",
        requestedPriorityId: 1,
      });

    expect(response.status).toBe(201);

    expect(response.body).toHaveProperty("ticketNumber");
    expect(response.body.ticketNumber).toMatch(/^TKT-/);

    expect(response.body).toHaveProperty("status");
    expect(response.body.status).toBe("New");

    expect(response.body).toHaveProperty("requesterId");
    expect(response.body.requesterId).toBe(1);
  });

  it("rejects an inactive requester", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .send({
        requesterId: 6,
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Inactive requester test",
        description: "This ticket should not be created.",
        requestedPriorityId: 1,
      });

    expect(response.status).toBe(400);
  });

  it("rejects a missing summary", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .send({
        requesterId: 1,
        categoryId: 1,
        relatedSystemId: 1,
        description: "Missing summary test.",
        requestedPriorityId: 1,
      });

    expect(response.status).toBe(400);
  });

  it("rejects a missing description", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .send({
        requesterId: 1,
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Missing description test",
        requestedPriorityId: 1,
      });

    expect(response.status).toBe(400);
  });
});