import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.js";
import { StaffTicket, fetchStaffQueue, PaginationMeta } from "../api.js";

interface StaffTicketQueueProps {
  onSelectTicket: (ticket: StaffTicket) => void;
}

export default function StaffTicketQueue({ onSelectTicket }: StaffTicketQueueProps) {
  const { user, token } = useAuth();
  const [tickets, setTickets] = useState<StaffTicket[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async (pageToLoad = 1) => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchStaffQueue(
        {
          search,
          status: statusFilter,
          priority: priorityFilter,
          ownerId: ownerFilter === "me" && user ? user.id : ownerFilter,
          page: pageToLoad,
          pageSize: 10,
          sortBy,
          sortOrder,
        },
        token
      );
      setTickets(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to load ticket queue.");
    } finally {
      setIsLoading(false);
    }
  }, [token, user?.id, search, statusFilter, priorityFilter, ownerFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadQueue(1);
  }, [loadQueue]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "NEW": return "badge bg-info text-dark";
      case "OPEN": return "badge bg-primary";
      case "IN_PROGRESS": return "badge bg-warning text-dark";
      case "WAITING_FOR_REQUESTER": return "badge bg-secondary";
      case "RESOLVED": return "badge bg-success";
      case "CLOSED": return "badge bg-dark";
      case "CANCELLED": return "badge bg-danger";
      default: return "badge bg-light text-dark";
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "URGENT": return "badge bg-danger fw-bold";
      case "HIGH": return "badge bg-warning text-dark";
      case "MEDIUM": return "badge bg-primary";
      case "LOW": return "badge bg-secondary";
      default: return "badge bg-light text-dark";
    }
  };

  return (
    <div className="zen-card p-4 mx-auto my-3" style={{ maxWidth: 1140 }} data-testid="staff-queue-card">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pb-3 mb-3 border-bottom">
        <div>
          <h1 className="h4 fw-bold mb-1" style={{ color: "var(--color-primary)" }}>
            IT Staff Ticket Queue
          </h1>
          <p className="text-muted small mb-0">
            Triage, assign ownership, and resolve organizational support tickets.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
          onClick={() => loadQueue(pagination.page)}
          disabled={isLoading}
          data-testid="queue-refresh-button"
        >
          <span>↻</span> Refresh
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-light p-3 rounded mb-4 border" data-testid="queue-filters">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-3">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search tickets, summary..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="queue-search-input"
            />
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              data-testid="queue-status-filter"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_REQUESTER">Waiting for Requester</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              data-testid="queue-priority-filter"
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              data-testid="queue-owner-filter"
            >
              <option value="">All Ownership</option>
              <option value="unassigned">Unassigned</option>
              {user && <option value="me">Assigned to Me</option>}
            </select>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("-");
                setSortBy(sb);
                setSortOrder(so as "asc" | "desc");
              }}
              data-testid="queue-sort-filter"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="requestedPriority-desc">Priority (High → Low)</option>
              <option value="requestedPriority-asc">Priority (Low → High)</option>
              <option value="ticketNumber-asc">Ticket # (Asc)</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger py-2 px-3 mb-3 small" role="alert" data-testid="queue-error-alert">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && tickets.length === 0 && (
        <div className="text-center py-5" data-testid="queue-loading">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading queue...</span>
          </div>
          <p className="text-muted small mt-2">Loading ticket queue…</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && tickets.length === 0 && (
        <div className="text-center py-5 border rounded bg-white" data-testid="queue-empty-state">
          <div className="display-6 mb-2 text-muted">📋</div>
          <h2 className="h5 fw-bold mb-1">No Tickets Match Criteria</h2>
          <p className="text-muted small mb-0">Try clearing filters or search keywords.</p>
        </div>
      )}

      {/* Tickets Table */}
      {!error && tickets.length > 0 && (
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" data-testid="staff-queue-table">
            <thead className="table-light">
              <tr>
                <th style={{ minWidth: 150 }}>Ticket #</th>
                <th>Summary</th>
                <th style={{ minWidth: 140 }}>Requester</th>
                <th style={{ minWidth: 110 }}>Priority</th>
                <th style={{ minWidth: 120 }}>Status</th>
                <th style={{ minWidth: 140 }}>Owner</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr
                  key={t.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelectTicket(t)}
                  data-testid={`staff-ticket-row-${t.id}`}
                >
                  <td className="font-monospace fw-bold" style={{ color: "var(--color-primary)" }}>
                    {t.ticketNumber}
                  </td>
                  <td className="fw-semibold text-truncate" style={{ maxWidth: 320 }}>
                    {t.summary}
                  </td>
                  <td className="small">
                    <div>{t.requester?.name || `Requester #${t.requesterId}`}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>
                      {t.requester?.department}
                    </div>
                  </td>
                  <td>
                    <span className={getPriorityBadgeClass(t.actualPriority || t.requestedPriority)}>
                      {t.actualPriority || t.requestedPriority}
                    </span>
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(t.currentStatus)}>
                      {t.currentStatus.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="small">
                    {t.owner ? (
                      <span className="badge bg-light text-dark border">
                        👤 {t.owner.name}
                      </span>
                    ) : (
                      <span className="text-muted fst-italic">Unassigned</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {!isLoading && !error && pagination.totalItems > 0 && (
        <div
          className="d-flex justify-content-between align-items-center flex-wrap gap-3 pt-3 mt-3 border-top"
          data-testid="queue-pagination"
        >
          <span className="small text-muted fw-semibold">
            Showing{" "}
            <strong>
              {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
              {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}
            </strong>{" "}
            of <strong>{pagination.totalItems}</strong> tickets
          </span>

          <div className="btn-group btn-group-sm">
            <button
              type="button"
              className="btn btn-outline-secondary px-3"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => loadQueue(pagination.page - 1)}
              data-testid="queue-prev-page"
            >
              ← Previous
            </button>
            <span className="btn btn-light disabled px-3 fw-bold">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              className="btn btn-outline-secondary px-3"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() => loadQueue(pagination.page + 1)}
              data-testid="queue-next-page"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
