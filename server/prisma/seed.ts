import { getPrisma } from "../src/prisma.js";

async function main() {
  const prisma = getPrisma();

  const categories = ["Account and Access", "Hardware", "Software", "Network"];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, isActive: true },
    });
  }

  const systems = ["Email", "Campus Wi-Fi", "VPN", "LEB2 App", "Grade Submission App", "Printer", "Corporate Laptop"];
  for (const name of systems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: {},
      create: { name, isActive: true },
    });
  }

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

  const statuses = [
    { name: "New", isDefault: true },
    { name: "Open", isDefault: false },
    { name: "In Progress", isDefault: false },
    { name: "Pending", isDefault: false },
  ];
  for (const status of statuses) {
    await prisma.status.upsert({
      where: { name: status.name },
      update: { isDefault: status.isDefault },
      create: status,
    });

  }
  

  const requesters = [
    ["Narin Chaiyo", "narin.chaiyo@example.com"],
    ["Pimchanok Rattanakul", "pimchanok.rattanakul@example.com"],
    ["Kittisak Boonmee", "kittisak.boonmee@example.com"],
    ["Suda Wongsawat", "suda.wongsawat@example.com"],
    ["Thanawat Saelim", "thanawat.saelim@example.com"],
  ];
  for (const [fullName, email] of requesters) {
    await prisma.devRequester.upsert({
      where: { email },
      update: { fullName, isActive: true },
      create: { fullName, email, isActive: true },
    });
  }
  await prisma.devRequester.upsert({
    where: { email: "inactive.requester@example.com" },
    update: { fullName: "Inactive Requester", isActive: false },
    create: {
      fullName: "Inactive Requester",
      email: "inactive.requester@example.com",
      isActive: false,
    },
  });
  const newStatus = await prisma.status.findUniqueOrThrow({ where: { name: "New" } });
  const lowPriority = await prisma.priority.findUniqueOrThrow({ where: { name: "Low" } });
  const requesterRows = await prisma.devRequester.findMany({ orderBy: { id: "asc" } });
  const categoryRows = await prisma.category.findMany({ orderBy: { id: "asc" } });
  const systemRows = await prisma.relatedSystem.findMany({ orderBy: { id: "asc" } });

  for (let index = 0; index < 10; index += 1) {
    const num = index + 1;
    const ticketNumber = `TKT-2026-${String(num).padStart(6, "0")}`;
    const ticketData = {
      requesterId: requesterRows[index % requesterRows.length].id,
      categoryId: categoryRows[index % categoryRows.length].id,
      relatedSystemId: systemRows[index % systemRows.length].id,
      summary: `Development request ${num}`,
      description: `Seed development request number ${num}.`,
      requestedPriorityId: lowPriority.id,
      currentStatusId: newStatus.id,
      ownerId: null,
    };
    
    await prisma.ticket.upsert({
      where: { ticketNumber },
      update: { ...ticketData, itPriorityId: null },
      create: { ticketNumber, ...ticketData },
    });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});