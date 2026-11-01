import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import RequesterDashboard from "../../src/components/RequesterDashboard.js";
import { AuthProvider } from "../../src/context/AuthContext.js";
import * as api from "../../src/api.js";

describe("Requester Dashboard UI Component (TEST-UI-04, AC-05, BR-10, BR-14)", () => {
  const mockRequesterUser: api.AuthUser = {
    id: 6,
    name: "Jennifer Anderson",
    email: "jennifer.anderson@example.com",
    role: "REQUESTER",
    department: "Human Resources",
    isActive: true,
    mustChangePassword: false,
  };

  const mockDashboardData: api.RequesterDashboardData = {
    metrics: {
      totalOpen: 3,
      inProgress: 1,
      waitingForRequester: 1,
      resolved: 2,
      closed: 5,
    },
    recentTickets: [
      {
        id: 101,
        ticketNumber: "TICK-101",
        summary: "Wi-Fi keeps dropping in Room 302",
        currentStatus: "IN_PROGRESS",
        requestedPriority: "HIGH",
        updatedAt: "2026-05-12T10:00:00Z",
      },
      {
        id: 102,
        ticketNumber: "TICK-102",
        summary: "Need access to SharePoint folder",
        currentStatus: "WAITING_FOR_REQUESTER",
        requestedPriority: "MEDIUM",
        updatedAt: "2026-05-11T14:30:00Z",
      },
    ],
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const renderDashboard = (onNavigate = vi.fn()) => {
    localStorage.setItem("toktickit_auth_token", "mock-requester-jwt");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockRequesterUser));
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockRequesterUser);
    vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue(mockDashboardData);

    return render(
      <AuthProvider>
        <RequesterDashboard onNavigate={onNavigate} />
      </AuthProvider>
    );
  };

  it("renders metric cards, recent tickets, and quick actions (TEST-UI-04, AC-05)", async () => {
    renderDashboard();

    expect(await screen.findByTestId("requester-dashboard")).toBeInTheDocument();

    // Metric cards check
    expect(screen.getByTestId("metric-value-my-open-tickets")).toHaveTextContent("3");
    expect(screen.getByTestId("metric-value-in-progress")).toHaveTextContent("1");
    expect(screen.getByTestId("metric-value-waiting-for-me")).toHaveTextContent("1");
    expect(screen.getByTestId("metric-value-resolved")).toHaveTextContent("2");
    expect(screen.getByTestId("metric-value-closed")).toHaveTextContent("5");

    // Recent tickets check
    expect(screen.getByTestId("recent-tickets-table")).toBeInTheDocument();
    expect(screen.getByText("TICK-101")).toBeInTheDocument();
    expect(screen.getByText("Wi-Fi keeps dropping in Room 302")).toBeInTheDocument();
    expect(screen.getByText("TICK-102")).toBeInTheDocument();

    // Quick actions check
    expect(screen.getByTestId("quick-action-create-ticket")).toBeInTheDocument();
    expect(screen.getByTestId("quick-action-view-tickets")).toBeInTheDocument();
  });

  it("triggers onNavigate when clicking metric cards and quick actions (TEST-UI-04)", async () => {
    const onNavigate = vi.fn();
    renderDashboard(onNavigate);

    expect(await screen.findByTestId("requester-dashboard")).toBeInTheDocument();

    // Click metric card
    fireEvent.click(screen.getByTestId("metric-card-my-open-tickets"));
    expect(onNavigate).toHaveBeenCalledWith("my-tickets", "open");

    // Click quick action "Create Ticket"
    fireEvent.click(screen.getByTestId("quick-action-create-ticket"));
    expect(onNavigate).toHaveBeenCalledWith("create-ticket");

    // Click quick action "View My Tickets"
    fireEvent.click(screen.getByTestId("quick-action-view-tickets"));
    expect(onNavigate).toHaveBeenCalledWith("my-tickets");

    // Click recent ticket row
    fireEvent.click(screen.getByTestId("recent-ticket-row-101"));
    expect(onNavigate).toHaveBeenCalledWith("ticket-detail", "101");
  });

  it("renders empty state gracefully when there are no recent tickets (BR-14)", async () => {
    localStorage.setItem("toktickit_auth_token", "mock-requester-jwt");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockRequesterUser));
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockRequesterUser);
    vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue({
      metrics: {
        totalOpen: 0,
        inProgress: 0,
        waitingForRequester: 0,
        resolved: 0,
        closed: 0,
      },
      recentTickets: [],
    });

    render(
      <AuthProvider>
        <RequesterDashboard />
      </AuthProvider>
    );

    expect(await screen.findByTestId("recent-tickets-empty")).toBeInTheDocument();
    expect(screen.getByText(/no tickets found/i)).toBeInTheDocument();
  });
});
