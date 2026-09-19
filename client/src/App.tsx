import React, { useState, useEffect } from "react";
import { checkSystem, Category, Ticket, StaffTicket } from "./api.js";
import { RequesterProvider, useRequester } from "./context/RequesterContext.js";
import { AuthProvider, useAuth } from "./context/AuthContext.js";
import Header, { NavTab } from "./components/Header.js";
import RequesterSelectorModal from "./components/RequesterSelectorModal.js";
import CreateTicket from "./components/CreateTicket.js";
import MyTickets from "./components/MyTickets.js";
import RequesterTicketDetail from "./components/RequesterTicketDetail.js";
import LoginPage from "./components/LoginPage.js";
import ChangePasswordPage from "./components/ChangePasswordPage.js";
import StaffTicketQueue from "./components/StaffTicketQueue.js";
import StaffTicketDetail from "./components/StaffTicketDetail.js";
import UserManagement from "./components/UserManagement.js";

type UiState = "idle" | "loading" | "success" | "error";

function AppContent() {
  const { currentRequester, openSelector } = useRequester();
  const { user: authUser, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    try {
      const authUserStr = localStorage.getItem("toktickit_auth_user");
      if (authUserStr) {
        const u = JSON.parse(authUserStr);
        if (u.role === "IT_STAFF" || u.role === "ADMINISTRATOR") {
          return "staff-queue";
        }
      }
      if (localStorage.getItem("toktickit_current_requester")) {
        return "my-tickets";
      }
    } catch {}
    return "home";
  });

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [ticketRefreshCounter, setTicketRefreshCounter] = useState<number>(0);

  // Synchronize tab on role change or login
  useEffect(() => {
    if (authUser) {
      if (authUser.role === "IT_STAFF" || authUser.role === "ADMINISTRATOR") {
        if (activeTab === "home" || activeTab === "my-tickets" || activeTab === "create-ticket") {
          setActiveTab("staff-queue");
        }
      } else if (authUser.role === "REQUESTER") {
        if (activeTab === "home" || activeTab === "staff-queue" || activeTab === "admin-users") {
          setActiveTab("my-tickets");
        }
      }
    } else if (currentRequester && activeTab === "home") {
      setActiveTab("my-tickets");
    }
  }, [authUser, currentRequester, activeTab]);

  async function handleCheck() {
    setState("loading");
    setErrorMessage("");
    try {
      const res = await checkSystem();
      setCategories(res.categories);
      setState("success");
    } catch (err: any) {
      setErrorMessage(err?.message || "API is unavailable");
      setState("error");
    }
  }

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
    setActiveTab("ticket-detail");
  };

  const handleBackToMyTickets = () => {
    setSelectedTicketId(null);
    setActiveTab("my-tickets");
  };

  const handleSelectStaffTicket = (ticket: StaffTicket) => {
    setSelectedTicketId(ticket.id);
    setActiveTab("staff-detail");
  };

  const handleBackToStaffQueue = () => {
    setSelectedTicketId(null);
    setActiveTab("staff-queue");
  };

  // If user is required to change password, lock into ChangePasswordPage
  if (authUser?.mustChangePassword) {
    return <ChangePasswordPage />;
  }

  // If login modal requested
  if (showLoginModal) {
    return (
      <div>
        <Header
          activeTab={activeTab}
          onTabChange={(tab) => {
            setShowLoginModal(false);
            setActiveTab(tab);
          }}
          onShowLogin={() => setShowLoginModal(true)}
        />
        <div className="container py-4 text-center">
          <button
            type="button"
            className="btn btn-sm btn-link mb-3"
            onClick={() => setShowLoginModal(false)}
          >
            ← Back to Application
          </button>
          <LoginPage onSuccess={() => setShowLoginModal(false)} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab !== "ticket-detail" && tab !== "staff-detail") {
            setSelectedTicketId(null);
          }
          setActiveTab(tab);
        }}
        onShowLogin={() => setShowLoginModal(true)}
      />
      <RequesterSelectorModal />

      <main className="container py-4" style={{ maxWidth: 1140 }}>
        {/* Banner for unauthenticated mode */}
        {!authUser && (
          <>
            {currentRequester ? (
              <div
                className="alert alert-light border mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2"
                data-testid="active-user-banner"
              >
                <div>
                  <span className="badge bg-success me-2">Active Requester</span>
                  <span data-testid="active-requester-info">
                    <strong>{currentRequester.name}</strong> ({currentRequester.department}) —{" "}
                    <code>{currentRequester.email}</code>
                  </span>
                </div>
                <div className="d-flex gap-2">
                  {activeTab !== "my-tickets" && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success"
                      onClick={handleBackToMyTickets}
                      data-testid="banner-my-tickets-button"
                    >
                      My Tickets
                    </button>
                  )}
                  {activeTab !== "create-ticket" && (
                    <button
                      type="button"
                      className="btn btn-sm zen-btn-primary"
                      onClick={() => {
                        setSelectedTicketId(null);
                        setActiveTab("create-ticket");
                      }}
                      data-testid="banner-create-ticket-button"
                    >
                      + Create Ticket
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="alert alert-warning mb-4 d-flex justify-content-between align-items-center"
                data-testid="no-user-banner"
              >
                <span>Please select a Development Requester or Sign In with an organizational account.</span>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark"
                    onClick={openSelector}
                    data-testid="select-requester-prompt-button"
                  >
                    Select Requester
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm zen-btn-primary"
                    onClick={() => setShowLoginModal(true)}
                    data-testid="sign-in-prompt-button"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab 1: Staff Ticket Queue */}
        {activeTab === "staff-queue" && (
          <StaffTicketQueue onSelectTicket={handleSelectStaffTicket} />
        )}

        {/* Tab 2: Staff Ticket Detail */}
        {activeTab === "staff-detail" && selectedTicketId && (
          <StaffTicketDetail ticketId={selectedTicketId} onBack={handleBackToStaffQueue} />
        )}

        {/* Tab 3: Admin User Management */}
        {activeTab === "admin-users" && <UserManagement />}

        {/* Tab 4: Requester My Tickets */}
        {activeTab === "my-tickets" && (
          <MyTickets
            key={ticketRefreshCounter}
            onCreateTicketClick={() => {
              setSelectedTicketId(null);
              setActiveTab("create-ticket");
            }}
            onSelectTicket={handleSelectTicket}
          />
        )}

        {/* Tab 5: Requester Ticket Detail */}
        {activeTab === "ticket-detail" && selectedTicketId && (
          <RequesterTicketDetail
            ticketId={selectedTicketId}
            onBack={handleBackToMyTickets}
          />
        )}

        {/* Tab 6: Requester Create Ticket */}
        {activeTab === "create-ticket" && (
          <CreateTicket
            onCancel={handleBackToMyTickets}
            onTicketCreated={(ticket) => {
              setSelectedTicketId(ticket.id);
              setTicketRefreshCounter((c) => c + 1);
            }}
          />
        )}

        {/* Tab 7: Diagnostics (Lab 1) */}
        {activeTab === "home" && (
          <div className="zen-card p-4 mx-auto" style={{ maxWidth: 840 }} data-testid="diagnostics-panel">
            <h1 className="h4 mb-3" style={{ color: "var(--color-primary-green)" }}>
              Service Desk <span className="text-secondary fw-normal fs-6">| System Diagnostics</span>
            </h1>

            <button className="btn zen-btn-primary" onClick={handleCheck} disabled={state === "loading"}>
              {state === "loading" ? "Loading…" : "Check System"}
            </button>

            {state === "success" && (
              <div className="mt-4">
                <div className="alert alert-success fw-bold" data-testid="status-online">
                  Online
                </div>
                <h2 className="h5 mt-3">Categories</h2>
                <ul className="list-group">
                  {categories.map((cat) => (
                    <li key={cat.id} className="list-group-item">
                      {cat.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {state === "error" && (
              <div className="mt-4">
                <div className="alert alert-danger fw-bold" data-testid="status-offline">
                  Offline
                </div>
                <p className="text-danger">{errorMessage}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RequesterProvider>
        <AppContent />
      </RequesterProvider>
    </AuthProvider>
  );
}
