# Lab 2 UI Specification: Zen Green Design System & Responsive Guidelines

## 1. Design Tokens & Color Palette

The interface adheres strictly to the **Zen Green Theme** palette:

| Token Name | Hex Code | Purpose / Intended Use |
| :--- | :--- | :--- |
| `--color-primary-green` | `#006B3C` | App header, primary action buttons, main page titles. |
| `--color-secondary-green` | `#0B7A46` | Active navigation tabs, focus rings, link text, button hover states. |
| `--color-pale-green` | `#EAF6EF` | Selected table rows, subtle callout backgrounds, success badges. |
| `--color-page-bg` | `#F5F7F6` | Global page body background. |
| `--color-surface-card` | `#FFFFFF` | Card containers, modal boxes, and data tables. |
| `--color-card-border` | `#E0E5E2` | Subtle container borders and divider lines. |
| `--color-text-main` | `#1F2923` | High-contrast dark charcoal-green for readable body typography. |
| `--color-text-muted` | `#59655E` | Secondary captions, timestamps, and helper text. |
| `--color-input-bg` | `#FFFFFF` | Background for editable form inputs and dropdowns. |
| `--color-readonly-bg` | `#F0F3F1` | Background for disabled/read-only field containers. |
| `--color-border-input` | `#CCD4CF` | Neutral borders for inputs and form controls. |
| `--color-error` | `#C92A2A` | Validation error text, red asterisks, error alert banners. |
| `--color-error-bg` | `#FFF5F5` | Background for error callouts and invalid input borders (`#E03131`). |
| `--color-warning` | `#D97706` | Medium/High priority badges and alert banners. |
| `--color-warning-bg` | `#FEF3C7` | Background for warning callouts. |
| `--color-success` | `#2B8A3E` | Success badges, creation confirmations. |
| `--color-success-bg` | `#EBFBEE` | Background for success toast/banners. |

---

## 2. Typography, Spacing & Layout System

- **Font Family:** System Font Stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`).
- **Base Font Size:** `16px` (1rem); Headings: `h1` = `24px` (1.5rem), `h2` = `20px` (1.25rem), `h3` = `18px` (1.125rem).
- **Spacing Scale:** Standard 4px grid (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`).
- **Card Containers:** `border-radius: 8px`, `box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05)`, `padding: 20px` to `24px`.

---

## 3. Component Hierarchy & Button Guidelines

### 3.1 Button Variants
1. **Primary Button:** Background `#006B3C`, text white, hover `#0B7A46`. Used for *Submit Ticket*, *Continue*, *Add Attachment*.
2. **Secondary Button:** Background white, border `1px solid #006B3C`, text `#006B3C`, hover `#EAF6EF`. Used for *Back to My Tickets*, *Cancel*.
3. **Destructive Button:** Background `#C92A2A`, text white, hover `#A51D24`. Used for *Confirm Remove Attachment*.
4. **Disabled State:** Opacity `0.55`, cursor `not-allowed`, background `#D1D5DB`, border `#D1D5DB`, text `#6B7280`.
5. **Busy / Loading State:** Button retains layout, displays spinner icon with text *"Submitting..."* or *"Loading..."*, and ignores repeated clicks.

### 3.2 Form Inputs & Controls
- **Labels:** Positioned strictly above controls with `font-weight: 600`, `font-size: 14px`.
- **Required Fields:** Marked with red asterisk `*` in label (`color: #C92A2A`).
- **Input Height:** Uniform `40px` height for single-line inputs and dropdowns.
- **Textarea (Description):** Minimum height `120px`, vertical-only resize allowed without breaking card bounds.
- **Validation Messages:** Rendered immediately below the invalid control in `#C92A2A` with `font-size: 13px`.
- **Focus Indicators:** 2px outline / box-shadow `#0B7A46` on keyboard/mouse focus.

---

## 4. Screen Specifications

### 4.1 Application Shell & Navigation
- **Header Bar:** Zen Green background (`#006B3C`), White logo/title **TokTickIT**, Navigation links (*My Tickets*, *Create Ticket*).
- **Active Navigation Indicator:** Subtle pale green underline or badge on current screen.
- **User Context Pill:** Right corner displays current Requester name (e.g. `👤 Jennifer Anderson (Requester)`) with a clickable link/button to **[Change Requester]**.

### 4.2 Development Requester Selection Screen
- **Container:** Centered modal/card (`max-width: 540px`).
- **Header:** Title *"Select Development Requester"* with informational note: *"This selector is for Lab 2 development testing only. Authentication will arrive in Lab 3."*
- **Controls:** Dropdown listing all active requesters, *Continue* primary button.
- **States:**
  - *Loading:* Spinner while fetching active users from `/api/requesters`.
  - *Empty State:* Warning card if no active users are seeded.
  - *Failure State:* Alert banner with Retry button if backend is offline.

### 4.3 Create Ticket Screen
- **Layout:** Card grid with grouped sections:
  1. *Requester Info (Read-Only):* Name & Department automatically populated from active context.
  2. *Classification:* Category dropdown, Related System dropdown, Requested Priority dropdown (`Low`, `Medium`, `High`, `Urgent`).
  3. *Issue Content:* Ticket Summary input (5–100 chars), Description textarea (10–2000 chars).
  4. *Attachments Dropzone/Picker:* File selector supporting JPG, PNG, WEBP, PDF (≤ 5MB, max 5 files). List of pending files with remove buttons.
  5. *Action Bar:* Primary *Submit Ticket* button and Secondary *Cancel* button.
- **States:**
  - *Validation Failure:* Field-level red borders and text; form retains user input.
  - *Submitting:* Submit button disabled with spinner.
  - *Success State:* Confirmation modal/banner showing generated `Ticket Number` (e.g., `TKT-2026-001234`) with buttons to *View Ticket* or *Back to My Tickets*.

### 4.4 My Tickets Screen
- **Header Section:** Title *"My Tickets"*, subtitle showing ticket count, and primary button `+ Create Ticket`.
- **Filter & Search Bar:**
  - Search input (query by ticket number, summary, or description).
  - Category dropdown filter.
  - Priority dropdown filter.
  - Status dropdown filter.
  - *Clear Filters* tertiary button.
- **Ticket Table (Desktop/Tablet):**
  - Columns: `Ticket No.`, `Created Date`, `Summary`, `Category`, `Requested Priority`, `Current Status`, `Last Updated`.
  - Row click navigates to Ticket Detail.
- **Ticket Cards (Mobile):**
  - Compact vertical cards displaying Ticket No, Summary, Badges, and Date.
- **Badges:**
  - *Status:* `New` (Blue/Green tint).
  - *Priority:* `Low` (Gray/Green), `Medium` (Amber/Yellow), `High` (Orange), `Urgent` (Red).
- **Pagination Bar:** `Previous`, Page numbers (`1`, `2`...), `Next`, and item count summary (e.g., *"Showing 1 to 10 of 24 tickets"*).
- **States:**
  - *Empty State:* Friendly illustration/message when user has 0 tickets.
  - *No Results State:* Message when filters return 0 matches with *Reset Filters* button.

### 4.5 Requester Ticket Detail Screen
- **Header:** Back button `← Back to My Tickets`, Ticket Number heading, Status & Priority badges.
- **Ticket Info Grid (Read-Only):**
  - Cards displaying Requester Name, Created Date, Category, Related System, Summary, and Description.
- **Attachments Section:**
  - Active Attachments list with file name, file size (formatted KB/MB), upload timestamp, Download action, and Soft-Remove action.
  - Soft-Removed Attachments list with "(Removed)" indicator, removal timestamp, and recorded reason (download action disabled).
  - *Upload Attachment* button (disabled if active attachments count reaches 5).
- **Soft-Removal Modal:**
  - Dialog prompting for removal confirmation and mandatory *Removal Reason* text input (min 3 chars).

---

## 5. Responsive Behavior Breakpoints

| Viewport | Screen Width | Behavior |
| :--- | :--- | :--- |
| **Desktop** | `≥ 992px` | Multi-column form layout; full tabular grid for My Tickets; centered content `max-width: 1200px`. |
| **Tablet** | `768px – 991px` | 2-column form layout; horizontally scrollable table with preserved sticky header or compact columns. |
| **Mobile** | `< 768px` | 1-column vertically stacked fields; My Tickets switches to touch-friendly card list; sticky bottom action bar. |

---

## 6. Accessibility & Usability Standards

- All interactive controls have accessible names (`aria-label`, associated `<label>`).
- Keyboard tab order follows logical visual layout.
- Color contrast meets WCAG 2.1 AA standard (4.5:1 ratio for normal text).
- Information is never conveyed through color alone; badges include explicit text labels.

---

## 7. Visual Inspection Checklist & Screenshot Deliverables

- [ ] Header renders `#006B3C` with active Requester name and navigation links.
- [ ] Requester Selector displays active users and navigates on selection.
- [ ] Create Ticket shows red asterisks for mandatory fields and validates input inline.
- [ ] File picker restricts selection to JPG, PNG, WEBP, PDF ≤ 5MB and enforces 5 file limit.
- [ ] My Tickets displays data table with working search, filters, sorting, and pagination.
- [ ] My Tickets data updates and isolates records when switching between Requester A and B.
- [ ] Ticket Detail renders all ticket fields as read-only.
- [ ] Attachment download streams active files; removed attachments show reason and block download.
- [ ] Verified at Desktop (1280px), Tablet (820px), and Mobile (375px) without layout breaking or unwanted horizontal scroll.
