import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import StaffTicketDetail from "../../src/components/StaffTicketDetail.js";
import RequesterTicketDetail from "../../src/components/RequesterTicketDetail.js";
import { AuthProvider } from "../../src/context/AuthContext.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import * as api from "../../src/api.js";

describe("Lab 4 Ticket Workflow & Resolution UI (TEST-UI-05, AC-07..09, BR-07..09)", () => {
  const mockStaffUser: api.AuthUser = {
    id: 2,
    name: "Alex Triage",
    email: "staff1@toktickit.local",
    role: "IT_STAFF",
    department: "IT Operations",
    isActive: true,
    mustChangePassword: false,
  };

  const mockRequesterUser: api.AuthUser = {
    id: 6,
    name: "Jennifer Anderson",
    email: "jennifer.anderson@example.com",
    role: "REQUESTER",
    department: "Human Resources",
    isActive: true,
    mustChangePassword: false,
  };

  const mockStaffTicket: api.StaffTicket = {
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
    updatedAt: "2026-05-12T09:14:00.000Z",
    ownerId: 2,
    requester: {
      id: 6,
      name: "Jennifer Anderson",
      email: "jennifer.anderson@example.com",
      department: "Human Resources",
    },
    category: { id: 4, name: "Network" },
    relatedSystem: { id: 3, name: "Wi-Fi Access Points" },
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValue([]);
    vi.spyOn(api, "fetchComments").mockResolvedValue([]);
    vi.spyOn(api, "fetchInternalNotes").mockResolvedValue([]);
    vi.spyOn(api, "fetchStaffUsers").mockResolvedValue([mockStaffUser]);
  });

  it("updates ticket status to RESOLVED when Staff executes formal resolution (AC-07)", async () => {
    localStorage.setItem("toktickit_auth_token", "mock-staff-jwt");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockStaffUser));
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockStaffUser);
    vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue(mockStaffTicket);

    const updateStatusSpy = vi.spyOn(api, "updateStaffStatus").mockResolvedValue({
      ...mockStaffTicket,
      currentStatus: "RESOLVED",
    });

    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={1} onBack={() => {}} />
      </AuthProvider>
    );

    const statusSelect = await screen.findByTestId("staff-status-select");
    expect(statusSelect).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(statusSelect, { target: { value: "RESOLVED" } });
    });

    expect(updateStatusSpy).toHaveBeenCalledWith(1, "RESOLVED", "mock-staff-jwt", mockStaffTicket.updatedAt);
    expect(await screen.findByText(/Status updated to RESOLVED/i)).toBeInTheDocument();
  });

  it("displays safe conflict alert when status update returns 409 Conflict (AC-09, BR-09)", async () => {
    localStorage.setItem("toktickit_auth_token", "mock-staff-jwt");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockStaffUser));
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockStaffUser);
    vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue(mockStaffTicket);

    const conflictError: any = new Error("Ticket has been modified by another process. Please refresh and retry.");
    conflictError.status = 409;
    conflictError.code = "STALE_UPDATE_CONFLICT";
    vi.spyOn(api, "updateStaffStatus").mockRejectedValue(conflictError);

    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={1} onBack={() => {}} />
      </AuthProvider>
    );

    const statusSelect = await screen.findByTestId("staff-status-select");
    await act(async () => {
      fireEvent.change(statusSelect, { target: { value: "RESOLVED" } });
    });

    expect(
      await screen.findByText(/Conflict: This ticket was modified by another process/i)
    ).toBeInTheDocument();
  });

  it("Requester view renders advisory 'Problem Appears Resolved' button without resolving ticket (AC-07, BR-07)", async () => {
    localStorage.setItem("toktickit_auth_token", "mock-requester-jwt");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockRequesterUser));
    localStorage.setItem("toktickit_current_requester", JSON.stringify(mockRequesterUser));
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockRequesterUser);
    vi.spyOn(api, "fetchActiveRequesters").mockResolvedValue([mockRequesterUser as any]);
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValue({
      id: 1,
      ticketNumber: "TKT-2026-000001",
      summary: "Wi-Fi issue",
      description: "Detailed description",
      requestedPriority: "HIGH",
      currentStatus: "IN_PROGRESS",
      requesterId: 6,
      categoryId: 4,
      relatedSystemId: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: { id: 4, name: "Network" },
      relatedSystem: { id: 3, name: "Wi-Fi" },
      attachments: [],
    } as any);

    const addCommentSpy = vi.spyOn(api, "addComment").mockResolvedValue({
      id: 99,
      ticketId: 1,
      userId: 6,
      message: "Problem Appears Resolved: The requester has confirmed that this issue appears to be resolved.",
      createdAt: new Date().toISOString(),
      user: { id: 6, name: "Jennifer Anderson", role: "REQUESTER" },
    });

    render(
      <AuthProvider>
        <RequesterProvider>
          <RequesterTicketDetail ticketId={1} />
        </RequesterProvider>
      </AuthProvider>
    );

    const resolveBtn = await screen.findByTestId("mark-resolved-button");
    expect(resolveBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(resolveBtn);
    });

    expect(addCommentSpy).toHaveBeenCalledWith(
      1,
      expect.stringContaining("Problem Appears Resolved"),
      "mock-requester-jwt"
    );
    expect(await screen.findByTestId("resolve-success-message")).toBeInTheDocument();
  });
});
