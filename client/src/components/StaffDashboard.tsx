import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.js";
import { fetchStaffDashboard, StaffDashboardData } from "../api.js";
import { NavTab } from "./Header.js";

interface StaffDashboardProps {
  onNavigate?: (tab: NavTab, filter?: string) => void;
}

const statusBadgeClass = (status: string): string => {
  const map: Record<string, string> = {
    NEW: "bg-primary",
    OPEN: "bg-info text-dark",
    IN_PROGRESS: "bg-warning text-dark",
    WAITING_FOR_REQUESTER: "bg-purple text-white",
    RESOLVED: "bg-success",
    CLOSED: "bg-secondary",
    REOPENED: "bg-info",
    CANCELLED: "bg-danger",
  };
  return map[status] || "bg-secondary";
};

export default function StaffDashboard({ onNavigate }: StaffDashboardProps) {
  const { user, token } = useAuth();
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchStaffDashboard(token);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const metricCards = data
    ? [
        { label: "New", value: data.metrics.new, icon: "🆕", color: "#3b82f6", filter: "NEW" },
        { label: "Open", value: data.metrics.open, icon: "📂", color: "#0284c7", filter: "OPEN" },
        { label: "In Progress", value: data.metrics.inProgress, icon: "⚙️", color: "#d97706", filter: "IN_PROGRESS" },
        { label: "Waiting for Requester", value: data.metrics.waitingForRequester, icon: "⏳", color: "#8b5cf6", filter: "WAITING_FOR_REQUESTER" },
        { label: "My Assigned", value: data.metrics.myAssigned, icon: "👤", color: "#15803d", filter: "my-assigned" },
        { label: "Unassigned", value: data.metrics.unassigned, icon: "❓", color: "#dc2626", filter: "unassigned" },
      ]
    : [];

  return (
    <div data-testid="staff-dashboard">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 fw-bold mb-1" style={{ color: "var(--zen-text-main, #0f172a)" }}>
            Welcome back, {user?.name || "Staff"}!
          </h2>
          <p className="text-muted mb-0 small">Here's what's happening with your queue today.</p>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          onClick={loadDashboard}
          disabled={loading}
          data-testid="dashboard-refresh-button"
        >
          <span style={{ display: "inline-block", animation: loading ? "spin 1s linear infinite" : "none" }}>🔄</span>
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {loading && !data && (
        <div className="text-center py-5" data-testid="dashboard-loading">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-2">Loading dashboard...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="alert alert-danger" data-testid="dashboard-error">
          {error}
        </div>
      )}

      {/* Dashboard Content */}
      {data && (
        <>
          {/* Metric Cards */}
          <div className="row g-3 mb-4" data-testid="staff-metric-cards">
            {metricCards.map((card) => (
              <div className="col-6 col-md-4 col-lg-2" key={card.label}>
                <div
                  className="card border-0 shadow-sm h-100"
                  style={{ cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
                  onClick={() => onNavigate?.("staff-queue", card.filter)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 25px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "";
                  }}
                  data-testid={`metric-card-${card.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="card-body text-center py-3">
                    <div style={{ fontSize: "1.5rem" }}>{card.icon}</div>
                    <div className="fw-bold fs-3" style={{ color: card.color }} data-testid={`metric-value-${card.label.toLowerCase().replace(/\s+/g, "-")}`}>
                      {card.value}
                    </div>
                    <div className="small text-muted fw-semibold" style={{ fontSize: "0.7rem" }}>{card.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="row g-4">
            {/* Recent Tickets */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white d-flex justify-content-between align-items-center py-3" style={{ borderBottom: "2px solid #e2e8f0" }}>
                  <h5 className="mb-0 fw-bold" style={{ color: "var(--zen-text-main, #0f172a)" }}>
                    🎫 Recent Active Tickets
                  </h5>
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-success text-decoration-none fw-semibold"
                    onClick={() => onNavigate?.("staff-queue")}
                    data-testid="view-all-tickets-link"
                  >
                    View all →
                  </button>
                </div>
                <div className="card-body p-0">
                  {data.recentTickets.length === 0 ? (
                    <div className="text-center py-4 text-muted" data-testid="recent-tickets-empty">
                      <p className="mb-0">No active tickets in the queue.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0" data-testid="recent-tickets-table">
                        <thead>
                          <tr className="text-muted small">
                            <th className="border-0 ps-3">Ticket #</th>
                            <th className="border-0">Summary</th>
                            <th className="border-0">Status</th>
                            <th className="border-0">Owner</th>
                            <th className="border-0 pe-3">Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.recentTickets.map((ticket) => (
                            <tr
                              key={ticket.id}
                              style={{ cursor: "pointer" }}
                              onClick={() => onNavigate?.("staff-detail", String(ticket.id))}
                              data-testid={`recent-ticket-row-${ticket.id}`}
                            >
                              <td className="ps-3 fw-semibold small text-success">{ticket.ticketNumber}</td>
                              <td className="small" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {ticket.summary}
                              </td>
                              <td>
                                <span className={`badge ${statusBadgeClass(ticket.currentStatus)} px-2 py-1`} style={{ fontSize: "0.7rem" }}>
                                  {ticket.currentStatus.replace(/_/g, " ")}
                                </span>
                              </td>
                              <td className="small text-muted">{ticket.owner?.name || "Unassigned"}</td>
                              <td className="small text-muted pe-3">{formatDate(ticket.updatedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="col-lg-4">
              <div className="d-flex flex-column gap-3" data-testid="quick-actions">
                <div
                  className="card border-0 shadow-sm"
                  style={{ cursor: "pointer", transition: "transform 0.15s" }}
                  onClick={() => onNavigate?.("create-ticket")}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                  data-testid="quick-action-create-ticket"
                >
                  <div className="card-body d-flex align-items-center gap-3 py-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: "var(--zen-primary-light, #dcfce7)", color: "var(--zen-primary, #15803d)", fontSize: "1.25rem", fontWeight: "bold" }}>
                      +
                    </div>
                    <div>
                      <div className="fw-bold small">Create Ticket</div>
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>Submit a new request</div>
                    </div>
                  </div>
                </div>

                <div
                  className="card border-0 shadow-sm"
                  style={{ cursor: "pointer", transition: "transform 0.15s" }}
                  onClick={() => onNavigate?.("staff-queue", "search")}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                  data-testid="quick-action-search-tickets"
                >
                  <div className="card-body d-flex align-items-center gap-3 py-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: "#fef3c7", color: "#d97706", fontSize: "1.25rem" }}>
                      🔍
                    </div>
                    <div>
                      <div className="fw-bold small">Search Tickets</div>
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>Find tickets by keyword</div>
                    </div>
                  </div>
                </div>

                <div
                  className="card border-0 shadow-sm"
                  style={{ cursor: "pointer", transition: "transform 0.15s" }}
                  onClick={() => onNavigate?.("staff-queue", "my-assigned")}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                  data-testid="quick-action-my-queue"
                >
                  <div className="card-body d-flex align-items-center gap-3 py-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: "#e0f2fe", color: "#0284c7", fontSize: "1.25rem" }}>
                      📋
                    </div>
                    <div>
                      <div className="fw-bold small">My Queue</div>
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>View tickets assigned to me</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
