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
      <div className="zen-modal-content text-start" style={{ maxWidth: 560, borderRadius: 12 }}>
        {/* Top Avatar Icon */}
        <div className="text-center mb-3">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle"
            style={{
              width: 56,
              height: 56,
              backgroundColor: "var(--color-pale-green)",
              color: "var(--color-primary-green)",
              fontSize: "1.75rem",
            }}
          >
            👤
          </div>
          <h2 className="h4 fw-bold mt-3 mb-1" style={{ color: "var(--color-text-main)" }}>
            Select Development Requester
          </h2>
          <p className="text-muted small mb-0" style={{ maxWidth: 440, margin: "0 auto", lineHeight: 1.4 }}>
            Choose a development requester to simulate the current requester context. This selector is for Lab 2 development testing only and is not a login screen.
          </p>
        </div>

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
          <form onSubmit={handleContinue} className="mt-3">
            <div className="mb-3">
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

            {/* Info Callout */}
            <div
              className="p-2 px-3 rounded mb-3 d-flex align-items-center gap-2 small border"
              style={{ backgroundColor: "var(--color-page-bg)", color: "var(--color-text-muted)" }}
            >
              <span style={{ fontSize: "1rem" }}>ℹ️</span>
              <span>Only active development requesters are shown.</span>
            </div>

            {/* Shield Notice Callout */}
            <div
              className="p-3 rounded mb-4 border d-flex align-items-start gap-3"
              style={{ backgroundColor: "#FAFAFA" }}
            >
              <span style={{ fontSize: "1.25rem", marginTop: -2 }}>🛡️</span>
              <div>
                <div className="fw-semibold small" style={{ color: "var(--color-text-main)" }}>
                  Authentication coming in Lab 3
                </div>
                <div className="small text-muted" style={{ fontSize: "12px", marginTop: 2 }}>
                  In Lab 3, this selection will be replaced with secure authentication so you can access the system with your own account.
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="d-flex justify-content-end gap-2 pt-2 border-top">
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
                className="btn zen-btn-primary px-4 d-inline-flex align-items-center gap-2"
                disabled={!selectedId}
                data-testid="requester-continue-button"
              >
                <span>➔</span> Continue
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
