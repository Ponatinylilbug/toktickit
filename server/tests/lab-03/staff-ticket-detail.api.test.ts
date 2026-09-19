import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 3 Staff Ticket Detail & Operations API (TEST-DETAIL-01..03, AC-06..08)", () => {
  let staffToken: string;

  beforeAll(async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "staff1@toktickit.local",
      password: "Password123!",
    });
    staffToken = res.body.token;
  });

  it("GET /api/staff/tickets/:id returns full ticket detail with requester & owner", async () => {
    const res = await request(app)
      .get("/api/staff/tickets/1")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ticket");
    expect(res.body.ticket.id).toBe(1);
    expect(res.body.ticket).toHaveProperty("requester");
    expect(res.body.ticket).toHaveProperty("currentStatus");
  });

  it("GET /api/staff/tickets/9999 returns 404 Not Found", async () => {
    const res = await request(app)
      .get("/api/staff/tickets/9999")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(404);
  });

  it("PATCH /api/staff/tickets/:id/assign updates owner (TEST-DETAIL-01, AC-06)", async () => {
    // Assign to Jordan Tech (id 3)
    const res = await request(app)
      .patch("/api/staff/tickets/2/assign")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ ownerId: 3 });

    expect(res.status).toBe(200);
    expect(res.body.ticket.ownerId).toBe(3);
  });

  it("PATCH /api/staff/tickets/:id/assign rejects assignment to a requester (BR-11)", async () => {
    // Jennifer Anderson is a requester (id 6)
    const res = await request(app)
      .patch("/api/staff/tickets/2/assign")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ ownerId: 6 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_ASSIGNEE");
  });

  it("PATCH /api/staff/tickets/:id/priority updates IT Priority (TEST-DETAIL-02, AC-07)", async () => {
    const res = await request(app)
      .patch("/api/staff/tickets/1/priority")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ itPriority: "URGENT" });

    expect(res.status).toBe(200);
    expect(res.body.ticket.itPriority).toBe("URGENT");
  });

  it("PATCH /api/staff/tickets/:id/status updates status (TEST-DETAIL-03, AC-08)", async () => {
    const res = await request(app)
      .patch("/api/staff/tickets/1/status")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "RESOLVED" });

    expect(res.status).toBe(200);
    expect(res.body.ticket.currentStatus).toBe("RESOLVED");
  });

  it("PATCH /api/staff/tickets/:id/status rejects invalid status values", async () => {
    const res = await request(app)
      .patch("/api/staff/tickets/1/status")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "NON_EXISTENT_STATUS" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
