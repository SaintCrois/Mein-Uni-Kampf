import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";


describe("POST /api/tickets", () => {
  const prisma = getPrisma();

  async function getTestData() {
    const requester = await prisma.devRequester.findFirstOrThrow({
      where: { isActive: true },
      orderBy: { id: "asc" },
    });
    const inactiveRequester = await prisma.devRequester.findFirstOrThrow({
      where: { isActive: false },
    });
    const category = await prisma.category.findFirstOrThrow({
      where: { isActive: true },
      orderBy: { id: "asc" },
    });
    const relatedSystem = await prisma.relatedSystem.findFirstOrThrow({
      where: { isActive: true },
      orderBy: { id: "asc" },
    });
    const priority = await prisma.priority.findFirstOrThrow({
      where: { name: "High" },
    });

    return {
      requester,
      inactiveRequester,
      category,
      relatedSystem,
      priority,
    };
  }

  it("creates a ticket with a generated ticket number and New status", async () => {
    const {
      requester,
      category,
      relatedSystem,
      priority,
    } = await getTestData();

    const response = await request(app)
      .post("/api/tickets")
      .set(
        "X-Requester-Id",
        String(requester.id),
      )
      .send({

        requesterId: requester.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Test ticket creation",
        description: "This is a test ticket created by the API test.",
        requestedPriorityId: priority.id,
      });


    expect(response.status).toBe(201);

    expect(response.body).toHaveProperty("ticketNumber");
    expect(response.body.ticketNumber).toMatch(/^TKT-/);

    expect(response.body).toHaveProperty("status");
    expect(response.body.status).toBe("New");

    expect(response.body).toHaveProperty("requesterId");
    expect(response.body.requesterId).toBe(requester.id);
  });

  it("rejects an inactive requester", async () => {
    const {
      inactiveRequester,
      category,
      relatedSystem,
      priority,
    } = await getTestData();

    const response = await request(app)
      .post("/api/tickets")
      .set(
        "X-Requester-Id",
        String(inactiveRequester.id),
      )
      .send({

        requesterId: inactiveRequester.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Inactive requester test",
        description: "This ticket should not be created.",
        requestedPriorityId: priority.id,
      });

    expect(response.status).toBe(400);
  });


  it("rejects a missing summary", async () => {
    const {
      requester,
      category,
      relatedSystem,
      priority,
    } = await getTestData();

    const response = await request(app)
      .post("/api/tickets")
      .set(
        "X-Requester-Id",
        String(requester.id),
      )
      .send({
        requesterId: requester.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        description: "Missing summary test.",
        requestedPriorityId: priority.id,
      });

    expect(response.status).toBe(400);
  });


  it("rejects a missing description", async () => {
    const {
      requester,
      category,
      relatedSystem,
      priority,
    } = await getTestData();

    const response = await request(app)
      .post("/api/tickets")
      .set(
        "X-Requester-Id",
        String(requester.id),
      )
      .send({
        requesterId: requester.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Missing description test",
        requestedPriorityId: priority.id,
      });

    expect(response.status).toBe(400);
  });
  it("rejects a ticket when the requester does not match the authenticated requester", async () => {
    const {
      requester,
      category,
      relatedSystem,
      priority,
    } = await getTestData();

    const otherRequester = await prisma.devRequester.findFirstOrThrow({
      where: {
        isActive: true,
        id: { not: requester.id },
      },
    });

    const response = await request(app)
      .post("/api/tickets")
      .set(
        "X-Requester-Id",
        String(requester.id),
      )
      .send({
        requesterId: otherRequester.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Ownership test",
        description: "This should be rejected.",
        requestedPriorityId: priority.id,
      });

    expect(response.status).toBe(403);
  });
  it("rejects a summary longer than 150 characters", async () => {
    const {
      requester,
      category,
      relatedSystem,
      priority,
    } = await getTestData();

    const response = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", String(requester.id))
      .send({
        requesterId: requester.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "A".repeat(151),
        description: "Summary length test.",
        requestedPriorityId: priority.id,
      });

    expect(response.status).toBe(400);
  });

  it("rejects a description longer than 2000 characters", async () => {
    const {
      requester,
      category,
      relatedSystem,
      priority,
    } = await getTestData();

    const response = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", String(requester.id))
      .send({
        requesterId: requester.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Description length test",
        description: "A".repeat(2001),
        requestedPriorityId: priority.id,
      });

    expect(response.status).toBe(400);
  });

  it("rejects an invalid category", async () => {
    const {
      requester,
      relatedSystem,
      priority,
    } = await getTestData();

    const response = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", String(requester.id))
      .send({
        requesterId: requester.id,
        categoryId: 999999,
        relatedSystemId: relatedSystem.id,
        summary: "Invalid category test",
        description: "This should be rejected.",
        requestedPriorityId: priority.id,
      });

    expect(response.status).toBe(400);
  });

  it("rejects an invalid related system", async () => {
    const {
      requester,
      category,
      priority,
    } = await getTestData();

    const response = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", String(requester.id))
      .send({
        requesterId: requester.id,
        categoryId: category.id,
        relatedSystemId: 999999,
        summary: "Invalid system test",
        description: "This should be rejected.",
        requestedPriorityId: priority.id,
      });

    expect(response.status).toBe(400);
  });

  it("rejects an invalid priority", async () => {
    const {
      requester,
      category,
      relatedSystem,
    } = await getTestData();

    const response = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", String(requester.id))
      .send({
        requesterId: requester.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Invalid priority test",
        description: "This should be rejected.",
        requestedPriorityId: 999999,
      });

    expect(response.status).toBe(400);
  });
  it("generates unique ticket numbers", async () => {
    const {
      requester,
      category,
      relatedSystem,
      priority,
    } = await getTestData();

    const firstResponse = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", String(requester.id))
      .send({
        requesterId: requester.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Unique number test one",
        description: "First ticket for unique number test.",
        requestedPriorityId: priority.id,
      });

    const secondResponse = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", String(requester.id))
      .send({
        requesterId: requester.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Unique number test two",
        description: "Second ticket for unique number test.",
        requestedPriorityId: priority.id,
      });

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(201);

    expect(firstResponse.body.ticketNumber).toMatch(/^TKT-/);
    expect(secondResponse.body.ticketNumber).toMatch(/^TKT-/);

    expect(firstResponse.body.ticketNumber).not.toBe(
      secondResponse.body.ticketNumber,
    );
  });

});