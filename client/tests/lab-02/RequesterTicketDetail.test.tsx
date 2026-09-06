import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import RequesterTicketDetail from "../../src/components/RequesterTicketDetail.js";
import * as api from "../../src/api.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";

const mockRequester: api.RequesterUser = {
  id: 1,
  name: "Jennifer Anderson",
  email: "jennifer.anderson@example.com",
  department: "Engineering",
  isActive: true,
};

const mockTicketDetail: api.Ticket = {
  id: 101,
  ticketNumber: "TKT-2026-000101",
  summary: "Laptop battery drains quickly after update",
  description: "Detailed description of battery drainage issue with steps taken.",
  requestedPriority: "MEDIUM",
  currentStatus: "NEW",
  requesterId: 1,
  categoryId: 2,
  relatedSystemId: 7,
  createdAt: new Date("2026-09-03T10:00:00Z").toISOString(),
  updatedAt: new Date("2026-09-03T10:00:00Z").toISOString(),
  requester: mockRequester,
  category: { id: 2, name: "Hardware" },
  relatedSystem: { id: 7, name: "Corporate Laptop" },
  attachments: [
    {
      id: 501,
      ticketId: 101,
      fileName: "501_battery_log.png",
      originalName: "battery_log.png",
      fileSize: 150000,
      mimeType: "image/png",
      isRemoved: false,
      createdAt: new Date("2026-09-03T10:00:00Z").toISOString(),
    },
  ],
};

describe("RequesterTicketDetail Component (UI-05, AC-09, AC-10, AC-12)", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("toktickit_current_requester", JSON.stringify(mockRequester));
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchActiveRequesters").mockResolvedValue([mockRequester]);
  });

  it("renders read-only ticket details, classification, and status badges (AC-09)", async () => {
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValue(mockTicketDetail);

    render(
      <RequesterProvider>
        <RequesterTicketDetail ticketId={101} />
      </RequesterProvider>
    );

    expect(await screen.findByTestId("ticket-detail-number")).toHaveTextContent("TKT-2026-000101");
    expect(screen.getByTestId("ticket-detail-summary")).toHaveTextContent("Laptop battery drains quickly after update");
    expect(screen.getByTestId("ticket-detail-description")).toHaveTextContent("Detailed description of battery drainage issue");
    expect(screen.getByTestId("ticket-category-name")).toHaveTextContent("Hardware");
    expect(screen.getByTestId("ticket-system-name")).toHaveTextContent("Corporate Laptop");
    expect(screen.getByTestId("ticket-detail-priority")).toHaveTextContent(/MEDIUM Priority/i);
    expect(screen.getByTestId("ticket-detail-status")).toHaveTextContent("NEW");
  });

  it("opens soft-remove modal, enforces reason, and triggers remove (AC-12, UI-05)", async () => {
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValue(mockTicketDetail);
    const softRemoveSpy = vi.spyOn(api, "softRemoveAttachment").mockResolvedValue({
      ...mockTicketDetail.attachments![0],
      isRemoved: true,
      removalReason: "Uploaded wrong screenshot",
      removedAt: new Date().toISOString(),
    });

    render(
      <RequesterProvider>
        <RequesterTicketDetail ticketId={101} />
      </RequesterProvider>
    );

    const removeBtn = await screen.findByTestId("remove-button-501");
    await act(async () => {
      fireEvent.click(removeBtn);
    });

    expect(await screen.findByTestId("soft-remove-modal")).toBeInTheDocument();

    // Try submitting without reason
    const confirmBtn = screen.getByTestId("confirm-remove-button");
    const reasonInput = screen.getByTestId("removal-reason-input");

    await act(async () => {
      fireEvent.change(reasonInput, { target: { value: "Uploaded wrong screenshot" } });
    });

    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(softRemoveSpy).toHaveBeenCalledWith(501, "Uploaded wrong screenshot", 1);
  });

  it("renders 403 Forbidden alert when access is rejected (AC-10)", async () => {
    const forbiddenError = new Error("Forbidden: You do not have access to this ticket.");
    (forbiddenError as any).status = 403;
    vi.spyOn(api, "fetchTicketDetail").mockRejectedValue(forbiddenError);

    render(
      <RequesterProvider>
        <RequesterTicketDetail ticketId={999} />
      </RequesterProvider>
    );

    expect(await screen.findByTestId("ticket-forbidden-error")).toBeInTheDocument();
    expect(screen.getByText(/Access Denied \(403 Forbidden\)/i)).toBeInTheDocument();
  });
});
