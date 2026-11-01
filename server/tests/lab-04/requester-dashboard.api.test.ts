import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { isDbAvailable } from "../../src/utils/db-fallback.js";
import { staffFallbackTickets } from "../../src/routes/staff.js";

describe("Requester Dashboard API (TEST-DASH-01, AC-05, BR-10, BR-11)", () => {
  let requesterToken: string;
  let requesterUserId: number;
  let staffToken: string;

  beforeAll(async () => {
    // Login as requester (Jennifer Anderson)
    const reqRes = await request(app).post("/api/auth/login").send({
      email: "jennifer.anderson@example.com",
      password: "Password123!",
    });
    requesterToken = reqRes.body.token;
    requesterUserId = reqRes.body.user.id;

    // Login as IT staff (Alex Triage)
    const staffRes = await request(app).post("/api/auth/login").send({
      email: "staff1@toktickit.local",
      password: "Password123!",
    });
    staffToken = staffRes.body.token;
  });

  it("rejects unauthenticated requests with 401", async () => {
    const res = await request(app).get("/api/dashboard/requester");
    expect(res.status).toBe(401);
  });

  it("rejects non-requester staff users with 403 Forbidden", async () => {
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("fetches dashboard data scoped strictly to authenticated requester (TEST-DASH-01, AC-05, BR-10)", async () => {
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metrics");
    expect(res.body).toHaveProperty("recentTickets");

    const { metrics, recentTickets } = res.body;

    // Verify metrics shape
    expect(typeof metrics.totalOpen).toBe("number");
    expect(typeof metrics.inProgress).toBe("number");
    expect(typeof metrics.waitingForRequester).toBe("number");
    expect(typeof metrics.resolved).toBe("number");
    expect(typeof metrics.closed).toBe("number");

    // Verify recent tickets are limited to 5 and belong to requester
    expect(Array.isArray(recentTickets)).toBe(true);
    expect(recentTickets.length).toBeLessThanOrEqual(5);

    if (await isDbAvailable()) {
      const prisma = getPrisma();
      for (const ticket of recentTickets) {
        const dbTicket = await prisma.ticket.findUnique({
          where: { id: ticket.id },
        });
        expect(dbTicket).toBeDefined();
        expect(dbTicket?.requesterId).toBe(requesterUserId);
      }

      const dbTotalOpen = await prisma.ticket.count({
        where: {
          requesterId: requesterUserId,
          currentStatus: { in: ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "REOPENED"] },
        },
      });
      expect(metrics.totalOpen).toBe(dbTotalOpen);
    } else {
      for (const ticket of recentTickets) {
        const fallbackTicket = staffFallbackTickets.find((t) => t.id === ticket.id);
        expect(fallbackTicket).toBeDefined();
        expect(fallbackTicket?.requesterId).toBe(requesterUserId);
      }
      expect(metrics.totalOpen).toBeGreaterThanOrEqual(0);
    }
  });
});
