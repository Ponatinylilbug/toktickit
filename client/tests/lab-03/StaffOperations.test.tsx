import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

describe("Lab 3 Staff Operations (Queue, Detail, Ownership, Comments & Notes) (TEST-QUEUE-01..03, TEST-DETAIL-01..03, TEST-COMM-01..03)", () => {
  const mockStaffUser: api.AuthUser = {
    id: 2,
    name: "Alex Triage",
    email: "staff1@toktickit.local",
    role: "IT_STAFF",
    department: "IT Operations",
    isActive: true,
    mustChangePassword: false,
  };

  const mockTicket: api.StaffTicket = {
    id: 1,
    ticketNumber: "TKT-2026-000001",
    summary: "Wi-Fi in library disconnects periodically",
    description: "Students report random dropouts every 15 minutes.",
    requestedPriority: "HIGH",
    actualPriority: "HIGH",
    currentStatus: "IN_PROGRESS",
    requesterId: 6,
    categoryId: 4,
    relatedSystemId: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ownerId: null,
    requester: {
      id: 6,
      name: "Jennifer Anderson",
      email: "jennifer.anderson@example.com",
      department: "Human Resources",
      isActive: true,
    },
    category: { id: 4, name: "Network" },
    relatedSystem: { id: 3, name: "Wi-Fi Access Points" },
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    localStorage.setItem("toktickit_auth_token", "mock-staff-token");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockStaffUser));
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockStaffUser);
    vi.spyOn(api, "fetchAdminUsers").mockResolvedValue({
      data: [mockStaffUser],
      pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    });
  });

  it("renders Staff Queue and navigates to Detail on row click", async () => {
    vi.spyOn(api, "fetchStaffQueue").mockResolvedValue({
      data: [mockTicket],
      pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    });

    vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue(mockTicket);
    vi.spyOn(api, "fetchComments").mockResolvedValue([]);
    vi.spyOn(api, "fetchInternalNotes").mockResolvedValue([]);

    render(<App />);

    const row = await screen.findByTestId("staff-ticket-row-1");
    expect(row).toBeInTheDocument();
    expect(screen.getByText("TKT-2026-000001")).toBeInTheDocument();
    expect(screen.getByText("Wi-Fi in library disconnects periodically")).toBeInTheDocument();

    // Click ticket row
    await act(async () => {
      fireEvent.click(row);
    });

    expect(await screen.findByTestId("staff-ticket-detail-card")).toBeInTheDocument();
    expect(screen.getByTestId("it-controls-panel")).toBeInTheDocument();
  });

  it("claims ownership and updates IT priority", async () => {
    vi.spyOn(api, "fetchStaffQueue").mockResolvedValue({
      data: [mockTicket],
      pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    });

    vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue(mockTicket);
    vi.spyOn(api, "fetchComments").mockResolvedValue([]);
    vi.spyOn(api, "fetchInternalNotes").mockResolvedValue([]);

    const assignSpy = vi.spyOn(api, "assignTicketOwner").mockResolvedValue({
      ...mockTicket,
      ownerId: 2,
      owner: mockStaffUser,
    });

    const prioritySpy = vi.spyOn(api, "updateStaffPriority").mockResolvedValue({
      ...mockTicket,
      actualPriority: "URGENT",
    });

    render(<App />);

    const row = await screen.findByTestId("staff-ticket-row-1");
    await act(async () => {
      fireEvent.click(row);
    });

    await screen.findByTestId("staff-ticket-detail-card");

    // Click Claim button
    const claimBtn = screen.getByTestId("claim-ticket-button");
    await act(async () => {
      fireEvent.click(claimBtn);
    });

    expect(assignSpy).toHaveBeenCalledWith(1, 2, "mock-staff-token");

    // Change Priority
    const prioritySelect = screen.getByTestId("staff-priority-select");
    await act(async () => {
      fireEvent.change(prioritySelect, { target: { value: "URGENT" } });
    });

    expect(prioritySpy).toHaveBeenCalledWith(1, "URGENT", "mock-staff-token");
  });

  it("posts public comment and private internal note", async () => {
    vi.spyOn(api, "fetchStaffQueue").mockResolvedValue({
      data: [mockTicket],
      pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    });

    vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue(mockTicket);
    vi.spyOn(api, "fetchComments").mockResolvedValue([]);
    vi.spyOn(api, "fetchInternalNotes").mockResolvedValue([]);

    const addCommentSpy = vi.spyOn(api, "addComment").mockResolvedValue({
      id: 10,
      ticketId: 1,
      userId: 2,
      message: "Technician dispatched to library 2nd floor.",
      createdAt: new Date().toISOString(),
      user: { id: 2, name: "Alex Triage", role: "IT_STAFF" },
    });

    const addNoteSpy = vi.spyOn(api, "addInternalNote").mockResolvedValue({
      id: 20,
      ticketId: 1,
      userId: 2,
      note: "Cisco switch port 12 flapping. Checking firmware logs.",
      createdAt: new Date().toISOString(),
      user: { id: 2, name: "Alex Triage", role: "IT_STAFF" },
    });

    render(<App />);

    const row = await screen.findByTestId("staff-ticket-row-1");
    await act(async () => {
      fireEvent.click(row);
    });

    await screen.findByTestId("staff-ticket-detail-card");

    // Post comment
    const commentInput = screen.getByTestId("comment-input");
    const commentSubmit = screen.getByTestId("post-comment-button");
    await act(async () => {
      fireEvent.change(commentInput, { target: { value: "Technician dispatched to library 2nd floor." } });
      fireEvent.click(commentSubmit);
    });

    expect(addCommentSpy).toHaveBeenCalledWith(1, "Technician dispatched to library 2nd floor.", "mock-staff-token");

    // Switch to internal notes tab
    const notesTab = screen.getByTestId("tab-internal-notes");
    await act(async () => {
      fireEvent.click(notesTab);
    });

    expect(await screen.findByTestId("internal-notes-panel")).toBeInTheDocument();

    const noteInput = screen.getByTestId("note-input");
    const noteSubmit = screen.getByTestId("post-note-button");
    await act(async () => {
      fireEvent.change(noteInput, { target: { value: "Cisco switch port 12 flapping. Checking firmware logs." } });
      fireEvent.click(noteSubmit);
    });

    expect(addNoteSpy).toHaveBeenCalledWith(1, "Cisco switch port 12 flapping. Checking firmware logs.", "mock-staff-token");
  });
});
