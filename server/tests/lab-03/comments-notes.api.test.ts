import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 3 Comments & Notes API (TEST-COMM-01..03, AC-09..10)", () => {
  let requesterToken: string; // Jennifer (id 6)
  let otherRequesterToken: string; // Michael (id 7)
  let staffToken: string; // Alex (id 2)

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
  });

  it("POST /api/tickets/:id/comments allows requester to comment on their own ticket (TEST-COMM-01, AC-09)", async () => {
    // Ticket 1 belongs to requesterId 6 (Jennifer)
    const res = await request(app)
      .post("/api/tickets/1/comments")
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({ message: "Checking if the new access point is live." });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("comment");
    expect(res.body.comment.message).toBe("Checking if the new access point is live.");
  });

  it("POST /api/tickets/:id/comments allows IT Staff to post public comment", async () => {
    const res = await request(app)
      .post("/api/tickets/1/comments")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ message: "Yes, access point B-3 is now operational." });

    expect(res.status).toBe(201);
    expect(res.body.comment.message).toBe("Yes, access point B-3 is now operational.");
  });

  it("GET /api/tickets/:id/comments blocks other requesters from viewing comments (BR-07)", async () => {
    // Michael (requester 7) tries to view comments on Jennifer's ticket 1
    const res = await request(app)
      .get("/api/tickets/1/comments")
      .set("Authorization", `Bearer ${otherRequesterToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("POST /api/tickets/:id/notes allows IT Staff to add internal note (TEST-COMM-02, AC-10)", async () => {
    const res = await request(app)
      .post("/api/tickets/1/notes")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ note: "Hardware vendor confirmed RMA #4418." });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("note");
    expect(res.body.note.note).toBe("Hardware vendor confirmed RMA #4418.");
  });

  it("GET /api/tickets/:id/notes allows IT Staff to read internal notes", async () => {
    const res = await request(app)
      .get("/api/tickets/1/notes")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("notes");
    expect(Array.isArray(res.body.notes)).toBe(true);
  });

  it("GET /api/tickets/:id/notes strictly blocks Requester from reading internal notes (TEST-COMM-03, AC-10, BR-14)", async () => {
    const res = await request(app)
      .get("/api/tickets/1/notes")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("POST /api/tickets/:id/notes strictly blocks Requester from creating internal notes", async () => {
    const res = await request(app)
      .post("/api/tickets/1/notes")
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({ note: "Should be blocked" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
});
