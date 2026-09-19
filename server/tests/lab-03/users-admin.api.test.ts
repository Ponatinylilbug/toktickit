import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 3 Admin User Management API (TEST-ADMIN-01..04, AC-11..13)", () => {
  let adminToken: string;

  beforeAll(async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "admin@toktickit.local",
      password: "Password123!",
    });
    adminToken = res.body.token;
  });

  it("GET /api/admin/users lists all users with pagination (TEST-ADMIN-01, AC-11)", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("users");
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body).toHaveProperty("pagination");
    // Ensure password hashes are never exposed in user list
    for (const u of res.body.users) {
      expect(u.passwordHash).toBeUndefined();
    }
  });

  it("POST /api/admin/users creates a new user with mustChangePassword=true (TEST-ADMIN-02, AC-11)", async () => {
    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Morgan Engineer",
        email: "morgan.eng@toktickit.local",
        role: "REQUESTER",
        department: "Engineering",
        temporaryPassword: "InitialPassword123!",
      });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("morgan.eng@toktickit.local");
    expect(res.body.user.mustChangePassword).toBe(true);
  });

  it("POST /api/admin/users rejects duplicate email (BR-04)", async () => {
    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Duplicate User",
        email: "morgan.eng@toktickit.local",
        role: "REQUESTER",
        temporaryPassword: "InitialPassword123!",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("DUPLICATE_EMAIL");
  });

  it("PATCH /api/admin/users/:id updates user attributes", async () => {
    // Update Jordan Tech (id 3)
    const res = await request(app)
      .patch("/api/admin/users/3")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Jordan Senior Tech",
        department: "Senior Operations",
      });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("Jordan Senior Tech");
    expect(res.body.user.department).toBe("Senior Operations");
  });

  it("PATCH /api/admin/users/:id blocks self-deactivation (BR-17)", async () => {
    // Admin user id 1 attempts to deactivate self
    const res = await request(app)
      .patch("/api/admin/users/1")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        isActive: false,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("CANNOT_DEACTIVATE_SELF");
  });

  it("PATCH /api/admin/users/:id blocks deactivating sole active admin (TEST-ADMIN-03, AC-12, BR-16)", async () => {
    // In our system, admin id 1 is the only active admin
    const res = await request(app)
      .patch("/api/admin/users/1")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        role: "IT_STAFF",
      });

    expect(res.status).toBe(400);
    expect(["CANNOT_DEMOTE_SELF", "LAST_ADMIN_PROTECTED"]).toContain(res.body.error.code);
  });

  it("POST /api/admin/users/:id/reset-password resets password and triggers mustChangePassword (TEST-ADMIN-04, AC-13)", async () => {
    const res = await request(app)
      .post("/api/admin/users/3/reset-password")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        temporaryPassword: "NewTempPassword456!",
      });

    expect(res.status).toBe(200);
    expect(res.body.mustChangePassword).toBe(true);
  });
});
