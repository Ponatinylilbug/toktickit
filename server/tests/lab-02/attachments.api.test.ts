import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

describe("Attachments API (API-07, API-08, API-09, AC-03, AC-05, AC-11..13, BR-10..13)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /api/tickets/:id/attachments (API-07, AC-03, AC-05)", () => {
    it("uploads a valid file attachment and returns 201 Created", async () => {
      const mockTicket = {
        id: 101,
        requesterId: 1,
      };

      const mockSavedAttachment = {
        id: 502,
        ticketId: 101,
        fileName: "502_system_diagnostics.pdf",
        originalName: "system_diagnostics.pdf",
        fileSize: 524000,
        mimeType: "application/pdf",
        filePath: "uploads/502_system_diagnostics.pdf",
        isRemoved: false,
        removedAt: null,
        removalReason: null,
        createdAt: new Date().toISOString(),
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
        ticket: {
          findUnique: vi.fn().mockResolvedValue(mockTicket),
        },
        attachment: {
          count: vi.fn().mockResolvedValue(2), // currently 2 active
          create: vi.fn().mockResolvedValue(mockSavedAttachment),
        },
      } as any);

      const res = await request(app)
        .post("/api/tickets/101/attachments")
        .set("x-requester-id", "1")
        .attach("file", Buffer.from("%PDF-1.4 sample content"), "system_diagnostics.pdf");

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(502);
      expect(res.body.originalName).toBe("system_diagnostics.pdf");
      expect(res.body.isRemoved).toBe(false);
    });

    it("rejects upload with 409 Conflict when ticket already has 5 active attachments (AC-05, BR-12)", async () => {
      const mockTicket = {
        id: 101,
        requesterId: 1,
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
        ticket: {
          findUnique: vi.fn().mockResolvedValue(mockTicket),
        },
        attachment: {
          count: vi.fn().mockResolvedValue(5), // 5 active files already
        },
      } as any);

      const res = await request(app)
        .post("/api/tickets/101/attachments")
        .set("x-requester-id", "1")
        .attach("file", Buffer.from("%PDF-1.4 test"), "sixth_file.pdf");

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/limit|5 active/i);
    });

    it("rejects upload with 400 Bad Request for unsupported file type (BR-10)", async () => {
      const mockTicket = {
        id: 101,
        requesterId: 1,
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
        ticket: {
          findUnique: vi.fn().mockResolvedValue(mockTicket),
        },
        attachment: {
          count: vi.fn().mockResolvedValue(0),
        },
      } as any);

      const res = await request(app)
        .post("/api/tickets/101/attachments")
        .set("x-requester-id", "1")
        .attach("file", Buffer.from("executable content"), "malicious.exe");

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/format|allowed|extension/i);
    });
  });

  describe("GET /api/attachments/:id/download (API-08, AC-11, AC-13)", () => {
    it("returns file stream with Content-Disposition for active attachment (AC-11)", async () => {
      const mockAttachment = {
        id: 501,
        ticketId: 101,
        originalName: "battery_log.png",
        mimeType: "image/png",
        filePath: "uploads/501_battery_log.png",
        isRemoved: false,
        ticket: {
          id: 101,
          requesterId: 1,
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
        attachment: {
          findUnique: vi.fn().mockResolvedValue(mockAttachment),
        },
      } as any);

      const res = await request(app)
        .get("/api/attachments/501/download")
        .set("x-requester-id", "1");

      // In real or mock handling, it sets Content-Disposition header and returns 200
      expect(res.status).toBe(200);
      expect(res.headers["content-disposition"]).toMatch(/attachment;\s*filename="?battery_log.png"?/i);
    });

    it("returns 410 Gone for soft-removed attachment and refuses download (AC-13, BR-13)", async () => {
      const mockAttachment = {
        id: 501,
        ticketId: 101,
        originalName: "battery_log.png",
        isRemoved: true,
        removedAt: new Date().toISOString(),
        removalReason: "Uploaded wrong screenshot",
        ticket: {
          id: 101,
          requesterId: 1,
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
        attachment: {
          findUnique: vi.fn().mockResolvedValue(mockAttachment),
        },
      } as any);

      const res = await request(app)
        .get("/api/attachments/501/download")
        .set("x-requester-id", "1");

      expect(res.status).toBe(410);
      expect(res.body.error).toMatch(/removed|no longer available/i);
    });

    it("returns 403 Forbidden if requester is not the ticket owner", async () => {
      const mockAttachment = {
        id: 501,
        ticketId: 101,
        originalName: "battery_log.png",
        isRemoved: false,
        ticket: {
          id: 101,
          requesterId: 1,
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
        attachment: {
          findUnique: vi.fn().mockResolvedValue(mockAttachment),
        },
      } as any);

      const res = await request(app)
        .get("/api/attachments/501/download")
        .set("x-requester-id", "2"); // wrong requester

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/attachments/:id/soft-remove (API-09, AC-12, BR-13)", () => {
    it("soft-removes attachment when valid removalReason provided (AC-12)", async () => {
      const mockAttachment = {
        id: 501,
        ticketId: 101,
        originalName: "battery_log.png",
        isRemoved: false,
        ticket: {
          id: 101,
          requesterId: 1,
        },
      };

      const mockUpdated = {
        id: 501,
        ticketId: 101,
        originalName: "battery_log.png",
        isRemoved: true,
        removedAt: new Date().toISOString(),
        removalReason: "Uploaded incorrect diagnostic screenshot",
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
        attachment: {
          findUnique: vi.fn().mockResolvedValue(mockAttachment),
          update: vi.fn().mockResolvedValue(mockUpdated),
        },
      } as any);

      const res = await request(app)
        .patch("/api/attachments/501/soft-remove")
        .set("x-requester-id", "1")
        .send({
          removalReason: "Uploaded incorrect diagnostic screenshot",
        });

      expect(res.status).toBe(200);
      expect(res.body.isRemoved).toBe(true);
      expect(res.body.removalReason).toBe("Uploaded incorrect diagnostic screenshot");
      expect(res.body.removedAt).toBeDefined();
    });

    it("returns 400 Bad Request when removalReason is missing or empty (BR-13)", async () => {
      const res = await request(app)
        .patch("/api/attachments/501/soft-remove")
        .set("x-requester-id", "1")
        .send({
          removalReason: "  ",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/reason/i);
    });
  });
});
