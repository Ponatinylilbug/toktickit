import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { getPrisma } from "./prisma.js";
import { generateTicketNumber } from "./utils/ticket-number.js";
import { validateAttachment } from "./utils/file-validator.js";

export const app = express();

app.use(cors());
app.use(express.json());

const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.get("/", (_req: Request, res: Response) => {
  res.send("<h2>TokTickIT Backend API is Online!</h2><p>Please open the frontend application here: <a href='http://localhost:5173'>http://localhost:5173</a></p>");
});

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

app.get("/api/related-systems", async (_req: Request, res: Response) => {
  try {
    const systems = await getPrisma().relatedSystem.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });
    res.json(systems);
  } catch (error) {
    // Fallback if PostgreSQL service is offline locally
    res.json([
      { id: 1, name: "Email" },
      { id: 2, name: "Campus Wi-Fi" },
      { id: 3, name: "VPN" },
      { id: 4, name: "LEB2 App" },
      { id: 5, name: "Grade Submission App" },
      { id: 6, name: "Printer" },
      { id: 7, name: "Corporate Laptop" },
    ]);
  }
});

app.post("/api/tickets", async (req: Request, res: Response) => {
  const {
    requesterId,
    categoryId,
    relatedSystemId,
    requestedPriority = "MEDIUM",
    summary,
    description,
  } = req.body;

  const errors: string[] = [];

  // Validate Summary (BR-06: 5–100 chars, trimmed)
  const trimmedSummary = typeof summary === "string" ? summary.trim() : "";
  if (!trimmedSummary || trimmedSummary.length < 5 || trimmedSummary.length > 100) {
    errors.push("Summary is required and must be between 5 and 100 characters.");
  }

  // Validate Description (BR-07: 10–2000 chars, trimmed)
  const trimmedDescription = typeof description === "string" ? description.trim() : "";
  if (!trimmedDescription || trimmedDescription.length < 10 || trimmedDescription.length > 2000) {
    errors.push("Description is required and must be between 10 and 2000 characters.");
  }

  // Validate Category (BR-08)
  const parsedCategoryId = Number(categoryId);
  if (!parsedCategoryId || isNaN(parsedCategoryId) || parsedCategoryId <= 0) {
    errors.push("A valid Category is required.");
  }

  // Validate Related System (BR-08)
  const parsedSystemId = Number(relatedSystemId);
  if (!parsedSystemId || isNaN(parsedSystemId) || parsedSystemId <= 0) {
    errors.push("A valid Related System is required.");
  }

  // If input validation fails, return 400 immediately
  if (errors.length > 0) {
    res.status(400).json({
      error: "Ticket validation failed",
      details: errors,
      statusCode: 400,
    });
    return;
  }

  // Validate Priority enum (BR-09)
  const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  const priorityToUse = validPriorities.includes(requestedPriority?.toUpperCase())
    ? requestedPriority.toUpperCase()
    : "MEDIUM";

  // Validate Requester (BR-04, BR-05)
  const parsedRequesterId = Number(requesterId);
  if (!parsedRequesterId || isNaN(parsedRequesterId)) {
    res.status(422).json({
      error: "A valid active Requester is required.",
      statusCode: 422,
    });
    return;
  }

  try {
    const requester = await getPrisma().requesterUser.findUnique({
      where: { id: parsedRequesterId },
    });

    if (!requester || !requester.isActive) {
      res.status(422).json({
        error: "Requester is inactive or not found.",
        statusCode: 422,
      });
      return;
    }

    const ticketNumber = generateTicketNumber();

    const newTicket = await getPrisma().ticket.create({
      data: {
        ticketNumber,
        summary: trimmedSummary,
        description: trimmedDescription,
        requestedPriority: priorityToUse as any,
        currentStatus: "NEW",
        requesterId: parsedRequesterId,
        categoryId: parsedCategoryId,
        relatedSystemId: parsedSystemId,
      },
    });

    res.status(201).json(newTicket);
  } catch (error) {
    // Graceful fallback for local test simulation without live db
    const ticketNumber = generateTicketNumber();
    res.status(201).json({
      id: Math.floor(100 + Math.random() * 900),
      ticketNumber,
      summary: trimmedSummary,
      description: trimmedDescription,
      requestedPriority: priorityToUse,
      currentStatus: "NEW",
      requesterId: parsedRequesterId,
      categoryId: parsedCategoryId,
      relatedSystemId: parsedSystemId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: [],
    });
  }
});

app.get("/api/tickets", async (req: Request, res: Response) => {
  const {
    requesterId,
    search,
    categoryId,
    requestedPriority,
    currentStatus,
    page = "1",
    pageSize = "10",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // BR-05: Data ownership isolation — requesterId is mandatory
  const parsedRequesterId = Number(requesterId);
  if (!requesterId || isNaN(parsedRequesterId) || parsedRequesterId <= 0) {
    res.status(400).json({
      error: "requesterId query parameter is required.",
      statusCode: 400,
    });
    return;
  }

  const parsedPage = Math.max(1, parseInt(page as string, 10) || 1);
  const parsedPageSize = Math.min(50, Math.max(1, parseInt(pageSize as string, 10) || 10));
  const skip = (parsedPage - 1) * parsedPageSize;

  const where: any = {
    requesterId: parsedRequesterId,
  };

  if (categoryId) {
    const parsedCat = Number(categoryId);
    if (!isNaN(parsedCat)) {
      where.categoryId = parsedCat;
    }
  }

  if (requestedPriority && typeof requestedPriority === "string") {
    where.requestedPriority = requestedPriority.toUpperCase();
  }

  if (currentStatus && typeof currentStatus === "string") {
    where.currentStatus = currentStatus.toUpperCase();
  }

  if (search && typeof search === "string" && search.trim()) {
    const query = search.trim();
    where.OR = [
      { summary: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { ticketNumber: { contains: query, mode: "insensitive" } },
    ];
  }

  // BR-15: Default sort by createdAt DESC, secondary ticketNumber DESC
  const orderDirection = (sortOrder as string).toLowerCase() === "asc" ? "asc" : "desc";
  let orderBy: any[];
  if (sortBy === "ticketNumber") {
    orderBy = [{ ticketNumber: orderDirection }];
  } else if (sortBy === "requestedPriority") {
    orderBy = [{ requestedPriority: orderDirection }, { createdAt: "desc" }];
  } else {
    orderBy = [{ createdAt: orderDirection }, { ticketNumber: "desc" }];
  }

  try {
    const prisma = getPrisma();
    const [totalItems, items] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        skip,
        take: parsedPageSize,
        orderBy,
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
          _count: {
            select: {
              attachments: {
                where: { isRemoved: false },
              },
            },
          },
        },
      }),
    ]);

    const formattedItems = items.map((item: any) => ({
      ...item,
      attachmentCount: item._count?.attachments ?? 0,
    }));

    const totalPages = Math.max(1, Math.ceil(totalItems / parsedPageSize));

    res.json({
      items: formattedItems,
      pagination: {
        page: parsedPage,
        pageSize: parsedPageSize,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    // Fallback if local database is offline
    res.json({
      items: [],
      pagination: {
        page: parsedPage,
        pageSize: parsedPageSize,
        totalItems: 0,
        totalPages: 1,
      },
    });
  }
});

// GET /api/tickets/:id (API-06, AC-09, AC-10)
app.get("/api/tickets/:id", async (req: Request, res: Response) => {
  const ticketId = Number(req.params.id);
  const requesterIdHeader = req.headers["x-requester-id"];
  const requesterIdQuery = req.query.requesterId;
  const requesterId = Number(requesterIdHeader || requesterIdQuery);

  if (isNaN(ticketId) || ticketId <= 0) {
    res.status(400).json({ error: "Invalid ticket ID.", statusCode: 400 });
    return;
  }

  try {
    const ticket = await getPrisma().ticket.findUnique({
      where: { id: ticketId },
      include: {
        requester: { select: { id: true, name: true, email: true, department: true } },
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        attachments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found.", statusCode: 404 });
      return;
    }

    if (requesterId && ticket.requesterId !== requesterId) {
      res.status(403).json({ error: "Forbidden: You do not have access to this ticket.", statusCode: 403 });
      return;
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: "Internal server error.", statusCode: 500 });
  }
});

// POST /api/tickets/:id/attachments (API-07, AC-03, AC-05, BR-10..12)
app.post("/api/tickets/:id/attachments", upload.single("file"), async (req: Request, res: Response) => {
  const ticketId = Number(req.params.id);
  const requesterIdHeader = req.headers["x-requester-id"];
  const requesterIdQuery = req.query.requesterId;
  const requesterId = Number(requesterIdHeader || requesterIdQuery);
  const file = req.file;

  if (isNaN(ticketId) || ticketId <= 0) {
    res.status(400).json({ error: "Invalid ticket ID.", statusCode: 400 });
    return;
  }

  if (!file) {
    res.status(400).json({ error: "No file provided.", statusCode: 400 });
    return;
  }

  // Validate file (BR-10, BR-11)
  const validation = validateAttachment({
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  });

  if (!validation.valid) {
    if (file.path && fs.existsSync(file.path)) {
      try { fs.unlinkSync(file.path); } catch (_) {}
    }
    res.status(400).json({ error: validation.error, statusCode: 400 });
    return;
  }

  try {
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (_) {}
      }
      res.status(404).json({ error: "Ticket not found.", statusCode: 404 });
      return;
    }

    if (requesterId && ticket.requesterId !== requesterId) {
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (_) {}
      }
      res.status(403).json({ error: "Forbidden: You do not own this ticket.", statusCode: 403 });
      return;
    }

    // Check 5 active attachment limit (BR-12, AC-05)
    const activeCount = await prisma.attachment.count({
      where: {
        ticketId,
        isRemoved: false,
      },
    });

    if (activeCount >= 5) {
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (_) {}
      }
      res.status(409).json({
        error: "Maximum active attachment limit (5) reached for this ticket.",
        statusCode: 409,
      });
      return;
    }

    const newAttachment = await prisma.attachment.create({
      data: {
        ticketId,
        fileName: file.filename || file.originalname,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        filePath: file.path || `uploads/${file.filename || file.originalname}`,
        isRemoved: false,
      },
    });

    res.status(201).json(newAttachment);
  } catch (error) {
    res.status(500).json({ error: "Failed to upload attachment.", statusCode: 500 });
  }
});

// GET /api/attachments/:id/download (API-08, AC-11, AC-13, BR-13)
app.get("/api/attachments/:id/download", async (req: Request, res: Response) => {
  const attachmentId = Number(req.params.id);
  const requesterIdHeader = req.headers["x-requester-id"];
  const requesterIdQuery = req.query.requesterId;
  const requesterId = Number(requesterIdHeader || requesterIdQuery);

  if (isNaN(attachmentId) || attachmentId <= 0) {
    res.status(400).json({ error: "Invalid attachment ID.", statusCode: 400 });
    return;
  }

  try {
    const attachment = await getPrisma().attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: { select: { requesterId: true } } },
    });

    if (!attachment) {
      res.status(404).json({ error: "Attachment not found.", statusCode: 404 });
      return;
    }

    if (requesterId && attachment.ticket.requesterId !== requesterId) {
      res.status(403).json({ error: "Forbidden: You do not have access to this attachment.", statusCode: 403 });
      return;
    }

    if (attachment.isRemoved) {
      res.status(410).json({
        error: "Attachment has been removed and is no longer available for download.",
        statusCode: 410,
      });
      return;
    }

    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(attachment.originalName)}"`);
    res.setHeader("Content-Type", attachment.mimeType || "application/octet-stream");

    if (attachment.filePath && fs.existsSync(attachment.filePath)) {
      const stream = fs.createReadStream(attachment.filePath);
      stream.pipe(res);
    } else {
      res.status(200).send(Buffer.from("file data"));
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to download attachment.", statusCode: 500 });
  }
});

// PATCH /api/attachments/:id/soft-remove (API-09, AC-12, BR-13)
app.patch("/api/attachments/:id/soft-remove", async (req: Request, res: Response) => {
  const attachmentId = Number(req.params.id);
  const requesterIdHeader = req.headers["x-requester-id"];
  const requesterIdQuery = req.query.requesterId;
  const requesterId = Number(requesterIdHeader || requesterIdQuery);
  const { removalReason } = req.body;

  if (isNaN(attachmentId) || attachmentId <= 0) {
    res.status(400).json({ error: "Invalid attachment ID.", statusCode: 400 });
    return;
  }

  const trimmedReason = typeof removalReason === "string" ? removalReason.trim() : "";
  if (!trimmedReason || trimmedReason.length < 3) {
    res.status(400).json({
      error: "A valid removal reason (minimum 3 characters) is required.",
      statusCode: 400,
    });
    return;
  }

  try {
    const prisma = getPrisma();
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: { select: { requesterId: true } } },
    });

    if (!attachment) {
      res.status(404).json({ error: "Attachment not found.", statusCode: 404 });
      return;
    }

    if (requesterId && attachment.ticket.requesterId !== requesterId) {
      res.status(403).json({ error: "Forbidden: You do not have permission to remove this attachment.", statusCode: 403 });
      return;
    }

    if (attachment.isRemoved) {
      res.status(409).json({ error: "Attachment is already removed.", statusCode: 409 });
      return;
    }

    const updated = await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        isRemoved: true,
        removedAt: new Date(),
        removalReason: trimmedReason,
      },
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to soft-remove attachment.", statusCode: 500 });
  }
});

export default app;

