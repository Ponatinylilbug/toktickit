import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.js";
import {
  ActionTaken,
  ActionTakenInput,
  fetchActionsTaken,
  createActionTaken,
  updateActionTaken,
} from "../api.js";

interface ActionsTakenSectionProps {
  ticketId: number;
}

export default function ActionsTakenSection({ ticketId }: ActionsTakenSectionProps) {
  const { user, token } = useAuth();
  const [actions, setActions] = useState<ActionTaken[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingActionId, setEditingActionId] = useState<number | null>(null);
  const [formDescription, setFormDescription] = useState("");
  const [formResult, setFormResult] = useState("");
  const [formActionDate, setFormActionDate] = useState("");
  const [formFollowUpRequired, setFormFollowUpRequired] = useState(false);
  const [formFollowUpNote, setFormFollowUpNote] = useState("");
  const [formAttachmentNotes, setFormAttachmentNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canManageActions = user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR";

  const loadActions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchActionsTaken(ticketId, token || undefined);
      setActions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load actions taken");
    } finally {
      setLoading(false);
    }
  }, [ticketId, token]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  const openCreateModal = () => {
    setEditingActionId(null);
    setFormDescription("");
    setFormResult("");
    setFormActionDate(new Date().toISOString().slice(0, 16));
    setFormFollowUpRequired(false);
    setFormFollowUpNote("");
    setFormAttachmentNotes("");
    setValidationError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (action: ActionTaken) => {
    setEditingActionId(action.id);
    setFormDescription(action.description);
    setFormResult(action.result);
    setFormActionDate(new Date(action.actionDate).toISOString().slice(0, 16));
    setFormFollowUpRequired(action.followUpRequired);
    setFormFollowUpNote(action.followUpNote || "");
    setFormAttachmentNotes(action.attachmentNotes || "");
    setValidationError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingActionId(null);
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!formDescription.trim() || formDescription.trim().length < 3) {
      setValidationError("Action description must be at least 3 characters.");
      return;
    }

    if (!formResult.trim() || formResult.trim().length < 3) {
      setValidationError("Action result must be at least 3 characters.");
      return;
    }

    if (formFollowUpRequired && (!formFollowUpNote || !formFollowUpNote.trim())) {
      setValidationError("Follow-up note is required when follow-up is needed.");
      return;
    }

    if (!token) {
      setValidationError("You must be logged in to record an action.");
      return;
    }

    try {
      setIsSaving(true);
      const payload: ActionTakenInput = {
        description: formDescription.trim(),
        result: formResult.trim(),
        actionDate: formActionDate ? new Date(formActionDate).toISOString() : new Date().toISOString(),
        followUpRequired: formFollowUpRequired,
        followUpNote: formFollowUpRequired ? formFollowUpNote.trim() : null,
        attachmentNotes: formAttachmentNotes.trim() || null,
      };

      if (editingActionId) {
        await updateActionTaken(ticketId, editingActionId, payload, token);
      } else {
        await createActionTaken(ticketId, payload, token);
      }

      await loadActions();
      closeModal();
    } catch (err: any) {
      setValidationError(err.message || "Failed to save action taken.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="card shadow-sm mb-4 border-0" data-testid="actions-taken-section">
      <div
        className="card-header bg-white py-3 d-flex justify-content-between align-items-center"
        style={{ borderBottom: "2px solid #e2e8f0" }}
      >
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: "1.25rem" }}>🛠️</span>
          <h5 className="mb-0 fw-bold" style={{ color: "var(--zen-text-main, #0f172a)" }}>
            Actions Taken
          </h5>
          <span className="badge rounded-pill bg-light text-dark border px-2 py-1" data-testid="actions-count">
            {actions.length}
          </span>
        </div>

        {canManageActions && (
          <button
            type="button"
            className="btn btn-sm text-white px-3 d-flex align-items-center gap-1 shadow-sm"
            style={{ backgroundColor: "var(--zen-primary, #15803d)", borderColor: "var(--zen-primary, #15803d)" }}
            onClick={openCreateModal}
            data-testid="add-action-button"
          >
            <span>+</span>
            <span>Add Action</span>
          </button>
        )}
      </div>

      <div className="card-body p-3 p-md-4">
        {loading ? (
          <div className="text-center py-4 text-muted">
            <div className="spinner-border spinner-border-sm me-2 text-success" role="status"></div>
            Loading actions...
          </div>
        ) : error ? (
          <div className="alert alert-warning py-2 mb-0" role="alert">
            {error}
          </div>
        ) : actions.length === 0 ? (
          <div className="text-center py-4 text-muted bg-light rounded-3" data-testid="actions-empty-state">
            <p className="mb-0">No actions recorded yet for this ticket.</p>
            {canManageActions && (
              <small className="text-muted">Click "+ Add Action" above to document work done.</small>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  <th scope="col" style={{ width: "18%" }}>Date & Time</th>
                  <th scope="col" style={{ width: "16%" }}>Performed By</th>
                  <th scope="col" style={{ width: "26%" }}>Description</th>
                  <th scope="col" style={{ width: "22%" }}>Result</th>
                  <th scope="col" style={{ width: "12%" }}>Follow-up</th>
                  {canManageActions && <th scope="col" style={{ width: "6%" }} className="text-end">Edit</th>}
                </tr>
              </thead>
              <tbody>
                {actions.map((act) => (
                  <tr key={act.id} data-testid={`action-item-${act.id}`}>
                    <td className="small text-muted fw-semibold">
                      {formatDate(act.actionDate)}
                    </td>
                    <td>
                      <div className="fw-medium text-dark" style={{ fontSize: "0.9rem" }}>
                        {act.performedBy?.name || `Staff #${act.performedById}`}
                      </div>
                      <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                        {act.performedBy?.role || "IT Staff"}
                      </small>
                    </td>
                    <td>
                      <div style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>{act.description}</div>
                      {act.attachmentNotes && (
                        <div className="mt-1 small text-muted fst-italic">
                          📎 Attachment: {act.attachmentNotes}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="text-secondary" style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>
                        {act.result}
                      </div>
                    </td>
                    <td>
                      {act.followUpRequired ? (
                        <div>
                          <span className="badge bg-warning text-dark mb-1">Required</span>
                          {act.followUpNote && (
                            <div className="small text-muted" style={{ fontSize: "0.8rem" }}>
                              {act.followUpNote}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="badge bg-light text-secondary border">None</span>
                      )}
                    </td>
                    {canManageActions && (
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary py-1 px-2"
                          onClick={() => openEditModal(act)}
                          data-testid={`edit-action-${act.id}`}
                          title="Edit action"
                        >
                          ✎
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.55)" }}
          data-testid="action-modal"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div
                className="modal-header py-3"
                style={{ backgroundColor: "var(--zen-primary, #15803d)", color: "#fff" }}
              >
                <h5 className="modal-title fw-bold">
                  {editingActionId ? "Edit Action Taken" : "Record Action Taken"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Close"
                  onClick={closeModal}
                  disabled={isSaving}
                ></button>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="modal-body p-4">
                  {validationError && (
                    <div
                      className="alert alert-danger py-2 mb-3"
                      role="alert"
                      data-testid="action-validation-error"
                    >
                      {validationError}
                    </div>
                  )}

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label htmlFor="actionDate" className="form-label fw-semibold small text-muted">
                        Action Date & Time
                      </label>
                      <input
                        id="actionDate"
                        type="datetime-local"
                        className="form-control"
                        value={formActionDate}
                        onChange={(e) => setFormActionDate(e.target.value)}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">
                        Performed By (Auto-bound)
                      </label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        value={user?.name ? `${user.name} (${user.email})` : "Current User"}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="actionDescription" className="form-label fw-semibold small text-muted">
                      Action Description <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="actionDescription"
                      className="form-control"
                      rows={3}
                      placeholder="Detail troubleshooting steps, hardware checks, or commands run..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      disabled={isSaving}
                      data-testid="action-description-input"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="actionResult" className="form-label fw-semibold small text-muted">
                      Result <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="actionResult"
                      className="form-control"
                      rows={2}
                      placeholder="Observed outcome, diagnostics result, or system response..."
                      value={formResult}
                      onChange={(e) => setFormResult(e.target.value)}
                      disabled={isSaving}
                      data-testid="action-result-input"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="attachmentNotes" className="form-label fw-semibold small text-muted">
                      Attachment Notes (Optional)
                    </label>
                    <input
                      id="attachmentNotes"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Refer to battery_diagnostic.png or Wi-Fi survey log"
                      value={formAttachmentNotes}
                      onChange={(e) => setFormAttachmentNotes(e.target.value)}
                      disabled={isSaving}
                      data-testid="action-attachment-notes-input"
                    />
                  </div>

                  <div className="border-top pt-3 mt-3">
                    <div className="form-check form-switch mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="followUpCheck"
                        checked={formFollowUpRequired}
                        onChange={(e) => setFormFollowUpRequired(e.target.checked)}
                        disabled={isSaving}
                        data-testid="action-followup-checkbox"
                      />
                      <label className="form-check-label fw-semibold" htmlFor="followUpCheck">
                        Follow-up Required?
                      </label>
                    </div>

                    {formFollowUpRequired && (
                      <div className="mt-2">
                        <label htmlFor="followUpNote" className="form-label fw-semibold small text-muted">
                          Follow-up Note <span className="text-danger">*</span>
                        </label>
                        <textarea
                          id="followUpNote"
                          className="form-control"
                          rows={2}
                          placeholder="What next steps or monitoring is required?"
                          value={formFollowUpNote}
                          onChange={(e) => setFormFollowUpNote(e.target.value)}
                          disabled={isSaving}
                          data-testid="action-followup-note-input"
                          required={formFollowUpRequired}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer bg-light py-2 px-4 d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary px-3"
                    onClick={closeModal}
                    disabled={isSaving}
                    data-testid="cancel-action-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn text-white px-4"
                    style={{ backgroundColor: "var(--zen-primary, #15803d)", borderColor: "var(--zen-primary, #15803d)" }}
                    disabled={isSaving}
                    data-testid="save-action-button"
                  >
                    {isSaving ? "Saving..." : editingActionId ? "Update Action" : "Save Action"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
