import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import { changeUserPassword } from "../api.js";

interface ChangePasswordPageProps {
  onSuccess?: () => void;
}

export default function ChangePasswordPage({ onSuccess }: ChangePasswordPageProps) {
  const { user, token, updateCurrentUser, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password rules validation
  const hasMinLen = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /\d/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    if (!hasMinLen || !hasUpper || !hasLower || !hasDigit) {
      setError("New password must meet all complexity requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password cannot be the same as current password.");
      return;
    }

    if (!token || !user) {
      setError("Authentication session missing. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changeUserPassword(currentPassword, newPassword, token);
      setSuccess("Password changed successfully!");
      setTimeout(() => {
        updateCurrentUser({
          ...user,
          mustChangePassword: res.mustChangePassword,
        });
        if (onSuccess) {
          onSuccess();
        }
      }, 500);
    } catch (err: any) {
      setError(err.message || "Failed to change password. Please verify current password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 p-3" style={{ backgroundColor: "var(--color-bg-page)" }}>
      <div className="zen-card p-4 p-md-5 w-100 shadow-sm" style={{ maxWidth: 480, borderRadius: 12 }}>
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
            style={{
              width: 56,
              height: 56,
              backgroundColor: "#FFF3E0",
              color: "#E65100",
              fontSize: "1.75rem",
            }}
          >
            🔑
          </div>
          <h2 className="h4 fw-bold mb-1" style={{ color: "var(--color-text-main)" }}>
            Password Change Required
          </h2>
          <p className="text-muted small mb-0">
            For security, please set a new password for <strong>{user?.email}</strong> before proceeding.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 mb-3 small" role="alert" data-testid="change-password-error-alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success py-2 px-3 mb-3 small" role="alert" data-testid="change-password-success-alert">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} data-testid="change-password-form">
          <div className="mb-3">
            <label htmlFor="current-password" className="form-label fw-semibold small">
              Current / Temporary Password <span className="text-danger">*</span>
            </label>
            <input
              id="current-password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isSubmitting}
              required
              data-testid="current-password-input"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="new-password" className="form-label fw-semibold small">
              New Password <span className="text-danger">*</span>
            </label>
            <input
              id="new-password"
              type="password"
              className="form-control"
              placeholder="At least 8 chars, 1 uppercase, 1 lowercase, 1 digit"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSubmitting}
              required
              data-testid="new-password-input"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="confirm-password" className="form-label fw-semibold small">
              Confirm New Password <span className="text-danger">*</span>
            </label>
            <input
              id="confirm-password"
              type="password"
              className="form-control"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              required
              data-testid="confirm-password-input"
            />
          </div>

          {/* Password complexity indicators */}
          <div className="p-3 rounded mb-4 border small bg-light" data-testid="password-rules-box">
            <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>
              Password Requirements:
            </div>
            <ul className="list-unstyled mb-0" style={{ fontSize: 12 }}>
              <li className={hasMinLen ? "text-success fw-bold" : "text-muted"}>
                {hasMinLen ? "✓" : "○"} At least 8 characters
              </li>
              <li className={hasUpper ? "text-success fw-bold" : "text-muted"}>
                {hasUpper ? "✓" : "○"} At least one uppercase letter (A-Z)
              </li>
              <li className={hasLower ? "text-success fw-bold" : "text-muted"}>
                {hasLower ? "✓" : "○"} At least one lowercase letter (a-z)
              </li>
              <li className={hasDigit ? "text-success fw-bold" : "text-muted"}>
                {hasDigit ? "✓" : "○"} At least one numeric digit (0-9)
              </li>
              {confirmPassword.length > 0 && (
                <li className={isMatch ? "text-success fw-bold" : "text-danger fw-bold"}>
                  {isMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
                </li>
              )}
            </ul>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary w-50 py-2"
              onClick={logout}
              disabled={isSubmitting}
              data-testid="change-password-cancel-button"
            >
              Sign Out
            </button>
            <button
              type="submit"
              className="btn zen-btn-primary w-50 py-2 fw-semibold"
              disabled={isSubmitting || !hasMinLen || !hasUpper || !hasLower || !hasDigit || !isMatch}
              data-testid="change-password-submit-button"
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
