import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { authMiddleware, requirePasswordChanged } from "../middleware/auth.js";
import { isDbAvailable } from "../utils/db-fallback.js";
import { staffFallbackTickets } from "./staff.js";

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware);
dashboardRouter.use(requirePasswordChanged);

// GET /api/dashboard/requester — Requester Dashboard Metrics (AC-05, BR-10, BR-11)
dashboardRouter.get("/requester", async (req: Request, res: Response) => {
  const user = (req as any).user;

  if (!user) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required." } });
    return;
  }

  // Allow REQUESTER and ADMINISTRATOR roles
  if (user.role !== "REQUESTER" && user.role !== "ADMINISTRATOR") {
    res.status(403).json({ error: { code: "FORBIDDEN", message: "Only Requesters can access this dashboard." } });
    return;
  }

  try {
    const requesterId = user.id;

    if (await isDbAvailable()) {
      const prisma = getPrisma();
      const [totalOpen, inProgress, waitingForRequester, resolved, closed, recentTickets] = await Promise.all([
        prisma.ticket.count({
          where: { requesterId, currentStatus: { in: ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "REOPENED"] } },
        }),
        prisma.ticket.count({
          where: { requesterId, currentStatus: "IN_PROGRESS" },
        }),
        prisma.ticket.count({
          where: { requesterId, currentStatus: "WAITING_FOR_REQUESTER" },
        }),
        prisma.ticket.count({
          where: { requesterId, currentStatus: "RESOLVED" },
        }),
        prisma.ticket.count({
          where: { requesterId, currentStatus: "CLOSED" },
        }),
        prisma.ticket.findMany({
          where: { requesterId },
          orderBy: { updatedAt: "desc" },
          take: 5,
          select: {
            id: true,
            ticketNumber: true,
            summary: true,
            currentStatus: true,
            requestedPriority: true,
            updatedAt: true,
          },
        }),
      ]);

      res.json({
        metrics: {
          totalOpen,
          inProgress,
          waitingForRequester,
          resolved,
          closed,
        },
        recentTickets,
      });
      return;
    }

    // Fallback in-memory aggregation
    const userTickets = staffFallbackTickets.filter((t) => t.requesterId === requesterId);
    const totalOpen = userTickets.filter((t) =>
      ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "REOPENED"].includes(t.currentStatus)
    ).length;
    const inProgress = userTickets.filter((t) => t.currentStatus === "IN_PROGRESS").length;
    const waitingForRequester = userTickets.filter((t) => t.currentStatus === "WAITING_FOR_REQUESTER").length;
    const resolved = userTickets.filter((t) => t.currentStatus === "RESOLVED").length;
    const closed = userTickets.filter((t) => t.currentStatus === "CLOSED").length;

    const recentTickets = [...userTickets]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        summary: t.summary,
        currentStatus: t.currentStatus,
        requestedPriority: t.requestedPriority,
        updatedAt: t.updatedAt,
      }));

    res.json({
      metrics: {
        totalOpen,
        inProgress,
        waitingForRequester,
        resolved,
        closed,
      },
      recentTickets,
    });
  } catch (error: any) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: error.message || "Failed to load dashboard." } });
  }
});

// GET /api/dashboard/staff — IT Staff Dashboard Metrics (AC-06, BR-11)
dashboardRouter.get("/staff", async (req: Request, res: Response) => {
  const user = (req as any).user;

  if (!user) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required." } });
    return;
  }

  // Allow IT_STAFF and ADMINISTRATOR roles
  if (user.role !== "IT_STAFF" && user.role !== "ADMINISTRATOR") {
    res.status(403).json({ error: { code: "FORBIDDEN", message: "Only IT Staff can access this dashboard." } });
    return;
  }

  try {
    if (await isDbAvailable()) {
      const prisma = getPrisma();
      const [newCount, openCount, inProgressCount, waitingCount, myAssigned, unassigned, rawRecentTickets] = await Promise.all([
        prisma.ticket.count({ where: { currentStatus: "NEW" } }),
        prisma.ticket.count({ where: { currentStatus: "OPEN" } }),
        prisma.ticket.count({ where: { currentStatus: "IN_PROGRESS" } }),
        prisma.ticket.count({ where: { currentStatus: "WAITING_FOR_REQUESTER" } }),
        prisma.ticket.count({ where: { ownerId: user.id, currentStatus: { notIn: ["CLOSED", "CANCELLED"] } } }),
        prisma.ticket.count({ where: { ownerId: null, currentStatus: { notIn: ["CLOSED", "CANCELLED"] } } }),
        prisma.ticket.findMany({
          where: { currentStatus: { notIn: ["CLOSED", "CANCELLED"] } },
          orderBy: { updatedAt: "desc" },
          take: 5,
          select: {
            id: true,
            ticketNumber: true,
            summary: true,
            currentStatus: true,
            itPriority: true,
            requestedPriority: true,
            updatedAt: true,
            owner: { select: { id: true, name: true } },
          },
        }),
      ]);

      const recentTickets = rawRecentTickets.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        summary: t.summary,
        currentStatus: t.currentStatus,
        actualPriority: t.itPriority || t.requestedPriority,
        updatedAt: t.updatedAt,
        owner: t.owner,
      }));

      res.json({
        metrics: {
          new: newCount,
          open: openCount,
          inProgress: inProgressCount,
          waitingForRequester: waitingCount,
          myAssigned,
          unassigned,
        },
        recentTickets,
      });
      return;
    }

    // Fallback in-memory aggregation
    const activeTickets = staffFallbackTickets.filter(
      (t) => !["CLOSED", "CANCELLED"].includes(t.currentStatus)
    );
    const newCount = staffFallbackTickets.filter((t) => t.currentStatus === "NEW").length;
    const openCount = staffFallbackTickets.filter((t) => t.currentStatus === "OPEN").length;
    const inProgressCount = staffFallbackTickets.filter((t) => t.currentStatus === "IN_PROGRESS").length;
    const waitingCount = staffFallbackTickets.filter((t) => t.currentStatus === "WAITING_FOR_REQUESTER").length;
    const myAssigned = activeTickets.filter((t) => t.ownerId === user.id).length;
    const unassigned = activeTickets.filter((t) => !t.ownerId).length;

    const recentTickets = [...activeTickets]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        summary: t.summary,
        currentStatus: t.currentStatus,
        actualPriority: t.itPriority || t.requestedPriority,
        updatedAt: t.updatedAt,
        owner: t.owner ? { id: t.owner.id, name: t.owner.name } : null,
      }));

    res.json({
      metrics: {
        new: newCount,
        open: openCount,
        inProgress: inProgressCount,
        waitingForRequester: waitingCount,
        myAssigned,
        unassigned,
      },
      recentTickets,
    });
  } catch (error: any) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: error.message || "Failed to load dashboard." } });
  }
});
