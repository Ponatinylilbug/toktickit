import React, { useState } from "react";
import { checkSystem, Category, Ticket } from "./api.js";
import { RequesterProvider, useRequester } from "./context/RequesterContext.js";
import Header, { NavTab } from "./components/Header.js";
import RequesterSelectorModal from "./components/RequesterSelectorModal.js";
import CreateTicket from "./components/CreateTicket.js";
import MyTickets from "./components/MyTickets.js";
import RequesterTicketDetail from "./components/RequesterTicketDetail.js";

type UiState = "idle" | "loading" | "success" | "error";

function AppContent() {
  const { currentRequester, openSelector } = useRequester();
  const [activeTab, setActiveTab] = useState<NavTab>(() => (currentRequester ? "my-tickets" : "home"));
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  React.useEffect(() => {
    if (currentRequester && activeTab === "home") {
      setActiveTab("my-tickets");
    }
  }, [currentRequester, activeTab]);

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

  return (
    <div>
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab !== "ticket-detail") setSelectedTicketId(null);
          setActiveTab(tab);
        }}
      />
      <RequesterSelectorModal />

      <main className="container py-4" style={{ maxWidth: 1040 }}>
        {currentRequester ? (
          <div className="alert alert-light border mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2" data-testid="active-user-banner">
            <div>
              <span className="badge bg-success me-2">Active Requester</span>
              <strong>{currentRequester.name}</strong> ({currentRequester.department}) — <code>{currentRequester.email}</code>
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
          <div className="alert alert-warning mb-4 d-flex justify-content-between align-items-center" data-testid="no-user-banner">
            <span>Please select a Development Requester to begin testing.</span>
            <button
              type="button"
              className="btn btn-sm btn-outline-dark"
              onClick={openSelector}
            >
              Select Requester
            </button>
          </div>
        )}

        {activeTab === "my-tickets" && (
          <MyTickets
            onCreateTicketClick={() => {
              setSelectedTicketId(null);
              setActiveTab("create-ticket");
            }}
            onSelectTicket={handleSelectTicket}
          />
        )}

        {activeTab === "ticket-detail" && selectedTicketId && (
          <RequesterTicketDetail
            ticketId={selectedTicketId}
            onBack={handleBackToMyTickets}
          />
        )}

        {activeTab === "create-ticket" && (
          <CreateTicket
            onCancel={handleBackToMyTickets}
            onTicketCreated={(ticket) => {
              setSelectedTicketId(ticket.id);
            }}
          />
        )}

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
    <RequesterProvider>
      <AppContent />
    </RequesterProvider>
  );
}

