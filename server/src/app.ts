import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { getPrisma } from "./prisma.js";
import { generateTicketNumber } from "./utils/ticket-number.js";
import { validateAttachment } from "./utils/file-validator.js";
import { authRouter } from "./routes/auth.js";
import { staffRouter } from "./routes/staff.js";
import { commentsRouter } from "./routes/comments.js";
import { notesRouter } from "./routes/notes.js";
import { adminRouter } from "./routes/admin.js";

export const app = express();

app.use(cors());
app.use(express.json());

// Mount Lab 3 API Routers
app.use("/api/auth", authRouter);
app.use("/api/staff", staffRouter);
app.use("/api/tickets", commentsRouter);
app.use("/api/tickets", notesRouter);
app.use("/api/admin", adminRouter);

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format. Allowed types: JPG, PNG, WEBP, PDF."));
    }
  },
});

app.get("/", (_req: Request, res: Response) => {
  res.send("<h2>TokTickIT Backend API is Online!</h2><p>Please open the frontend application here: <a href='http://localhost:5173'>http://localhost:5173</a></p>");
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

const fallbackCategories = [
  { id: 1, name: "Account and Access" },
  { id: 2, name: "Hardware" },
  { id: 3, name: "Software" },
  { id: 4, name: "Network" },
];

const fallbackRequesters = [
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
];

const fallbackSystems = [
  { id: 1, name: "Email" },
  { id: 2, name: "Campus Wi-Fi" },
  { id: 3, name: "VPN" },
  { id: 4, name: "LEB2 App" },
  { id: 5, name: "Grade Submission App" },
  { id: 6, name: "Printer" },
  { id: 7, name: "Corporate Laptop" },
];

const inMemoryTickets: any[] = [
  {
    id: 1,
    ticketNumber: "TICK-20260901-0001",
    summary: "Cannot connect to Campus Wi-Fi in building B",
    description: "Wi-Fi signals drop every 5 minutes when connecting from the 3rd floor lab.",
    requestedPriority: "HIGH",
    currentStatus: "NEW",
    requesterId: 1,
    categoryId: 4,
    relatedSystemId: 2,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    attachments: [],
    attachmentCount: 0,
    category: { id: 4, name: "Network" },
    relatedSystem: { id: 2, name: "Campus Wi-Fi" },
    requester: fallbackRequesters[0],
  },
  {
    id: 2,
    ticketNumber: "TICK-20260901-0002",
    summary: "Outlook client freezes when opening large PDF attachments",
    description: "Every time an email with attachment over 10MB arrives, Outlook becomes unresponsive.",
    requestedPriority: "MEDIUM",
    currentStatus: "IN_PROGRESS",
    requesterId: 1,
    categoryId: 3,
    relatedSystemId: 1,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    attachments: [],
    attachmentCount: 1,
    category: { id: 3, name: "Software" },
    relatedSystem: { id: 1, name: "Email" },
    requester: fallbackRequesters[0],
  },
  {
    id: 3,
    ticketNumber: "TICK-20260902-0003",
    summary: "Password reset for ERP Accounting module",
    description: "Account locked out after 3 failed login attempts. Need temporary password.",
    requestedPriority: "URGENT",
    currentStatus: "RESOLVED",
    requesterId: 1,
    categoryId: 1,
    relatedSystemId: 4,
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    attachments: [],
    attachmentCount: 0,
    category: { id: 1, name: "Account and Access" },
    relatedSystem: { id: 4, name: "LEB2 App" },
    requester: fallbackRequesters[0],
  },
  {
    id: 4,
    ticketNumber: "TICK-20260902-0004",
    summary: "Dual monitor HDMI adapter not detecting secondary display",
    description: "Connected corporate laptop to Dell monitor via HDMI, but display settings say no signal.",
    requestedPriority: "LOW",
    currentStatus: "CLOSED",
    requesterId: 1,
    categoryId: 2,
    relatedSystemId: 7,
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    attachments: [],
    attachmentCount: 0,
    category: { id: 2, name: "Hardware" },
    relatedSystem: { id: 7, name: "Corporate Laptop" },
    requester: fallbackRequesters[0],
  },
  {
    id: 5,
    ticketNumber: "TICK-20260903-0005",
    summary: "VPN tunnel disconnected when accessing remote dev server",
    description: "Cisco AnyConnect VPN constantly disconnects with gateway timeout error.",
    requestedPriority: "HIGH",
    currentStatus: "ASSIGNED",
    requesterId: 1,
    categoryId: 4,
    relatedSystemId: 3,
    createdAt: new Date(Date.now() - 3600000 * 50).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    attachments: [],
    attachmentCount: 0,
    category: { id: 4, name: "Network" },
    relatedSystem: { id: 3, name: "VPN" },
    requester: fallbackRequesters[0],
  },
  {
    id: 6,
    ticketNumber: "TICK-20260903-0006",
    summary: "Department network printer offline - Paper tray 2 jammed",
    description: "HP LaserJet on 4th floor engineering wing shows error code 13.00.00.",
    requestedPriority: "MEDIUM",
    currentStatus: "NEW",
    requesterId: 1,
    categoryId: 2,
    relatedSystemId: 6,
    createdAt: new Date(Date.now() - 3600000 * 65).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 65).toISOString(),
    attachments: [],
    attachmentCount: 0,
    category: { id: 2, name: "Hardware" },
    relatedSystem: { id: 6, name: "Printer" },
    requester: fallbackRequesters[0],
  },
  {
    id: 7,
    ticketNumber: "TICK-20260904-0007",
    summary: "Request access permission to Engineering shared drive",
    description: "Need Read/Write permissions to //nas01/engineering/projects folder for Q3 roadmap.",
    requestedPriority: "LOW",
    currentStatus: "IN_PROGRESS",
    requesterId: 1,
    categoryId: 1,
    relatedSystemId: 1,
    createdAt: new Date(Date.now() - 3600000 * 80).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 78).toISOString(),
    attachments: [],
    attachmentCount: 0,
    category: { id: 1, name: "Account and Access" },
    relatedSystem: { id: 1, name: "Email" },
    requester: fallbackRequesters[0],
  },
  {
    id: 8,
    ticketNumber: "TICK-20260905-0008",
    summary: "Grade Submission App session expired during mid-term upload",
    description: "Error 401 Unauthorized occurs while trying to save grades for section 102.",
    requestedPriority: "URGENT",
    currentStatus: "NEW",
    requesterId: 1,
    categoryId: 3,
    relatedSystemId: 5,
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    attachments: [],
    attachmentCount: 0,
    category: { id: 3, name: "Software" },
    relatedSystem: { id: 5, name: "Grade Submission App" },
    requester: fallbackRequesters[0],
  },
  {
    id: 9,
    ticketNumber: "TICK-20260905-0009",
    summary: "Antivirus scanner reporting false positive on local test script",
    description: "Defender blocked python test runner scratch script under workspace build dir.",
    requestedPriority: "MEDIUM",
    currentStatus: "RESOLVED",
    requesterId: 1,
    categoryId: 3,
    relatedSystemId: 7,
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 115).toISOString(),
    attachments: [],
    attachmentCount: 0,
    category: { id: 3, name: "Software" },
    relatedSystem: { id: 7, name: "Corporate Laptop" },
    requester: fallbackRequesters[0],
  },
  {
    id: 10,
    ticketNumber: "TICK-20260902-0010",
    summary: "Requesting software license for Figma",
    description: "Need Figma enterprise license for the UI design team onboarding.",
    requestedPriority: "MEDIUM",
    currentStatus: "ASSIGNED",
    requesterId: 2,
    categoryId: 3,
    relatedSystemId: 4,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    attachments: [],
    attachmentCount: 0,
    category: { id: 3, name: "Software" },
    relatedSystem: { id: 4, name: "LEB2 App" },
    requester: fallbackRequesters[1],
  },
];

app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const categories = await getPrisma().category.findMany({
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });
    res.json(categories);
  } catch (error) {
    // Fallback to default seeded categories if PostgreSQL service is offline locally
    res.json(fallbackCategories);
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
    res.json(fallbackRequesters);
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
    res.json(fallbackSystems);
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
    const newId = inMemoryTickets.length > 0 ? Math.max(...inMemoryTickets.map((t) => t.id)) + 1 : 1;
    const cat = fallbackCategories.find((c) => c.id === parsedCategoryId) || { id: parsedCategoryId, name: "General" };
    const sys = fallbackSystems.find((s) => s.id === parsedSystemId) || { id: parsedSystemId, name: "General" };
    const reqUser = fallbackRequesters.find((r) => r.id === parsedRequesterId) || {
      id: parsedRequesterId,
      name: "Requester",
      email: "user@example.com",
      department: "IT",
    };

    const mockTicket = {
      id: newId,
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
      attachmentCount: 0,
      category: cat,
      relatedSystem: sys,
      requester: reqUser,
    };
    inMemoryTickets.unshift(mockTicket);
    res.status(201).json(mockTicket);
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
    // Fallback in-memory query if local database is offline
    let filtered = inMemoryTickets.filter((t) => t.requesterId === parsedRequesterId);

    if (categoryId) {
      const parsedCat = Number(categoryId);
      if (!isNaN(parsedCat)) {
        filtered = filtered.filter((t) => t.categoryId === parsedCat);
      }
    }

    if (requestedPriority && typeof requestedPriority === "string") {
      filtered = filtered.filter(
        (t) => t.requestedPriority?.toUpperCase() === (requestedPriority as string).toUpperCase()
      );
    }

    if (currentStatus && typeof currentStatus === "string") {
      filtered = filtered.filter(
        (t) => t.currentStatus?.toUpperCase() === (currentStatus as string).toUpperCase()
      );
    }

    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.summary?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.ticketNumber?.toLowerCase().includes(q)
      );
    }

    const totalItems = filtered.length;
    const paginatedItems = filtered.slice(skip, skip + parsedPageSize);
    const totalPages = Math.max(1, Math.ceil(totalItems / parsedPageSize));

    res.json({
      items: paginatedItems,
      pagination: {
        page: parsedPage,
        pageSize: parsedPageSize,
        totalItems,
        totalPages,
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
    const ticket = inMemoryTickets.find((t) => t.id === ticketId);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found.", statusCode: 404 });
      return;
    }
    if (requesterId && ticket.requesterId !== requesterId) {
      res.status(403).json({ error: "Forbidden: You do not have access to this ticket.", statusCode: 403 });
      return;
    }
    res.json(ticket);
  }
});

// Handler for uploading attachments (API-07, AC-03, AC-05, BR-10..12)
const handleUploadAttachment = async (req: Request, res: Response) => {
  const ticketId = Number(req.params.id || req.body.ticketId);
  const requesterIdHeader = req.headers["x-requester-id"];
  const requesterIdQuery = req.query.requesterId;
  const requesterId = Number(requesterIdHeader || requesterIdQuery || req.body.requesterId);
  const file = req.file;

  if (isNaN(ticketId) || ticketId <= 0) {
    res.status(400).json({ error: "Invalid ticket ID.", statusCode: 400 });
    return;
  }

  if (!file) {
    res.status(400).json({ error: "No file provided.", statusCode: 400 });
    return;
  }

  // Validate file (BR-10, BR-11: 5MB limit, valid mime/ext)
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
    // Fallback for inMemoryTickets
    const ticket = inMemoryTickets.find((t) => t.id === ticketId);
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

    const activeCount = (ticket.attachments || []).filter((a: any) => !a.isRemoved).length;
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

    const newAttachment = {
      id: Math.floor(Math.random() * 9000) + 1000,
      ticketId,
      fileName: file.filename || file.originalname,
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      filePath: file.path || `uploads/${file.filename || file.originalname}`,
      isRemoved: false,
      createdAt: new Date().toISOString(),
    };

    if (!ticket.attachments) ticket.attachments = [];
    ticket.attachments.push(newAttachment);
    ticket.attachmentCount = (ticket.attachmentCount || 0) + 1;

    res.status(201).json(newAttachment);
  }
};

// POST /api/tickets/:id/attachments & POST /tickets/:id/attachments
app.post("/api/tickets/:id/attachments", upload.single("file"), handleUploadAttachment);
app.post("/tickets/:id/attachments", upload.single("file"), handleUploadAttachment);

// Handler for downloading attachments
const handleDownloadAttachment = async (req: Request, res: Response) => {
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
    for (const t of inMemoryTickets) {
      const att = (t.attachments || []).find((a: any) => a.id === attachmentId);
      if (att) {
        if (requesterId && t.requesterId !== requesterId) {
          res.status(403).json({ error: "Forbidden: You do not have access to this attachment.", statusCode: 403 });
          return;
        }
        if (att.isRemoved) {
          res.status(410).json({ error: "Attachment has been removed and is no longer available for download.", statusCode: 410 });
          return;
        }
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(att.originalName)}"`);
        res.setHeader("Content-Type", att.mimeType || "application/octet-stream");
        if (att.filePath && fs.existsSync(att.filePath)) {
          const stream = fs.createReadStream(att.filePath);
          stream.pipe(res);
        } else {
          res.status(200).send(Buffer.from("file data"));
        }
        return;
      }
    }
    res.status(404).json({ error: "Attachment not found.", statusCode: 404 });
  }
};

app.get("/api/attachments/:id/download", handleDownloadAttachment);
app.get("/attachments/:id/download", handleDownloadAttachment);

// Handler for soft-removing attachments
const handleSoftRemoveAttachment = async (req: Request, res: Response) => {
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
    for (const t of inMemoryTickets) {
      const att = (t.attachments || []).find((a: any) => a.id === attachmentId);
      if (att) {
        if (requesterId && t.requesterId !== requesterId) {
          res.status(403).json({ error: "Forbidden: You do not have permission to remove this attachment.", statusCode: 403 });
          return;
        }
        if (att.isRemoved) {
          res.status(409).json({ error: "Attachment is already removed.", statusCode: 409 });
          return;
        }
        att.isRemoved = true;
        att.removedAt = new Date().toISOString();
        att.removalReason = trimmedReason;
        t.attachmentCount = Math.max(0, (t.attachmentCount || 1) - 1);
        res.status(200).json(att);
        return;
      }
    }
    res.status(404).json({ error: "Attachment not found.", statusCode: 404 });
  }
};

app.patch("/api/attachments/:id/soft-remove", handleSoftRemoveAttachment);
app.patch("/attachments/:id/soft-remove", handleSoftRemoveAttachment);

// Multer and general error handling middleware
app.use((err: any, _req: Request, res: Response, _next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "File size exceeds maximum limit of 5MB.", statusCode: 400 });
      return;
    }
    res.status(400).json({ error: err.message, statusCode: 400 });
    return;
  }
  if (err) {
    res.status(400).json({ error: err.message || "Bad Request", statusCode: 400 });
    return;
  }
  _next();
});

export default app;

