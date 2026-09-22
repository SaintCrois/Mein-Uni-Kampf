import { describe, expect, it } from "vitest";
import bcrypt from "bcrypt";
import { getPrisma } from "../../src/prisma.js";

describe("Issue 13: User Model Migration and Lab 3 Seed Data", () => {
  const prisma = getPrisma();

  it("seeds at least 4 active Requesters and at least 1 inactive Requester", async () => {
    const activeRequesters = await prisma.user.findMany({
      where: { role: "REQUESTER", isActive: true },
    });
    const inactiveRequesters = await prisma.user.findMany({
      where: { role: "REQUESTER", isActive: false },
    });

    expect(activeRequesters.length).toBeGreaterThanOrEqual(4);
    expect(inactiveRequesters.length).toBeGreaterThanOrEqual(1);

    for (const user of activeRequesters) {
      expect(user.role).toBe("REQUESTER");
      expect(user.isActive).toBe(true);
      expect(user.email).toBeTruthy();
      expect(user.name).toBeTruthy();
    }
  });

  it("seeds at least 3 active IT Staff and at least 1 inactive IT Staff", async () => {
    const activeStaff = await prisma.user.findMany({
      where: { role: "IT_STAFF", isActive: true },
    });
    const inactiveStaff = await prisma.user.findMany({
      where: { role: "IT_STAFF", isActive: false },
    });

    expect(activeStaff.length).toBeGreaterThanOrEqual(3);
    expect(inactiveStaff.length).toBeGreaterThanOrEqual(1);

    for (const staff of activeStaff) {
      expect(staff.role).toBe("IT_STAFF");
      expect(staff.isActive).toBe(true);
    }
  });

  it("seeds at least 1 active Administrator", async () => {
    const activeAdmins = await prisma.user.findMany({
      where: { role: "ADMINISTRATOR", isActive: true },
    });

    expect(activeAdmins.length).toBeGreaterThanOrEqual(1);
    for (const admin of activeAdmins) {
      expect(admin.role).toBe("ADMINISTRATOR");
      expect(admin.isActive).toBe(true);
    }
  });

  it("ensures passwords are never stored in plaintext and match bcrypt hash format", async () => {
    const users = await prisma.user.findMany();
    expect(users.length).toBeGreaterThan(0);

    const bcryptRegex = /^\$2[aby]?\$\d{1,2}\$[./0-9A-Za-z]{53}$/;

    for (const user of users) {
      expect(user.passwordHash).toMatch(bcryptRegex);
      expect(user.passwordHash).not.toBe("Password123!");
    }

    // Verify that primary seeded accounts match the default seed password
    const seedUser = await prisma.user.findFirst({
      where: { email: "narin.chaiyo@example.com" },
    });
    if (seedUser) {
      const isMatch = bcrypt.compareSync("Password123!", seedUser.passwordHash);
      expect(isMatch).toBe(true);
    }
  });

  it("preserves categories, related systems, and tickets from Lab 2", async () => {
    const categories = await prisma.category.findMany();
    expect(categories.length).toBeGreaterThanOrEqual(4);

    const systems = await prisma.relatedSystem.findMany();
    expect(systems.length).toBeGreaterThanOrEqual(7);

    const tickets = await prisma.ticket.findMany({
      include: {
        requester: true,
        category: true,
        relatedSystem: true,
      },
    });
    expect(tickets.length).toBeGreaterThanOrEqual(10);

    for (const ticket of tickets) {
      expect(ticket.requesterId).toBe(ticket.requester.id);
      expect(ticket.requester.role).toBe("REQUESTER");
      expect(ticket.categoryId).toBe(ticket.category.id);
      expect(ticket.relatedSystemId).toBe(ticket.relatedSystem.id);
    }
  });

  it("seeds realistic tickets with different statuses, priorities, and ownership", async () => {
    const tickets = await prisma.ticket.findMany({
      include: {
        currentStatus: true,
        requestedPriority: true,
        itPriority: true,
        owner: true,
      },
    });

    const statusNames = new Set(tickets.map((t) => t.currentStatus.name));
    expect(statusNames.has("New")).toBe(true);
    expect(statusNames.has("Open")).toBe(true);
    expect(statusNames.has("In Progress")).toBe(true);
    expect(statusNames.has("Resolved")).toBe(true);

    const ownedTickets = tickets.filter((t) => t.ownerId !== null);
    const unassignedTickets = tickets.filter((t) => t.ownerId === null);
    expect(ownedTickets.length).toBeGreaterThan(0);
    expect(unassignedTickets.length).toBeGreaterThan(0);

    for (const ticket of ownedTickets) {
      expect(["IT_STAFF", "ADMINISTRATOR"]).toContain(ticket.owner?.role);
    }

    const dualPriorityTickets = tickets.filter(
      (t) => t.itPriorityId !== null && t.requestedPriorityId !== t.itPriorityId,
    );
    expect(dualPriorityTickets.length).toBeGreaterThan(0);
  });

  it("seeds example Public Comments and Internal Notes with proper author relations", async () => {
    const comments = await prisma.publicComment.findMany({
      include: { author: true, ticket: true },
    });
    expect(comments.length).toBeGreaterThanOrEqual(2);

    for (const comment of comments) {
      expect(comment.content.trim().length).toBeGreaterThan(0);
      expect(comment.author).toBeDefined();
      expect(comment.ticket).toBeDefined();
    }

    const notes = await prisma.internalNote.findMany({
      include: { author: true, ticket: true },
    });
    expect(notes.length).toBeGreaterThanOrEqual(2);

    for (const note of notes) {
      expect(note.content.trim().length).toBeGreaterThan(0);
      expect(note.author).toBeDefined();
      expect(["IT_STAFF", "ADMINISTRATOR"]).toContain(note.author.role);
      expect(note.ticket).toBeDefined();
    }
  });
});

