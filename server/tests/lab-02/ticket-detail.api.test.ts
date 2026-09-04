import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

describe("Ticket Detail API (API-06, AC-09, AC-10, BR-05)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 200 with complete ticket details and attachments for ticket owner (AC-09)", async () => {
    const mockTicket = {
      id: 101,
      ticketNumber: "TKT-2026-000101",
      summary: "Laptop battery drains quickly",
      description: "My laptop battery is draining much faster than usual even when idle.",
      requestedPriority: "MEDIUM",
      currentStatus: "NEW",
      requesterId: 1,
      categoryId: 2,
      relatedSystemId: 7,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requester: {
        id: 1,
        name: "Jennifer Anderson",
        email: "jennifer.anderson@example.com",
        department: "Engineering",
      },
      category: { id: 2, name: "Hardware" },
      relatedSystem: { id: 7, name: "Corporate Laptop" },
      attachments: [
        {
          id: 501,
          ticketId: 101,
          fileName: "501_battery_log.png",
          originalName: "battery_log.png",
          fileSize: 145200,
          mimeType: "image/png",
          filePath: "uploads/501_battery_log.png",
          isRemoved: false,
          removedAt: null,
          removalReason: null,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
      ticket: {
        findUnique: vi.fn().mockResolvedValue(mockTicket),
      },
    } as any);

    const res = await request(app)
      .get("/api/tickets/101")
      .set("x-requester-id", "1");

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(101);
    expect(res.body.ticketNumber).toBe("TKT-2026-000101");
    expect(res.body.category.name).toBe("Hardware");
    expect(res.body.attachments).toHaveLength(1);
  });

  it("returns 403 Forbidden when requester attempts to access another user's ticket (API-06, AC-10)", async () => {
    const mockTicket = {
      id: 101,
      ticketNumber: "TKT-2026-000101",
      requesterId: 1, // Owned by user 1
      summary: "Confidential hardware issue",
      description: "Details of hardware failure",
    };

    vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
      ticket: {
        findUnique: vi.fn().mockResolvedValue(mockTicket),
      },
    } as any);

    // User 2 attempts to access Ticket 101
    const res = await request(app)
      .get("/api/tickets/101")
      .set("x-requester-id", "2");

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/forbidden|access/i);
  });

  it("returns 404 Not Found when ticket does not exist", async () => {
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
      ticket: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    } as any);

    const res = await request(app)
      .get("/api/tickets/9999")
      .set("x-requester-id", "1");

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});
