# Lab 4 UI Specification: TokTickIT Actions Taken, Dashboards, and Hardening

## 1. Overview and Design Philosophy
TokTickIT Sprint 4 preserves and polishes the **Zen Green** design language introduced in Lab 2 and expanded in Lab 3. The UI components are built to feel responsive, clear, accessible, and operationally focused. Every dashboard and ticket action provides immediate visual cues, robust error boundaries, and WCAG-compliant keyboard focus.

---

## 2. Zen Green Theme Design Tokens

```css
:root {
  /* Color Palette */
  --zen-primary: #15803d;         /* Forest green primary brand */
  --zen-primary-hover: #166534;   /* Darker hover state */
  --zen-primary-light: #dcfce7;   /* Pale mint highlight */
  --zen-surface: #ffffff;         /* Elevated surfaces */
  --zen-background: #f8fafc;      /* Neutral cool background */
  --zen-text-main: #0f172a;       /* Slate 900 primary text */
  --zen-text-muted: #64748b;      /* Slate 500 secondary text */
  --zen-border: #e2e8f0;          /* Subtle dividing border */

  /* Status Colors */
  --status-new: #3b82f6;          /* Blue */
  --status-open: #0284c7;         /* Sky */
  --status-in-progress: #d97706;  /* Amber */
  --status-waiting: #8b5cf6;      /* Violet */
  --status-resolved: #16a34a;     /* Green */
  --status-closed: #64748b;       /* Gray */
  --status-cancelled: #dc2626;    /* Red */

  /* Spacing and Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
}
```

---

## 3. Screen Specifications

### 3.1 IT Staff Dashboard (`UI-STAFF-DASHBOARD`)
- **Navigation:** Top navigation bar displays active "Dashboard" tab, "Ticket Queue", "Create Ticket", and User Profile menu.
- **Header Section:**
  - Welcome greeting: `Welcome back, [Staff Name]!` with subtitle `Here's what's happening with your queue today.`
  - Refresh button in top-right with rotating indicator during data re-fetch.
- **Metric Cards Row (5 Cards):**
  1. **New:** Count of unassigned new tickets. Subtitle: comparison or label.
  2. **Open:** Count of open tickets.
  3. **In Progress:** Count of actively serviced tickets.
  4. **Waiting for Requester:** Count of tickets awaiting customer input.
  5. **My Assigned:** Count of active tickets owned by the authenticated staff member.
  - *Interaction:* Clicking any metric card drills down to the Staff Ticket Queue pre-filtered by that status or assignment.
- **Content Grid (2 Columns on Desktop):**
  - **Left Column (My Recent Tickets):**
    - Clean table displaying Ticket Number, Summary, Status Badge, and Formatted Timestamp.
    - "View all" link in the card header navigating to `/staff/tickets`.
    - Clicking a ticket row opens that ticket's Detail view.
  - **Right Column (Quick Actions):**
    - "Create Ticket" card with icon (`+`) and subtitle `Submit a new request`.
    - "Search Tickets" card with icon (`🔍`) navigating to Queue with search focus.
    - "My Queue" card with icon (`📋`) filtering for `ownerId = currentUserId`.

---

### 3.2 Requester Dashboard (`UI-REQUESTER-DASHBOARD`)
- **Navigation:** Top navigation displays active "Dashboard" or "My Tickets", "Create Ticket", and User Profile.
- **Header Section:**
  - Welcome greeting: `Welcome, [Requester Name]!` with subtitle `Here's the latest on your requests.`
- **Metric Cards Row (4 Cards):**
  1. **My Open Tickets:** Total count of active tickets.
  2. **In Progress:** Count of user's tickets currently being resolved.
  3. **Resolved:** Count of user's recently resolved tickets.
  4. **Closed:** Count of completed tickets.
  - *Interaction:* Clicking any card drills down to the "My Tickets" list with corresponding filter.
- **Content Grid:**
  - **Left Column (My Recent Tickets):**
    - List of recent tickets owned exclusively by the authenticated requester.
    - Status badges matching Zen Green conventions.
    - "View all" link navigating to full `My Tickets` list.
  - **Right Column (Quick Actions):**
    - "Create Ticket" button card.
    - "View My Tickets" button card.

---

### 3.3 Actions Taken on Ticket Detail (`UI-ACTIONS-TAKEN`)
- **Location:** Positioned as a dedicated tab or prominent card section below Ticket Details on `StaffTicketDetail` and `RequesterTicketDetail`.
- **Header Controls:**
  - Title: `Actions Taken` with badge indicating total count `([count])`.
  - For IT Staff and Administrators: Prominent "+ Add Action" button (primary Zen Green).
  - For Requesters: View-only indicator; no "+ Add Action" or "Edit" buttons are rendered.
- **Action Items Table / List:**
  - **Columns:**
    1. **Date & Time:** Formatted timestamp (e.g. `May 12, 2026, 09:14 AM`).
    2. **Performed By:** Name of the IT Staff member who logged the action.
    3. **Description:** Clear textual narrative of troubleshooting or steps taken.
    4. **Result:** Outcome of the action (e.g. "Battery firmware updated successfully").
    5. **Follow-Up:** Badge indicating `Required` (Amber) or `None` (Gray). If required, renders the `Follow-up Note` text below.
    6. **Attachment Notes:** Text note indicating related files or diagnostic logs.
    7. **Actions (Staff/Admin only):** "Edit" button to open the action modal.
- **Add / Edit Action Modal Dialog:**
  - Accessible modal with keyboard `Escape` trap and background overlay.
  - Fields:
    - `Action Date/Time`: Defaults to current time; customizable.
    - `Action Description` (Textarea, required): Minimum 5 characters.
    - `Result` (Textarea, required): Minimum 3 characters.
    - `Follow-Up Required?` (Checkbox toggle).
    - `Follow-up Note` (Textarea): Conditionally required when checkbox is checked. Displays inline validation error if left empty.
    - `Attachment Notes` (Input): Optional reference string.
  - Buttons: "Cancel" (secondary) and "Save Action" (primary, with spinner while saving).

---

### 3.4 Ticket Workflow and Resolution Feedback (`UI-WORKFLOW`)
- **Status Change Control:**
  - Dropdown or button group displaying only *permitted transitions* based on current status and user role.
  - For Requesters: A banner or button allows indicating "Problem Appears Resolved (Advisory)". Clarifies with helper text that IT Staff will formally confirm and resolve.
  - For IT Staff: A formal "Resolve Ticket" button transitions status to `RESOLVED`, triggering resolution summary feedback.
- **Safe Failure & Conflict UI:**
  - In case of a 409 Conflict, displays an alert: `Conflict: This ticket was updated by another user. Please refresh and review changes before retrying.`
  - Retains user-entered form data so work is not lost.

---

## 4. Responsive Breakpoint Behavior

| Viewport | Width | Layout Adjustments |
| :--- | :--- | :--- |
| **Desktop** | ≥ 992px | Multi-column grid (5 metric cards per row; 2-column content layout for Recent Tickets + Quick Actions). Actions Taken rendered as full data table. |
| **Tablet** | 768px – 991px | 3 metric cards per row with wrap. Content stacks into a single column with full-width cards. Tables remain readable without horizontal cutoff. |
| **Mobile** | < 768px | 2 metric cards per row. Quick Actions stack vertically. Actions Taken render as responsive structured cards instead of a wide table. Touch targets minimum 44px × 44px. |

---

## 5. Visual and Accessibility Checklist
- [x] All interactive controls feature visible `:focus-visible` outline (`#15803d` 2px ring).
- [x] Text color contrast against background exceeds WCAG AA standard (≥ 4.5:1).
- [x] Status cues are accompanied by text labels, not color alone.
- [x] Screen readers supported with descriptive `aria-label` attributes on icon-only buttons.
- [x] Modals trap focus and close on `Escape` key press.
- [x] Zero horizontal page overflow on viewports down to 320px width.
