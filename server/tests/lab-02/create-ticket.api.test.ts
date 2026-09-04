import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

describe("Create Ticket API (API-01, API-02, AC-01, AC-02, BR-01, BR-02, BR-06..09)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/related-systems", () => {
    it("returns 200 and list of active related systems in ascending id order", async () => {
      const mockSystems = [
        { id: 1, name: "Email" },
        { id: 2, name: "Campus Wi-Fi" },
        { id: 3, name: "VPN" },
        { id: 4, name: "LEB2 App" },
      ];

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
        relatedSystem: {
          findMany: vi.fn().mockResolvedValue(mockSystems),
        },
      } as any);

      const res = await request(app).get("/api/related-systems");
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockSystems);
    });
  });

  describe("POST /api/tickets", () => {
    it("creates a valid ticket and returns 201 with status NEW and formatted ticketNumber (API-01, AC-01)", async () => {
      const mockCreatedTicket = {
        id: 101,
        ticketNumber: "TKT-2026-000101",
        summary: "Cannot connect to campus VPN from dormitory",
        description: "Whenever I try to connect to the campus VPN client, it shows connection timeout error.",
        requestedPriority: "MEDIUM",
        currentStatus: "NEW",
        requesterId: 1,
        categoryId: 4,
        relatedSystemId: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: [],
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
        requesterUser: {
          findUnique: vi.fn().mockResolvedValue({ id: 1, name: "Jennifer Anderson", isActive: true }),
        },
        category: {
          findUnique: vi.fn().mockResolvedValue({ id: 4, name: "Network" }),
        },
        relatedSystem: {
          findUnique: vi.fn().mockResolvedValue({ id: 3, name: "VPN", isActive: true }),
        },
        ticket: {
          create: vi.fn().mockResolvedValue(mockCreatedTicket),
        },
      } as any);

      const res = await request(app)
        .post("/api/tickets")
        .send({
          requesterId: 1,
          categoryId: 4,
          relatedSystemId: 3,
          requestedPriority: "MEDIUM",
          summary: "Cannot connect to campus VPN from dormitory",
          description: "Whenever I try to connect to the campus VPN client, it shows connection timeout error.",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id", 101);
      expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
      expect(res.body.currentStatus).toBe("NEW");
      expect(res.body.summary).toBe("Cannot connect to campus VPN from dormitory");
    });

    it("returns 400 Bad Request with field errors when summary is missing or too short (API-02, AC-02, BR-06)", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .send({
          requesterId: 1,
          categoryId: 1,
          relatedSystemId: 1,
          summary: "Bad", // < 5 chars
          description: "This is a valid description that has more than ten characters.",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(Array.isArray(res.body.details)).toBe(true);
      expect(res.body.details.some((d: string) => /summary/i.test(d))).toBe(true);
    });

    it("returns 400 Bad Request when description is shorter than 10 characters (BR-07)", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .send({
          requesterId: 1,
          categoryId: 1,
          relatedSystemId: 1,
          summary: "Valid summary for ticket",
          description: "Too short", // < 10 chars
        });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d: string) => /description/i.test(d))).toBe(true);
    });

    it("returns 400 Bad Request when categoryId or relatedSystemId is missing (BR-08)", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .send({
          requesterId: 1,
          summary: "Valid summary for ticket",
          description: "This is a valid description that is long enough.",
        });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d: string) => /category/i.test(d))).toBe(true);
      expect(res.body.details.some((d: string) => /related system/i.test(d))).toBe(true);
    });

    it("returns 422 Unprocessable Entity when requesterId is missing or inactive (BR-04, BR-05)", async () => {
      vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
        requesterUser: {
          findUnique: vi.fn().mockResolvedValue({ id: 5, name: "David Miller", isActive: false }),
        },
      } as any);

      const res = await request(app)
        .post("/api/tickets")
        .send({
          requesterId: 5,
          categoryId: 1,
          relatedSystemId: 1,
          summary: "Valid summary for ticket",
          description: "Valid description longer than 10 chars.",
        });

      expect(res.status).toBe(422);
      expect(res.body.error).toMatch(/inactive|not found/i);
    });
  });
});
