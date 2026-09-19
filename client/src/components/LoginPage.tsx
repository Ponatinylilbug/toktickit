import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";

interface LoginPageProps {
  onSuccess?: () => void;
}

export default function LoginPage({ onSuccess }: LoginPageProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 p-3" style={{ backgroundColor: "var(--color-bg-page)" }}>
      <div className="zen-card p-4 p-md-5 w-100 shadow-sm" style={{ maxWidth: 460, borderRadius: 12 }}>
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
            style={{
              width: 56,
              height: 56,
              backgroundColor: "var(--color-pale-green)",
              color: "var(--color-primary)",
              fontSize: "1.75rem",
            }}
          >
            🛡️
          </div>
          <h2 className="h4 fw-bold mb-1" style={{ color: "var(--color-primary)" }}>
            TokTickIT Portal
          </h2>
          <p className="text-muted small mb-0">Sign in with your organizational account</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 mb-3 small" role="alert" data-testid="login-error-alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} data-testid="login-form">
          <div className="mb-3">
            <label htmlFor="login-email" className="form-label fw-semibold small">
              Email Address <span className="text-danger">*</span>
            </label>
            <input
              id="login-email"
              type="email"
              className="form-control"
              placeholder="user@toktickit.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
              data-testid="login-email-input"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="login-password" className="form-label fw-semibold small">
              Password <span className="text-danger">*</span>
            </label>
            <input
              id="login-password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              required
              data-testid="login-password-input"
            />
          </div>

          <button
            type="submit"
            className="btn zen-btn-primary w-100 py-2 fw-semibold"
            disabled={isSubmitting}
            data-testid="login-submit-button"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Demo Credentials Helper Pill Bar */}
        <div className="mt-4 pt-3 border-top">
          <p className="text-muted small fw-semibold mb-2" style={{ fontSize: 12 }}>
            Demo Accounts for Testing:
          </p>
          <div className="d-flex flex-wrap gap-1">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary py-0 px-2"
              style={{ fontSize: 11 }}
              onClick={() => handleFillDemo("admin@toktickit.local", "Password123!")}
              data-testid="demo-admin-btn"
            >
              Admin
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary py-0 px-2"
              style={{ fontSize: 11 }}
              onClick={() => handleFillDemo("staff1@toktickit.local", "Password123!")}
              data-testid="demo-staff-btn"
            >
              IT Staff
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary py-0 px-2"
              style={{ fontSize: 11 }}
              onClick={() => handleFillDemo("jennifer.anderson@example.com", "Password123!")}
              data-testid="demo-requester-btn"
            >
              Requester
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary py-0 px-2"
              style={{ fontSize: 11 }}
              onClick={() => handleFillDemo("newuser@toktickit.local", "InitialPassword123!")}
              data-testid="demo-newuser-btn"
            >
              New User (Password Reset)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
