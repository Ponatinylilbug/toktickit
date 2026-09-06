import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

const mockRequester: api.RequesterUser = {
  id: 1,
  name: "Jennifer Anderson",
  email: "jennifer.anderson@example.com",
  department: "Engineering",
  isActive: true,
};

const mockCategories: api.Category[] = [
  { id: 1, name: "Account and Access" },
  { id: 2, name: "Hardware" },
];

const mockRelatedSystems: api.RelatedSystem[] = [
  { id: 1, name: "Email" },
  { id: 2, name: "Corporate Laptop" },
];

describe("CreateTicket Component & Flow (UI-02, UI-03, AC-01, AC-02, BR-14)", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("toktickit_current_requester", JSON.stringify(mockRequester));
    vi.restoreAllMocks();

    vi.spyOn(api, "fetchActiveRequesters").mockResolvedValue([mockRequester]);
    vi.spyOn(api, "fetchActiveCategories").mockResolvedValue(mockCategories);
    vi.spyOn(api, "fetchActiveRelatedSystems").mockResolvedValue(mockRelatedSystems);
  });

  it("navigates to Create Ticket screen and renders all required form controls", async () => {
    render(<App />);

    // Click nav to Create Ticket
    const navBtn = await screen.findByTestId("nav-create-ticket");
    await act(async () => {
      fireEvent.click(navBtn);
    });

    expect(await screen.findByRole("heading", { name: /Create IT Support Ticket/i })).toBeInTheDocument();
    expect(screen.getByTestId("readonly-requester-name")).toHaveTextContent("Jennifer Anderson");
    expect(screen.getByTestId("readonly-requester-department")).toHaveTextContent("Engineering");
    expect(screen.getByTestId("ticket-category-select")).toBeInTheDocument();
    expect(screen.getByTestId("ticket-related-system-select")).toBeInTheDocument();
    expect(screen.getByTestId("ticket-priority-select")).toBeInTheDocument();
    expect(screen.getByTestId("ticket-summary-input")).toBeInTheDocument();
    expect(screen.getByTestId("ticket-description-input")).toBeInTheDocument();
  });

  it("shows inline validation errors and preserves user input on invalid submission (UI-02, BR-14, AC-02)", async () => {
    render(<App />);

    const navBtn = await screen.findByTestId("nav-create-ticket");
    await act(async () => {
      fireEvent.click(navBtn);
    });

    await screen.findByRole("heading", { name: /Create IT Support Ticket/i });

    // Type short summary (< 5 chars) and short description (< 10 chars)
    const summaryInput = screen.getByTestId("ticket-summary-input");
    const descInput = screen.getByTestId("ticket-description-input");

    await act(async () => {
      fireEvent.change(summaryInput, { target: { value: "Bad" } });
      fireEvent.change(descInput, { target: { value: "Short" } });
    });

    const submitBtn = screen.getByTestId("submit-ticket-button");
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Check inline validation error messages
    expect(await screen.findByTestId("error-summary")).toHaveTextContent(/at least 5 characters/i);
    expect(screen.getByTestId("error-description")).toHaveTextContent(/at least 10 characters/i);
    expect(screen.getByTestId("error-category")).toHaveTextContent(/select a category/i);
    expect(screen.getByTestId("error-related-system")).toHaveTextContent(/select a related system/i);

    // BR-14: Verify inputs were preserved
    expect(summaryInput).toHaveValue("Bad");
    expect(descInput).toHaveValue("Short");
  });

  it("submits valid form and displays success confirmation with generated Ticket Number (UI-03, AC-01, BR-01)", async () => {
    const mockCreatedTicket: api.Ticket = {
      id: 101,
      ticketNumber: "TKT-2026-000101",
      summary: "Laptop battery drains quickly after OS update",
      description: "My laptop battery is draining much faster than usual even when idle.",
      requestedPriority: "MEDIUM",
      currentStatus: "NEW",
      requesterId: 1,
      categoryId: 2,
      relatedSystemId: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const createTicketSpy = vi.spyOn(api, "createTicket").mockResolvedValue(mockCreatedTicket);

    render(<App />);

    const navBtn = await screen.findByTestId("nav-create-ticket");
    await act(async () => {
      fireEvent.click(navBtn);
    });

    await screen.findByRole("heading", { name: /Create IT Support Ticket/i });

    // Fill valid form values
    const catSelect = await screen.findByTestId("ticket-category-select");
    const sysSelect = screen.getByTestId("ticket-related-system-select");
    const summaryInput = screen.getByTestId("ticket-summary-input");
    const descInput = screen.getByTestId("ticket-description-input");

    await act(async () => {
      fireEvent.change(catSelect, { target: { value: "2" } });
      fireEvent.change(sysSelect, { target: { value: "2" } });
      fireEvent.change(summaryInput, { target: { value: "Laptop battery drains quickly after OS update" } });
      fireEvent.change(descInput, {
        target: { value: "My laptop battery is draining much faster than usual even when idle." },
      });
    });

    const submitBtn = screen.getByTestId("submit-ticket-button");
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(createTicketSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        requesterId: 1,
        categoryId: 2,
        relatedSystemId: 2,
        summary: "Laptop battery drains quickly after OS update",
      })
    );

    // Success dialog displays ticket number
    expect(await screen.findByTestId("ticket-success-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("ticket-number-display")).toHaveTextContent("TKT-2026-000101");
  });
});
