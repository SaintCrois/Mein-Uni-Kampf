import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Attachment lifecycle", () => {
  const prisma = getPrisma();

  async function createTestTicket() {
    const requester = await prisma.devRequester.findFirstOrThrow({
      where: { isActive: true },
      orderBy: { id: "asc" },
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

    const status = await prisma.status.findFirstOrThrow({
      where: { name: "New" },
    });

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TEST-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        requesterId: requester.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Attachment lifecycle test",
        description: "Ticket used to test attachment lifecycle behavior.",
        requestedPriorityId: priority.id,
        currentStatusId: status.id,
      },
    });

    return {
      requester,
      ticket,
    };
  }

  it("downloads an active attachment owned by the requester", async () => {
    const { requester, ticket } = await createTestTicket();

    const uploadResponse = await request(app)
      .post(`/api/tickets/${ticket.id}/attachments`)
      .set("X-Requester-Id", String(requester.id))
      .attach("files", Buffer.from("download test content"), {
        filename: "download-test.pdf",
        contentType: "application/pdf",
      });

    expect(uploadResponse.status).toBe(201);

    const attachmentId = uploadResponse.body.data[0].id;

    const response = await request(app)
      .get(`/api/tickets/${ticket.id}/attachments/${attachmentId}/download`)
      .set("X-Requester-Id", String(requester.id));

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(Buffer.from(response.body).toString()).toBe(
      "download test content",
    );
  });

  it("does not allow another requester to download an attachment", async () => {
    const { requester, ticket } = await createTestTicket();

    const otherRequester = await prisma.devRequester.findFirstOrThrow({
      where: {
        isActive: true,
        id: { not: requester.id },
      },
      orderBy: { id: "asc" },
    });

    const uploadResponse = await request(app)
      .post(`/api/tickets/${ticket.id}/attachments`)
      .set("X-Requester-Id", String(requester.id))
      .attach("files", Buffer.from("ownership test"), {
        filename: "ownership-test.pdf",
        contentType: "application/pdf",
      });

    expect(uploadResponse.status).toBe(201);

    const attachmentId = uploadResponse.body.data[0].id;

    const response = await request(app)
      .get(`/api/tickets/${ticket.id}/attachments/${attachmentId}`)
      .set("X-Requester-Id", String(otherRequester.id));

    expect([403, 404]).toContain(response.status);
  });

  it("requires a removal reason", async () => {
    const { requester, ticket } = await createTestTicket();

    const uploadResponse = await request(app)
      .post(`/api/tickets/${ticket.id}/attachments`)
      .set("X-Requester-Id", String(requester.id))
      .attach("files", Buffer.from("removal test"), {
        filename: "removal-test.pdf",
        contentType: "application/pdf",
      });

    expect(uploadResponse.status).toBe(201);

    const attachmentId = uploadResponse.body.data[0].id;

    const response = await request(app)
      .delete(
        `/api/tickets/${ticket.id}/attachments/${attachmentId}`,
      )
      .set("X-Requester-Id", String(requester.id))
      .send({});

    expect(response.status).toBe(400);
  });

  it("soft-removes an attachment with a reason and blocks later download", async () => {
    const { requester, ticket } = await createTestTicket();

    const uploadResponse = await request(app)
      .post(`/api/tickets/${ticket.id}/attachments`)
      .set("X-Requester-Id", String(requester.id))
      .attach("files", Buffer.from("soft removal test"), {
        filename: "soft-removal-test.pdf",
        contentType: "application/pdf",
      });

    expect(uploadResponse.status).toBe(201);

    const attachmentId = uploadResponse.body.data[0].id;

    const deleteResponse = await request(app)
      .delete(
        `/api/tickets/${ticket.id}/attachments/${attachmentId}`,
      )
      .set("X-Requester-Id", String(requester.id))
      .send({
        reason: "Uploaded wrong file",
      });

    expect(deleteResponse.status).toBe(200);

    const attachment = await prisma.attachment.findUniqueOrThrow({
      where: { id: attachmentId },
    });

    expect(attachment.status).toBe("REMOVED");
    expect(attachment.removalReason).toBe("Uploaded wrong file");
    expect(attachment.removedAt).not.toBeNull();

    const downloadResponse = await request(app)
      .get(`/api/tickets/${ticket.id}/attachments/${attachmentId}`)
      .set("X-Requester-Id", String(requester.id));

    expect([403, 404]).toContain(downloadResponse.status);
  });
});
