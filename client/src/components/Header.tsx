import React from "react";
import { useRequester } from "../context/RequesterContext.js";
import { useAuth } from "../context/AuthContext.js";

export type NavTab =
  | "my-tickets"
  | "create-ticket"
  | "home"
  | "ticket-detail"
  | "staff-queue"
  | "staff-detail"
  | "admin-users";

interface HeaderProps {
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  onShowLogin?: () => void;
}

export default function Header({ activeTab = "my-tickets", onTabChange, onShowLogin }: HeaderProps) {
  const { currentRequester, openSelector } = useRequester();
  const { user: authUser, logout } = useAuth();

  const handleOpen = () => {
    openSelector();
  };

  return (
    <header className="zen-header d-flex justify-content-between align-items-center flex-wrap gap-2">
      <div className="d-flex align-items-center gap-3">
        <span className="zen-header-brand" data-testid="header-brand">
          TokTickIT <span style={{ opacity: 0.85, fontSize: "0.95rem", fontWeight: 400 }}>| IT Service Desk</span>
        </span>

        {/* Dynamic Navigation based on Role */}
        <nav className="d-flex align-items-center gap-2 ms-3">
          {(!authUser || authUser.role === "REQUESTER") && (
            <>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === "my-tickets" ? "btn-light fw-bold" : "btn-outline-light"}`}
                style={{ fontSize: "0.875rem", borderRadius: "6px" }}
                onClick={() => onTabChange?.("my-tickets")}
                data-testid="nav-my-tickets"
              >
                My Tickets
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === "create-ticket" ? "btn-light fw-bold" : "btn-outline-light"}`}
                style={{ fontSize: "0.875rem", borderRadius: "6px" }}
                onClick={() => onTabChange?.("create-ticket")}
                data-testid="nav-create-ticket"
              >
                + Create Ticket
              </button>
            </>
          )}

          {authUser && (authUser.role === "IT_STAFF" || authUser.role === "ADMINISTRATOR") && (
            <button
              type="button"
              className={`btn btn-sm ${activeTab === "staff-queue" || activeTab === "staff-detail" ? "btn-light fw-bold" : "btn-outline-light"}`}
              style={{ fontSize: "0.875rem", borderRadius: "6px" }}
              onClick={() => onTabChange?.("staff-queue")}
              data-testid="nav-staff-queue"
            >
              Ticket Queue
            </button>
          )}

          {authUser && authUser.role === "ADMINISTRATOR" && (
            <button
              type="button"
              className={`btn btn-sm ${activeTab === "admin-users" ? "btn-light fw-bold" : "btn-outline-light"}`}
              style={{ fontSize: "0.875rem", borderRadius: "6px" }}
              onClick={() => onTabChange?.("admin-users")}
              data-testid="nav-admin-users"
            >
              User Management
            </button>
          )}
        </nav>
      </div>

      <div className="d-flex align-items-center gap-2">
        {authUser ? (
          /* Authenticated User Pill */
          <div
            className="zen-user-pill"
            data-testid="auth-user-pill"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: 32,
                height: 32,
                backgroundColor: "var(--color-pale-green)",
                color: "var(--color-primary)",
                fontSize: "1.25rem",
              }}
            >
              👤
            </div>
            <div className="d-flex flex-column">
              <div className="d-flex align-items-center gap-1">
                <span style={{ fontSize: "0.9rem", fontWeight: "600" }} data-testid="auth-user-name">
                  {authUser.name}
                </span>
                <span
                  className={`badge ${
                    authUser.role === "ADMINISTRATOR"
                      ? "bg-danger"
                      : authUser.role === "IT_STAFF"
                      ? "bg-primary"
                      : "bg-secondary"
                  }`}
                  style={{ fontSize: "9px" }}
                  data-testid="auth-user-role-badge"
                >
                  {authUser.role}
                </span>
              </div>
              {authUser.department && (
                <span className="text-muted" style={{ fontSize: "11px" }}>
                  {authUser.department}
                </span>
              )}
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline-danger ms-2"
              style={{ fontSize: "0.8rem", padding: "0.2rem 0.6rem" }}
              onClick={logout}
              data-testid="logout-button"
            >
              Sign Out
            </button>
          </div>
        ) : (
          /* Unauthenticated / Dev Requester Mode */
          <div className="d-flex align-items-center gap-2">
            <div
              className="zen-user-pill"
              data-testid="user-context-pill"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
              onClick={handleOpen}
            >
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle"
                style={{ width: 32, height: 32, backgroundColor: "var(--color-pale-green)", color: "var(--color-primary-green)", fontSize: "1.25rem" }}
              >
                👤
              </div>
              {currentRequester ? (
                <>
                  <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>
                    {currentRequester.name}{currentRequester.department ? ` (${currentRequester.department})` : ""}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary ms-2"
                    style={{ fontSize: "0.8rem", padding: "0.15rem 0.5rem" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openSelector();
                    }}
                    data-testid="change-requester-button"
                  >
                    Change Requester
                  </button>
                </>
              ) : (
                <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>Select Requester</span>
              )}
            </div>

            {onShowLogin && (
              <button
                type="button"
                className="btn btn-sm btn-light fw-semibold ms-1"
                onClick={onShowLogin}
                data-testid="header-sign-in-btn"
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
