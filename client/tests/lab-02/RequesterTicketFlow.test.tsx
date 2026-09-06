import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

const mockRequesters: api.RequesterUser[] = [
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
];

const mockCategories: api.Category[] = [
  { id: 2, name: "Hardware" },
  { id: 4, name: "Network" },
];

const mockRelatedSystems: api.RelatedSystem[] = [
  { id: 3, name: "VPN" },
  { id: 7, name: "Corporate Laptop" },
];

describe("Complete Requester Journey Flow (E2E-01, AC-01..AC-15)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    vi.spyOn(api, "fetchActiveRequesters").mockResolvedValue(mockRequesters);
    vi.spyOn(api, "fetchActiveCategories").mockResolvedValue(mockCategories);
    vi.spyOn(api, "fetchActiveRelatedSystems").mockResolvedValue(mockRelatedSystems);
  });

  it("completes full requester journey: select user, create ticket, view in list, inspect detail, and soft-remove attachment", async () => {
    let createdTicketObj: api.Ticket | null = null;

    vi.spyOn(api, "createTicket").mockImplementation(async (input) => {
      createdTicketObj = {
        id: 101,
        ticketNumber: "TKT-2026-000101",
        summary: input.summary,
        description: input.description,
        requestedPriority: input.requestedPriority,
        currentStatus: "NEW",
        requesterId: input.requesterId,
        categoryId: input.categoryId,
        relatedSystemId: input.relatedSystemId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: { id: input.categoryId, name: "Network" },
        relatedSystem: { id: input.relatedSystemId, name: "VPN" },
        attachments: [
          {
            id: 501,
            ticketId: 101,
            fileName: "501_vpn_log.png",
            originalName: "vpn_log.png",
            fileSize: 120000,
            mimeType: "image/png",
            isRemoved: false,
            createdAt: new Date().toISOString(),
          },
        ],
      };
      return createdTicketObj;
    });

    vi.spyOn(api, "fetchMyTickets").mockImplementation(async () => {
      return {
        items: createdTicketObj ? [createdTicketObj] : [],
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: createdTicketObj ? 1 : 0,
          totalPages: 1,
        },
      };
    });

    vi.spyOn(api, "fetchTicketDetail").mockImplementation(async () => {
      return createdTicketObj!;
    });

    render(<App />);

    // Step 1: Select Development Requester (AC-06)
    const selectBtn = await screen.findByTestId("select-requester-prompt-button");
    await act(async () => {
      fireEvent.click(selectBtn);
    });

    const modal = await screen.findByTestId("requester-modal-overlay");
    expect(modal).toBeInTheDocument();

    const requesterSelect = screen.getByTestId("requester-select");
    await act(async () => {
      fireEvent.change(requesterSelect, { target: { value: "1" } });
    });

    const continueBtn = screen.getByTestId("requester-continue-button");
    await act(async () => {
      fireEvent.click(continueBtn);
    });

    expect(await screen.findByTestId("active-user-banner")).toBeInTheDocument();
    expect(screen.getByTestId("active-requester-info")).toHaveTextContent("Jennifer Anderson");

    // Step 2: Navigate to Create Ticket (AC-01)
    const createNavBtn = screen.getByTestId("nav-create-ticket");
    await act(async () => {
      fireEvent.click(createNavBtn);
    });

    expect(await screen.findByTestId("create-ticket-form-card")).toBeInTheDocument();

    // Fill form
    await act(async () => {
      fireEvent.change(screen.getByTestId("ticket-category-select"), { target: { value: "4" } });
      fireEvent.change(screen.getByTestId("ticket-related-system-select"), { target: { value: "3" } });
      fireEvent.change(screen.getByTestId("ticket-priority-select"), { target: { value: "HIGH" } });
      fireEvent.change(screen.getByTestId("ticket-summary-input"), { target: { value: "Cannot connect to VPN from dorm" } });
      fireEvent.change(screen.getByTestId("ticket-description-input"), { target: { value: "Connection times out repeatedly when attempting to connect to campus VPN." } });
    });

    // Submit
    const submitBtn = screen.getByTestId("submit-ticket-button");
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Step 3: Verify Success Dialog & Ticket Number (AC-01)
    expect(await screen.findByTestId("ticket-success-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("ticket-number-display")).toHaveTextContent("TKT-2026-000101");

    // Step 4: Back to My Tickets (AC-07, AC-08)
    const viewMyTicketsBtn = screen.getByTestId("view-my-tickets-button");
    await act(async () => {
      fireEvent.click(viewMyTicketsBtn);
    });

    expect(await screen.findByTestId("my-tickets-table")).toBeInTheDocument();
    expect(screen.getByText("TKT-2026-000101")).toBeInTheDocument();
    expect(screen.getByText("Cannot connect to VPN from dorm")).toBeInTheDocument();

    // Step 5: Click ticket row to open Ticket Detail (AC-09)
    const ticketRow = screen.getByTestId("ticket-row-101");
    await act(async () => {
      fireEvent.click(ticketRow);
    });

    expect(await screen.findByTestId("ticket-detail-card")).toBeInTheDocument();
    expect(screen.getByTestId("ticket-detail-number")).toHaveTextContent("TKT-2026-000101");
    expect(screen.getByTestId("ticket-detail-summary")).toHaveTextContent("Cannot connect to VPN from dorm");
    expect(screen.getByTestId("ticket-detail-priority")).toHaveTextContent("HIGH Priority");

    // Step 6: Verify Attachments & Soft-Remove (AC-12)
    expect(screen.getByText("vpn_log.png")).toBeInTheDocument();
    const removeBtn = screen.getByTestId("remove-button-501");

    const softRemoveSpy = vi.spyOn(api, "softRemoveAttachment").mockResolvedValue({
      id: 501,
      ticketId: 101,
      fileName: "501_vpn_log.png",
      originalName: "vpn_log.png",
      fileSize: 120000,
      mimeType: "image/png",
      isRemoved: true,
      removalReason: "Uploaded outdated screenshot",
      removedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    await act(async () => {
      fireEvent.click(removeBtn);
    });

    expect(await screen.findByTestId("soft-remove-modal")).toBeInTheDocument();
    const reasonInput = screen.getByTestId("removal-reason-input");
    await act(async () => {
      fireEvent.change(reasonInput, { target: { value: "Uploaded outdated screenshot" } });
    });

    const confirmRemoveBtn = screen.getByTestId("confirm-remove-button");
    await act(async () => {
      fireEvent.click(confirmRemoveBtn);
    });

    expect(softRemoveSpy).toHaveBeenCalledWith(501, "Uploaded outdated screenshot", 1);
  });
});
