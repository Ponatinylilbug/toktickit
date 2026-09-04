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

const mockTickets: api.Ticket[] = [
  {
    id: 101,
    ticketNumber: "TKT-2026-000101",
    summary: "Cannot connect to campus VPN",
    description: "Connection timeout when trying to reach internal repository.",
    requestedPriority: "HIGH",
    currentStatus: "NEW",
    requesterId: 1,
    categoryId: 4,
    relatedSystemId: 3,
    createdAt: new Date("2026-09-02T10:00:00Z").toISOString(),
    updatedAt: new Date("2026-09-02T10:00:00Z").toISOString(),
  },
  {
    id: 102,
    ticketNumber: "TKT-2026-000102",
    summary: "Need monitor adapter for dual screen",
    description: "HDMI to USB-C adapter required for workstation.",
    requestedPriority: "LOW",
    currentStatus: "NEW",
    requesterId: 1,
    categoryId: 2,
    relatedSystemId: 7,
    createdAt: new Date("2026-09-01T09:00:00Z").toISOString(),
    updatedAt: new Date("2026-09-01T09:00:00Z").toISOString(),
  },
];

describe("MyTickets Component & Table Interactions (UI-04, AC-07, AC-08, BR-05, BR-15)", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("toktickit_current_requester", JSON.stringify(mockRequester));
    vi.restoreAllMocks();

    vi.spyOn(api, "fetchActiveRequesters").mockResolvedValue([mockRequester]);
    vi.spyOn(api, "fetchActiveCategories").mockResolvedValue([
      { id: 2, name: "Hardware" },
      { id: 4, name: "Network" },
    ]);
    vi.spyOn(api, "fetchActiveRelatedSystems").mockResolvedValue([
      { id: 3, name: "VPN" },
      { id: 7, name: "Corporate Laptop" },
    ]);
  });

  it("renders the tickets table with correct records, badges, and columns (AC-08)", async () => {
    vi.spyOn(api, "fetchMyTickets").mockResolvedValue({
      items: mockTickets,
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 2,
        totalPages: 1,
      },
    });

    render(<App />);

    // Click My Tickets tab in Header
    const navBtn = await screen.findByTestId("nav-my-tickets");
    await act(async () => {
      fireEvent.click(navBtn);
    });

    expect(await screen.findByTestId("my-tickets-table")).toBeInTheDocument();
    expect(screen.getByText("TKT-2026-000101")).toBeInTheDocument();
    expect(screen.getByText("Cannot connect to campus VPN")).toBeInTheDocument();
    expect(screen.getByText("TKT-2026-000102")).toBeInTheDocument();
    expect(screen.getByText("Need monitor adapter for dual screen")).toBeInTheDocument();

    // Priority badges
    expect(screen.getByText("HIGH")).toBeInTheDocument();
    expect(screen.getByText("LOW")).toBeInTheDocument();

    // Pagination summary
    expect(screen.getByTestId("pagination-summary")).toHaveTextContent("Showing 1 to 2 of 2 tickets");
  });

  it("updates query and filters table when changing filter criteria (AC-08)", async () => {
    const fetchTicketsSpy = vi.spyOn(api, "fetchMyTickets").mockResolvedValue({
      items: [mockTickets[0]],
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1,
      },
    });

    render(<App />);

    const navBtn = await screen.findByTestId("nav-my-tickets");
    await act(async () => {
      fireEvent.click(navBtn);
    });

    await screen.findByTestId("my-tickets-table");

    // Change Priority filter to HIGH
    const prioritySelect = screen.getByTestId("tickets-priority-filter");
    await act(async () => {
      fireEvent.change(prioritySelect, { target: { value: "HIGH" } });
    });

    expect(fetchTicketsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        requesterId: 1,
        requestedPriority: "HIGH",
      })
    );

    // Clear filters button appears and resets filters
    const clearBtn = await screen.findByTestId("clear-filters-button");
    expect(clearBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(clearBtn);
    });

    expect(prioritySelect).toHaveValue("");
  });

  it("handles pagination clicks correctly (AC-08)", async () => {
    const fetchTicketsSpy = vi.spyOn(api, "fetchMyTickets").mockResolvedValue({
      items: mockTickets,
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 25,
        totalPages: 3,
      },
    });

    render(<App />);

    const navBtn = await screen.findByTestId("nav-my-tickets");
    await act(async () => {
      fireEvent.click(navBtn);
    });

    await screen.findByTestId("pagination-bar");

    // Click page 2
    const page2Btn = screen.getByTestId("page-button-2");
    await act(async () => {
      fireEvent.click(page2Btn);
    });

    expect(fetchTicketsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        requesterId: 1,
        page: 2,
      })
    );
  });

  it("displays friendly empty state when user has zero tickets (AC-08)", async () => {
    vi.spyOn(api, "fetchMyTickets").mockResolvedValue({
      items: [],
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 1,
      },
    });

    render(<App />);

    const navBtn = await screen.findByTestId("nav-my-tickets");
    await act(async () => {
      fireEvent.click(navBtn);
    });

    expect(await screen.findByTestId("tickets-empty-state")).toBeInTheDocument();
    expect(screen.getByText(/No Tickets Found/i)).toBeInTheDocument();
    expect(screen.getByTestId("empty-create-ticket-button")).toBeInTheDocument();
  });
});
