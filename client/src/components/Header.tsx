import React from "react";
import { useRequester } from "../context/RequesterContext.js";

interface HeaderProps {
  activeTab?: "home" | "create-ticket";
  onTabChange?: (tab: "home" | "create-ticket") => void;
}

export default function Header({ activeTab = "home", onTabChange }: HeaderProps) {
  const { currentRequester, openSelector } = useRequester();

  return (
    <header className="zen-header d-flex justify-content-between align-items-center flex-wrap gap-2">
      <div className="d-flex align-items-center gap-3">
        <span className="zen-header-brand" data-testid="header-brand">
          TokTickIT <span style={{ opacity: 0.85, fontSize: "0.95rem", fontWeight: 400 }}>| IT Service Desk</span>
        </span>

        {onTabChange && (
          <nav className="d-flex align-items-center gap-1 ms-2">
            <button
              type="button"
              className={`btn btn-sm ${activeTab === "home" ? "btn-light fw-bold" : "btn-outline-light"}`}
              style={{ fontSize: "0.85rem" }}
              onClick={() => onTabChange("home")}
              data-testid="nav-home"
            >
              System Check
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === "create-ticket" ? "btn-light fw-bold" : "btn-outline-light"}`}
              style={{ fontSize: "0.85rem" }}
              onClick={() => onTabChange("create-ticket")}
              data-testid="nav-create-ticket"
            >
              + Create Ticket
            </button>
          </nav>
        )}
      </div>

      <div className="d-flex align-items-center gap-2">
        {currentRequester ? (
          <div className="zen-user-pill" data-testid="user-context-pill">
            <span data-testid="active-requester-info">
              👤 {currentRequester.name} ({currentRequester.department})
            </span>
            <button
              type="button"
              className="btn btn-sm zen-btn-secondary py-0 px-2"
              style={{ fontSize: "0.8rem", borderRadius: "12px" }}
              onClick={openSelector}
              data-testid="change-requester-button"
            >
              Change Requester
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-sm btn-light fw-medium px-3"
            onClick={openSelector}
            data-testid="select-requester-prompt-button"
          >
            Select Requester
          </button>
        )}
      </div>
    </header>
  );
}
