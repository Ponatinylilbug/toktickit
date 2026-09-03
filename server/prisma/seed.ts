import { getPrisma } from "../src/prisma.js";

// Sprint 2 — Idempotent seed script
// 1. Four required categories: Account and Access, Hardware, Software, Network
// 2. At least six realistic Related Systems
// 3. At least four active Development Requesters and at least one inactive Development Requester

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

  // 3. Seed Development Requesters (4 active, 1 inactive)
  const requesters = [
    {
      email: "jennifer.anderson@example.com",
      name: "Jennifer Anderson",
      department: "Human Resources",
      isActive: true,
    },
    {
      email: "michael.brown@example.com",
      name: "Michael Brown",
      department: "Finance",
      isActive: true,
    },
    {
      email: "sarah.johnson@example.com",
      name: "Sarah Johnson",
      department: "Marketing",
      isActive: true,
    },
    {
      email: "david.lee@example.com",
      name: "David Lee",
      department: "Engineering",
      isActive: true,
    },
    {
      email: "inactive.user@example.com",
      name: "Alex Taylor (Former Employee)",
      department: "Operations",
      isActive: false,
    },
  ];

  for (const user of requesters) {
    await prisma.requesterUser.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        department: user.department,
        isActive: user.isActive,
      },
      create: {
        email: user.email,
        name: user.name,
        department: user.department,
        isActive: user.isActive,
      },
    });
  }
  console.log(`Seeded ${requesters.length} Development Requesters (4 active, 1 inactive).`);

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
