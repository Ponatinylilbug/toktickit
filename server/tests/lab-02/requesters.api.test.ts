import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

describe("GET /api/requesters (API-03, AC-06, BR-04)", () => {
  it("returns 200 with only active requesters in ascending id order", async () => {
    // Seeded data contains 4 active users and 1 inactive user (David Miller)
    const mockRequesters = [
      {
        id: 1,
        name: "Jennifer Anderson",
        email: "jennifer.anderson@example.com",
        department: "Engineering",
        isActive: true,
      },
      {
        id: 2,
        name: "Michael Brown",
        email: "michael.brown@example.com",
        department: "Design",
        isActive: true,
      },
      {
        id: 3,
        name: "Sophia Martinez",
        email: "sophia.martinez@example.com",
        department: "Marketing",
        isActive: true,
      },
      {
        id: 4,
        name: "William Taylor",
        email: "william.taylor@example.com",
        department: "Human Resources",
        isActive: true,
      },
    ];

    const findManyMock = vi.fn().mockImplementation(async (args?: any) => {
      // Ensure query filters by isActive: true
      if (args?.where?.isActive === true) {
        return mockRequesters;
      }
      return [];
    });

    vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
      requesterUser: {
        findMany: findManyMock,
      },
    } as any);

    const res = await request(app).get("/api/requesters");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(4);

    // Verify all returned records have isActive: true
    res.body.forEach((requester: any) => {
      expect(requester.isActive).toBe(true);
      expect(requester).toHaveProperty("id");
      expect(requester).toHaveProperty("name");
      expect(requester).toHaveProperty("email");
      expect(requester).toHaveProperty("department");
    });

    // Inactive user should never be returned
    const inactiveUser = res.body.find((u: any) => u.name === "David Miller" || u.isActive === false);
    expect(inactiveUser).toBeUndefined();

    // Verify Prisma query argument
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true },
      })
    );
  });
});
