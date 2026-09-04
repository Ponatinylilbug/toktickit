import React, { useState, useEffect } from "react";
import { useRequester } from "../context/RequesterContext.js";
import { RequesterUser } from "../api.js";

export default function RequesterSelectorModal() {
  const {
    currentRequester,
    setCurrentRequester,
    requesters,
    isLoading,
    error,
    isSelectorOpen,
    closeSelector,
    reloadRequesters,
  } = useRequester();

  const [selectedId, setSelectedId] = useState<number | "">("");

  // Sync selectedId when requesters or currentRequester updates
  useEffect(() => {
    if (currentRequester) {
      setSelectedId(currentRequester.id);
    } else if (requesters.length > 0) {
      setSelectedId(requesters[0].id);
    } else {
      setSelectedId("");
    }
  }, [currentRequester, requesters]);

  if (!isSelectorOpen) {
    return null;
  }

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    const found = requesters.find((r) => r.id === Number(selectedId));
    if (found) {
      setCurrentRequester(found);
    }
  };

  return (
    <div className="zen-modal-overlay" role="dialog" aria-modal="true" data-testid="requester-modal-overlay">
      <div className="zen-modal-content">
        <h2 className="h4 fw-bold mb-2" style={{ color: "var(--color-primary-green)" }}>
          Select Development Requester
        </h2>
        <p className="text-muted small mb-4">
          This selector is for Lab 2 development testing only. Authentication will arrive in Lab 3.
        </p>

        {isLoading && (
          <div className="text-center py-4" data-testid="requester-loading">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading requesters...</span>
            </div>
            <p className="text-muted small mt-2">Loading active development requesters…</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="alert alert-danger" role="alert" data-testid="requester-error">
            <p className="mb-2 fw-semibold">Failed to load requesters</p>
            <p className="small mb-3">{error}</p>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={reloadRequesters}
              data-testid="requester-retry-button"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && requesters.length === 0 && (
          <div className="alert alert-warning" role="alert" data-testid="requester-empty">
            <p className="mb-0 small">No active development requesters found in database.</p>
          </div>
        )}

        {!isLoading && !error && requesters.length > 0 && (
          <form onSubmit={handleContinue}>
            <div className="mb-4">
              <label htmlFor="requester-select" className="form-label fw-semibold" style={{ fontSize: "14px" }}>
                Development Requester <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <select
                id="requester-select"
                className="form-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : "")}
                data-testid="requester-select"
                required
              >
                {requesters.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.department} ({r.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="d-flex justify-content-end gap-2">
              {currentRequester && (
                <button
                  type="button"
                  className="btn zen-btn-secondary px-3"
                  onClick={closeSelector}
                  data-testid="requester-cancel-button"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="btn zen-btn-primary px-4"
                disabled={!selectedId}
                data-testid="requester-continue-button"
              >
                Continue
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
