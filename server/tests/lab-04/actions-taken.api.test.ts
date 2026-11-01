import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 4 Actions Taken API (TEST-ACT-01..06, AC-01..04, BR-01..05, BR-13)", () => {
  let requesterToken: string; // Jennifer (id 6)
  let otherRequesterToken: string; // Michael (id 7)
  let staffToken: string; // Alex (id 2)
  let secondStaffToken: string; // Jordan (id 3)
  let createdActionId: number;

  beforeAll(async () => {
    const res1 = await request(app).post("/api/auth/login").send({
      email: "jennifer.anderson@example.com",
      password: "Password123!",
    });
    requesterToken = res1.body.token;

    const res2 = await request(app).post("/api/auth/login").send({
      email: "michael.brown@example.com",
      password: "Password123!",
    });
    otherRequesterToken = res2.body.token;

    const res3 = await request(app).post("/api/auth/login").send({
      email: "staff1@toktickit.local",
      password: "Password123!",
    });
    staffToken = res3.body.token;

    const res4 = await request(app).post("/api/auth/login").send({
      email: "staff2@toktickit.local",
      password: "Password123!",
    });
    secondStaffToken = res4.body.token;
  });

  it("POST /api/tickets/:id/actions saves action under correct ticket with authenticated actor (TEST-ACT-01, AC-01, BR-01..03)", async () => {
    const res = await request(app)
      .post("/api/tickets/1/actions")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        actionDate: new Date().toISOString(),
        description: "Replaced faulty Cisco AP-302 access point on 3rd floor.",
        result: "New access point booted and registered with controller.",
        followUpRequired: true,
        followUpNote: "Verify Wi-Fi channel coverage during peak class hours.",
        attachmentNotes: "ap_replacement_log.pdf",
      });

    expect(res.status).toBe(201);
    const action = res.body.action || res.body.data;
    expect(action).toBeDefined();
    expect(action.ticketId).toBe(1);
    expect(action.description).toContain("Replaced faulty Cisco AP-302");
    expect(action.followUpRequired).toBe(true);
    expect(action.followUpNote).toBe("Verify Wi-Fi channel coverage during peak class hours.");
    expect(action.performedBy).toBeDefined();
    expect(action.performedBy.role).toBe("IT_STAFF");
    createdActionId = action.id;
  });

  it("POST /api/tickets/:id/actions rejects creation when followUpRequired is true but followUpNote is missing (TEST-ACT-02, AC-02, BR-04)", async () => {
    const res = await request(app)
      .post("/api/tickets/1/actions")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        description: "Checked switch port configurations.",
        result: "VLAN 20 trunk configured.",
        followUpRequired: true,
        followUpNote: "", // missing note
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toContain("Follow-up note is required when follow-up is needed");
  });

  it("POST /api/tickets/:id/actions rejects Requester role with 403 Forbidden (TEST-ACT-03, AC-03, BR-05)", async () => {
    const res = await request(app)
      .post("/api/tickets/1/actions")
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({
        description: "Requester trying to add an action.",
        result: "Should be forbidden.",
        followUpRequired: false,
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("GET /api/tickets/:id/actions allows owner Requester to view Actions Taken (TEST-ACT-04, AC-04, BR-13)", async () => {
    // Ticket 1 is owned by Jennifer (id 6)
    const res = await request(app)
      .get("/api/tickets/1/actions")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    const actions = res.body.actions || res.body.data;
    expect(Array.isArray(actions)).toBe(true);
    expect(actions.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/tickets/:id/actions blocks non-owner Requester with 403 Forbidden (TEST-ACT-07, BR-05)", async () => {
    // Michael (requester 7) tries to view ticket 1 (owned by Jennifer)
    const res = await request(app)
      .get("/api/tickets/1/actions")
      .set("Authorization", `Bearer ${otherRequesterToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("POST /api/tickets/:id/actions allows non-owner IT Staff to record action (TEST-ACT-05, AC-01, BR-02)", async () => {
    // Jordan Tech (staff2) records action on ticket 1 owned by Alex Triage
    const res = await request(app)
      .post("/api/tickets/1/actions")
      .set("Authorization", `Bearer ${secondStaffToken}`)
      .send({
        description: "Assisted with RF signal sweep.",
        result: "Confirmed RF attenuation is within acceptable limits.",
        followUpRequired: false,
      });

    expect(res.status).toBe(201);
    const action = res.body.action || res.body.data;
    expect(action.performedBy.name).toBe("Jordan Tech");
  });

  it("PUT /api/tickets/:id/actions/:actionId allows IT Staff to update existing action (TEST-ACT-06, AC-01, BR-03)", async () => {
    const targetId = createdActionId || 1;
    const res = await request(app)
      .put(`/api/tickets/1/actions/${targetId}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        result: "Updated: Firmware verified and all AP services running normally.",
        followUpRequired: false,
      });

    expect(res.status).toBe(200);
    const action = res.body.action || res.body.data;
    expect(action.result).toContain("Updated: Firmware verified");
    expect(action.followUpRequired).toBe(false);
  });
});
