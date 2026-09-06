import React, { useState, useEffect, useCallback } from "react";
import { useRequester } from "../context/RequesterContext.js";
import {
  Ticket,
  Category,
  PaginationMeta,
  fetchActiveCategories,
  fetchMyTickets,
} from "../api.js";

interface MyTicketsProps {
  onCreateTicketClick?: () => void;
  onSelectTicket?: (ticket: Ticket) => void;
}

export default function MyTickets({ onCreateTicketClick, onSelectTicket }: MyTicketsProps) {
  const { currentRequester, openSelector } = useRequester();

  const [categories, setCategories] = useState<Category[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  // Load categories on mount
  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const cats = await fetchActiveCategories();
        if (isMounted) setCategories(cats);
      } catch {
        // fallback ignored
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch tickets for current requester (AC-07: data ownership isolation)
  const loadTickets = useCallback(async () => {
    if (!currentRequester) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchMyTickets({
        requesterId: currentRequester.id,
        search: search.trim() || undefined,
        categoryId: categoryId || undefined,
        requestedPriority: priority || undefined,
        currentStatus: status || undefined,
        page,
        pageSize: 10,
      });

      setTickets(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to load tickets");
    } finally {
      setIsLoading(false);
    }
  }, [currentRequester, search, categoryId, priority, status, page]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // When requester changes, reset to page 1
  useEffect(() => {
    setPage(1);
  }, [currentRequester?.id]);

  const handleClearFilters = () => {
    setSearch("");
    setCategoryId("");
    setPriority("");
    setStatus("");
    setPage(1);
  };

  const isFiltering = Boolean(search || categoryId || priority || status);

  const getPriorityBadgeClass = (p: string) => {
    switch (p?.toUpperCase()) {
      case "URGENT":
        return "badge bg-danger";
      case "HIGH":
        return "badge bg-warning text-dark";
      case "MEDIUM":
        return "badge bg-info text-dark";
      case "LOW":
        return "badge bg-secondary";
      default:
        return "badge bg-secondary";
    }
  };

  const startItem = pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.totalItems, pagination.page * pagination.pageSize);

  if (!currentRequester) {
    return (
      <div className="zen-card p-4 mx-auto my-4 text-center" style={{ maxWidth: 640 }} data-testid="no-requester-state">
        <h2 className="h4 fw-bold mb-2" style={{ color: "var(--color-primary-green)" }}>
          Development Requester Required
        </h2>
        <p className="text-muted mb-4">
          Please select an active simulated Requester to view their submitted tickets.
        </p>
        <button type="button" className="btn zen-btn-primary px-4" onClick={openSelector}>
          Select Requester
        </button>
      </div>
    );
  }

  return (
    <div className="zen-card p-4 mx-auto my-4" style={{ maxWidth: 1040 }} data-testid="my-tickets-card">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pb-3 mb-4 border-bottom">
        <div>
          <h1 className="h4 fw-bold mb-1" style={{ color: "var(--color-primary-green)" }}>
            My Tickets
          </h1>
          <p className="text-muted small mb-0">
            Showing tickets requested by <strong>{currentRequester.name}</strong> ({currentRequester.department})
          </p>
        </div>

        {onCreateTicketClick && (
          <button
            type="button"
            className="btn zen-btn-primary px-3"
            onClick={onCreateTicketClick}
            data-testid="my-tickets-create-button"
          >
            + Create Ticket
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-light p-3 rounded mb-4 border">
        <div className="row g-2 align-items-center">
          <div className="col-md-4">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search summary, desc, or ticket #..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              data-testid="tickets-search-input"
            />
          </div>

          <div className="col-sm-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              data-testid="tickets-category-filter"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-sm-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              data-testid="tickets-priority-filter"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div className="col-sm-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              data-testid="tickets-status-filter"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div className="col-sm-6 col-md-2 d-flex justify-content-end">
            {isFiltering && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary w-100"
                onClick={handleClearFilters}
                data-testid="clear-filters-button"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center" data-testid="tickets-error-alert">
          <span>{error}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={loadTickets}>
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-5" data-testid="tickets-loading">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading tickets...</span>
          </div>
          <p className="text-muted small mt-2">Loading your support tickets…</p>
        </div>
      )}

      {/* Empty State: 0 tickets for requester */}
      {!isLoading && !error && tickets.length === 0 && !isFiltering && (
        <div className="text-center py-5 border rounded bg-white" data-testid="tickets-empty-state">
          <div className="display-6 mb-3 text-muted">🎫</div>
          <h2 className="h5 fw-bold mb-2">No Tickets Found</h2>
          <p className="text-muted small mb-4" style={{ maxWidth: 420, margin: "0 auto" }}>
            You have not submitted any IT support tickets yet. Need help with hardware, software, or account access?
          </p>
          {onCreateTicketClick && (
            <button
              type="button"
              className="btn zen-btn-primary px-4"
              onClick={onCreateTicketClick}
              data-testid="empty-create-ticket-button"
            >
              + Create Your First Ticket
            </button>
          )}
        </div>
      )}

      {/* No Results State: filters match 0 */}
      {!isLoading && !error && tickets.length === 0 && isFiltering && (
        <div className="text-center py-5 border rounded bg-white" data-testid="tickets-no-results">
          <div className="display-6 mb-3 text-muted">🔍</div>
          <h2 className="h5 fw-bold mb-2">No Matching Tickets</h2>
          <p className="text-muted small mb-4">
            No tickets match your search or filter criteria. Try changing or clearing your filters.
          </p>
          <button
            type="button"
            className="btn zen-btn-secondary px-4"
            onClick={handleClearFilters}
            data-testid="no-results-clear-filters-button"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Data Table */}
      {!isLoading && !error && tickets.length > 0 && (
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" data-testid="my-tickets-table">
            <thead className="table-light">
              <tr>
                <th style={{ minWidth: 150 }}>Ticket No</th>
                <th style={{ minWidth: 110 }}>Created</th>
                <th>Summary</th>
                <th style={{ minWidth: 130 }}>Category</th>
                <th style={{ minWidth: 100 }}>Priority</th>
                <th style={{ minWidth: 90 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr
                  key={t.id}
                  style={{ cursor: onSelectTicket ? "pointer" : "default" }}
                  onClick={() => onSelectTicket && onSelectTicket(t)}
                  data-testid={`ticket-row-${t.id}`}
                >
                  <td className="font-monospace fw-bold" style={{ color: "var(--color-primary-green)" }}>
                    {t.ticketNumber}
                  </td>
                  <td className="small text-muted">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td className="fw-semibold text-truncate" style={{ maxWidth: 300 }}>
                    {t.summary}
                  </td>
                  <td className="small">
                    {(t as any).category?.name || "Support"}
                  </td>
                  <td>
                    <span className={getPriorityBadgeClass(t.requestedPriority)}>
                      {t.requestedPriority}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: "var(--color-pale-green)", color: "var(--color-primary-green)" }}>
                      {t.currentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {!isLoading && !error && pagination.totalItems > 0 && (
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-3 mt-3 border-top" data-testid="pagination-bar">
          <span className="small text-muted" data-testid="pagination-summary">
            Showing {startItem} to {endItem} of {pagination.totalItems} tickets
          </span>

          <nav aria-label="Ticket pagination">
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${pagination.page <= 1 ? "disabled" : ""}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  data-testid="prev-page-button"
                >
                  Previous
                </button>
              </li>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pNum) => (
                <li key={pNum} className={`page-item ${pNum === pagination.page ? "active" : ""}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => setPage(pNum)}
                    data-testid={`page-button-${pNum}`}
                  >
                    {pNum}
                  </button>
                </li>
              ))}

              <li className={`page-item ${pagination.page >= pagination.totalPages ? "disabled" : ""}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  data-testid="next-page-button"
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
