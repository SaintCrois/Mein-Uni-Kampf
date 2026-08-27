import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("GET /api/tickets/:id", () => {
  const prisma = getPrisma();

  async function getTestTicket() {
    const requester = await prisma.devRequester.findFirstOrThrow({
      where: { isActive: true },
      orderBy: { id: "asc" },
    });

    const otherRequester = await prisma.devRequester.findFirstOrThrow({
      where: {
        isActive: true,
        id: { not: requester.id },
      },
      orderBy: { id: "asc" },
    });

    const ticket = await prisma.ticket.findFirstOrThrow({
      where: {
        requesterId: requester.id,
      },
      orderBy: { id: "asc" },
    });

    return {
      requester,
      otherRequester,
      ticket,
    };
  }

  it("returns an owned ticket with its details and attachments", async () => {
    const { requester, ticket } = await getTestTicket();

    const response = await request(app)
      .get(`/api/tickets/${ticket.id}`)
      .set("X-Requester-Id", String(requester.id));

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("id", ticket.id);
    expect(response.body).toHaveProperty("ticketNumber");
    expect(response.body).toHaveProperty("summary");
    expect(response.body).toHaveProperty("description");
    expect(response.body).toHaveProperty("category");
    expect(response.body).toHaveProperty("relatedSystem");
    expect(response.body).toHaveProperty("requestedPriority");
    expect(response.body).toHaveProperty("currentStatus");
    expect(response.body).toHaveProperty("createdAt");
    expect(response.body).toHaveProperty("updatedAt");
    expect(response.body).toHaveProperty("attachments");

    expect(Array.isArray(response.body.attachments)).toBe(true);
  });

  it("does not allow another requester to access the ticket", async () => {
    const { otherRequester, ticket } = await getTestTicket();

    const response = await request(app)
      .get(`/api/tickets/${ticket.id}`)
      .set("X-Requester-Id", String(otherRequester.id));

    expect([403, 404]).toContain(response.status);
  });

  it("returns 404 for a non-existent ticket", async () => {
    const { requester } = await getTestTicket();

    const response = await request(app)
      .get("/api/tickets/999999")
      .set("X-Requester-Id", String(requester.id));

    expect(response.status).toBe(404);
  });

  it("requires requester context", async () => {
    const { ticket } = await getTestTicket();

    const response = await request(app)
      .get(`/api/tickets/${ticket.id}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Requester context is required");
  });
});
