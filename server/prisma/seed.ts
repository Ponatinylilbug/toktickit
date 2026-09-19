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
