import { getPrisma } from "../src/prisma.js";
import bcrypt from "bcryptjs";

// Lab 3 — Multi-role seed script
// Seeds Categories, Related Systems, Legacy RequesterUsers, and Unified Users with hashed passwords.

async function main() {
  const prisma = getPrisma();

  // 1. Seed Categories
  const categories = [
    "Account and Access",
    "Hardware",
    "Software",
    "Network",
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Seeded 4 categories.");

  // 2. Seed Related Systems
  const relatedSystems = [
    { name: "Email", isActive: true },
    { name: "Campus Wi-Fi", isActive: true },
    { name: "VPN", isActive: true },
    { name: "LEB2 App", isActive: true },
    { name: "Grade Submission App", isActive: true },
    { name: "Printer", isActive: true },
    { name: "Corporate Laptop", isActive: true },
  ];

  for (const sys of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name: sys.name },
      update: { isActive: sys.isActive },
      create: { name: sys.name, isActive: sys.isActive },
    });
  }
  console.log(`Seeded ${relatedSystems.length} related systems.`);

  // 3. Legacy Requester Users (for backward compatibility)
  const legacyRequesters = [
    { email: "jennifer.anderson@example.com", name: "Jennifer Anderson", department: "Human Resources", isActive: true },
    { email: "michael.brown@example.com", name: "Michael Brown", department: "Finance", isActive: true },
    { email: "sarah.johnson@example.com", name: "Sarah Johnson", department: "Marketing", isActive: true },
    { email: "david.lee@example.com", name: "David Lee", department: "Engineering", isActive: true },
    { email: "inactive.user@example.com", name: "Alex Taylor (Former Employee)", department: "Operations", isActive: false },
  ];

  for (const user of legacyRequesters) {
    await prisma.requesterUser.upsert({
      where: { email: user.email },
      update: { name: user.name, department: user.department, isActive: user.isActive },
      create: user,
    });
  }

  // 4. Unified Users (Admin, IT Staff, Requesters)
  const defaultPasswordHash = bcrypt.hashSync("Password123!", 10);

  const users = [
    // Administrator
    {
      name: "System Administrator",
      email: "admin@toktickit.local",
      passwordHash: defaultPasswordHash,
      role: "ADMINISTRATOR" as const,
      department: "IT Administration",
      isActive: true,
      mustChangePassword: false,
    },
    // IT Staff
    {
      name: "Alex Triage",
      email: "staff1@toktickit.local",
      passwordHash: defaultPasswordHash,
      role: "IT_STAFF" as const,
      department: "IT Operations",
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Jordan Tech",
      email: "staff2@toktickit.local",
      passwordHash: defaultPasswordHash,
      role: "IT_STAFF" as const,
      department: "Network Operations",
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Sam Systems",
      email: "staff3@toktickit.local",
      passwordHash: defaultPasswordHash,
      role: "IT_STAFF" as const,
      department: "Infrastructure",
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Morgan Retired",
      email: "staff.inactive@toktickit.local",
      passwordHash: defaultPasswordHash,
      role: "IT_STAFF" as const,
      department: "IT Operations",
      isActive: false,
      mustChangePassword: false,
    },
    // Requesters
    {
      name: "Jennifer Anderson",
      email: "jennifer.anderson@example.com",
      passwordHash: defaultPasswordHash,
      role: "REQUESTER" as const,
      department: "Human Resources",
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Michael Brown",
      email: "michael.brown@example.com",
      passwordHash: defaultPasswordHash,
      role: "REQUESTER" as const,
      department: "Finance",
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      passwordHash: defaultPasswordHash,
      role: "REQUESTER" as const,
      department: "Marketing",
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "David Lee",
      email: "david.lee@example.com",
      passwordHash: defaultPasswordHash,
      role: "REQUESTER" as const,
      department: "Engineering",
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Alex Taylor",
      email: "inactive.user@example.com",
      passwordHash: defaultPasswordHash,
      role: "REQUESTER" as const,
      department: "Operations",
      isActive: false,
      mustChangePassword: false,
    },
    // Requester with mustChangePassword = true
    {
      name: "Casey Newbie",
      email: "newuser@toktickit.local",
      passwordHash: defaultPasswordHash,
      role: "REQUESTER" as const,
      department: "Sales",
      isActive: true,
      mustChangePassword: true,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        department: u.department,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
      },
      create: u,
    });
  }
  console.log(`Seeded ${users.length} Unified Users (Admin, Staff, Requesters).`);

  // 5. Seed Tickets and Actions Taken
  const techUser = await prisma.user.findUnique({ where: { email: "staff1@toktickit.local" } });
  const techUser2 = await prisma.user.findUnique({ where: { email: "staff2@toktickit.local" } });
  const reqUser1 = await prisma.user.findUnique({ where: { email: "jennifer.anderson@example.com" } });
  const catNetwork = await prisma.category.findUnique({ where: { name: "Network" } });
  const catHardware = await prisma.category.findUnique({ where: { name: "Hardware" } });
  const sysWifi = await prisma.relatedSystem.findUnique({ where: { name: "Campus Wi-Fi" } });
  const sysLaptop = await prisma.relatedSystem.findUnique({ where: { name: "Corporate Laptop" } });

  if (techUser && reqUser1 && catNetwork && sysWifi) {
    const t1 = await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-000001" },
      update: {},
      create: {
        ticketNumber: "TKT-2026-000001",
        summary: "Cannot connect to Campus Wi-Fi in building B",
        description: "Wi-Fi signals drop every 5 minutes when connecting from the 3rd floor lab.",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        currentStatus: "IN_PROGRESS",
        requesterId: reqUser1.id,
        ownerId: techUser.id,
        categoryId: catNetwork.id,
        relatedSystemId: sysWifi.id,
      },
    });

    const actionsCount = await prisma.actionTaken.count({ where: { ticketId: t1.id } });
    if (actionsCount === 0) {
      await prisma.actionTaken.createMany({
        data: [
          {
            ticketId: t1.id,
            performedById: techUser.id,
            actionDate: new Date(Date.now() - 3600000 * 18),
            description: "Replaced faulty Cisco AP-302 access point on 3rd floor.",
            result: "New access point booted and registered with wireless controller.",
            followUpRequired: true,
            followUpNote: "Verify Wi-Fi channel coverage during peak class hours.",
            attachmentNotes: "ap_replacement_log.pdf",
          },
          {
            ticketId: t1.id,
            performedById: techUser2 ? techUser2.id : techUser.id,
            actionDate: new Date(Date.now() - 3600000 * 10),
            description: "Conducted RF spectrum sweep and adjusted transmit power to 18 dBm.",
            result: "Signal-to-noise ratio improved by 14 dB across all endpoints.",
            followUpRequired: false,
            followUpNote: null,
            attachmentNotes: "rf_survey_heatmap.png",
          },
        ],
      });
      console.log("Seeded Actions Taken for Ticket 1.");
    }
  }

  if (reqUser1 && catHardware && sysLaptop) {
    await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-000002" },
      update: {},
      create: {
        ticketNumber: "TKT-2026-000002",
        summary: "Secondary monitor displays flickering horizontal lines",
        description: "Occurs intermittently when connected via USB-C docking station.",
        requestedPriority: "MEDIUM",
        itPriority: "LOW",
        currentStatus: "NEW",
        requesterId: reqUser1.id,
        ownerId: null,
        categoryId: catHardware.id,
        relatedSystemId: sysLaptop.id,
      },
    });
  }

  console.log("Database seeded successfully and idempotently.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
