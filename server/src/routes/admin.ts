import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getPrisma } from "../prisma.js";
import { authMiddleware, requireRole, requirePasswordChanged } from "../middleware/auth.js";
import { fallbackUsers, findUserByEmail, findUserById } from "./auth.js";
import { isDbAvailable } from "../utils/db-fallback.js";

export const adminRouter = Router();

// Administrator-only route guard
adminRouter.use(authMiddleware);
adminRouter.use(requirePasswordChanged);
adminRouter.use(requireRole("ADMINISTRATOR"));

// Helper to count active administrators across database or fallback
async function getActiveAdminCount(): Promise<number> {
  if (await isDbAvailable()) {
    try {
      const prisma = getPrisma();
      if (prisma?.user) {
        return await prisma.user.count({
          where: { role: "ADMINISTRATOR", isActive: true },
        });
      }
    } catch {
      // Database unavailable, fallback
    }
  }
  return fallbackUsers.filter((u) => u.role === "ADMINISTRATOR" && u.isActive).length;
}

// ---------------------------------------------------------------------------
// GET /api/admin/users
adminRouter.get("/users", async (req: Request, res: Response) => {
  const { search, role, isActive, page = "1", pageSize = "20" } = req.query;

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(pageSize as string) || 20));

  if (await isDbAvailable()) {
    try {
      const prisma = getPrisma();
    if (prisma?.user) {
      const where: any = {};

      if (role && role !== "ALL") {
        where.role = role;
      }

      if (isActive !== undefined && isActive !== "ALL") {
        where.isActive = String(isActive) === "true";
      }

      if (search) {
        const q = String(search).trim();
        where.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { department: { contains: q, mode: "insensitive" } },
        ];
      }

      const totalCount = await prisma.user.count({ where });
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          isActive: true,
          mustChangePassword: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { id: "asc" },
        skip: (pageNum - 1) * limit,
        take: limit,
      });

      res.status(200).json({
        users,
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

  // Fallback in-memory listing
  let filtered = [...fallbackUsers];

  if (role && role !== "ALL") {
    filtered = filtered.filter((u) => u.role === role);
  }

  if (isActive !== undefined && isActive !== "ALL") {
    const boolActive = String(isActive) === "true";
    filtered = filtered.filter((u) => u.isActive === boolActive);
  }

  if (search) {
    const q = String(search).toLowerCase().trim();
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q))
    );
  }

  const totalCount = filtered.length;
  const paginated = filtered
    .slice((pageNum - 1) * limit, pageNum * limit)
    .map(({ passwordHash, ...safeUser }) => safeUser);

  res.status(200).json({
    users: paginated,
    pagination: {
      page: pageNum,
      pageSize: limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
  });
});

// ---------------------------------------------------------------------------
// POST /api/admin/users (Create User)
adminRouter.post("/users", async (req: Request, res: Response) => {
  const { name, email, role, department, temporaryPassword } = req.body;

  if (!name || !email || !role || !temporaryPassword) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Name, email, role, and temporaryPassword are required",
      },
    });
    return;
  }

  const validRoles = ["REQUESTER", "IT_STAFF", "ADMINISTRATOR"];
  if (!validRoles.includes(role)) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: `Role must be one of: ${validRoles.join(", ")}`,
      },
    });
    return;
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    res.status(400).json({
      error: {
        code: "DUPLICATE_EMAIL",
        message: "A user with this email address already exists",
      },
    });
    return;
  }

  const passwordHash = bcrypt.hashSync(temporaryPassword, 10);

  if (await isDbAvailable()) {
    try {
      const prisma = getPrisma();
    if (prisma?.user) {
      const created = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          role,
          department: department ? department.trim() : null,
          passwordHash,
          isActive: true,
          mustChangePassword: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          isActive: true,
          mustChangePassword: true,
          createdAt: true,
        },
      });

      res.status(201).json({ user: created });
      return;
    }
    } catch {
      // Database unavailable, fallback
    }
  }

  const newUser = {
    id: fallbackUsers.length + 1,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    role,
    department: department ? department.trim() : null,
    passwordHash,
    isActive: true,
    mustChangePassword: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  fallbackUsers.push(newUser);

  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json({ user: safeUser });
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/users/:id (Update User & Enforce Safety Rules)
adminRouter.patch("/users/:id", async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  const { name, role, department, isActive } = req.body;

  if (isNaN(userId)) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid user ID" } });
    return;
  }

  const targetUser = await findUserById(userId);
  if (!targetUser) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
    return;
  }

  // Safety Rule 1: Administrator cannot deactivate their own active account
  if (req.user?.id === userId && isActive === false) {
    res.status(400).json({
      error: {
        code: "CANNOT_DEACTIVATE_SELF",
        message: "You cannot deactivate your own administrative account",
      },
    });
    return;
  }

  // Safety Rule 2: Administrator cannot revoke their own Administrator role
  if (req.user?.id === userId && role && role !== "ADMINISTRATOR") {
    res.status(400).json({
      error: {
        code: "CANNOT_DEMOTE_SELF",
        message: "You cannot change the role of your own administrative account",
      },
    });
    return;
  }

  // Safety Rule 3: Last active administrator safeguard
  if (targetUser.role === "ADMINISTRATOR" && targetUser.isActive) {
    const isDeactivating = isActive === false;
    const isChangingRole = role && role !== "ADMINISTRATOR";

    if (isDeactivating || isChangingRole) {
      const activeAdminCount = await getActiveAdminCount();
      if (activeAdminCount <= 1) {
        res.status(400).json({
          error: {
            code: "LAST_ADMIN_PROTECTED",
            message: "Cannot deactivate or change role of the last active Administrator account",
          },
        });
        return;
      }
    }
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name.trim();
  if (department !== undefined) updateData.department = department ? department.trim() : null;
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = Boolean(isActive);

  if (await isDbAvailable()) {
    try {
      const prisma = getPrisma();
    if (prisma?.user) {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          isActive: true,
          mustChangePassword: true,
          updatedAt: true,
        },
      });
      res.status(200).json({ user: updated });
      return;
    }
    } catch {
      // Database unavailable, fallback
    }
  }

  Object.assign(targetUser, updateData);
  targetUser.updatedAt = new Date();

  const { passwordHash: _, ...safeUser } = targetUser;
  res.status(200).json({ user: safeUser });
});

// ---------------------------------------------------------------------------
// POST /api/admin/users/:id/reset-password
adminRouter.post("/users/:id/reset-password", async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  const { temporaryPassword } = req.body;

  if (isNaN(userId)) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid user ID" } });
    return;
  }

  if (!temporaryPassword || typeof temporaryPassword !== "string" || temporaryPassword.length < 8) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Temporary password must be at least 8 characters long",
      },
    });
    return;
  }

  const targetUser = await findUserById(userId);
  if (!targetUser) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
    return;
  }

  const newHash = bcrypt.hashSync(temporaryPassword, 10);

  if (await isDbAvailable()) {
    try {
      const prisma = getPrisma();
    if (prisma?.user) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newHash,
          mustChangePassword: true,
        },
      });
      res.status(200).json({
        message: "User password reset successfully",
        mustChangePassword: true,
      });
      return;
    }
    } catch {
      // Database unavailable, fallback
    }
  }

  targetUser.passwordHash = newHash;
  targetUser.mustChangePassword = true;

  res.status(200).json({
    message: "User password reset successfully",
    mustChangePassword: true,
  });
});
