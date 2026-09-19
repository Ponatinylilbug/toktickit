import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

describe("Lab 3 Admin User Management Flow (UI-04, TEST-ADMIN-01..04, AC-11..13)", () => {
  const mockAdminUser: api.AuthUser = {
    id: 1,
    name: "System Administrator",
    email: "admin@toktickit.local",
    role: "ADMINISTRATOR",
    department: "IT Administration",
    isActive: true,
    mustChangePassword: false,
  };

  const mockUsersList: api.AuthUser[] = [
    mockAdminUser,
    {
      id: 2,
      name: "Alex Triage",
      email: "staff1@toktickit.local",
      role: "IT_STAFF",
      department: "IT Operations",
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: 6,
      name: "Jennifer Anderson",
      email: "jennifer.anderson@example.com",
      role: "REQUESTER",
      department: "Human Resources",
      isActive: true,
      mustChangePassword: false,
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    localStorage.setItem("toktickit_auth_token", "mock-admin-token");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockAdminUser));
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockAdminUser);
    vi.spyOn(api, "fetchAdminUsers").mockResolvedValue({
      data: mockUsersList,
      pagination: { page: 1, pageSize: 10, totalItems: 3, totalPages: 1 },
    });
  });

  it("renders User Management navigation tab and user list for Administrator", async () => {
    render(<App />);

    const adminNavBtn = await screen.findByTestId("nav-admin-users");
    expect(adminNavBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(adminNavBtn);
    });

    const table = await screen.findByTestId("admin-users-table");
    expect(table).toBeInTheDocument();
    expect(screen.getAllByText("System Administrator").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Alex Triage")).toBeInTheDocument();
    expect(screen.getByText("Jennifer Anderson")).toBeInTheDocument();
  });

  it("opens modal and creates a new user with temporary password", async () => {
    const createSpy = vi.spyOn(api, "createAdminUser").mockResolvedValue({
      user: {
        id: 15,
        name: "Test Engineer",
        email: "test.engineer@toktickit.local",
        role: "IT_STAFF",
        department: "QA",
        isActive: true,
        mustChangePassword: true,
      },
      temporaryPassword: "GeneratedPass123!",
    });

    render(<App />);

    const adminNavBtn = await screen.findByTestId("nav-admin-users");
    await act(async () => {
      fireEvent.click(adminNavBtn);
    });

    await screen.findByTestId("admin-users-table");

    const addBtn = screen.getByTestId("add-user-button");
    await act(async () => {
      fireEvent.click(addBtn);
    });

    expect(await screen.findByTestId("user-modal")).toBeInTheDocument();

    const nameInput = screen.getByTestId("user-name-input");
    const emailInput = screen.getByTestId("user-email-input");
    const roleSelect = screen.getByTestId("user-role-select");
    const deptInput = screen.getByTestId("user-department-input");
    const saveBtn = screen.getByTestId("user-save-button");

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "Test Engineer" } });
      fireEvent.change(emailInput, { target: { value: "test.engineer@toktickit.local" } });
      fireEvent.change(roleSelect, { target: { value: "IT_STAFF" } });
      fireEvent.change(deptInput, { target: { value: "QA" } });
      fireEvent.click(saveBtn);
    });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test Engineer",
        email: "test.engineer@toktickit.local",
        role: "IT_STAFF",
        department: "QA",
      }),
      "mock-admin-token"
    );
  });

  it("triggers password reset modal and shows temporary password", async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    const resetSpy = vi.spyOn(api, "resetAdminUserPassword").mockResolvedValue({
      message: "Password reset successfully",
      temporaryPassword: "TempResetPassword999!",
      mustChangePassword: true,
    });

    render(<App />);

    const adminNavBtn = await screen.findByTestId("nav-admin-users");
    await act(async () => {
      fireEvent.click(adminNavBtn);
    });

    await screen.findByTestId("admin-users-table");

    // Click reset for Alex Triage (id 2)
    const resetBtn = screen.getByTestId("reset-user-button-2");
    await act(async () => {
      fireEvent.click(resetBtn);
    });

    expect(resetSpy).toHaveBeenCalledWith(2, "mock-admin-token");
    expect(await screen.findByTestId("temp-password-display")).toHaveTextContent("TempResetPassword999!");
  });
});
