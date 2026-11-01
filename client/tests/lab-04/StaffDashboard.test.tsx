import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import React from "react";
import StaffDashboard from "../../src/components/StaffDashboard.js";
import { AuthProvider } from "../../src/context/AuthContext.js";
import * as api from "../../src/api.js";

describe("Staff Dashboard UI Component (TEST-UI-03, AC-06, BR-11, BR-14)", () => {
  const mockStaffUser: api.AuthUser = {
    id: 2,
    name: "Alex Triage",
    email: "staff1@toktickit.local",
    role: "IT_STAFF",
    department: "IT Operations",
    isActive: true,
    mustChangePassword: false,
  };

  const mockStaffDashboardData: api.StaffDashboardData = {
    metrics: {
      new: 4,
      open: 6,
      inProgress: 3,
      waitingForRequester: 2,
      myAssigned: 5,
      unassigned: 4,
    },
    recentTickets: [
      {
        id: 201,
        ticketNumber: "TICK-201",
        summary: "VPN authentication failure for remote contractors",
        currentStatus: "NEW",
        actualPriority: "URGENT",
        updatedAt: "2026-05-12T11:00:00Z",
        owner: null,
      },
      {
        id: 202,
        ticketNumber: "TICK-202",
        summary: "Replace broken monitor in Design lab",
        currentStatus: "IN_PROGRESS",
        actualPriority: "MEDIUM",
        updatedAt: "2026-05-12T09:30:00Z",
        owner: { id: 2, name: "Alex Triage" },
      },
    ],
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const renderDashboard = (onNavigate = vi.fn()) => {
    localStorage.setItem("toktickit_auth_token", "mock-staff-jwt");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockStaffUser));
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockStaffUser);
    vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockStaffDashboardData);

    return render(
      <AuthProvider>
        <StaffDashboard onNavigate={onNavigate} />
      </AuthProvider>
    );
  };

  it("renders 6 metric cards, recent tickets with owner, and quick actions (TEST-UI-03, AC-06)", async () => {
    renderDashboard();

    expect(await screen.findByTestId("staff-dashboard")).toBeInTheDocument();

    // Verify 6 metric cards
    expect(screen.getByTestId("metric-value-new")).toHaveTextContent("4");
    expect(screen.getByTestId("metric-value-open")).toHaveTextContent("6");
    expect(screen.getByTestId("metric-value-in-progress")).toHaveTextContent("3");
    expect(screen.getByTestId("metric-value-waiting-for-requester")).toHaveTextContent("2");
    expect(screen.getByTestId("metric-value-my-assigned")).toHaveTextContent("5");
    expect(screen.getByTestId("metric-value-unassigned")).toHaveTextContent("4");

    // Verify recent tickets table
    expect(screen.getByTestId("recent-tickets-table")).toBeInTheDocument();
    expect(screen.getByText("TICK-201")).toBeInTheDocument();
    expect(screen.getByText("VPN authentication failure for remote contractors")).toBeInTheDocument();
    expect(within(screen.getByTestId("recent-tickets-table")).getByText("Unassigned")).toBeInTheDocument();

    expect(screen.getByText("TICK-202")).toBeInTheDocument();
    expect(screen.getByText("Replace broken monitor in Design lab")).toBeInTheDocument();
    expect(screen.getByText("Alex Triage")).toBeInTheDocument();

    // Verify quick actions
    expect(screen.getByTestId("quick-action-create-ticket")).toBeInTheDocument();
    expect(screen.getByTestId("quick-action-search-tickets")).toBeInTheDocument();
    expect(screen.getByTestId("quick-action-my-queue")).toBeInTheDocument();
  });

  it("triggers drill-down navigation when clicking cards, actions, and tickets (TEST-UI-03, BR-11)", async () => {
    const onNavigate = vi.fn();
    renderDashboard(onNavigate);

    expect(await screen.findByTestId("staff-dashboard")).toBeInTheDocument();

    // Click "New" metric card -> navigates to staff-queue with NEW filter
    fireEvent.click(screen.getByTestId("metric-card-new"));
    expect(onNavigate).toHaveBeenCalledWith("staff-queue", "NEW");

    // Click "My Assigned" metric card -> navigates to staff-queue with my-assigned filter
    fireEvent.click(screen.getByTestId("metric-card-my-assigned"));
    expect(onNavigate).toHaveBeenCalledWith("staff-queue", "my-assigned");

    // Click "Search Tickets" quick action
    fireEvent.click(screen.getByTestId("quick-action-search-tickets"));
    expect(onNavigate).toHaveBeenCalledWith("staff-queue", "search");

    // Click "My Queue" quick action
    fireEvent.click(screen.getByTestId("quick-action-my-queue"));
    expect(onNavigate).toHaveBeenCalledWith("staff-queue", "my-assigned");

    // Click recent ticket row
    fireEvent.click(screen.getByTestId("recent-ticket-row-201"));
    expect(onNavigate).toHaveBeenCalledWith("staff-detail", "201");
  });

  it("renders empty state gracefully when there are no active tickets (BR-14)", async () => {
    localStorage.setItem("toktickit_auth_token", "mock-staff-jwt");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockStaffUser));
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockStaffUser);
    vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue({
      metrics: {
        new: 0,
        open: 0,
        inProgress: 0,
        waitingForRequester: 0,
        myAssigned: 0,
        unassigned: 0,
      },
      recentTickets: [],
    });

    render(
      <AuthProvider>
        <StaffDashboard />
      </AuthProvider>
    );

    expect(await screen.findByTestId("recent-tickets-empty")).toBeInTheDocument();
    expect(screen.getByText(/no active tickets in the queue/i)).toBeInTheDocument();
  });
});
