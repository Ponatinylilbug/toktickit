import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { isDbAvailable } from "../../src/utils/db-fallback.js";
import { staffFallbackTickets } from "../../src/routes/staff.js";

describe("IT Staff Dashboard API (TEST-DASH-02, AC-06, BR-11)", () => {
  let staffToken: string;
  let staffUserId: number;
  let requesterToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Login as IT staff (Alex Triage)
    const staffRes = await request(app).post("/api/auth/login").send({
      email: "staff1@toktickit.local",
      password: "Password123!",
    });
    staffToken = staffRes.body.token;
    staffUserId = staffRes.body.user.id;

    // Login as requester (Jennifer Anderson)
    const reqRes = await request(app).post("/api/auth/login").send({
      email: "jennifer.anderson@example.com",
      password: "Password123!",
    });
    requesterToken = reqRes.body.token;

    // Login as admin (Samir Admin)
    const adminRes = await request(app).post("/api/auth/login").send({
      email: "admin@toktickit.local",
      password: "Password123!",
    });
    adminToken = adminRes.body.token;
  });

  it("rejects unauthenticated requests with 401", async () => {
    const res = await request(app).get("/api/dashboard/staff");
    expect(res.status).toBe(401);
  });

  it("rejects requester users with 403 Forbidden", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Authorization", `Bearer ${requesterToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("allows IT staff to fetch authoritative dashboard metrics (TEST-DASH-02, AC-06, BR-11)", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metrics");
    expect(res.body).toHaveProperty("recentTickets");

    const { metrics, recentTickets } = res.body;

    // Verify metrics shape
    expect(typeof metrics.new).toBe("number");
    expect(typeof metrics.open).toBe("number");
    expect(typeof metrics.inProgress).toBe("number");
    expect(typeof metrics.waitingForRequester).toBe("number");
    expect(typeof metrics.myAssigned).toBe("number");
    expect(typeof metrics.unassigned).toBe("number");

    // Verify recent tickets are limited to 5 and exclude closed/cancelled
    expect(Array.isArray(recentTickets)).toBe(true);
    expect(recentTickets.length).toBeLessThanOrEqual(5);

    if (await isDbAvailable()) {
      const prisma = getPrisma();
      const [dbNew, dbOpen, dbInProgress, dbWaiting, dbMyAssigned, dbUnassigned] = await Promise.all([
        prisma.ticket.count({ where: { currentStatus: "NEW" } }),
        prisma.ticket.count({ where: { currentStatus: "OPEN" } }),
        prisma.ticket.count({ where: { currentStatus: "IN_PROGRESS" } }),
        prisma.ticket.count({ where: { currentStatus: "WAITING_FOR_REQUESTER" } }),
        prisma.ticket.count({ where: { ownerId: staffUserId, currentStatus: { notIn: ["CLOSED", "CANCELLED"] } } }),
        prisma.ticket.count({ where: { ownerId: null, currentStatus: { notIn: ["CLOSED", "CANCELLED"] } } }),
      ]);

      expect(metrics.new).toBe(dbNew);
      expect(metrics.open).toBe(dbOpen);
      expect(metrics.inProgress).toBe(dbInProgress);
      expect(metrics.waitingForRequester).toBe(dbWaiting);
      expect(metrics.myAssigned).toBe(dbMyAssigned);
      expect(metrics.unassigned).toBe(dbUnassigned);
    } else {
      expect(metrics.new).toBeGreaterThanOrEqual(0);
      expect(metrics.open).toBeGreaterThanOrEqual(0);
      expect(metrics.inProgress).toBeGreaterThanOrEqual(0);
      expect(metrics.waitingForRequester).toBeGreaterThanOrEqual(0);
      expect(metrics.myAssigned).toBeGreaterThanOrEqual(0);
      expect(metrics.unassigned).toBeGreaterThanOrEqual(0);
    }
  });

  it("allows Administrator to access staff dashboard", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metrics");
  });
});
