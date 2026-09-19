import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { authMiddleware, requireRole, requirePasswordChanged } from "../middleware/auth.js";
import { findUserById, fallbackUsers } from "./auth.js";
import { isDbAvailable } from "../utils/db-fallback.js";

export const staffRouter = Router();

// Apply auth middleware and IT_STAFF / ADMINISTRATOR role check to all staff routes
staffRouter.use(authMiddleware);
staffRouter.use(requirePasswordChanged);
staffRouter.use(requireRole("IT_STAFF", "ADMINISTRATOR"));

// Fallback in-memory tickets for development or testing
export const staffFallbackTickets: any[] = [
  {
    id: 1,
    ticketNumber: "TKT-2026-000001",
    summary: "Cannot connect to Campus Wi-Fi in building B",
    description: "Wi-Fi signals drop every 5 minutes when connecting from the 3rd floor lab.",
    requestedPriority: "HIGH",
    itPriority: "HIGH",
    currentStatus: "IN_PROGRESS",
    requesterId: 6,
    ownerId: 2,
    categoryId: 4,
    relatedSystemId: 2,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    requester: { id: 6, name: "Jennifer Anderson", email: "jennifer.anderson@example.com", department: "Human Resources" },
    owner: { id: 2, name: "Alex Triage", email: "staff1@toktickit.local" },
    category: { id: 4, name: "Network" },
    relatedSystem: { id: 2, name: "Campus Wi-Fi" },
    attachments: [],
  },
  {
    id: 2,
    ticketNumber: "TKT-2026-000002",
    summary: "Need secondary monitor for accounting setup",
    description: "Requesting a 24-inch HDMI monitor for financial quarterly closing.",
    requestedPriority: "LOW",
    itPriority: "LOW",
    currentStatus: "NEW",
    requesterId: 7,
    ownerId: null,
    categoryId: 2,
    relatedSystemId: 7,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    requester: { id: 7, name: "Michael Brown", email: "michael.brown@example.com", department: "Finance" },
    owner: null,
    category: { id: 2, name: "Hardware" },
    relatedSystem: { id: 7, name: "Corporate Laptop" },
    attachments: [],
  },
  {
    id: 3,
    ticketNumber: "TKT-2026-000003",
    summary: "VPN access token expired",
    description: "Cannot establish remote connection to staging server.",
    requestedPriority: "URGENT",
    itPriority: "URGENT",
    currentStatus: "OPEN",
    requesterId: 6,
    ownerId: 3,
    categoryId: 1,
    relatedSystemId: 3,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    requester: { id: 6, name: "Jennifer Anderson", email: "jennifer.anderson@example.com", department: "Human Resources" },
    owner: { id: 3, name: "Jordan Tech", email: "staff2@toktickit.local" },
    category: { id: 1, name: "Account and Access" },
    relatedSystem: { id: 3, name: "VPN" },
    attachments: [],
  },
];

// ---------------------------------------------------------------------------
// GET /api/staff/tickets (Staff Queue)
staffRouter.get("/tickets", async (req: Request, res: Response) => {
  const {
    search,
    status,
    priority,
    ownerId,
    categoryId,
    sortBy = "createdAt",
    sortOrder = "desc",
    page = "1",
    pageSize = "10",
  } = req.query;

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(pageSize as string) || 10));

  if (await isDbAvailable()) {
    try {
      const prisma = getPrisma();
    if (prisma?.ticket) {
      const where: any = {};

      if (status && status !== "ALL") {
        where.currentStatus = status;
      }

      if (priority && priority !== "ALL") {
        where.OR = [
          { itPriority: priority },
          { itPriority: null, requestedPriority: priority },
        ];
      }

      if (ownerId) {
        if (ownerId === "unassigned") {
          where.ownerId = null;
        } else if (ownerId === "me" && req.user) {
          where.ownerId = req.user.id;
        } else if (!isNaN(Number(ownerId))) {
          where.ownerId = Number(ownerId);
        }
      }

      if (categoryId && categoryId !== "ALL") {
        where.categoryId = Number(categoryId);
      }

      if (search) {
        const query = String(search).trim();
        where.OR = [
          { ticketNumber: { contains: query, mode: "insensitive" } },
          { summary: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { requester: { name: { contains: query, mode: "insensitive" } } },
        ];
      }

      const totalCount = await prisma.ticket.count({ where });
      const tickets = await prisma.ticket.findMany({
        where,
        include: {
          requester: { select: { id: true, name: true, email: true, department: true } },
          owner: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
          _count: { select: { attachments: { where: { isRemoved: false } } } },
        },
        orderBy: {
          [String(sortBy)]: String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc",
        },
        skip: (pageNum - 1) * limit,
        take: limit,
      });

      res.status(200).json({
        data: tickets.map((t: any) => ({
          ...t,
          attachmentCount: t._count?.attachments ?? 0,
        })),
        pagination: {
          page: pageNum,
          pageSize: limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
      });
      return;
    }
    } catch {
      // Database unavailable, fallback
    }
  }

  // In-memory fallback filtering
  let filtered = [...staffFallbackTickets];

  if (status && status !== "ALL") {
    filtered = filtered.filter((t) => t.currentStatus === status);
  }

  if (priority && priority !== "ALL") {
    filtered = filtered.filter((t) => (t.itPriority || t.requestedPriority) === priority);
  }

  if (ownerId) {
    if (ownerId === "unassigned") {
      filtered = filtered.filter((t) => t.ownerId === null);
    } else if (ownerId === "me" && req.user) {
      filtered = filtered.filter((t) => t.ownerId === req.user?.id);
    } else if (!isNaN(Number(ownerId))) {
      filtered = filtered.filter((t) => t.ownerId === Number(ownerId));
    }
  }

  if (categoryId && categoryId !== "ALL") {
    filtered = filtered.filter((t) => t.categoryId === Number(categoryId));
  }

  if (search) {
    const q = String(search).toLowerCase().trim();
    filtered = filtered.filter(
      (t) =>
        t.ticketNumber.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.requester?.name && t.requester.name.toLowerCase().includes(q))
    );
  }

  filtered.sort((a, b) => {
    const field = String(sortBy);
    const valA = a[field] || "";
    const valB = b[field] || "";
    if (sortOrder === "asc") return valA > valB ? 1 : -1;
    return valA < valB ? 1 : -1;
  });

  const totalCount = filtered.length;
  const paginated = filtered.slice((pageNum - 1) * limit, pageNum * limit);

  res.status(200).json({
    data: paginated,
    pagination: {
      page: pageNum,
      pageSize: limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
  });
});

// ---------------------------------------------------------------------------
// GET /api/staff/tickets/:id (Staff Ticket Detail)
staffRouter.get("/tickets/:id", async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id);
  if (isNaN(ticketId)) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid ticket ID" } });
    return;
  }

  if (await isDbAvailable()) {
    try {
      const prisma = getPrisma();
    if (prisma?.ticket) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          requester: { select: { id: true, name: true, email: true, department: true } },
          owner: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
          attachments: {
            select: {
              id: true,
              fileName: true,
              originalName: true,
              fileSize: true,
              mimeType: true,
              isRemoved: true,
              removedAt: true,
              removalReason: true,
              createdAt: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (ticket) {
        res.status(200).json({ ticket });
        return;
      }
    }
    } catch {
      // Database unavailable, fallback
    }
  }

  const ticket = staffFallbackTickets.find((t) => t.id === ticketId);
  if (!ticket) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found" } });
    return;
  }

  res.status(200).json({ ticket });
});

// ---------------------------------------------------------------------------
// PATCH /api/staff/tickets/:id/assign (Assign / Claim Ownership)
staffRouter.patch("/tickets/:id/assign", async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id);
  const { ownerId } = req.body;

  if (isNaN(ticketId)) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid ticket ID" } });
    return;
  }

  // If assigning an owner, verify user exists and is active IT_STAFF or ADMINISTRATOR
  let assignedUser: any = null;
  if (ownerId !== null && ownerId !== undefined) {
    const targetId = Number(ownerId);
    assignedUser = await findUserById(targetId);
    if (!assignedUser || !assignedUser.isActive || !["IT_STAFF", "ADMINISTRATOR"].includes(assignedUser.role)) {
      res.status(400).json({
        error: {
          code: "INVALID_ASSIGNEE",
          message: "Ticket can only be assigned to an active IT Staff or Administrator account",
        },
      });
      return;
    }
  }

  const newOwnerId = assignedUser ? assignedUser.id : null;

  if (await isDbAvailable()) {
    try {
      const prisma = getPrisma();
    if (prisma?.ticket) {
      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: { ownerId: newOwnerId },
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
      });
      res.status(200).json({
        message: "Ticket ownership updated",
        ticket: updated,
      });
      return;
    }
    } catch {
      // Database unavailable, fallback
    }
  }

  const ticket = staffFallbackTickets.find((t) => t.id === ticketId);
  if (!ticket) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found" } });
    return;
  }

  ticket.ownerId = newOwnerId;
  ticket.owner = assignedUser ? { id: assignedUser.id, name: assignedUser.name, email: assignedUser.email } : null;
  ticket.updatedAt = new Date().toISOString();

  res.status(200).json({
    message: "Ticket ownership updated",
    ticket,
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/staff/tickets/:id/priority (Update IT Priority)
staffRouter.patch("/tickets/:id/priority", async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id);
  const { itPriority } = req.body;

  const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  if (!validPriorities.includes(itPriority)) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "itPriority must be one of: LOW, MEDIUM, HIGH, URGENT",
      },
    });
    return;
  }

  if (await isDbAvailable()) {
    try {
      const prisma = getPrisma();
    if (prisma?.ticket) {
      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: { itPriority },
      });
      res.status(200).json({
        message: "IT Priority updated",
        ticket: updated,
      });
      return;
    }
    } catch {
      // Database unavailable, fallback
    }
  }

  const ticket = staffFallbackTickets.find((t) => t.id === ticketId);
  if (!ticket) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found" } });
    return;
  }

  ticket.itPriority = itPriority;
  ticket.updatedAt = new Date().toISOString();

  res.status(200).json({
    message: "IT Priority updated",
    ticket,
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/staff/tickets/:id/status (Status Transitions)
staffRouter.patch("/tickets/:id/status", async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id);
  const { status } = req.body;

  const validStatuses = [
    "NEW",
    "OPEN",
    "IN_PROGRESS",
    "WAITING_FOR_REQUESTER",
    "RESOLVED",
    "CLOSED",
    "REOPENED",
    "CANCELLED",
  ];

  if (!validStatuses.includes(status)) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: `Invalid status. Permitted: ${validStatuses.join(", ")}`,
      },
    });
    return;
  }

  if (await isDbAvailable()) {
    try {
      const prisma = getPrisma();
    if (prisma?.ticket) {
      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: { currentStatus: status },
      });
      res.status(200).json({
        message: "Ticket status updated",
        ticket: updated,
      });
      return;
    }
    } catch {
      // Database unavailable, fallback
    }
  }

  const ticket = staffFallbackTickets.find((t) => t.id === ticketId);
  if (!ticket) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found" } });
    return;
  }

  ticket.currentStatus = status;
  ticket.updatedAt = new Date().toISOString();

  res.status(200).json({
    message: "Ticket status updated",
    ticket,
  });
});
