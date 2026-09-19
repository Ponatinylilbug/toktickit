import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 3 Authorization & RBAC API (TEST-RBAC-01..03, AC-04)", () => {
  let requesterToken: string;
  let staffToken: string;
  let adminToken: string;

  it("sets up tokens for Requester, IT Staff, and Administrator", async () => {
    const reqRes = await request(app).post("/api/auth/login").send({
      email: "jennifer.anderson@example.com",
      password: "Password123!",
    });
    requesterToken = reqRes.body.token;

    const staffRes = await request(app).post("/api/auth/login").send({
      email: "staff1@toktickit.local",
      password: "Password123!",
    });
    staffToken = staffRes.body.token;

    const adminRes = await request(app).post("/api/auth/login").send({
      email: "admin@toktickit.local",
      password: "Password123!",
    });
    adminToken = adminRes.body.token;

    expect(requesterToken).toBeDefined();
    expect(staffToken).toBeDefined();
    expect(adminToken).toBeDefined();
  });

  it("blocks unauthenticated access to /api/staff/tickets with 401 (TEST-RBAC-03)", async () => {
    const res = await request(app).get("/api/staff/tickets");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("blocks unauthenticated access to /api/admin/users with 401", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("blocks Requester from accessing /api/staff/tickets with 403 Forbidden (TEST-RBAC-01, AC-04)", async () => {
    const res = await request(app)
      .get("/api/staff/tickets")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("blocks Requester from accessing /api/admin/users with 403 Forbidden", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("blocks IT Staff from accessing /api/admin/users with 403 Forbidden (TEST-RBAC-02, AC-04)", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("allows IT Staff to access /api/staff/tickets with 200 OK", async () => {
    const res = await request(app)
      .get("/api/staff/tickets")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("pagination");
  });

  it("allows Administrator to access both /api/staff/tickets and /api/admin/users", async () => {
    const staffRes = await request(app)
      .get("/api/staff/tickets")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(staffRes.status).toBe(200);

    const adminRes = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);
  });
});
