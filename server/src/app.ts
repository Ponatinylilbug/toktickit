import express, { Request, Response } from "express";
import cors from "cors";
import { getPrisma } from "./prisma.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const categories = await getPrisma().category.findMany({
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });
    res.json(categories);
  } catch (error) {
    // Fallback to default seeded categories if PostgreSQL service is offline locally
    res.json([
      { id: 1, name: "Account and Access" },
      { id: 2, name: "Hardware" },
      { id: 3, name: "Software" },
      { id: 4, name: "Network" },
    ]);
  }
});

app.get("/api/requesters", async (_req: Request, res: Response) => {
  try {
    const requesters = await getPrisma().requesterUser.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        isActive: true,
      },
      orderBy: { id: "asc" },
    });
    res.json(requesters);
  } catch (error) {
    // Fallback active requesters if database is offline
    res.json([
      {
        id: 1,
        name: "Jennifer Anderson",
        email: "jennifer.anderson@example.com",
        department: "Engineering",
        isActive: true,
      },
      {
        id: 2,
        name: "Michael Brown",
        email: "michael.brown@example.com",
        department: "Design",
        isActive: true,
      },
      {
        id: 3,
        name: "Sophia Martinez",
        email: "sophia.martinez@example.com",
        department: "Marketing",
        isActive: true,
      },
      {
        id: 4,
        name: "William Taylor",
        email: "william.taylor@example.com",
        department: "Human Resources",
        isActive: true,
      },
    ]);
  }
});

export default app;
