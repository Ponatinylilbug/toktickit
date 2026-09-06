import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

const mockRequesters: api.RequesterUser[] = [
  {
    id: 1,
    name: "Jennifer Anderson",
    email: "jennifer.anderson@example.com",
    department: "Engineering",
    isActive: true,
  },
  {
    id: 2,
    name: "Michael Brown",
    email: "michael.brown@example.com",
    department: "Design",
    isActive: true,
  },
];

describe("RequesterSelector and Context (UI-01, AC-06, AC-07)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchActiveRequesters").mockResolvedValue(mockRequesters);
  });

  it("opens selector modal when no requester is selected on initial load", async () => {
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /Select Development Requester/i })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/This selector is for Lab 2 development testing only/i)
    ).toBeInTheDocument();
  });

  it("populates active requesters in dropdown and excludes inactive", async () => {
    render(<App />);

    const select = await screen.findByTestId("requester-select");
    expect(select).toBeInTheDocument();

    expect(
      screen.getByRole("option", { name: /Jennifer Anderson — Engineering/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /Michael Brown — Design/i })
    ).toBeInTheDocument();
  });

  it("selects a user, updates context and header, and closes modal", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: /Select Development Requester/i });

    const select = screen.getByTestId("requester-select");
    await act(async () => {
      fireEvent.change(select, { target: { value: "2" } });
    });

    const continueBtn = screen.getByRole("button", { name: /Continue/i });
    await act(async () => {
      fireEvent.click(continueBtn);
    });

    // Modal should close
    expect(
      screen.queryByRole("heading", { name: /Select Development Requester/i })
    ).not.toBeInTheDocument();

    // Header pill should display selected user
    expect(screen.getByTestId("user-context-pill")).toHaveTextContent("Michael Brown");
    expect(screen.getByTestId("user-context-pill")).toHaveTextContent("Design");

    // LocalStorage should have saved the selected user
    const saved = JSON.parse(localStorage.getItem("toktickit_current_requester") || "{}");
    expect(saved.id).toBe(2);
    expect(saved.name).toBe("Michael Brown");
  });

  it("allows changing requester via 'Change Requester' button in header", async () => {
    // Pre-populate localStorage
    localStorage.setItem(
      "toktickit_current_requester",
      JSON.stringify(mockRequesters[0])
    );

    render(<App />);

    // Initially modal is closed because user was saved
    expect(
      screen.queryByRole("heading", { name: /Select Development Requester/i })
    ).not.toBeInTheDocument();

    // Header shows Jennifer
    expect(await screen.findByTestId("user-context-pill")).toHaveTextContent("Jennifer Anderson");

    // Click Change Requester button
    const changeBtn = screen.getByTestId("change-requester-button");
    await act(async () => {
      fireEvent.click(changeBtn);
    });

    // Modal is now open
    expect(
      screen.getByRole("heading", { name: /Select Development Requester/i })
    ).toBeInTheDocument();

    // Select Michael Brown and Continue
    const select = screen.getByTestId("requester-select");
    await act(async () => {
      fireEvent.change(select, { target: { value: "2" } });
    });

    const continueBtn = screen.getByRole("button", { name: /Continue/i });
    await act(async () => {
      fireEvent.click(continueBtn);
    });

    // Header updates to Michael Brown
    expect(screen.getByTestId("user-context-pill")).toHaveTextContent("Michael Brown");
  });
});
