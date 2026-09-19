import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 3 Auth API (/api/auth)", () => {
  it("POST /api/auth/login succeeds with valid credentials (TEST-AUTH-01, AC-01)", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "staff1@toktickit.local",
      password: "Password123!",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toBe("staff1@toktickit.local");
    expect(res.body.user.role).toBe("IT_STAFF");
    expect(res.body.user.mustChangePassword).toBe(false);
  });

  it("POST /api/auth/login fails with invalid password (TEST-AUTH-02, AC-01)", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "staff1@toktickit.local",
      password: "WrongPassword999!",
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("POST /api/auth/login fails with non-existent email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "unknown@toktickit.local",
      password: "Password123!",
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("POST /api/auth/login fails for inactive user (TEST-AUTH-03, AC-02, BR-01)", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "staff.inactive@toktickit.local",
      password: "Password123!",
    });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("ACCOUNT_INACTIVE");
  });

  it("GET /api/auth/me returns current user profile when authenticated (TEST-AUTH-06)", async () => {
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "admin@toktickit.local",
      password: "Password123!",
    });
    const token = loginRes.body.token;

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe("admin@toktickit.local");
    expect(meRes.body.user.role).toBe("ADMINISTRATOR");
  });

  it("GET /api/auth/me returns 401 when token is missing", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("POST /api/auth/logout succeeds", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });

  it("POST /api/auth/change-password validates password complexity and updates password (TEST-AUTH-05, AC-03)", async () => {
    // Login as Casey Newbie who needs password change
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "newuser@toktickit.local",
      password: "InitialPassword123!",
    });
    const token = loginRes.body.token;
    expect(loginRes.body.user.mustChangePassword).toBe(true);

    // Try weak password
    const weakRes = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "InitialPassword123!",
        newPassword: "short",
      });
    expect(weakRes.status).toBe(400);
    expect(weakRes.body.error.code).toBe("WEAK_PASSWORD");

    // Valid password change
    const changeRes = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "InitialPassword123!",
        newPassword: "BrandNewPassword999!",
      });
    expect(changeRes.status).toBe(200);
    expect(changeRes.body.mustChangePassword).toBe(false);

    // Can now log in with the new password
    const newLoginRes = await request(app).post("/api/auth/login").send({
      email: "newuser@toktickit.local",
      password: "BrandNewPassword999!",
    });
    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.user.mustChangePassword).toBe(false);
  });
});
