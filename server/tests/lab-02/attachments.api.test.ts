import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("POST /api/tickets/:ticketId/attachments", () => {
  const prisma = getPrisma();

  async function getTestData() {
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
      orderBy: { id: "desc" },
    });

    return {
      requester,
      otherRequester,
      ticket,
    };
  }

  it("uploads a valid attachment", async () => {
    const { requester, ticket } = await getTestData();

    const response = await request(app)
      .post(`/api/tickets/${ticket.id}/attachments`)
      .set("X-Requester-Id", String(requester.id))
      .attach("files", Buffer.from("test attachment"), {
        filename: "test.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(201);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(1);

    expect(response.body.data[0]).toHaveProperty("originalFileName");
    expect(response.body.data[0].originalFileName).toBe("test.pdf");
    expect(response.body.data[0].mimeType).toBe("application/pdf");
    expect(response.body.data[0].status).toBe("ACTIVE");
  });

  it("rejects an attachment from a different requester", async () => {
    const { otherRequester, ticket } = await getTestData();

    const response = await request(app)
      .post(`/api/tickets/${ticket.id}/attachments`)
      .set("X-Requester-Id", String(otherRequester.id))
      .attach("files", Buffer.from("test attachment"), {
        filename: "test.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(403);
  });

  it("rejects an unsupported file type", async () => {
    const { requester, ticket } = await getTestData();

    const response = await request(app)
      .post(`/api/tickets/${ticket.id}/attachments`)
      .set("X-Requester-Id", String(requester.id))
      .attach("files", Buffer.from("not an image"), {
        filename: "test.txt",
        contentType: "text/plain",
      });

    expect(response.status).toBe(400);
  });

  it("rejects a file larger than 5 MiB", async () => {
    const { requester, ticket } = await getTestData();

    const largeFile = Buffer.alloc(5 * 1024 * 1024 + 1);

    const response = await request(app)
      .post(`/api/tickets/${ticket.id}/attachments`)
      .set("X-Requester-Id", String(requester.id))
      .attach("files", largeFile, {
        filename: "large.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(400);
  });

  it("rejects a nonexistent ticket", async () => {
    const { requester } = await getTestData();

    const response = await request(app)
      .post("/api/tickets/999999/attachments")
      .set("X-Requester-Id", String(requester.id))
      .attach("files", Buffer.from("test"), {
        filename: "test.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(404);
  });

  it("rejects more than 5 attachments", async () => {
    const { requester, ticket } = await getTestData();

    const upload = request(app)
      .post(`/api/tickets/${ticket.id}/attachments`)
      .set("X-Requester-Id", String(requester.id));

    for (let i = 1; i <= 6; i++) {
      upload.attach(
        "files",
        Buffer.from(`test attachment ${i}`),
        {
          filename: `test-${i}.pdf`,
          contentType: "application/pdf",
        },
      );
    }

    const response = await upload;

    expect(response.status).toBe(400);
  });

});
