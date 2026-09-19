import net from "net";
import { PrismaClient } from "@prisma/client";
import { getPrisma } from "../prisma.js";

let dbConnected: boolean | null = null;

function probeDbConnection(): Promise<boolean> {
  return new Promise((resolve) => {
    let host = "127.0.0.1";
    let port = 5432;
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        const u = new URL(dbUrl);
        host = u.hostname || "127.0.0.1";
        port = parseInt(u.port, 10) || 5432;
      } catch {}
    }

    const socket = new net.Socket();
    let settled = false;

    const finalize = (result: boolean) => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(result);
      }
    };

    socket.setTimeout(150);
    socket.on("connect", () => finalize(true));
    socket.on("timeout", () => finalize(false));
    socket.on("error", () => finalize(false));
    socket.connect(port, host);
  });
}

/**
 * Returns true if getPrisma() is a mocked object (e.g. in vitest vi.spyOn)
 * or if the live PostgreSQL database is reachable.
 */
export async function isDbAvailable(): Promise<boolean> {
  const prisma = getPrisma() as any;
  if (!prisma) return false;

  // If getPrisma() was mocked in tests (plain Object, not PrismaClient instance)
  if (!(prisma instanceof PrismaClient)) {
    return true;
  }

  // If already probed
  if (dbConnected !== null) {
    return dbConnected;
  }

  dbConnected = await probeDbConnection();
  return dbConnected;
}

export async function safeDbQuery<T>(
  dbFn: (prisma: ReturnType<typeof getPrisma>) => Promise<T>,
  fallbackFn: () => T | Promise<T>
): Promise<T> {
  const available = await isDbAvailable();
  if (!available) {
    return await fallbackFn();
  }

  try {
    return await dbFn(getPrisma());
  } catch (err) {
    return await fallbackFn();
  }
}

export function resetDbConnectedCache() {
  dbConnected = null;
}
