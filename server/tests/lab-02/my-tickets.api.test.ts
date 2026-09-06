import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

describe("My Tickets API (API-04, API-05, AC-07, AC-08, BR-05, BR-15)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/tickets - Data Ownership Isolation (API-04, BR-05, AC-07)", () => {
    it("returns 400 Bad Request if requesterId is missing", async () => {
      const res = await request(app).get("/api/tickets");
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatch(/requesterId/i);
    });

    it("filters tickets strictly by requesterId so users only see their own tickets", async () => {
      const mockRequester1Tickets = [
        {
          id: 1,
          ticketNumber: "TKT-2026-000001",
          summary: "VPN issue",
          description: "Cannot connect to campus VPN",
          requestedPriority: "MEDIUM",
          currentStatus: "NEW",
          requesterId: 1,
          categoryId: 4,
          relatedSystemId: 3,
          category: { id: 4, name: "Network" },
          relatedSystem: { id: 3, name: "VPN" },
          createdAt: new Date("2026-09-01T10:00:00Z").toISOString(),
          updatedAt: new Date("2026-09-01T10:00:00Z").toISOString(),
        },
      ];

      const findManyMock = vi.fn().mockImplementation(async (args?: any) => {
        if (args?.where?.requesterId === 1) {
          return mockRequester1Tickets;
        }
        return [];
      });

      const countMock = vi.fn().mockImplementation(async (args?: any) => {
        if (args?.where?.requesterId === 1) {
          return mockRequester1Tickets.length;
        }
        return 0;
      });

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
        ticket: {
          findMany: findManyMock,
          count: countMock,
        },
      } as any);

      // Query as requesterId = 1
      const res1 = await request(app).get("/api/tickets?requesterId=1");
      expect(res1.status).toBe(200);
      expect(res1.body.items).toHaveLength(1);
      expect(res1.body.items[0].ticketNumber).toBe("TKT-2026-000001");
      expect(res1.body.items[0].requesterId).toBe(1);

      // Query as requesterId = 2
      const res2 = await request(app).get("/api/tickets?requesterId=2");
      expect(res2.status).toBe(200);
      expect(res2.body.items).toHaveLength(0);
      expect(res2.body.pagination.totalItems).toBe(0);
    });
  });

  describe("GET /api/tickets - Search, Filter, Sort, Pagination (API-05, BR-15, AC-08)", () => {
    it("returns paginated results with pagination metadata and defaults to createdAt DESC", async () => {
      const mockTickets = [
        {
          id: 10,
          ticketNumber: "TKT-2026-000010",
          summary: "Newest ticket",
          description: "Description 10",
          requestedPriority: "HIGH",
          currentStatus: "NEW",
          requesterId: 1,
          categoryId: 1,
          relatedSystemId: 1,
          category: { id: 1, name: "Account and Access" },
          relatedSystem: { id: 1, name: "Email" },
          createdAt: new Date("2026-09-03T12:00:00Z").toISOString(),
          updatedAt: new Date("2026-09-03T12:00:00Z").toISOString(),
        },
        {
          id: 5,
          ticketNumber: "TKT-2026-000005",
          summary: "Older ticket",
          description: "Description 5",
          requestedPriority: "LOW",
          currentStatus: "NEW",
          requesterId: 1,
          categoryId: 2,
          relatedSystemId: 2,
          category: { id: 2, name: "Hardware" },
          relatedSystem: { id: 2, name: "Campus Wi-Fi" },
          createdAt: new Date("2026-09-02T08:00:00Z").toISOString(),
          updatedAt: new Date("2026-09-02T08:00:00Z").toISOString(),
        },
      ];

      const findManyMock = vi.fn().mockResolvedValue(mockTickets);
      const countMock = vi.fn().mockResolvedValue(25);

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
        ticket: {
          findMany: findManyMock,
          count: countMock,
        },
      } as any);

      const res = await request(app).get("/api/tickets?requesterId=1&page=2&pageSize=10");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("items");
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.pagination).toEqual({
        page: 2,
        pageSize: 10,
        totalItems: 25,
        totalPages: 3,
      });

      // Verify Prisma call received correct skip/take and default sort
      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
          orderBy: [{ createdAt: "desc" }, { ticketNumber: "desc" }],
        })
      );
    });

    it("applies search and category/priority/status filters to Prisma query", async () => {
      const findManyMock = vi.fn().mockResolvedValue([]);
      const countMock = vi.fn().mockResolvedValue(0);

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
        ticket: {
          findMany: findManyMock,
          count: countMock,
        },
      } as any);

      const res = await request(app).get(
        "/api/tickets?requesterId=1&search=wifi&categoryId=2&requestedPriority=HIGH&currentStatus=NEW"
      );

      expect(res.status).toBe(200);
      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            requesterId: 1,
            categoryId: 2,
            requestedPriority: "HIGH",
            currentStatus: "NEW",
            OR: expect.arrayContaining([
              { summary: { contains: "wifi", mode: "insensitive" } },
              { description: { contains: "wifi", mode: "insensitive" } },
              { ticketNumber: { contains: "wifi", mode: "insensitive" } },
            ]),
          }),
        })
      );
    });
  });
});
