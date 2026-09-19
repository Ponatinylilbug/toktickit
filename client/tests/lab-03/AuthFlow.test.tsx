import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

describe("Lab 3 Auth Flow (UI-01, AC-01..03, TEST-AUTH-01..06)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders Sign In button and opens Login Page when unauthenticated", async () => {
    render(<App />);

    const signInBtn = await screen.findByTestId("sign-in-prompt-button");
    expect(signInBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(signInBtn);
    });

    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.getByTestId("login-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-password-input")).toBeInTheDocument();
  });

  it("successfully signs in as IT Staff, updates header with role badge, and clears login view", async () => {
    const mockStaffUser: api.AuthUser = {
      id: 2,
      name: "Alex Triage",
      email: "staff1@toktickit.local",
      role: "IT_STAFF",
      department: "IT Operations",
      isActive: true,
      mustChangePassword: false,
    };

    const loginSpy = vi.spyOn(api, "loginUser").mockResolvedValue({
      token: "mock-jwt-token-staff",
      user: mockStaffUser,
    });

    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockStaffUser);
    vi.spyOn(api, "fetchStaffQueue").mockResolvedValue({
      data: [],
      pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
    });

    render(<App />);

    const signInBtn = await screen.findByTestId("sign-in-prompt-button");
    await act(async () => {
      fireEvent.click(signInBtn);
    });

    // Fill credentials
    const emailInput = screen.getByTestId("login-email-input");
    const passwordInput = screen.getByTestId("login-password-input");
    const submitBtn = screen.getByTestId("login-submit-button");

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: "staff1@toktickit.local" } });
      fireEvent.change(passwordInput, { target: { value: "Password123!" } });
      fireEvent.click(submitBtn);
    });

    expect(loginSpy).toHaveBeenCalledWith("staff1@toktickit.local", "Password123!");

    // Header now reflects logged in IT Staff
    expect(await screen.findByTestId("auth-user-pill")).toBeInTheDocument();
    expect(screen.getByTestId("auth-user-name")).toHaveTextContent("Alex Triage");
    expect(screen.getByTestId("auth-user-role-badge")).toHaveTextContent("IT_STAFF");
    expect(screen.getByTestId("nav-staff-queue")).toBeInTheDocument();

    // Sign out clears state
    const logoutBtn = screen.getByTestId("logout-button");
    await act(async () => {
      fireEvent.click(logoutBtn);
    });

    expect(await screen.findByTestId("sign-in-prompt-button")).toBeInTheDocument();
  });

  it("displays error alert when login fails (invalid credentials or deactivated)", async () => {
    vi.spyOn(api, "loginUser").mockRejectedValue(new Error("This account has been deactivated."));

    render(<App />);

    const signInBtn = await screen.findByTestId("sign-in-prompt-button");
    await act(async () => {
      fireEvent.click(signInBtn);
    });

    const emailInput = screen.getByTestId("login-email-input");
    const passwordInput = screen.getByTestId("login-password-input");
    const submitBtn = screen.getByTestId("login-submit-button");

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: "staff.inactive@toktickit.local" } });
      fireEvent.change(passwordInput, { target: { value: "Password123!" } });
      fireEvent.click(submitBtn);
    });

    expect(await screen.findByTestId("login-error-alert")).toBeInTheDocument();
    expect(screen.getByTestId("login-error-alert")).toHaveTextContent("This account has been deactivated.");
  });
});
