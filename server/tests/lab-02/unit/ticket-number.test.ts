import { describe, it, expect } from "vitest";
import { generateTicketNumber } from "../../../src/utils/ticket-number.js";

describe("generateTicketNumber (UNIT-01, BR-01, FR-04)", () => {
  it("generates ticket number matching ^TKT-\\d{4}-\\d{6}$ pattern", () => {
    const ticketNumber = generateTicketNumber();
    expect(ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
  });

  it("uses the current four-digit calendar year", () => {
    const currentYear = new Date().getFullYear().toString();
    const ticketNumber = generateTicketNumber();
    expect(ticketNumber.startsWith(`TKT-${currentYear}-`)).toBe(true);
  });

  it("formats explicit sequential IDs with six digits zero-padded", () => {
    const currentYear = new Date().getFullYear().toString();
    expect(generateTicketNumber(1)).toBe(`TKT-${currentYear}-000001`);
    expect(generateTicketNumber(42)).toBe(`TKT-${currentYear}-000042`);
    expect(generateTicketNumber(123456)).toBe(`TKT-${currentYear}-123456`);
  });
});
