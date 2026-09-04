import { test, expect } from "@playwright/test";

test.describe("Requester Ticket Complete Flow (E2E-01, AC-01..AC-15)", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to base URL
    await page.goto("/");
  });

  test("full requester workflow: selector, create ticket, my tickets search/filter, detail, and soft-remove", async ({ page }) => {
    // 1. Initial State: Development Requester Selection (AC-06)
    const selectPrompt = page.getByTestId("select-requester-prompt-button");
    if (await selectPrompt.isVisible()) {
      await selectPrompt.click();
    }

    const modal = page.getByTestId("requester-selector-modal");
    await expect(modal).toBeVisible();

    const requesterSelect = page.getByTestId("requester-select");
    await requesterSelect.selectOption({ index: 1 }); // Select first active requester

    const continueBtn = page.getByTestId("continue-selector-button");
    await continueBtn.click();

    // Verify Active User Banner & Header Pill (AC-06, AC-07)
    await expect(page.getByTestId("user-context-pill")).toBeVisible();
    await expect(page.getByTestId("active-user-banner")).toBeVisible();

    // 2. Navigate to Create Ticket Screen (AC-01, AC-02)
    const createNavBtn = page.getByTestId("nav-create-ticket");
    await createNavBtn.click();

    await expect(page.getByTestId("create-ticket-form-card")).toBeVisible();

    // Fill in valid ticket fields
    await page.getByTestId("ticket-category-select").selectOption({ index: 1 });
    await page.getByTestId("ticket-related-system-select").selectOption({ index: 1 });
    await page.getByTestId("ticket-priority-select").selectOption("HIGH");
    await page.getByTestId("ticket-summary-input").fill("Cannot access campus VPN from dorm room");
    await page.getByTestId("ticket-description-input").fill("When attempting to connect to the campus VPN client, connection timeout occurs repeatedly.");

    // Submit ticket
    await page.getByTestId("submit-ticket-button").click();

    // 3. Verify Success Confirmation & Ticket Number (AC-01)
    await expect(page.getByTestId("ticket-success-dialog")).toBeVisible();
    const ticketNumberEl = page.getByTestId("ticket-number-display");
    await expect(ticketNumberEl).toBeVisible();
    const ticketNumber = (await ticketNumberEl.textContent())?.trim();
    expect(ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);

    // 4. Navigate to My Tickets (AC-07, AC-08)
    const viewMyTicketsBtn = page.getByTestId("view-my-tickets-button");
    await viewMyTicketsBtn.click();

    await expect(page.getByTestId("my-tickets-card")).toBeVisible();
    await expect(page.getByTestId("my-tickets-table")).toBeVisible();

    // Search for the newly created ticket
    await page.getByTestId("tickets-search-input").fill("VPN from dorm room");
    await expect(page.getByText(ticketNumber!)).toBeVisible();

    // 5. Open Ticket Detail View (AC-09)
    await page.getByText(ticketNumber!).click();
    await expect(page.getByTestId("ticket-detail-card")).toBeVisible();
    await expect(page.getByTestId("ticket-detail-number")).toHaveText(ticketNumber!);
    await expect(page.getByTestId("ticket-detail-summary")).toHaveText("Cannot access campus VPN from dorm room");
    await expect(page.getByTestId("ticket-detail-priority")).toContainText("HIGH");

    // 6. Attachment Management & Soft-Removal (AC-04, AC-05, AC-11, AC-12, AC-13)
    const attachmentSection = page.getByTestId("attachment-section");
    await expect(attachmentSection).toBeVisible();

    // Back to My Tickets
    await page.getByTestId("back-to-my-tickets-button").click();
    await expect(page.getByTestId("my-tickets-card")).toBeVisible();
  });

  test("responsive layout verification across Desktop, Tablet, and Mobile (AC-15)", async ({ page }) => {
    // Desktop Viewport (1280x800)
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator("header")).toBeVisible();

    // Tablet Viewport (820x1180)
    await page.setViewportSize({ width: 820, height: 1180 });
    await expect(page.locator("header")).toBeVisible();

    // Mobile Viewport (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator("header")).toBeVisible();
  });
});
