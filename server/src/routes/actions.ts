import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { authMiddleware, requireRole, requirePasswordChanged } from "../middleware/auth.js";
import { fallbackUsers, findUserById } from "./auth.js";
import { staffFallbackTickets } from "./staff.js";
import { isDbAvailable } from "../utils/db-fallback.js";

export const actionsRouter = Router();

export interface ActionTakenItem {
  id: number;
  ticketId: number;
  performedById: number;
  actionDate: string;
  description: string;
  result: string;
  followUpRequired: boolean;
  followUpNote: string | null;
  attachmentNotes: string | null;
  createdAt: string;
  updatedAt: string;
  performedBy?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export const fallbackActionsTaken: ActionTakenItem[] = [
  {
    id: 1,
    ticketId: 1,
    performedById: 2,
    actionDate: new Date(Date.now() - 3600000 * 18).toISOString(),
    description: "Replaced faulty Cisco AP-302 access point on 3rd floor.",
    result: "New access point booted and registered with wireless controller.",
    followUpRequired: true,
    followUpNote: "Verify Wi-Fi channel coverage during peak class hours.",
    attachmentNotes: "ap_replacement_log.pdf",
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    performedBy: { id: 2, name: "Alex Triage", email: "staff1@toktickit.local", role: "IT_STAFF" },
  },
  {
    id: 2,
    ticketId: 1,
    performedById: 3,
    actionDate: new Date(Date.now() - 3600000 * 10).toISOString(),
    description: "Conducted RF spectrum sweep and adjusted transmit power to 18 dBm.",
    result: "Signal-to-noise ratio improved by 14 dB across all endpoints.",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: "rf_survey_heatmap.png",
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    performedBy: { id: 3, name: "Jordan Tech", email: "staff2@toktickit.local", role: "IT_STAFF" },
  },
  {
    id: 3,
    ticketId: 3,
    performedById: 2,
    actionDate: new Date(Date.now() - 3600000 * 2).toISOString(),
    description: "Reissued user VPN client certificate and cleared session cache.",
    result: "User successfully authenticated to staging VPN gateway.",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    performedBy: { id: 2, name: "Alex Triage", email: "staff1@toktickit.local", role: "IT_STAFF" },
  },
];

async function verifyTicketAccess(ticketId: number, reqUser: any): Promise<{ allowed: boolean; notFound: boolean; ticket?: any }> {
  if (await isDbAvailable()) {
    try {
      const prisma = getPrisma();
      if (prisma?.ticket) {
        const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
        if (!ticket) return { allowed: false, notFound: true };
        if (reqUser.role === "REQUESTER" && ticket.requesterId !== reqUser.id) {
          return { allowed: false, notFound: false, ticket };
        }
        return { allowed: true, notFound: false, ticket };
      }
    } catch {
      // Fallback
    }
  }

  const ticket = staffFallbackTickets.find((t) => t.id === ticketId);
  if (!ticket) return { allowed: false, notFound: true };
  if (reqUser.role === "REQUESTER" && ticket.requesterId !== reqUser.id) {
    return { allowed: false, notFound: false, ticket };
  }
  return { allowed: true, notFound: false, ticket };
}

// ---------------------------------------------------------------------------
// GET /api/tickets/:id/actions
actionsRouter.get(
  "/:id/actions",
  authMiddleware,
  requirePasswordChanged,
  async (req: Request, res: Response) => {
    const ticketId = parseInt(req.params.id);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid ticket ID" } });
      return;
    }

    const { allowed, notFound } = await verifyTicketAccess(ticketId, req.user);
    if (notFound) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found" } });
      return;
    }
    if (!allowed) {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "Requesters can only view actions on their own tickets" } });
      return;
    }

    if (await isDbAvailable()) {
      try {
        const prisma = getPrisma();
        if (prisma?.actionTaken) {
          const actions = await prisma.actionTaken.findMany({
            where: { ticketId },
            include: {
              performedBy: { select: { id: true, name: true, email: true, role: true } },
            },
            orderBy: [{ actionDate: "asc" }, { createdAt: "asc" }],
          });
          res.status(200).json({ actions, data: actions });
          return;
        }
      } catch {
        // Fallback
      }
    }

    const actions = fallbackActionsTaken
      .filter((a) => a.ticketId === ticketId)
      .sort((a, b) => new Date(a.actionDate).getTime() - new Date(b.actionDate).getTime());

    res.status(200).json({ actions, data: actions });
  }
);

// ---------------------------------------------------------------------------
// POST /api/tickets/:id/actions (IT_STAFF and ADMINISTRATOR only)
actionsRouter.post(
  "/:id/actions",
  authMiddleware,
  requirePasswordChanged,
  requireRole("IT_STAFF", "ADMINISTRATOR"),
  async (req: Request, res: Response) => {
    const ticketId = parseInt(req.params.id);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid ticket ID" } });
      return;
    }

    const { description, result, followUpRequired, followUpNote, attachmentNotes, actionDate } = req.body;

    if (!description || typeof description !== "string" || description.trim().length < 3) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Action description must be at least 3 characters" },
      });
      return;
    }

    if (!result || typeof result !== "string" || result.trim().length < 3) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Action result must be at least 3 characters" },
      });
      return;
    }

    const isFollowUp = Boolean(followUpRequired);
    if (isFollowUp && (!followUpNote || typeof followUpNote !== "string" || !followUpNote.trim())) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Follow-up note is required when follow-up is needed" },
      });
      return;
    }

    // Verify ticket existence
    const { notFound } = await verifyTicketAccess(ticketId, req.user);
    if (notFound) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found" } });
      return;
    }

    const performedById = req.user!.id;
    const actorUser = await findUserById(performedById);
    const parsedDate = actionDate ? new Date(actionDate) : new Date();

    if (await isDbAvailable()) {
      try {
        const prisma = getPrisma();
        if (prisma?.actionTaken) {
          const created = await prisma.actionTaken.create({
            data: {
              ticketId,
              performedById,
              actionDate: parsedDate,
              description: description.trim(),
              result: result.trim(),
              followUpRequired: isFollowUp,
              followUpNote: isFollowUp ? followUpNote.trim() : null,
              attachmentNotes: attachmentNotes && typeof attachmentNotes === "string" ? attachmentNotes.trim() : null,
            },
            include: {
              performedBy: { select: { id: true, name: true, email: true, role: true } },
            },
          });
          res.status(201).json({ action: created, data: created });
          return;
        }
      } catch {
        // Fallback
      }
    }

    const newAction: ActionTakenItem = {
      id: fallbackActionsTaken.length + 1,
      ticketId,
      performedById,
      actionDate: parsedDate.toISOString(),
      description: description.trim(),
      result: result.trim(),
      followUpRequired: isFollowUp,
      followUpNote: isFollowUp ? followUpNote.trim() : null,
      attachmentNotes: attachmentNotes && typeof attachmentNotes === "string" ? attachmentNotes.trim() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      performedBy: {
        id: performedById,
        name: actorUser?.name || req.user!.name,
        email: actorUser?.email || req.user!.email,
        role: req.user!.role,
      },
    };
    fallbackActionsTaken.push(newAction);

    res.status(201).json({ action: newAction, data: newAction });
  }
);

// ---------------------------------------------------------------------------
// PUT /api/tickets/:id/actions/:actionId (IT_STAFF and ADMINISTRATOR only)
actionsRouter.put(
  "/:id/actions/:actionId",
  authMiddleware,
  requirePasswordChanged,
  requireRole("IT_STAFF", "ADMINISTRATOR"),
  async (req: Request, res: Response) => {
    const ticketId = parseInt(req.params.id);
    const actionId = parseInt(req.params.actionId);

    if (isNaN(ticketId) || isNaN(actionId)) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid ticket or action ID" } });
      return;
    }

    const { description, result, followUpRequired, followUpNote, attachmentNotes, actionDate } = req.body;

    if (description !== undefined && (typeof description !== "string" || description.trim().length < 3)) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Action description must be at least 3 characters" },
      });
      return;
    }

    if (result !== undefined && (typeof result !== "string" || result.trim().length < 3)) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Action result must be at least 3 characters" },
      });
      return;
    }

    if (followUpRequired === true && (!followUpNote || typeof followUpNote !== "string" || !followUpNote.trim())) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Follow-up note is required when follow-up is needed" },
      });
      return;
    }

    if (await isDbAvailable()) {
      try {
        const prisma = getPrisma();
        if (prisma?.actionTaken) {
          const existing = await prisma.actionTaken.findFirst({ where: { id: actionId, ticketId } });
          if (!existing) {
            res.status(404).json({ error: { code: "NOT_FOUND", message: "Action Taken not found" } });
            return;
          }

          const updated = await prisma.actionTaken.update({
            where: { id: actionId },
            data: {
              ...(description !== undefined ? { description: description.trim() } : {}),
              ...(result !== undefined ? { result: result.trim() } : {}),
              ...(actionDate !== undefined ? { actionDate: new Date(actionDate) } : {}),
              ...(followUpRequired !== undefined ? { followUpRequired: Boolean(followUpRequired) } : {}),
              ...(followUpRequired !== undefined
                ? { followUpNote: followUpRequired ? followUpNote?.trim() || null : null }
                : {}),
              ...(attachmentNotes !== undefined
                ? { attachmentNotes: attachmentNotes ? attachmentNotes.trim() : null }
                : {}),
            },
            include: {
              performedBy: { select: { id: true, name: true, email: true, role: true } },
            },
          });
          res.status(200).json({ action: updated, data: updated });
          return;
        }
      } catch {
        // Fallback
      }
    }

    const action = fallbackActionsTaken.find((a) => a.id === actionId && a.ticketId === ticketId);
    if (!action) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Action Taken not found" } });
      return;
    }

    if (description !== undefined) action.description = description.trim();
    if (result !== undefined) action.result = result.trim();
    if (actionDate !== undefined) action.actionDate = new Date(actionDate).toISOString();
    if (followUpRequired !== undefined) {
      action.followUpRequired = Boolean(followUpRequired);
      action.followUpNote = action.followUpRequired ? followUpNote?.trim() || null : null;
    }
    if (attachmentNotes !== undefined) {
      action.attachmentNotes = attachmentNotes ? attachmentNotes.trim() : null;
    }
    action.updatedAt = new Date().toISOString();

    res.status(200).json({ action, data: action });
  }
);
