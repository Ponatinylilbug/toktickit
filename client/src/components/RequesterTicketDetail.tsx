import React, { useState, useEffect, useCallback } from "react";
import { useRequester } from "../context/RequesterContext.js";
import { Ticket, fetchTicketDetail } from "../api.js";
import AttachmentSection from "./AttachmentSection.js";

interface RequesterTicketDetailProps {
  ticketId: number;
  onBack?: () => void;
}

export default function RequesterTicketDetail({ ticketId, onBack }: RequesterTicketDetailProps) {
  const { currentRequester, openSelector } = useRequester();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadTicket = useCallback(async () => {
    if (!currentRequester) return;

    setIsLoading(true);
    setErrorStatus(null);
    setErrorMessage(null);
    try {
      const data = await fetchTicketDetail(ticketId, currentRequester.id);
      setTicket(data);
    } catch (err: any) {
      setErrorStatus(err.status || 500);
      setErrorMessage(err.message || "Failed to load ticket details");
    } finally {
      setIsLoading(false);
    }
  }, [ticketId, currentRequester]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

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

  if (!currentRequester) {
    return (
      <div className="zen-card p-4 mx-auto my-4 text-center" style={{ maxWidth: 640 }} data-testid="no-requester-state">
        <h2 className="h4 fw-bold mb-2" style={{ color: "var(--color-primary-green)" }}>
          Requester Identity Required
        </h2>
        <p className="text-muted mb-4">
          Please select a Development Requester to view ticket details.
        </p>
        <button type="button" className="btn zen-btn-primary px-4" onClick={openSelector}>
          Select Requester
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="zen-card p-5 mx-auto my-4 text-center" style={{ maxWidth: 840 }} data-testid="ticket-detail-loading">
        <div className="spinner-border text-success mb-3" role="status">
          <span className="visually-hidden">Loading ticket...</span>
        </div>
        <p className="text-muted">Loading ticket details…</p>
      </div>
    );
  }

  // 403 Forbidden Error (AC-10: Cross-requester access rejection)
  if (errorStatus === 403) {
    return (
      <div className="zen-card p-4 mx-auto my-4" style={{ maxWidth: 680 }} data-testid="ticket-forbidden-error">
        <div className="alert alert-danger mb-4">
          <h2 className="h5 fw-bold mb-1">Access Denied (403 Forbidden)</h2>
          <p className="mb-0">
            You do not have permission to view this ticket. This ticket was requested by another user.
          </p>
        </div>
        {onBack && (
          <button type="button" className="btn zen-btn-secondary" onClick={onBack} data-testid="forbidden-back-button">
            ← Back to My Tickets
          </button>
        )}
      </div>
    );
  }

  // 404 Not Found or other error
  if (errorStatus === 404 || !ticket) {
    return (
      <div className="zen-card p-4 mx-auto my-4 text-center" style={{ maxWidth: 680 }} data-testid="ticket-not-found-error">
        <div className="display-6 mb-3 text-muted">🔍</div>
        <h2 className="h5 fw-bold mb-2">Ticket Not Found</h2>
        <p className="text-muted mb-4">
          {errorMessage || "The requested ticket could not be found."}
        </p>
        {onBack && (
          <button type="button" className="btn zen-btn-secondary px-4" onClick={onBack} data-testid="not-found-back-button">
            ← Back to My Tickets
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="zen-card p-4 mx-auto my-4" style={{ maxWidth: 840 }} data-testid="ticket-detail-card">
      {/* Header & Back Navigation */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pb-3 mb-4 border-bottom">
        <div>
          {onBack && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary mb-2"
              onClick={onBack}
              data-testid="back-to-my-tickets-button"
            >
              ← Back to My Tickets
            </button>
          )}
          <h1 className="h4 fw-bold font-monospace mb-0" style={{ color: "var(--color-primary-green)" }} data-testid="ticket-detail-number">
            {ticket.ticketNumber}
          </h1>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge" style={{ backgroundColor: "var(--color-pale-green)", color: "var(--color-primary-green)", fontSize: "0.9rem" }} data-testid="ticket-detail-status">
            {ticket.currentStatus}
          </span>
          <span className={`${getPriorityBadgeClass(ticket.requestedPriority)} px-2 py-1`} style={{ fontSize: "0.9rem" }} data-testid="ticket-detail-priority">
            {ticket.requestedPriority} Priority
          </span>
        </div>
      </div>

      {/* Read-Only Info Grid (AC-09, UI-05) */}
      <div className="row g-3 mb-4">
        {/* Requester Information */}
        <div className="col-md-6">
          <div className="p-3 rounded h-100" style={{ backgroundColor: "var(--color-readonly-bg)", border: "1px solid var(--color-card-border)" }}>
            <span className="small text-muted fw-semibold text-uppercase d-block mb-1">Requester</span>
            <div className="fw-bold" data-testid="ticket-requester-name">
              {ticket.requester?.name || currentRequester.name}
            </div>
            <div className="small text-muted" data-testid="ticket-requester-department">
              {ticket.requester?.department || currentRequester.department} • {ticket.requester?.email || currentRequester.email}
            </div>
          </div>
        </div>

        {/* Classification & Timestamps */}
        <div className="col-md-6">
          <div className="p-3 rounded h-100" style={{ backgroundColor: "var(--color-readonly-bg)", border: "1px solid var(--color-card-border)" }}>
            <span className="small text-muted fw-semibold text-uppercase d-block mb-1">Classification</span>
            <div className="d-flex justify-content-between">
              <span className="text-muted small">Category:</span>
              <span className="fw-semibold" data-testid="ticket-category-name">{ticket.category?.name || "Support"}</span>
            </div>
            <div className="d-flex justify-content-between mt-1">
              <span className="text-muted small">Affected System:</span>
              <span className="fw-semibold" data-testid="ticket-system-name">{ticket.relatedSystem?.name || "-"}</span>
            </div>
            <div className="d-flex justify-content-between mt-1">
              <span className="text-muted small">Created:</span>
              <span className="small text-muted">{new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="col-12">
          <div className="p-3 rounded bg-white border">
            <span className="small text-muted fw-semibold text-uppercase d-block mb-1">Summary</span>
            <div className="fw-bold fs-6" data-testid="ticket-detail-summary">
              {ticket.summary}
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="col-12">
          <div className="p-3 rounded bg-white border">
            <span className="small text-muted fw-semibold text-uppercase d-block mb-1">Detailed Description</span>
            <div
              className="text-break mt-1"
              style={{ whiteSpace: "pre-wrap", minHeight: 60 }}
              data-testid="ticket-detail-description"
            >
              {ticket.description}
            </div>
          </div>
        </div>
      </div>

      {/* Attachments Section */}
      <AttachmentSection
        ticketId={ticket.id}
        attachments={ticket.attachments || []}
        onAttachmentUploaded={(newAtt) => {
          setTicket((prev) =>
            prev ? { ...prev, attachments: [...(prev.attachments || []), newAtt] } : null
          );
        }}
        onAttachmentRemoved={(removedId, updated) => {
          setTicket((prev) =>
            prev
              ? {
                  ...prev,
                  attachments: (prev.attachments || []).map((a) =>
                    a.id === removedId ? updated : a
                  ),
                }
              : null
          );
        }}
      />
    </div>
  );
}
