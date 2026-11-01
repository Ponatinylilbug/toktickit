import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import ActionsTakenSection from "../../src/components/ActionsTakenSection.js";
import { AuthProvider } from "../../src/context/AuthContext.js";
import * as api from "../../src/api.js";

describe("Lab 4 Actions Taken UI Component (TEST-UI-01, TEST-UI-02, AC-01..04, BR-04, BR-05)", () => {
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

  const mockActions: api.ActionTaken[] = [
    {
      id: 1,
      ticketId: 101,
      performedById: 2,
      actionDate: new Date("2026-05-12T09:14:00Z").toISOString(),
      description: "Replaced faulty Cisco AP-302 access point on 3rd floor.",
      result: "New access point booted and registered with wireless controller.",
      followUpRequired: true,
      followUpNote: "Verify Wi-Fi channel coverage during peak class hours.",
      attachmentNotes: "ap_replacement_log.pdf",
      createdAt: new Date("2026-05-12T09:14:00Z").toISOString(),
      updatedAt: new Date("2026-05-12T09:14:00Z").toISOString(),
      performedBy: {
        id: 2,
        name: "Alex Triage",
        email: "staff1@toktickit.local",
        role: "IT_STAFF",
      },
    },
    {
      id: 2,
      ticketId: 101,
      performedById: 3,
      actionDate: new Date("2026-05-12T14:30:00Z").toISOString(),
      description: "Conducted RF spectrum sweep and adjusted transmit power.",
      result: "Signal-to-noise ratio improved by 14 dB across all endpoints.",
      followUpRequired: false,
      followUpNote: null,
      attachmentNotes: null,
      createdAt: new Date("2026-05-12T14:30:00Z").toISOString(),
      updatedAt: new Date("2026-05-12T14:30:00Z").toISOString(),
      performedBy: {
        id: 3,
        name: "Jordan Tech",
        email: "staff2@toktickit.local",
        role: "IT_STAFF",
      },
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders Actions Taken list with count badge and Add button for IT Staff (TEST-UI-01, AC-01)", async () => {
    localStorage.setItem("toktickit_auth_token", "mock-staff-jwt");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockStaffUser));
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockStaffUser);
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValue(mockActions);

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={101} />
      </AuthProvider>
    );

    expect(await screen.findByTestId("actions-count")).toHaveTextContent("2");
    expect(screen.getByTestId("add-action-button")).toBeInTheDocument();
    expect(screen.getByText(/Replaced faulty Cisco AP-302/i)).toBeInTheDocument();
    expect(screen.getByText(/Conducted RF spectrum sweep/i)).toBeInTheDocument();
    expect(screen.getByText(/Alex Triage/i)).toBeInTheDocument();
    expect(screen.getByText(/Jordan Tech/i)).toBeInTheDocument();
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByText(/Verify Wi-Fi channel coverage/i)).toBeInTheDocument();
  });

  it("renders Actions Taken in read-only mode for Requester (hides Add and Edit buttons) (AC-04, BR-05)", async () => {
    localStorage.setItem("toktickit_auth_token", "mock-requester-jwt");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockRequesterUser));
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockRequesterUser);
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValue(mockActions);

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={101} />
      </AuthProvider>
    );

    expect(await screen.findByTestId("actions-count")).toHaveTextContent("2");
    // Verify Add Action button is NOT rendered
    expect(screen.queryByTestId("add-action-button")).not.toBeInTheDocument();
    // Verify Edit buttons are NOT rendered
    expect(screen.queryByTestId("edit-action-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("edit-action-2")).not.toBeInTheDocument();
  });

  it("opens modal and enforces follow-up note validation when followUpRequired is checked (TEST-UI-02, AC-02, BR-04)", async () => {
    localStorage.setItem("toktickit_auth_token", "mock-staff-jwt");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockStaffUser));
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockStaffUser);
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValue(mockActions);
    const createSpy = vi.spyOn(api, "createActionTaken").mockResolvedValue({
      ...mockActions[0],
      id: 3,
      description: "Tested new cable connection.",
    });

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={101} />
      </AuthProvider>
    );

    const addBtn = await screen.findByTestId("add-action-button");
    await act(async () => {
      fireEvent.click(addBtn);
    });

    expect(screen.getByTestId("action-modal")).toBeInTheDocument();

    // Fill description and result
    const descInput = screen.getByTestId("action-description-input");
    const resultInput = screen.getByTestId("action-result-input");
    const followUpCheckbox = screen.getByTestId("action-followup-checkbox");
    const saveBtn = screen.getByTestId("save-action-button");

    await act(async () => {
      fireEvent.change(descInput, { target: { value: "Tested new cable connection." } });
      fireEvent.change(resultInput, { target: { value: "Cable link negotiated at 1 Gbps." } });
      fireEvent.click(followUpCheckbox); // check follow-up required
    });

    // Attempt save without entering follow-up note
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(await screen.findByTestId("action-validation-error")).toHaveTextContent(
      "Follow-up note is required when follow-up is needed."
    );
    expect(createSpy).not.toHaveBeenCalled();

    // Enter follow-up note
    const followUpNoteInput = screen.getByTestId("action-followup-note-input");
    await act(async () => {
      fireEvent.change(followUpNoteInput, { target: { value: "Inspect cable routing tomorrow." } });
    });

    await act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(createSpy).toHaveBeenCalledWith(
      101,
      expect.objectContaining({
        description: "Tested new cable connection.",
        result: "Cable link negotiated at 1 Gbps.",
        followUpRequired: true,
        followUpNote: "Inspect cable routing tomorrow.",
      }),
      "mock-staff-jwt"
    );
  });
});
