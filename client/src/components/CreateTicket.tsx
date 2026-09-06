import React, { useState, useEffect } from "react";
import { useRequester } from "../context/RequesterContext.js";
import {
  Category,
  RelatedSystem,
  Ticket,
  fetchActiveCategories,
  fetchActiveRelatedSystems,
  createTicket,
} from "../api.js";

interface CreateTicketProps {
  onTicketCreated?: (ticket: Ticket) => void;
  onCancel?: () => void;
}

export default function CreateTicket({ onTicketCreated, onCancel }: CreateTicketProps) {
  const { currentRequester, openSelector } = useRequester();

  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  const [isLoadingRefs, setIsLoadingRefs] = useState<boolean>(true);

  // Form states
  const [categoryId, setCategoryId] = useState<string>("");
  const [relatedSystemId, setRelatedSystemId] = useState<string>("");
  const [requestedPriority, setRequestedPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Validation & Submission states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);

  // Load Categories & Related Systems on mount
  useEffect(() => {
    let isMounted = true;
    async function loadReferenceData() {
      setIsLoadingRefs(true);
      try {
        const [cats, systems] = await Promise.all([
          fetchActiveCategories(),
          fetchActiveRelatedSystems(),
        ]);
        if (isMounted) {
          setCategories(cats);
          setRelatedSystems(systems);
        }
      } catch {
        // Fallbacks if backend is slow
      } finally {
        if (isMounted) setIsLoadingRefs(false);
      }
    }
    loadReferenceData();
    return () => {
      isMounted = false;
    };
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const trimmedSummary = summary.trim();
    if (!trimmedSummary) {
      errors.summary = "Ticket summary is required.";
    } else if (trimmedSummary.length < 5) {
      errors.summary = "Summary must be at least 5 characters.";
    } else if (trimmedSummary.length > 100) {
      errors.summary = "Summary cannot exceed 100 characters.";
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      errors.description = "Ticket description is required.";
    } else if (trimmedDesc.length < 10) {
      errors.description = "Description must be at least 10 characters.";
    } else if (trimmedDesc.length > 2000) {
      errors.description = "Description cannot exceed 2000 characters.";
    }

    if (!categoryId) {
      errors.categoryId = "Please select a Category.";
    }

    if (!relatedSystemId) {
      errors.relatedSystemId = "Please select a Related System.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!currentRequester) {
      openSelector();
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const ticket = await createTicket({
        requesterId: currentRequester.id,
        categoryId: Number(categoryId),
        relatedSystemId: Number(relatedSystemId),
        requestedPriority,
        summary: summary.trim(),
        description: description.trim(),
      });

      setCreatedTicket(ticket);
      if (onTicketCreated) {
        onTicketCreated(ticket);
      }
    } catch (err: any) {
      // BR-14: Preserve form inputs upon failure
      setSubmitError(err.message || "Failed to submit ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCategoryId("");
    setRelatedSystemId("");
    setRequestedPriority("MEDIUM");
    setSummary("");
    setDescription("");
    setFieldErrors({});
    setSubmitError(null);
    setCreatedTicket(null);
  };

  // Success Confirmation Dialog / Screen (AC-01)
  if (createdTicket) {
    return (
      <div className="zen-card p-4 mx-auto my-4" style={{ maxWidth: 680 }} data-testid="ticket-success-dialog">
        <div className="text-center py-3">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
            style={{ width: 64, height: 64, backgroundColor: "var(--color-pale-green)", color: "var(--color-primary-green)" }}
          >
            <span style={{ fontSize: "2rem" }}>✓</span>
          </div>
          <h2 className="h4 fw-bold" style={{ color: "var(--color-primary-green)" }}>
            Ticket Created Successfully!
          </h2>
          <p className="text-muted mb-4">
            Your support request has been logged and assigned an official tracking number.
          </p>

          <div className="p-3 mb-4 rounded border" style={{ backgroundColor: "var(--color-pale-green)" }}>
            <span className="text-muted small text-uppercase fw-semibold d-block mb-1">Official Ticket Number</span>
            <span className="h3 fw-bold font-monospace" style={{ color: "var(--color-primary-green)" }} data-testid="ticket-number-display">
              {createdTicket.ticketNumber}
            </span>
          </div>

          <div className="text-start bg-light p-3 rounded mb-4 border">
            <div className="row g-2 small">
              <div className="col-sm-4 text-muted">Summary:</div>
              <div className="col-sm-8 fw-semibold">{createdTicket.summary}</div>
              <div className="col-sm-4 text-muted">Priority:</div>
              <div className="col-sm-8">
                <span className="badge bg-secondary">{createdTicket.requestedPriority}</span>
              </div>
              <div className="col-sm-4 text-muted">Current Status:</div>
              <div className="col-sm-8">
                <span className="badge bg-success">{createdTicket.currentStatus}</span>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-center gap-3">
            <button
              type="button"
              className="btn zen-btn-secondary px-4"
              onClick={resetForm}
              data-testid="create-another-ticket-button"
            >
              Create Another Ticket
            </button>
            {onCancel && (
              <button
                type="button"
                className="btn zen-btn-primary px-4"
                onClick={onCancel}
                data-testid="view-my-tickets-button"
              >
                Back to My Tickets
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="zen-card p-4 mx-auto my-4" style={{ maxWidth: 720 }} data-testid="create-ticket-form-card">
      <div className="border-bottom pb-3 mb-4">
        <h2 className="h4 fw-bold mb-1" style={{ color: "var(--color-primary-green)" }}>
          Create IT Support Ticket
        </h2>
        <p className="text-muted small mb-0">
          Fill in the details below to submit a support request to the IT Help Desk.
        </p>
      </div>

      {submitError && (
        <div className="alert alert-danger" role="alert" data-testid="submit-error-banner">
          <strong>Submission Error:</strong> {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Requester Info Section (Read-Only) */}
        <div className="mb-4 p-3 rounded" style={{ backgroundColor: "var(--color-readonly-bg)", border: "1px solid var(--color-card-border)" }}>
          <span className="fw-semibold small text-muted text-uppercase d-block mb-2">Requester Information (Read-Only)</span>
          <div className="row g-2">
            <div className="col-sm-6">
              <label className="form-label small text-muted mb-0">Requester Name</label>
              <div className="fw-semibold" data-testid="readonly-requester-name">
                {currentRequester ? currentRequester.name : "(No requester selected)"}
              </div>
            </div>
            <div className="col-sm-6">
              <label className="form-label small text-muted mb-0">Department</label>
              <div className="fw-semibold" data-testid="readonly-requester-department">
                {currentRequester ? currentRequester.department : "-"}
              </div>
            </div>
          </div>
        </div>

        {/* Classification Section */}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label htmlFor="ticket-category" className="form-label fw-semibold" style={{ fontSize: "14px" }}>
              Category <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <select
              id="ticket-category"
              className={`form-select ${fieldErrors.categoryId ? "is-invalid" : ""}`}
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                if (fieldErrors.categoryId) {
                  setFieldErrors((prev) => ({ ...prev, categoryId: "" }));
                }
              }}
              disabled={isLoadingRefs}
              data-testid="ticket-category-select"
              required
            >
              <option value="">-- Select Category --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {fieldErrors.categoryId && (
              <div className="invalid-feedback d-block" data-testid="error-category">
                {fieldErrors.categoryId}
              </div>
            )}
          </div>

          <div className="col-md-6">
            <label htmlFor="ticket-related-system" className="form-label fw-semibold" style={{ fontSize: "14px" }}>
              Related System <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <select
              id="ticket-related-system"
              className={`form-select ${fieldErrors.relatedSystemId ? "is-invalid" : ""}`}
              value={relatedSystemId}
              onChange={(e) => {
                setRelatedSystemId(e.target.value);
                if (fieldErrors.relatedSystemId) {
                  setFieldErrors((prev) => ({ ...prev, relatedSystemId: "" }));
                }
              }}
              disabled={isLoadingRefs}
              data-testid="ticket-related-system-select"
              required
            >
              <option value="">-- Select Affected System --</option>
              {relatedSystems.map((sys) => (
                <option key={sys.id} value={sys.id}>
                  {sys.name}
                </option>
              ))}
            </select>
            {fieldErrors.relatedSystemId && (
              <div className="invalid-feedback d-block" data-testid="error-related-system">
                {fieldErrors.relatedSystemId}
              </div>
            )}
          </div>
        </div>

        {/* Priority Dropdown */}
        <div className="mb-3">
          <label htmlFor="ticket-priority" className="form-label fw-semibold" style={{ fontSize: "14px" }}>
            Requested Priority <span style={{ color: "var(--color-error)" }}>*</span>
          </label>
          <select
            id="ticket-priority"
            className="form-select"
            value={requestedPriority}
            onChange={(e) => setRequestedPriority(e.target.value as any)}
            data-testid="ticket-priority-select"
          >
            <option value="LOW">Low (Minor inconvenience)</option>
            <option value="MEDIUM">Medium (Standard request - Default)</option>
            <option value="HIGH">High (Major impact on daily work)</option>
            <option value="URGENT">Urgent (Critical blocker)</option>
          </select>
        </div>

        {/* Summary */}
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label htmlFor="ticket-summary" className="form-label fw-semibold mb-0" style={{ fontSize: "14px" }}>
              Summary <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <span className="small text-muted" data-testid="summary-counter">
              {summary.length}/100
            </span>
          </div>
          <input
            id="ticket-summary"
            type="text"
            className={`form-control ${fieldErrors.summary ? "is-invalid" : ""}`}
            placeholder="Brief description of the problem (5 to 100 characters)"
            value={summary}
            maxLength={100}
            onChange={(e) => {
              setSummary(e.target.value);
              if (fieldErrors.summary) {
                setFieldErrors((prev) => ({ ...prev, summary: "" }));
              }
            }}
            data-testid="ticket-summary-input"
            required
          />
          {fieldErrors.summary && (
            <div className="invalid-feedback d-block" data-testid="error-summary">
              {fieldErrors.summary}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label htmlFor="ticket-description" className="form-label fw-semibold mb-0" style={{ fontSize: "14px" }}>
              Detailed Description <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <span className="small text-muted" data-testid="description-counter">
              {description.length}/2000
            </span>
          </div>
          <textarea
            id="ticket-description"
            className={`form-control ${fieldErrors.description ? "is-invalid" : ""}`}
            rows={5}
            style={{ resize: "vertical", minHeight: "120px" }}
            placeholder="Explain steps to reproduce, error messages observed, and impact (10 to 2000 characters)"
            value={description}
            maxLength={2000}
            onChange={(e) => {
              setDescription(e.target.value);
              if (fieldErrors.description) {
                setFieldErrors((prev) => ({ ...prev, description: "" }));
              }
            }}
            data-testid="ticket-description-input"
            required
          />
          {fieldErrors.description && (
            <div className="invalid-feedback d-block" data-testid="error-description">
              {fieldErrors.description}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="d-flex justify-content-end gap-2 border-top pt-3">
          {onCancel && (
            <button
              type="button"
              className="btn zen-btn-secondary px-4"
              onClick={onCancel}
              disabled={isSubmitting}
              data-testid="cancel-ticket-button"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn zen-btn-primary px-4"
            disabled={isSubmitting}
            data-testid="submit-ticket-button"
          >
            {isSubmitting ? "Submitting..." : "Submit Ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}
