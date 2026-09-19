import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 3 IT Staff Ticket Queue API (TEST-QUEUE-01..03, AC-05)", () => {
  let staffToken: string;

  beforeAll(async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "staff1@toktickit.local",
      password: "Password123!",
    });
    staffToken = res.body.token;
  });

  it("GET /api/staff/tickets returns 200 with paginated ticket list across all requesters (TEST-QUEUE-01, AC-05)", async () => {
    const res = await request(app)
      .get("/api/staff/tickets")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty("pagination");
    expect(res.body.pagination).toHaveProperty("page", 1);
    expect(res.body.pagination).toHaveProperty("totalCount");
  });

  it("filters ticket queue by status (TEST-QUEUE-02)", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?status=IN_PROGRESS")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    for (const ticket of res.body.data) {
      expect(ticket.currentStatus).toBe("IN_PROGRESS");
    }
  });

  it("filters ticket queue by priority", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?priority=HIGH")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    for (const ticket of res.body.data) {
      const p = ticket.itPriority || ticket.requestedPriority;
      expect(p).toBe("HIGH");
    }
  });

  it("filters ticket queue by unassigned owner", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?ownerId=unassigned")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    for (const ticket of res.body.data) {
      expect(ticket.ownerId).toBeNull();
    }
  });

  it("searches tickets by keyword in summary or ticketNumber (TEST-QUEUE-03)", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?search=Wi-Fi")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    const hasMatch = res.body.data.some(
      (t: any) =>
        t.summary.includes("Wi-Fi") ||
        t.description.includes("Wi-Fi") ||
        t.ticketNumber.includes("Wi-Fi")
    );
    expect(hasMatch).toBe(true);
  });
});
