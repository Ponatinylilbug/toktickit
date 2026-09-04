import React, { useState } from "react";
import { checkSystem, Category } from "./api.js";
import { RequesterProvider, useRequester } from "./context/RequesterContext.js";
import Header from "./components/Header.js";
import RequesterSelectorModal from "./components/RequesterSelectorModal.js";

type UiState = "idle" | "loading" | "success" | "error";

function AppContent() {
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { currentRequester } = useRequester();

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

  return (
    <div>
      <Header />
      <RequesterSelectorModal />

      <main className="container py-4" style={{ maxWidth: 800 }}>
        {currentRequester ? (
          <div className="alert alert-light border mb-4 d-flex justify-content-between align-items-center" data-testid="active-user-banner">
            <div>
              <span className="badge bg-success me-2">Active Requester</span>
              <strong>{currentRequester.name}</strong> ({currentRequester.department}) — <code>{currentRequester.email}</code>
            </div>
          </div>
        ) : (
          <div className="alert alert-warning mb-4" data-testid="no-user-banner">
            Please select a Development Requester to begin testing.
          </div>
        )}

        <div className="zen-card p-4">
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
