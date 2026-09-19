import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { authMiddleware, requirePasswordChanged } from "../middleware/auth.js";
import { fallbackUsers, findUserById } from "./auth.js";
import { staffFallbackTickets } from "./staff.js";
import { isDbAvailable } from "../utils/db-fallback.js";

export const commentsRouter = Router();

// Router without top-level auth middleware to avoid intercepting parent /api/tickets routes

export const fallbackComments: any[] = [
  {
    id: 1,
    ticketId: 1,
    authorId: 2,
    message: "We have initiated a signal strength diagnostic on the 3rd floor AP.",
    isSystemGenerated: false,
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    author: { id: 2, name: "Alex Triage", role: "IT_STAFF" },
  },
  {
    id: 2,
    ticketId: 1,
    authorId: 6,
    message: "Thank you! I noticed the signal improved slightly near the window.",
    isSystemGenerated: false,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    author: { id: 6, name: "Jennifer Anderson", role: "REQUESTER" },
  },
];

// Helper to check ticket ownership for requesters
async function verifyTicketAccess(ticketId: number, reqUser: any): Promise<{ allowed: boolean; ticket?: any }> {
  if (await isDbAvailable()) {
    try {
      const prisma = getPrisma();
      if (prisma?.ticket) {
        const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
        if (!ticket) return { allowed: false };
        if (reqUser.role === "REQUESTER" && ticket.requesterId !== reqUser.id) {
          return { allowed: false, ticket };
        }
        return { allowed: true, ticket };
      }
    } catch {
      // Database unavailable, fallback
    }
  }

  const ticket = staffFallbackTickets.find((t) => t.id === ticketId);
  if (!ticket) return { allowed: false };
  if (reqUser.role === "REQUESTER" && ticket.requesterId !== reqUser.id) {
    return { allowed: false, ticket };
  }
  return { allowed: true, ticket };
}

// ---------------------------------------------------------------------------
// GET /api/tickets/:id/comments
commentsRouter.get("/:id/comments", authMiddleware, requirePasswordChanged, async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id);
  if (isNaN(ticketId)) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid ticket ID" } });
    return;
  }

  const access = await verifyTicketAccess(ticketId, req.user);
  if (!access.allowed) {
    res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message: "You do not have permission to view comments on this ticket",
      },
    });
    return;
  }

  if (await isDbAvailable()) {
    try {
      const prisma = getPrisma();
    if (prisma?.comment) {
      const comments = await prisma.comment.findMany({
        where: { ticketId },
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      });
      res.status(200).json({ comments });
      return;
    }
    } catch {
      // Database unavailable, fallback
    }
  }

  const comments = fallbackComments.filter((c) => c.ticketId === ticketId);
  res.status(200).json({ comments });
});

// ---------------------------------------------------------------------------
// POST /api/tickets/:id/comments
commentsRouter.post("/:id/comments", authMiddleware, requirePasswordChanged, async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id);
  const { message } = req.body;

  if (isNaN(ticketId)) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid ticket ID" } });
    return;
  }

  if (!message || typeof message !== "string" || message.trim().length < 2 || message.trim().length > 2000) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Comment message must be between 2 and 2000 characters",
      },
    });
    return;
  }

  const access = await verifyTicketAccess(ticketId, req.user);
  if (!access.allowed) {
    res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message: "You do not have permission to comment on this ticket",
      },
    });
    return;
  }

  const authorId = req.user!.id;
  const authorUser = await findUserById(authorId);

  if (await isDbAvailable()) {
    try {
      const prisma = getPrisma();
    if (prisma?.comment) {
      const comment = await prisma.comment.create({
        data: {
          ticketId,
          authorId,
          message: message.trim(),
          isSystemGenerated: false,
        },
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
      });
      res.status(201).json({ comment });
      return;
    }
    } catch {
      // Database unavailable, fallback
    }
  }

  const newComment = {
    id: fallbackComments.length + 1,
    ticketId,
    authorId,
    message: message.trim(),
    isSystemGenerated: false,
    createdAt: new Date().toISOString(),
    author: {
      id: authorId,
      name: authorUser?.name || req.user!.name,
      role: req.user!.role,
    },
  };
  fallbackComments.push(newComment);

  res.status(201).json({ comment: newComment });
});
