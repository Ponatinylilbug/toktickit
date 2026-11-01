# Lab 4 Sprint Engineering Specification: TokTickIT Actions Taken, Dashboards, and Final Regression

## 1. Sprint Goal
Deliver the final operational increment of TokTickIT under the **Zen Green Theme** by implementing a parent-child **Actions Taken** work-logging system, enforcing strict **Ticket Workflow & Resolution Rules** (resolution gate), providing role-tailored operational **Dashboards** for Requesters and IT Staff, and performing comprehensive **Final Regression & Hardening** across all features delivered in Labs 1 through 3.

---

## 2. Stakeholder Request Interpretation
While TokTickIT currently manages ticket intake, assignment, public comments, and internal notes, IT service-desk leadership requires a formal, traceable mechanism to plan, execute, and verify technical actions taken on each incident. Multiple technicians must be able to contribute remedial actions to a single ticket without altering primary ticket ownership. Furthermore, Requesters and IT Staff need concise, role-appropriate dashboards to monitor progress and queue health without constantly searching through exhaustive ticket tables. Finally, resolution integrity must be enforced: end-user feedback ("Problem Appears Resolved") remains strictly advisory, requiring technician review and authoritative transition before closure.

---

## 3. Scope

### 3.1 Included Scope
- **Actions Taken Management (Parent-Child Work Structure):**
  - Database persistence for multiple `ActionTaken` entries linked to a single `Ticket`.
  - Capturing: `actionDate`, `description`, `result`, `performedBy` (auto-populated with authenticated user), `followUpRequired`, `followUpNote` (mandatory if follow-up is checked), and `attachmentNotes`.
  - Authorized access: IT Staff and Administrators can create and edit Actions Taken; Requesters have read-only visibility into actions on their owned tickets.
  - Actions Taken table and create/edit modal integrated into the IT Staff Ticket Detail and Requester Ticket Detail views.
- **Ticket Workflow & Resolution Rules:**
  - Status lifecycle: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`.
  - Resolution Gate: Requester advisory flag does not auto-resolve; formal transition to `RESOLVED` requires IT Staff/Admin action.
  - Permitted transition enforcement at the backend API layer.
  - Optimistic concurrency and stale-update detection using ticket update timestamps (HTTP 409 Conflict).
- **Role-Appropriate Dashboards:**
  - **Requester Dashboard:** Summary metric cards (Total Open, Waiting for Requester, Recently Resolved, Closed), My Recent Tickets table, and Quick Action buttons.
  - **IT Staff Dashboard:** Metric cards (New, Open, In Progress, Waiting for Requester, My Assigned, Unassigned), Recent/Urgent Tickets list, Quick Action buttons, and accessible drill-down navigation to pre-filtered queues.
  - Administrator access reusing the IT Staff dashboard.
  - Backend authoritative aggregation queries for all dashboard metrics.
- **Final Regression & System Hardening:**
  - Zero regression across authentication, RBAC, ticket creation, attachments, comments, notes, and user administration.
  - Visual consistency, keyboard navigation, accessible contrast, and responsive viewports (Desktop, Tablet, Mobile) adhering to Zen Green tokens.

### 3.2 Explicitly Excluded Scope
- Automated SLA countdown clocks, breach alerts, or escalation engines.
- External email, SMS, LINE, or push notification services.
- Inventory, spare-parts billing, payroll, or labor-cost financial calculations.
- Multi-level organizational approvals and cryptographic digital signatures.
- Multi-tenant cloud partitioning or third-party business intelligence export pipelines.

---

## 4. Functional Requirements

- **FR-01 (Actions Taken Creation):** The system shall allow authenticated IT Staff and Administrators to record Actions Taken under an accessible ticket with automatic actor assignment.
- **FR-02 (Actions Taken Listing):** The system shall display all Actions Taken for a ticket in ascending chronological order on both IT Staff and Requester ticket detail views.
- **FR-03 (Actions Taken Update):** The system shall permit IT Staff and Administrators to modify existing Action Taken entries, updating audit timestamps.
- **FR-04 (Follow-Up Enforcement):** The system shall require a non-empty `followUpNote` whenever `followUpRequired` is marked true.
- **FR-05 (Requester Actions Visibility):** The system shall allow Requesters to view Actions Taken only on tickets they own, rejecting creation or modification attempts with HTTP 403 Forbidden.
- **FR-06 (Permitted Workflow Transitions):** The system shall validate that ticket status changes conform to the permitted transition matrix, rejecting illegal jumps with HTTP 400 Bad Request.
- **FR-07 (Resolution Gate):** The system shall enforce that only IT Staff or Administrators can transition tickets to `RESOLVED`, treating Requester resolution feedback as non-state-changing advisory input.
- **FR-08 (Concurrency Conflict Handling):** The system shall reject updates with HTTP 409 Conflict if a ticket has been modified by another transaction since it was loaded.
- **FR-09 (Requester Dashboard Metrics):** The system shall compute and display real-time counts of the authenticated requester's tickets categorized by status.
- **FR-10 (IT Staff Dashboard Metrics):** The system shall calculate operational metrics including Unassigned tickets, My Assigned tickets, and status distributions.
- **FR-11 (Dashboard Drill-Down):** The system shall navigate users from dashboard metric cards to the appropriate pre-filtered ticket queue.
- **FR-12 (Empty State Handling):** The system shall display informative and accessible empty states when dashboard metrics or ticket lists return zero items.
- **FR-13 (Zen Green Theme Compliance):** The user interface shall adhere strictly to Zen Green design tokens, maintaining responsive layout and WCAG accessibility standards.
- **FR-14 (Full Regression Stability):** All features implemented in Labs 1 to 3 shall execute without error or behavioral regression.

---

## 5. Business Rules

- **BR-01 (Ticket Ownership):** An Action Taken belongs to exactly one Ticket (`ticketId` is mandatory and immutable).
- **BR-02 (Action Actor Independence):** The primary Ticket Owner coordinates the Ticket, but any active IT Staff member or Administrator may perform and record an Action Taken.
- **BR-03 (Mandatory Action Attributes):** Every Action Taken must contain an Action Date/Time, non-empty Description, Result, and auto-populated `performedById`.
- **BR-04 (Conditional Follow-Up Note):** When `followUpRequired` is `true`, `followUpNote` must not be null or whitespace. When `false`, `followUpNote` is optional/null.
- **BR-05 (Read-Only Requester Role):** Requesters are strictly read-only observers of Actions Taken on their own tickets; any write operation from a Requester returns HTTP 403 Forbidden.
- **BR-06 (Ticket Status Enumeration):** Allowed ticket statuses are strictly: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`.
- **BR-07 (Resolution Authority Gate):** A Requester marking "Problem Appears Resolved" does not change `currentStatus` to `RESOLVED`. Only IT Staff or Administrator roles possess authority to formally set status to `RESOLVED`.
- **BR-08 (Transition Matrix Validation):** Transitions must follow logical progression:
  - `NEW` → `OPEN`, `CANCELLED`
  - `OPEN` → `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `CANCELLED`
  - `IN_PROGRESS` → `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
  - `WAITING_FOR_REQUESTER` → `IN_PROGRESS`, `RESOLVED`, `CANCELLED`
  - `RESOLVED` → `CLOSED`, `REOPENED`
  - `CLOSED` → (Terminal; read-only)
  - `REOPENED` → `IN_PROGRESS`, `RESOLVED`, `CANCELLED`
  - `CANCELLED` → (Terminal; read-only)
- **BR-09 (Optimistic Concurrency Protection):** Status and ticket updates require client submission of the current `updatedAt` value; mismatch triggers HTTP 409 Conflict.
- **BR-10 (Requester Data Isolation):** Requester dashboard metrics and ticket queries must strictly filter by `requesterId = authenticatedUserId`.
- **BR-11 (Authoritative Backend Metrics):** All dashboard metrics must be computed dynamically by the database/backend service rather than assembled via client-side filtering.
- **BR-12 (Inactive User Protection):** Inactive IT Staff accounts cannot be assigned to tickets or perform new Actions Taken.
- **BR-13 (Stable Chronological Ordering):** Actions Taken must be sorted in ascending order of `actionDate`/`createdAt`.
- **BR-14 (Safe Degradation):** When no records match, dashboards and action lists must render clear empty messages without throwing runtime errors.

---

## 6. UI Specification Summary
- **IT Staff Dashboard:** Top metric cards (New, Open, In Progress, Waiting for Requester, My Assigned), Recent Tickets table with status badges, and Quick Action cards ("Create Ticket", "Search Tickets", "My Queue").
- **Requester Dashboard:** Summary metric cards (My Open Tickets, In Progress, Resolved, Closed), Recent Tickets table, and Quick Action cards ("Create Ticket", "View My Tickets").
- **Actions Taken Section:** Located on Ticket Detail page; renders summary count, chronological action cards or table, "Add Action" button for IT Staff/Admin, and edit dialog.
- **Design Tokens:** Strict adherence to Zen Green variables (`--zen-primary`, `--zen-forest`, `--zen-surface`, etc.), clean typography, visible focus rings, and zero horizontal scrolling on tablet/mobile views.
- Full details documented in `docs/lab-04/ui-spec.md`.

---

## 7. Data Changes & Justifications

### 7.1 Data Models
- **ActionTaken Model:**
  - `id`: Int (Autoincrement Primary Key)
  - `ticketId`: Int (Foreign Key referencing `Ticket.id`, ON DELETE CASCADE)
  - `performedById`: Int (Foreign Key referencing `User.id`)
  - `actionDate`: DateTime (Default `now()`)
  - `description`: String (Text)
  - `result`: String (Text)
  - `followUpRequired`: Boolean (Default `false`)
  - `followUpNote`: String? (Nullable)
  - `attachmentNotes`: String? (Nullable)
  - `createdAt`: DateTime (Default `now()`)
  - `updatedAt`: DateTime (Updated automatically)

### 7.2 Database Design Decisions & Justifications
1. **Decision 1: Normalized Parent-Child Table for Actions Taken:**
   - *Rationale:* Rather than overloading `InternalNote` or storing an unstructured JSON array on `Ticket`, creating a dedicated `ActionTaken` relation preserves strict schema typing, enables foreign key integrity with `User`, allows indexing on `ticketId` and `performedById`, and supports future audit/reporting requirements without data duplication.
2. **Decision 2: Optimistic Concurrency Control via `updatedAt` Validation:**
   - *Rationale:* Service-desk operations involve multiple staff triaging and resolving incidents concurrently. Utilizing Prisma's automatic `@updatedAt` timestamp as a concurrency token provides effective collision detection (HTTP 409) without the performance overhead or deadlock risks of pessimistic table locking.

### 7.3 Seed Strategy
- Idempotent seed script provisioning:
  - Tickets with 0, 1, and multiple Actions Taken.
  - Realistic operational distribution demonstrating non-zero and zero metrics on both Requester and IT Staff dashboards.

---

## 8. API Contract Summary
- `POST /api/tickets/:id/actions`: Create new Action Taken (IT Staff / Admin only)
- `GET /api/tickets/:id/actions`: List all Actions Taken for a ticket (Owner Requester, IT Staff, Admin)
- `PUT /api/tickets/:id/actions/:actionId`: Update an existing Action Taken (IT Staff / Admin only)
- `GET /api/dashboard/requester`: Fetch authenticated Requester dashboard metrics and recent tickets
- `GET /api/dashboard/staff`: Fetch IT Staff dashboard metrics, triage counts, and queue previews
- `PUT /api/staff/tickets/:id/status`: Transition ticket status with resolution gate and conflict detection
- Full request/response schemas documented in `docs/lab-04/api-spec.md`.

---

## 9. Acceptance Criteria

- **AC-01:** Given a permitted IT Staff user and valid data, when an Action Taken is created, then it is saved under the correct Ticket with the authenticated creator, and returns HTTP 201 Created.
- **AC-02:** Given an Action Taken creation request with `followUpRequired = true` and an empty `followUpNote`, then the server returns HTTP 400 Bad Request with a descriptive error.
- **AC-03:** Given an authenticated Requester, when attempting to create or edit an Action Taken, then the server rejects the request with HTTP 403 Forbidden.
- **AC-04:** Given an authenticated Requester, when viewing an owned Ticket, then all associated Actions Taken are visible in read-only mode.
- **AC-05:** Given an authenticated Requester viewing the Requester Dashboard, then all returned metrics and recent tickets belong exclusively to that user.
- **AC-06:** Given an authenticated IT Staff member viewing the IT Staff Dashboard, then accurate counts for Unassigned, My Assigned, and status distributions are displayed.
- **AC-07:** Given a ticket in `IN_PROGRESS`, when an authorized IT Staff transitions it to `RESOLVED`, then the ticket status updates and summary refreshes.
- **AC-08:** Given a ticket in `NEW`, when a user attempts an illegal transition directly to `CLOSED` or `RESOLVED`, then the server returns HTTP 400 Bad Request.
- **AC-09:** Given a stale update attempt where the ticket `updatedAt` in the payload does not match the database, then the server returns HTTP 409 Conflict.
- **AC-10:** Given all regression test suites (Labs 1, 2, 3), when executed on `main`, then 100% of tests pass without error.

---

## 10. Product Definition of Done (DoD)
1. Specification, UI spec, API spec, and Test plan completed and committed before implementation.
2. Prisma schema evolved, migrated, and seeded with idempotent test records.
3. All REST API endpoints implemented with strict RBAC authorization and input validation.
4. UI components responsive across Desktop, Tablet, and Mobile, adhering to Zen Green tokens.
5. Unit, API, UI component, and E2E automated test suites passing with 100% success rate.
6. Clean Git commit history showing feature branches merged into `lab4-staging` and then `main` via reviewed Pull Requests.
7. Final 9-part PDF report assembled with complete evidence and screenshots.

---

## 11. Assumptions and Decisions
- Actions Taken can be created even if the ticket status is `RESOLVED` or `CLOSED` for post-resolution documentation, but tickets marked `CANCELLED` remain locked against new actions.
- Any active IT Staff or Administrator may log an Action Taken on any ticket regardless of who currently owns the ticket.
- Attachment notes in Actions Taken serve as informational text references (e.g. "Refer to battery_diagnostic.png") rather than duplicate binary file uploads.
