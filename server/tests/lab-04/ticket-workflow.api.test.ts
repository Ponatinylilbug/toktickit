import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 4 Ticket Workflow & Resolution API (TEST-FLOW-01..04, AC-07..09, BR-06..09)", () => {
  let requesterToken: string; // Jennifer (id 6)
  let staffToken: string; // Alex (id 2)

  beforeAll(async () => {
    const res1 = await request(app).post("/api/auth/login").send({
      email: "jennifer.anderson@example.com",
      password: "Password123!",
    });
    requesterToken = res1.body.token;

    const res2 = await request(app).post("/api/auth/login").send({
      email: "staff1@toktickit.local",
      password: "Password123!",
    });
    staffToken = res2.body.token;
  });

  it("PUT /api/staff/tickets/:id/status allows IT Staff to formally resolve an In Progress ticket (TEST-FLOW-01, AC-07, BR-07)", async () => {
    // Ticket 1 is IN_PROGRESS -> permitted to transition to RESOLVED
    const res = await request(app)
      .put("/api/staff/tickets/1/status")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "RESOLVED" });

    expect(res.status).toBe(200);
    expect(res.body.ticket.currentStatus).toBe("RESOLVED");
  });

  it("PUT /api/staff/tickets/:id/status rejects illegal status transition with 400 Bad Request (TEST-FLOW-02, AC-08, BR-08)", async () => {
    // Ticket 2 has status NEW -> transitioning directly to CLOSED or RESOLVED is illegal
    const res = await request(app)
      .put("/api/staff/tickets/2/status")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "CLOSED" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("ILLEGAL_TRANSITION");
    expect(res.body.error.message).toContain("not permitted");
  });

  it("enforces Resolution Gate: Requester advisory feedback does NOT change ticket to RESOLVED, and Requester cannot call staff status (TEST-FLOW-03, AC-07, BR-07)", async () => {
    // 1. Advisory endpoint records feedback without state change
    const advRes = await request(app)
      .put("/api/requester/tickets/2/resolve-feedback")
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({ appearsResolved: true });

    expect(advRes.status).toBe(200);
    expect(advRes.body.problemAppearsResolved).toBe(true);

    // 2. Direct attempt by Requester to formally change status is rejected with 403 Forbidden
    const staffRes = await request(app)
      .put("/api/staff/tickets/2/status")
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({ status: "RESOLVED" });

    expect(staffRes.status).toBe(403);
    expect(staffRes.body.error.code).toBe("FORBIDDEN");
  });

  it("PUT /api/staff/tickets/:id/status rejects stale update with 409 Conflict when expectedUpdatedAt does not match (TEST-FLOW-04, AC-09, BR-09)", async () => {
    // Stale timestamp far in the past
    const staleTimestamp = new Date("2020-01-01T00:00:00.000Z").toISOString();

    const res = await request(app)
      .put("/api/staff/tickets/1/status")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        status: "CLOSED", // Permitted from RESOLVED
        expectedUpdatedAt: staleTimestamp,
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("STALE_UPDATE_CONFLICT");
    expect(res.body.error.message).toContain("modified by another process");
  });
});
