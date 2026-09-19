import bcrypt from "bcrypt";
import { getPrisma } from "../src/prisma.js";

async function main() {
  const prisma = getPrisma();

  // 1. Categories
  const categories = ["Account and Access", "Hardware", "Software", "Network"];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, isActive: true },
    });
  }

  // 2. Related Systems
  const systems = [
    "Email",
    "Campus Wi-Fi",
    "VPN",
    "LEB2 App",
    "Grade Submission App",
    "Printer",
    "Corporate Laptop",
  ];
  for (const name of systems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: {},
      create: { name, isActive: true },
    });
  }

  // 3. Priorities
  const priorities = [
    { name: "Urgent", sortOrder: 4 },
    { name: "High", sortOrder: 3 },
    { name: "Medium", sortOrder: 2 },
    { name: "Low", sortOrder: 1 },
  ];
  for (const priority of priorities) {
    await prisma.priority.upsert({
      where: { name: priority.name },
      update: { sortOrder: priority.sortOrder },
      create: priority,
    });
  }

  // 4. Statuses
  const statuses = [
    { name: "New", isDefault: true },
    { name: "Open", isDefault: false },
    { name: "In Progress", isDefault: false },
    { name: "Waiting for Requester", isDefault: false },
    { name: "Resolved", isDefault: false },
    { name: "Closed", isDefault: false },
    { name: "Reopened", isDefault: false },
    { name: "Cancelled", isDefault: false },
    { name: "Pending", isDefault: false },
  ];
  for (const status of statuses) {
    await prisma.status.upsert({
      where: { name: status.name },
      update: { isDefault: status.isDefault },
      create: status,
    });
  }

  // 5. Users
  // Securely hashed password (never stored in plaintext)
  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);

  const usersToSeed = [
    // Requesters (at least 4 active, 1 inactive)
    {
      name: "Narin Chaiyo",
      email: "narin.chaiyo@example.com",
      role: "REQUESTER" as const,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Pimchanok Rattanakul",
      email: "pimchanok.rattanakul@example.com",
      role: "REQUESTER" as const,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Kittisak Boonmee",
      email: "kittisak.boonmee@example.com",
      role: "REQUESTER" as const,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Suda Wongsawat",
      email: "suda.wongsawat@example.com",
      role: "REQUESTER" as const,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Thanawat Saelim",
      email: "thanawat.saelim@example.com",
      role: "REQUESTER" as const,
      isActive: true,
      mustChangePassword: true,
    },
    {
      name: "Inactive Requester",
      email: "inactive.requester@example.com",
      role: "REQUESTER" as const,
      isActive: false,
      mustChangePassword: false,
    },
    // IT Staff (at least 3 active, 1 inactive)
    {
      name: "Somchai Jaidee",
      email: "somchai.jaidee@example.com",
      role: "IT_STAFF" as const,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Anong Prasert",
      email: "anong.prasert@example.com",
      role: "IT_STAFF" as const,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Chaiya Suksan",
      email: "chaiya.suksan@example.com",
      role: "IT_STAFF" as const,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Inactive Staff",
      email: "inactive.staff@example.com",
      role: "IT_STAFF" as const,
      isActive: false,
      mustChangePassword: false,
    },
    // Administrators (at least 1 active)
    {
      name: "System Administrator",
      email: "admin@example.com",
      role: "ADMINISTRATOR" as const,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Backup Administrator",
      email: "admin.backup@example.com",
      role: "ADMINISTRATOR" as const,
      isActive: true,
      mustChangePassword: false,
    },
  ];

  for (const user of usersToSeed) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        passwordHash: defaultPasswordHash,
      },
      create: {
        ...user,
        passwordHash: defaultPasswordHash,
      },
    });
  }

  // Pre-load reference maps for ticket creation
  const statusMap = new Map(
    (await prisma.status.findMany()).map((s) => [s.name, s]),
  );
  const priorityMap = new Map(
    (await prisma.priority.findMany()).map((p) => [p.name, p]),
  );
  const categoryMap = new Map(
    (await prisma.category.findMany()).map((c) => [c.name, c]),
  );
  const systemMap = new Map(
    (await prisma.relatedSystem.findMany()).map((s) => [s.name, s]),
  );
  const userMap = new Map(
    (await prisma.user.findMany()).map((u) => [u.email, u]),
  );

  // 6. Tickets (realistic tickets with various statuses, priorities, ownership)
  const ticketsToSeed = [
    {
      ticketNumber: "TKT-2026-000001",
      requesterEmail: "narin.chaiyo@example.com",
      categoryName: "Network",
      systemName: "Campus Wi-Fi",
      summary: "Cannot connect to campus Wi-Fi in Engineering Building",
      description: "Getting authentication error whenever trying to associate with campus Wi-Fi from 4th floor.",
      requestedPriorityName: "Medium",
      itPriorityName: null,
      statusName: "New",
      ownerEmail: null,
      requesterResolvedIndicator: false,
    },
    {
      ticketNumber: "TKT-2026-000002",
      requesterEmail: "pimchanok.rattanakul@example.com",
      categoryName: "Network",
      systemName: "VPN",
      summary: "VPN client disconnects intermittently during remote work",
      description: "The FortiClient VPN drops every 15-20 minutes when connecting to internal lab resources.",
      requestedPriorityName: "High",
      itPriorityName: "High",
      statusName: "Open",
      ownerEmail: "somchai.jaidee@example.com",
      requesterResolvedIndicator: false,
    },
    {
      ticketNumber: "TKT-2026-000003",
      requesterEmail: "kittisak.boonmee@example.com",
      categoryName: "Hardware",
      systemName: "Corporate Laptop",
      summary: "Corporate laptop blue screen after Windows update",
      description: "Encountered CRITICAL_PROCESS_DIED loop after applying the latest cumulative update.",
      requestedPriorityName: "Medium",
      itPriorityName: "Urgent",
      statusName: "In Progress",
      ownerEmail: "anong.prasert@example.com",
      requesterResolvedIndicator: false,
    },
    {
      ticketNumber: "TKT-2026-000004",
      requesterEmail: "suda.wongsawat@example.com",
      categoryName: "Software",
      systemName: "Grade Submission App",
      summary: "Grade Submission App session timeout during batch upload",
      description: "Session expires while preparing mid-term grade upload for CPE334 section.",
      requestedPriorityName: "High",
      itPriorityName: "High",
      statusName: "Waiting for Requester",
      ownerEmail: "chaiya.suksan@example.com",
      requesterResolvedIndicator: false,
    },
    {
      ticketNumber: "TKT-2026-000005",
      requesterEmail: "thanawat.saelim@example.com",
      categoryName: "Hardware",
      systemName: "Printer",
      summary: "Printer paper jam on 3rd floor communal lab",
      description: "Tray 2 is stuck with jammed heavy paper, toner warning is also blinking red.",
      requestedPriorityName: "Low",
      itPriorityName: "Low",
      statusName: "Resolved",
      ownerEmail: "somchai.jaidee@example.com",
      requesterResolvedIndicator: true,
    },
    {
      ticketNumber: "TKT-2026-000006",
      requesterEmail: "narin.chaiyo@example.com",
      categoryName: "Account and Access",
      systemName: "LEB2 App",
      summary: "LEB2 access denied for new semester course assignment",
      description: "Teaching assistant role permissions were missing on the section page.",
      requestedPriorityName: "Medium",
      itPriorityName: "Medium",
      statusName: "Closed",
      ownerEmail: "anong.prasert@example.com",
      requesterResolvedIndicator: false,
    },
    {
      ticketNumber: "TKT-2026-000007",
      requesterEmail: "pimchanok.rattanakul@example.com",
      categoryName: "Account and Access",
      systemName: "Email",
      summary: "Email quota exceeded error notification",
      description: "Mailbox reached 99% capacity and cannot receive external attachments.",
      requestedPriorityName: "Low",
      itPriorityName: null,
      statusName: "New",
      ownerEmail: null,
      requesterResolvedIndicator: false,
    },
    {
      ticketNumber: "TKT-2026-000008",
      requesterEmail: "kittisak.boonmee@example.com",
      categoryName: "Hardware",
      systemName: "Corporate Laptop",
      summary: "Secondary monitor not detected via HDMI docking station",
      description: "Dual screen setup fails to recognize the external DisplayPort/HDMI monitor.",
      requestedPriorityName: "Low",
      itPriorityName: "Medium",
      statusName: "In Progress",
      ownerEmail: "chaiya.suksan@example.com",
      requesterResolvedIndicator: false,
    },
    {
      ticketNumber: "TKT-2026-000009",
      requesterEmail: "suda.wongsawat@example.com",
      categoryName: "Account and Access",
      systemName: "Email",
      summary: "Password reset request for department shared mailbox",
      description: "Shared mailbox credentials expired and need recovery.",
      requestedPriorityName: "High",
      itPriorityName: "High",
      statusName: "Reopened",
      ownerEmail: "somchai.jaidee@example.com",
      requesterResolvedIndicator: false,
    },
    {
      ticketNumber: "TKT-2026-000010",
      requesterEmail: "thanawat.saelim@example.com",
      categoryName: "Software",
      systemName: "LEB2 App",
      summary: "Accidental duplicate request for lab software license",
      description: "Created by mistake, please cancel this request.",
      requestedPriorityName: "Low",
      itPriorityName: "Low",
      statusName: "Cancelled",
      ownerEmail: null,
      requesterResolvedIndicator: false,
    },
  ];

  for (const t of ticketsToSeed) {
    const requester = userMap.get(t.requesterEmail)!;
    const category = categoryMap.get(t.categoryName)!;
    const system = systemMap.get(t.systemName)!;
    const requestedPriority = priorityMap.get(t.requestedPriorityName)!;
    const itPriority = t.itPriorityName ? priorityMap.get(t.itPriorityName) : null;
    const status = statusMap.get(t.statusName)!;
    const owner = t.ownerEmail ? userMap.get(t.ownerEmail) : null;

    const ticketData = {
      requesterId: requester.id,
      categoryId: category.id,
      relatedSystemId: system.id,
      summary: t.summary,
      description: t.description,
      requestedPriorityId: requestedPriority.id,
      itPriorityId: itPriority ? itPriority.id : null,
      currentStatusId: status.id,
      ownerId: owner ? owner.id : null,
      requesterResolvedIndicator: t.requesterResolvedIndicator,
    };

    await prisma.ticket.upsert({
      where: { ticketNumber: t.ticketNumber },
      update: ticketData,
      create: {
        ticketNumber: t.ticketNumber,
        ...ticketData,
      },
    });
  }

  // 7. Example Public Comments
  const vpnTicket = await prisma.ticket.findUnique({
    where: { ticketNumber: "TKT-2026-000002" },
  });
  const pimchanok = userMap.get("pimchanok.rattanakul@example.com")!;
  const somchai = userMap.get("somchai.jaidee@example.com")!;

  if (vpnTicket) {
    const comment1 = "I have attached the client log file showing the reconnect drops.";
    const existingComment1 = await prisma.publicComment.findFirst({
      where: { ticketId: vpnTicket.id, content: comment1 },
    });
    if (!existingComment1) {
      await prisma.publicComment.create({
        data: {
          ticketId: vpnTicket.id,
          authorId: pimchanok.id,
          content: comment1,
        },
      });
    }

    const comment2 = "Thanks Pimchanok, we see an MTU mismatch in the log. We are pushing a configuration profile update.";
    const existingComment2 = await prisma.publicComment.findFirst({
      where: { ticketId: vpnTicket.id, content: comment2 },
    });
    if (!existingComment2) {
      await prisma.publicComment.create({
        data: {
          ticketId: vpnTicket.id,
          authorId: somchai.id,
          content: comment2,
        },
      });
    }
  }

  // 8. Example Internal Notes
  const bsodTicket = await prisma.ticket.findUnique({
    where: { ticketNumber: "TKT-2026-000003" },
  });
  const anong = userMap.get("anong.prasert@example.com")!;

  if (bsodTicket) {
    const note1 = "Driver version 24.12 causes conflict with BitLocker TPM state. Preparing rollback media.";
    const existingNote1 = await prisma.internalNote.findFirst({
      where: { ticketId: bsodTicket.id, content: note1 },
    });
    if (!existingNote1) {
      await prisma.internalNote.create({
        data: {
          ticketId: bsodTicket.id,
          authorId: anong.id,
          content: note1,
        },
      });
    }

    const note2 = "Confirmed on test device. Advised user to bring device to Service Desk if rollback fails.";
    const existingNote2 = await prisma.internalNote.findFirst({
      where: { ticketId: bsodTicket.id, content: note2 },
    });
    if (!existingNote2) {
      await prisma.internalNote.create({
        data: {
          ticketId: bsodTicket.id,
          authorId: somchai.id,
          content: note2,
        },
      });
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});