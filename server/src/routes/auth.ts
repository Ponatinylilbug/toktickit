import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getPrisma } from "../prisma.js";
import { authMiddleware, generateToken, AuthPayload } from "../middleware/auth.js";

export const authRouter = Router();

// Fallback in-memory users for testing or offline database mode
const defaultHashedPassword = bcrypt.hashSync("Password123!", 10);
const initialHashedPassword = bcrypt.hashSync("InitialPassword123!", 10);

export const fallbackUsers = [
  {
    id: 1,
    name: "System Administrator",
    email: "admin@toktickit.local",
    passwordHash: defaultHashedPassword,
    role: "ADMINISTRATOR" as const,
    department: "IT Administration",
    isActive: true,
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: "Alex Triage",
    email: "staff1@toktickit.local",
    passwordHash: defaultHashedPassword,
    role: "IT_STAFF" as const,
    department: "IT Operations",
    isActive: true,
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    name: "Jordan Tech",
    email: "staff2@toktickit.local",
    passwordHash: defaultHashedPassword,
    role: "IT_STAFF" as const,
    department: "Network Operations",
    isActive: true,
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 4,
    name: "Sam Systems",
    email: "staff3@toktickit.local",
    passwordHash: defaultHashedPassword,
    role: "IT_STAFF" as const,
    department: "Infrastructure",
    isActive: true,
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 5,
    name: "Morgan Retired",
    email: "staff.inactive@toktickit.local",
    passwordHash: defaultHashedPassword,
    role: "IT_STAFF" as const,
    department: "IT Operations",
    isActive: false,
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 6,
    name: "Jennifer Anderson",
    email: "jennifer.anderson@example.com",
    passwordHash: defaultHashedPassword,
    role: "REQUESTER" as const,
    department: "Human Resources",
    isActive: true,
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 7,
    name: "Michael Brown",
    email: "michael.brown@example.com",
    passwordHash: defaultHashedPassword,
    role: "REQUESTER" as const,
    department: "Finance",
    isActive: true,
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 8,
    name: "Alex Taylor",
    email: "inactive.user@example.com",
    passwordHash: defaultHashedPassword,
    role: "REQUESTER" as const,
    department: "Operations",
    isActive: false,
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 9,
    name: "Casey Newbie",
    email: "newuser@toktickit.local",
    passwordHash: initialHashedPassword,
    role: "REQUESTER" as const,
    department: "Sales",
    isActive: true,
    mustChangePassword: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

import { safeDbQuery } from "../utils/db-fallback.js";

// Helper to find user across Prisma DB or fallback
export async function findUserByEmail(email: string) {
  return safeDbQuery(
    async (prisma) => {
      if (prisma?.user) {
        const found = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (found) return found;
      }
      return fallbackUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
    },
    () => fallbackUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
  );
}

export async function findUserById(id: number) {
  return safeDbQuery(
    async (prisma) => {
      if (prisma?.user) {
        const found = await prisma.user.findUnique({
          where: { id },
        });
        if (found) return found;
      }
      return fallbackUsers.find((u) => u.id === id) || null;
    },
    () => fallbackUsers.find((u) => u.id === id) || null
  );
}

// ---------------------------------------------------------------------------
// POST /api/auth/login
authRouter.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Email and password are required",
      },
    });
    return;
  }

  const user = await findUserByEmail(email);

  if (!user) {
    res.status(401).json({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      },
    });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({
      error: {
        code: "ACCOUNT_INACTIVE",
        message: "This account has been deactivated. Please contact an administrator.",
      },
    });
    return;
  }

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      },
    });
    return;
  }

  const payload: AuthPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    mustChangePassword: user.mustChangePassword,
  };

  const token = generateToken(payload);

  res.status(200).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      mustChangePassword: user.mustChangePassword,
    },
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout
authRouter.post("/logout", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Successfully logged out",
  });
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
authRouter.get("/me", authMiddleware, async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
    return;
  }

  const user = await findUserById(req.user.id);
  if (!user) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
    return;
  }

  res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      mustChangePassword: user.mustChangePassword,
    },
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/change-password
authRouter.post("/change-password", authMiddleware, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Current password and new password are required",
      },
    });
    return;
  }

  // Password complexity: >=8 chars, 1 uppercase, 1 lowercase, 1 digit
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    res.status(400).json({
      error: {
        code: "WEAK_PASSWORD",
        message: "New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number",
      },
    });
    return;
  }

  if (currentPassword === newPassword) {
    res.status(400).json({
      error: {
        code: "SAME_PASSWORD",
        message: "New password must be different from current password",
      },
    });
    return;
  }

  const user = await findUserById(req.user!.id);
  if (!user) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
    return;
  }

  const isCurrentValid = bcrypt.compareSync(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    res.status(401).json({
      error: {
        code: "INVALID_CURRENT_PASSWORD",
        message: "Current password does not match",
      },
    });
    return;
  }

  const newHash = bcrypt.hashSync(newPassword, 10);

  await safeDbQuery(
    async (prisma) => {
      if (prisma?.user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash: newHash,
            mustChangePassword: false,
          },
        });
      }
    },
    () => {}
  );

  // Update in memory fallback
  user.passwordHash = newHash;
  user.mustChangePassword = false;

  res.status(200).json({
    message: "Password changed successfully",
    mustChangePassword: false,
  });
});
