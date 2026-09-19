import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { authMiddleware, requireRole, requirePasswordChanged } from "../middleware/auth.js";
import { findUserById } from "./auth.js";
import { isDbAvailable } from "../utils/db-fallback.js";

export const notesRouter = Router();

// Internal Notes are strictly confidential to IT Staff and Administrators

export const fallbackNotes: any[] = [
  {
    id: 1,
    ticketId: 1,
    authorId: 2,
    note: "Suspected firmware bug on Cisco AP-302. Escalated to vendor support ticket #98721.",
    createdAt: new Date(Date.now() - 3600000 * 15).toISOString(),
    author: { id: 2, name: "Alex Triage", role: "IT_STAFF" },
  },
];

// ---------------------------------------------------------------------------
// GET /api/tickets/:id/notes (Staff / Admin only)
notesRouter.get(
  "/:id/notes",
  authMiddleware,
  requirePasswordChanged,
  requireRole("IT_STAFF", "ADMINISTRATOR"),
  async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id);
  if (isNaN(ticketId)) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid ticket ID" } });
    return;
  }

  if (await isDbAvailable()) {
    try {
      const prisma = getPrisma();
    if (prisma?.internalNote) {
      const notes = await prisma.internalNote.findMany({
        where: { ticketId },
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      });
      res.status(200).json({ notes });
      return;
    }
    } catch {
      // Database unavailable, fallback
    }
  }

  const notes = fallbackNotes.filter((n) => n.ticketId === ticketId);
  res.status(200).json({ notes });
});

// ---------------------------------------------------------------------------
// POST /api/tickets/:id/notes (Staff / Admin only)
notesRouter.post(
  "/:id/notes",
  authMiddleware,
  requirePasswordChanged,
  requireRole("IT_STAFF", "ADMINISTRATOR"),
  async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id);
  const { note } = req.body;

  if (isNaN(ticketId)) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid ticket ID" } });
    return;
  }

  if (!note || typeof note !== "string" || note.trim().length < 2 || note.trim().length > 2000) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Internal note must be between 2 and 2000 characters",
      },
    });
    return;
  }

  const authorId = req.user!.id;
  const authorUser = await findUserById(authorId);

  if (await isDbAvailable()) {
    try {
      const prisma = getPrisma();
    if (prisma?.internalNote) {
      const createdNote = await prisma.internalNote.create({
        data: {
          ticketId,
          authorId,
          note: note.trim(),
        },
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
      });
      res.status(201).json({ note: createdNote });
      return;
    }
    } catch {
      // Database unavailable, fallback
    }
  }

  const newNote = {
    id: fallbackNotes.length + 1,
    ticketId,
    authorId,
    note: note.trim(),
    createdAt: new Date().toISOString(),
    author: {
      id: authorId,
      name: authorUser?.name || req.user!.name,
      role: req.user!.role,
    },
  };
  fallbackNotes.push(newNote);

  res.status(201).json({ note: newNote });
});
