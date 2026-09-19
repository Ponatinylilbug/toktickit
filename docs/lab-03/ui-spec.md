# Lab 3 UI Specification: TokTickIT Users, Roles, IT Staff & Admin

## 1. Design System Foundations (Zen Green)

TokTickIT implements the refined **Zen Green Design System**, emphasizing visual clarity, accessible contrast, calm aesthetics, and high information density suited for IT workflows.

### 1.1 Color Tokens
| Token | Hex Value | Usage |
|---|---|---|
| `--color-primary` | `#006B3C` | App header, primary CTAs, main titles |
| `--color-primary-hover` | `#00542F` | Interactive hover states on primary components |
| `--color-primary-focus` | `#0B7A46` | Active tab indicators, focus rings |
| `--color-pale-green` | `#EAF6EF` | Row highlight, badge backgrounds, card headers |
| `--color-bg-page` | `#F5F7F6` | Main screen body background |
| `--color-surface` | `#FFFFFF` | Form cards, queue data tables, modal dialogs |
| `--color-border` | `#E0E5E2` | Dividers, card boundaries, table cell borders |
| `--color-text-main` | `#1F2923` | High-contrast body and heading text |
| `--color-text-muted` | `#617368` | Secondary labels, timestamps, metadata |
| `--color-badge-note` | `#FFF8E1` | Internal note container background (amber accent) |
| `--color-badge-note-border` | `#FFE082` | Internal note border |

### 1.2 Status & Priority Badges
- **Status Badges:**
  - `NEW`: Teal (`#E0F2F1`, Text `#00695C`)
  - `OPEN`: Blue (`#E3F2FD`, Text `#1565C0`)
  - `IN_PROGRESS`: Amber (`#FFF3E0`, Text `#E65100`)
  - `WAITING_FOR_REQUESTER`: Purple (`#F3E5F5`, Text `#6A1B9A`)
  - `RESOLVED`: Green (`#E8F5E9`, Text `#2E7D32`)
  - `CLOSED`: Gray (`#ECEFF1`, Text `#37474F`)
  - `CANCELLED`: Red tint (`#FFEBEE`, Text `#C62828`)
- **Priority Badges:**
  - `LOW`: Light Gray / Green
  - `MEDIUM`: Blue
  - `HIGH`: Orange
  - `URGENT`: Red badge with bold text

---

## 2. Screen Specifications & Wireframes

### 2.1 Navigation & Global Header
```
+-----------------------------------------------------------------------------------------------+
| [TokTickIT Logo]   [My Tickets] [Create Ticket] [Staff Queue] [Admin]    Alex (IT Staff) [Log Out] |
+-----------------------------------------------------------------------------------------------+
```
- **Dynamic Tabs based on Role:**
  - `REQUESTER`: "My Tickets", "Create Ticket"
  - `IT_STAFF`: "Ticket Queue"
  - `ADMINISTRATOR`: "Ticket Queue", "User Management"
- **User Widget:** Shows User Name, Role Tag pill, and "Sign Out" button.

### 2.2 Login Screen (`/login`)
```
+-------------------------------------------------------------+
|                                                             |
|                    +----------------------+                 |
|                    |     TokTickIT        |                 |
|                    | IT Support Portal    |                 |
|                    |----------------------|                 |
|                    | Email Address *      |                 |
|                    | [ user@domain.com  ] |                 |
|                    |                      |                 |
|                    | Password *           |                 |
|                    | [ **************** ] |                 |
|                    |                      |                 |
|                    | [ Sign In Button   ] |                 |
|                    |                      |                 |
|                    | [Error Banner Here]  |                 |
|                    +----------------------+                 |
|                                                             |
+-------------------------------------------------------------+
```
- **Validation:** Instant validation on email format and non-empty password.
- **States:** Default, Loading (spinner on button), Error (alert banner with clear message, e.g., "Account is deactivated").

### 2.3 Mandatory Password Change Screen (`/change-password`)
- Displayed automatically if user has `mustChangePassword: true`.
- Requires: Current Password, New Password, Confirm New Password.
- Real-time password requirement checklist (8+ chars, upper, lower, number).
- Cannot bypass or navigate away until successfully completed.

### 2.4 IT Staff Ticket Queue Screen (`/staff/queue`)
```
+-----------------------------------------------------------------------------------------------+
| IT Staff Ticket Queue                                                    [ Refresh ]           |
|-----------------------------------------------------------------------------------------------|
| [Search tickets...       ] [Status: All v] [Priority: All v] [Owner: All v] [Sort: Date v]    |
|-----------------------------------------------------------------------------------------------|
| Ticket #       | Summary              | Requester     | Priority | Status       | Owner       |
|----------------|----------------------|---------------|----------|--------------|-------------|
| TKT-2026-00012 | VPN tunnel drops     | Somchai J.    | [HIGH]   | [IN PROGRESS]| Alex T.     |
| TKT-2026-00013 | New monitor request  | Manee K.      | [LOW]    | [NEW]        | Unassigned  |
|-----------------------------------------------------------------------------------------------|
| Showing 1-10 of 45 tickets                                    [< Prev] [1] [2] [3] [Next >]   |
+-----------------------------------------------------------------------------------------------+
```
- **Desktop (≥992px):** Full multi-column data table with hover row highlights.
- **Tablet (768px-991px):** Horizontally scrollable responsive table with frozen headers.
- **Mobile (<768px):** Stacked Card view showing Ticket #, Status/Priority badges, summary, requester, and owner.

### 2.5 IT Staff Ticket Detail Screen (`/staff/tickets/:id`)
```
+-----------------------------------------------------------------------------------------------+
| [< Back to Queue]  Ticket TKT-2026-00012: VPN tunnel drops                                    |
|-----------------------------------------------------------------------------------------------|
| [ Left Panel: Ticket Details ]              | [ Right Panel: IT Controls ]                    |
| - Requester: Somchai Jaidee (Engineering)   | - Ownership: [ Alex Triage          v] [Claim]  |
| - Category: Network                         | - IT Priority: [ HIGH               v]          |
| - Related System: VPN                       | - Status: [ IN_PROGRESS             v]          |
| - Created: 2026-09-19 08:00                 | - Requester Priority: HIGH                      |
| - Description:                               |-------------------------------------------------|
|   Every 10 mins disconnected...             | [ Quick Actions ]                               |
| - Attachments:                              | [ Save Changes ]                                |
|   [file_log.txt (24 KB)]                    |                                                 |
|-----------------------------------------------------------------------------------------------|
| [ Communication Tabs: (•) Public Comments (3)   ( ) Internal Notes (Staff Only) (1) ]         |
|-----------------------------------------------------------------------------------------------|
| [Alex Triage - IT Staff (09:00)]                                                              |
| We updated the gateway. Please retry.                                                         |
|                                                                                               |
| [+ Add Public Comment textarea...] [ Post Comment ]                                           |
+-----------------------------------------------------------------------------------------------+
```

### 2.6 Administrator User Management Screen (`/admin/users`)
```
+-----------------------------------------------------------------------------------------------+
| User Management                                                       [ + Add New User ]      |
|-----------------------------------------------------------------------------------------------|
| [ Search users by name or email...    ]  [ Role Filter: All v ] [ Status: Active v ]          |
|-----------------------------------------------------------------------------------------------|
| Name             | Email                 | Role        | Department    | Status   | Actions   |
|------------------|-----------------------|-------------|---------------|----------|-----------|
| System Admin     | admin@toktickit.local | ADMIN       | IT Admin      | Active   | [Edit]    |
| Alex Triage      | staff1@toktickit.local| IT_STAFF    | IT Ops        | Active   | [Edit]    |
| Somchai Jaidee   | somchai@toktickit.local| REQUESTER  | Engineering   | Active   | [Edit]    |
+-----------------------------------------------------------------------------------------------+
```
- **Add/Edit User Modal:**
  - Name (required), Email (required, valid format), Role (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`), Department, Initial Password (for new user), Active Toggle.
  - Reset Password Action button with confirmation.
  - Safety Guards: Deactivating the last admin shows a red disabled error message.

---

## 3. Responsive Rules & Breakpoints
- **Desktop (≥ 992px):** Wide grid layouts, full tables, side-by-side detail panels.
- **Tablet (768px – 991px):** Two-column form fields, stacked detail panels, scrollable table.
- **Mobile (< 768px):** Single-column stacked layouts, touch-target sizes min 44x44px, table rows converted to card list, full-width action buttons.
