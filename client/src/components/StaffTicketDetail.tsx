import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.js";
import {
  StaffTicket,
  CommentItem,
  InternalNoteItem,
  fetchStaffTicketDetail,
  assignTicketOwner,
  updateStaffPriority,
  updateStaffStatus,
  fetchComments,
  addComment,
  fetchInternalNotes,
  addInternalNote,
  fetchAdminUsers,
  AuthUser,
  getAttachmentDownloadUrl,
} from "../api.js";

interface StaffTicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

export default function StaffTicketDetail({ ticketId, onBack }: StaffTicketDetailProps) {
  const { user, token } = useAuth();
  const [ticket, setTicket] = useState<StaffTicket | null>(null);
  const [staffUsers, setStaffUsers] = useState<AuthUser[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [notes, setNotes] = useState<InternalNoteItem[]>([]);

  // Controls state
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Tabs state
  const [activeTab, setActiveTab] = useState<"comments" | "notes">("comments");
  const [commentText, setCommentText] = useState("");
  const [noteText, setNoteText] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadTicketData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [tData, staffData, cData, nData] = await Promise.all([
        fetchStaffTicketDetail(ticketId, token),
        fetchAdminUsers({ role: "IT_STAFF" }, token).catch(() => ({ data: [], pagination: {} as any })),
        fetchComments(ticketId, token).catch(() => []),
        fetchInternalNotes(ticketId, token).catch(() => []),
      ]);

      setTicket(tData);
      setStaffUsers(staffData.data);
      setComments(cData);
      setNotes(nData);

      setSelectedOwnerId(tData.ownerId ? tData.ownerId.toString() : "");
      setSelectedPriority(tData.actualPriority || tData.requestedPriority || "MEDIUM");
      setSelectedStatus(tData.currentStatus || "NEW");
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to load ticket." });
    } finally {
      setIsLoading(false);
    }
  }, [ticketId, token]);

  useEffect(() => {
    loadTicketData();
  }, [loadTicketData]);

  // IT Operations handlers
  const handleAssignOwner = async (ownerIdVal: string) => {
    if (!token) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const parsedId = ownerIdVal ? Number(ownerIdVal) : null;
      const updated = await assignTicketOwner(ticketId, parsedId, token);
      setTicket(updated);
      setSelectedOwnerId(updated.ownerId ? updated.ownerId.toString() : "");
      setActionMessage({ type: "success", text: "Ticket owner updated successfully." });
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to update owner." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaim = () => {
    if (user) {
      handleAssignOwner(user.id.toString());
    }
  };

  const handleUpdatePriority = async (newPriority: string) => {
    if (!token) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const updated = await updateStaffPriority(
        ticketId,
        newPriority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
        token
      );
      setTicket(updated);
      setSelectedPriority(updated.actualPriority || newPriority);
      setActionMessage({ type: "success", text: `Priority updated to ${newPriority}.` });
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to update priority." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!token) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const updated = await updateStaffStatus(ticketId, newStatus, token);
      setTicket(updated);
      setSelectedStatus(updated.currentStatus);
      setActionMessage({ type: "success", text: `Status updated to ${newStatus.replace(/_/g, " ")}.` });
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to update status." });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !token) return;
    setActionLoading(true);
    try {
      const newC = await addComment(ticketId, commentText.trim(), token);
      setComments((prev) => [...prev, newC]);
      setCommentText("");
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to post comment." });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !token) return;
    setActionLoading(true);
    try {
      const newN = await addInternalNote(ticketId, noteText.trim(), token);
      setNotes((prev) => [...prev, newN]);
      setNoteText("");
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to post note." });
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5" data-testid="detail-loading">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading ticket...</span>
        </div>
        <p className="text-muted small mt-2">Loading ticket details…</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="alert alert-danger mx-auto my-4" style={{ maxWidth: 800 }}>
        Ticket not found.
        <button type="button" className="btn btn-sm btn-link" onClick={onBack}>
          Back to Queue
        </button>
      </div>
    );
  }

  return (
    <div className="zen-card p-4 mx-auto my-3" style={{ maxWidth: 1140 }} data-testid="staff-ticket-detail-card">
      {/* Top Bar with Back Button and Heading */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pb-3 mb-3 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onBack}
            data-testid="staff-detail-back-button"
          >
            ← Back to Queue
          </button>
          <div>
            <h1 className="h5 fw-bold mb-0 font-monospace" style={{ color: "var(--color-primary)" }}>
              {ticket.ticketNumber}
            </h1>
            <span className="small text-muted">{ticket.summary}</span>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`alert ${actionMessage.type === "success" ? "alert-success" : "alert-danger"} py-2 px-3 mb-3 small`}
          role="alert"
          data-testid="action-feedback-alert"
        >
          {actionMessage.text}
        </div>
      )}

      {/* Main Two-Panel Layout */}
      <div className="row g-4">
        {/* Left Panel: Ticket Details */}
        <div className="col-12 col-lg-7">
          <div className="p-3 bg-light rounded border mb-4">
            <h2 className="h6 fw-bold mb-3 border-bottom pb-2">Ticket Information</h2>
            <div className="row g-2 small">
              <div className="col-sm-6">
                <span className="text-muted">Requester:</span>{" "}
                <strong>{ticket.requester?.name || `ID #${ticket.requesterId}`}</strong>
                {ticket.requester?.department && (
                  <span className="text-muted"> ({ticket.requester.department})</span>
                )}
              </div>
              <div className="col-sm-6">
                <span className="text-muted">Category:</span>{" "}
                <strong>{ticket.category?.name || "General"}</strong>
              </div>
              <div className="col-sm-6">
                <span className="text-muted">Related System:</span>{" "}
                <strong>{ticket.relatedSystem?.name || "N/A"}</strong>
              </div>
              <div className="col-sm-6">
                <span className="text-muted">Created:</span>{" "}
                {new Date(ticket.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="h6 fw-bold mb-2">Description</h2>
            <div
              className="p-3 rounded border bg-white small"
              style={{ whiteSpace: "pre-wrap", minHeight: 100, lineHeight: 1.6 }}
              data-testid="ticket-description-view"
            >
              {ticket.description}
            </div>
          </div>

          {/* Attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="mb-4">
              <h2 className="h6 fw-bold mb-2">Attachments ({ticket.attachments.filter((a) => !a.isRemoved).length})</h2>
              <div className="list-group list-group-flush border rounded">
                {ticket.attachments
                  .filter((a) => !a.isRemoved)
                  .map((att) => (
                    <div
                      key={att.id}
                      className="list-group-item d-flex justify-content-between align-items-center py-2"
                    >
                      <span className="small">
                        📎 <strong>{att.originalName}</strong>{" "}
                        <span className="text-muted">({(att.fileSize / 1024).toFixed(1)} KB)</span>
                      </span>
                      <a
                        href={getAttachmentDownloadUrl(att.id)}
                        className="btn btn-sm btn-outline-success py-0 px-2"
                        target="_blank"
                        rel="noreferrer"
                        data-testid={`download-att-${att.id}`}
                      >
                        Download
                      </a>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: IT Controls */}
        <div className="col-12 col-lg-5">
          <div className="p-3 rounded border bg-white shadow-sm" data-testid="it-controls-panel">
            <h2 className="h6 fw-bold mb-3 border-bottom pb-2" style={{ color: "var(--color-primary)" }}>
              ⚙️ IT Controls
            </h2>

            {/* Ownership */}
            <div className="mb-3">
              <label htmlFor="staff-owner-select" className="form-label fw-semibold small">
                Assigned Owner
              </label>
              <div className="d-flex gap-2">
                <select
                  id="staff-owner-select"
                  className="form-select form-select-sm"
                  value={selectedOwnerId}
                  onChange={(e) => {
                    setSelectedOwnerId(e.target.value);
                    handleAssignOwner(e.target.value);
                  }}
                  disabled={actionLoading}
                  data-testid="staff-owner-select"
                >
                  <option value="">Unassigned</option>
                  {staffUsers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.department || "IT"})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success text-nowrap"
                  onClick={handleClaim}
                  disabled={actionLoading || Boolean(user && selectedOwnerId === user.id.toString())}
                  data-testid="claim-ticket-button"
                >
                  Claim
                </button>
              </div>
            </div>

            {/* IT Priority */}
            <div className="mb-3">
              <label htmlFor="staff-priority-select" className="form-label fw-semibold small">
                IT Priority (Actual)
              </label>
              <select
                id="staff-priority-select"
                className="form-select form-select-sm"
                value={selectedPriority}
                onChange={(e) => {
                  setSelectedPriority(e.target.value);
                  handleUpdatePriority(e.target.value);
                }}
                disabled={actionLoading}
                data-testid="staff-priority-select"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
              <div className="text-muted small mt-1" style={{ fontSize: 11 }}>
                Requester requested: <strong>{ticket.requestedPriority}</strong>
              </div>
            </div>

            {/* Ticket Status */}
            <div className="mb-3">
              <label htmlFor="staff-status-select" className="form-label fw-semibold small">
                Ticket Status
              </label>
              <select
                id="staff-status-select"
                className="form-select form-select-sm"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  handleUpdateStatus(e.target.value);
                }}
                disabled={actionLoading}
                data-testid="staff-status-select"
              >
                <option value="NEW">NEW</option>
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="WAITING_FOR_REQUESTER">WAITING FOR REQUESTER</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Communication Section: Comments & Internal Notes */}
      <div className="mt-4 pt-3 border-top">
        <ul className="nav nav-tabs mb-3" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              type="button"
              className={`nav-link ${activeTab === "comments" ? "active fw-bold" : ""}`}
              onClick={() => setActiveTab("comments")}
              data-testid="tab-public-comments"
            >
              💬 Public Comments ({comments.length})
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              type="button"
              className={`nav-link ${activeTab === "notes" ? "active fw-bold text-warning-emphasis" : ""}`}
              onClick={() => setActiveTab("notes")}
              data-testid="tab-internal-notes"
            >
              🔒 Internal Notes (Staff Only) ({notes.length})
            </button>
          </li>
        </ul>

        {/* Tab 1: Public Comments */}
        {activeTab === "comments" && (
          <div data-testid="comments-panel">
            <div className="mb-3" style={{ maxHeight: 300, overflowY: "auto" }}>
              {comments.length === 0 ? (
                <p className="text-muted small fst-italic">No comments posted yet.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-2 mb-2 rounded bg-light border small" data-testid={`comment-item-${c.id}`}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div>
                        <strong>{c.user?.name || `User #${c.userId}`}</strong>
                        <span className="badge bg-secondary ms-2" style={{ fontSize: 10 }}>
                          {c.user?.role}
                        </span>
                      </div>
                      <span className="text-muted" style={{ fontSize: 11 }}>
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div>{c.message}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handlePostComment} className="d-flex gap-2">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Write a public comment for the requester..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={actionLoading}
                data-testid="comment-input"
              />
              <button
                type="submit"
                className="btn btn-sm zen-btn-primary px-3"
                disabled={actionLoading || !commentText.trim()}
                data-testid="post-comment-button"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Internal Notes */}
        {activeTab === "notes" && (
          <div
            className="p-3 rounded border"
            style={{ backgroundColor: "var(--color-badge-note, #FFF8E1)", borderColor: "var(--color-badge-note-border, #FFE082)" }}
            data-testid="internal-notes-panel"
          >
            <div className="mb-3" style={{ maxHeight: 300, overflowY: "auto" }}>
              {notes.length === 0 ? (
                <p className="text-muted small fst-italic">No internal notes logged yet.</p>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="p-2 mb-2 rounded bg-white border small" data-testid={`note-item-${n.id}`}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div>
                        <strong>{n.user?.name || `Staff #${n.userId}`}</strong>
                        <span className="badge bg-warning text-dark ms-2" style={{ fontSize: 10 }}>
                          Internal Note
                        </span>
                      </div>
                      <span className="text-muted" style={{ fontSize: 11 }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div>{n.note}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handlePostNote} className="d-flex gap-2">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Log private staff notes (never visible to requester)..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                disabled={actionLoading}
                data-testid="note-input"
              />
              <button
                type="submit"
                className="btn btn-sm btn-warning text-dark px-3 fw-bold"
                disabled={actionLoading || !noteText.trim()}
                data-testid="post-note-button"
              >
                Add Note
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
