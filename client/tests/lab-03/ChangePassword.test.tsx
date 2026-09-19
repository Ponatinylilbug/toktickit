import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

describe("Lab 3 Mandatory Password Change Flow (UI-02, AC-03, TEST-AUTH-05)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("forces user into ChangePasswordPage when mustChangePassword is true", async () => {
    const mockUser: api.AuthUser = {
      id: 9,
      name: "Casey Newbie",
      email: "newuser@toktickit.local",
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: true,
    };

    localStorage.setItem("toktickit_auth_token", "mock-newbie-token");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockUser));

    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockUser);

    render(<App />);

    expect(await screen.findByTestId("change-password-form")).toBeInTheDocument();
    expect(screen.getByText(/Password Change Required/i)).toBeInTheDocument();
    expect(screen.getByTestId("password-rules-box")).toBeInTheDocument();
  });

  it("validates complexity requirements and completes password change", async () => {
    const mockUser: api.AuthUser = {
      id: 9,
      name: "Casey Newbie",
      email: "newuser@toktickit.local",
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: true,
    };

    localStorage.setItem("toktickit_auth_token", "mock-newbie-token");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockUser));

    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockUser);
    const changePwSpy = vi.spyOn(api, "changeUserPassword").mockResolvedValue({
      message: "Password changed successfully",
      mustChangePassword: false,
    });

    render(<App />);

    await screen.findByTestId("change-password-form");

    const curInput = screen.getByTestId("current-password-input");
    const newInput = screen.getByTestId("new-password-input");
    const confirmInput = screen.getByTestId("confirm-password-input");
    const submitBtn = screen.getByTestId("change-password-submit-button");

    // Invalid weak password
    await act(async () => {
      fireEvent.change(curInput, { target: { value: "InitialPassword123!" } });
      fireEvent.change(newInput, { target: { value: "weak" } });
      fireEvent.change(confirmInput, { target: { value: "weak" } });
    });

    expect(submitBtn).toBeDisabled();

    // Valid strong password
    await act(async () => {
      fireEvent.change(newInput, { target: { value: "NewSecurePass2026!" } });
      fireEvent.change(confirmInput, { target: { value: "NewSecurePass2026!" } });
    });

    expect(submitBtn).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(changePwSpy).toHaveBeenCalledWith(
      "InitialPassword123!",
      "NewSecurePass2026!",
      "mock-newbie-token"
    );

    expect(await screen.findByTestId("change-password-success-alert")).toBeInTheDocument();
  });
});
