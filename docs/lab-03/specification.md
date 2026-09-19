# Lab 3 Sprint Engineering Specification: TokTickIT Users, Roles, IT Staff & Admin

## 1. Sprint Goal
Deliver an enterprise-grade authentication and role-based access control (RBAC) foundation for TokTickIT in the **Zen Green Theme**. Transition from simulated requester selection to secure real authentication with three distinct roles: **Requester**, **IT Staff**, and **Administrator**. Implement the IT Staff Ticket Queue with search, multi-faceted filtering, sorting, and pagination; the IT Staff Ticket Detail with ticket assignment, IT Priority management, status transitions, public comments, and staff-only internal notes; and Administrator User Management with user provisioning, editing, deactivation safeguards, and initial password resets.

---

## 2. Stakeholder Request Interpretation
The organization requires TokTickIT to transition from a single-persona prototype to a multi-role enterprise IT support portal. The system must enforce data security through authentic credentials, prevent unauthorized access to administrative functions and internal deliberations, and empower IT Support personnel with specialized triage tools to manage ticket lifecycles from intake to resolution. End users (Requesters) must communicate with technicians via public comments, while IT staff maintain private operational context using internal notes. Administrators need centralized oversight to manage user accounts and reset credentials safely.

---

## 3. Scope

### 3.1 Included Scope
- **Real Authentication & Credential Management:**
  - Secure email and password authentication with encrypted password hashing (bcrypt).
  - JWT-based authorization tokens transmitted via standard HTTP Authorization headers.
  - Mandatory initial password change enforcement for new or admin-reset accounts before accessing application features.
  - Active account verification preventing inactive users from authenticating.
  - Secure logout with client-side credential eviction.
  - Removal of the development-only `RequesterSelectorModal` and `RequesterContext`.
- **Role-Based Access Control (RBAC):**
  - Three distinct system roles: `REQUESTER`, `IT_STAFF`, and `ADMINISTRATOR`.
  - Dynamic navigation header adapting to the authenticated user's role.
  - Route protection and backend authorization middleware restricting endpoint access according to the Authorization Matrix.
- **IT Staff Ticket Queue:**
  - Comprehensive ticket triage dashboard displaying tickets across all requesters.
  - Multi-criteria filtering (Status, IT Priority, Assignment/Owner, Category).
  - Free-text search matching Ticket Number, Summary, Description, and Requester Name.
  - Configurable sorting by Created Date, Updated Date, IT Priority, and Status.
  - Responsive pagination supporting configurable page sizes (e.g., 10, 25, 50).
  - Visual status and priority badges adhering to the Zen Green design system.
- **IT Staff Ticket Detail & Lifecycle Management:**
  - Read-only inspection of requester-submitted fields, categories, and attachments.
  - Ticket claim (assign to self), assignment, and reassignment to active IT Staff members.
  - IT Priority assessment and assignment (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
  - Status lifecycle transitions: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`.
  - Requester feedback acknowledgment ("Problem Appears Resolved").
- **Communication Channels (Comments & Internal Notes):**
  - **Public Comments:** Bidirectional communication visible to the ticket Requester, IT Staff, and Administrators.
  - **Internal Notes:** Confidential technical and operational notes restricted exclusively to IT Staff and Administrators.
- **Administrator User Management:**
  - User inventory table with keyword search and role filtering.
  - User provisioning (Name, Email, Role, Department, Initial Temporary Password).
  - User modification (Name, Department, Role, Active/Inactive status toggle).
  - Safety constraints: Disallow deactivating or demoting the last active Administrator; disallow self-deactivation.
  - Administrative password reset generating a temporary password requiring change upon next login.
- **Design System & Responsiveness:**
  - Strict compliance with Zen Green theme tokens, typography, and contrast standards.
  - Responsive layouts optimized for Desktop (≥992px), Tablet (768px–991px), and Mobile (<768px).

### 3.2 Explicitly Excluded Scope
- Multi-factor authentication (MFA/2FA) or SSO/OAuth integrations.
- Email or SMS notification dispatching.
- SLA timers, automated ticket escalation rules, and business hours calculators.
- File attachment deletion or physical file purging (soft-removal remains the standard).
- Custom workflow engines or configurable status transition graphs.

---

## 4. Functional Requirements

### 4.1 Authentication & Session Management
- **FR-01 (User Login):** The system accepts valid email and password credentials, validates active account status, verifies password hash, and returns an access token containing user identity and role.
- **FR-02 (Mandatory Password Change):** Users flagged with `mustChangePassword: true` must be immediately directed to the password change screen and prevented from accessing any other system screens or APIs.
- **FR-03 (Voluntary Password Change):** Any authenticated user can update their current password by verifying their existing password and supplying a compliant new password.
- **FR-04 (User Logout):** Users can terminate their active session, clearing client tokens and resetting memory state.
- **FR-05 (Current Identity Retrieval):** Authenticated clients can fetch their active profile (`/api/auth/me`) to maintain session state across reloads.
- **FR-06 (Removal of Mock Requester Selector):** The temporary Lab 2 Requester selector modal and context must be completely eliminated.

### 4.2 IT Staff Ticket Queue
- **FR-07 (Queue Retrieval):** IT Staff and Administrators can view a global ticket queue containing tickets submitted by all requesters.
- **FR-08 (Queue Search & Filtering):** The queue must support instant text search and faceted filtering by Status, IT Priority, Owner (Assigned IT Staff), and Category.
- **FR-09 (Queue Sorting & Pagination):** Users can sort the queue by creation date, last updated date, priority, and ticket number, with full server-side pagination.
- **FR-10 (Queue Summary Metrics):** Displays count badges or summary metrics for open, unassigned, and high-priority tickets.

### 4.3 IT Staff Ticket Operations & Detail
- **FR-11 (Ticket Detail Inspection):** IT Staff and Administrators can view full ticket details including requester profile, submission timestamp, category, affected system, attachments, and complete communication thread.
- **FR-12 (Ticket Assignment & Claim):** IT Staff can assign an unassigned ticket to themselves ("Claim Ticket"), assign to another active IT Staff member, or unassign.
- **FR-13 (IT Priority Modification):** IT Staff can designate or alter the official IT Priority independent of the requester's initially requested priority.
- **FR-14 (Ticket Status Progression):** IT Staff can update ticket status along defined lifecycle phases (`OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`).
- **FR-15 (Requester Confirmation of Resolution):** Requesters can indicate that their issue appears resolved, prompting IT Staff to close the ticket.

### 4.4 Comments & Internal Notes
- **FR-16 (Public Comments Submission & Visibility):** Requesters, IT Staff, and Administrators can post public comments on a ticket. Public comments are visible to all authorized viewers of that ticket.
- **FR-17 (Internal Notes Submission & Visibility):** IT Staff and Administrators can post and view internal notes. Internal notes are strictly inaccessible and invisible to Requesters.

### 4.5 Administrator User Management
- **FR-18 (User Directory Inspection):** Administrators can view a paginated list of all users, searchable by name and email, filterable by role and active status.
- **FR-19 (User Account Creation):** Administrators can create new accounts with Name, unique Email, Role, Department, and an initial password flagged with `mustChangePassword = true`.
- **FR-20 (User Account Modification):** Administrators can update user details (Name, Department, Role, Active status).
- **FR-21 (Password Reset by Administrator):** Administrators can reset a user's password, requiring the user to change it upon subsequent login.

---

## 5. Business Rules

### Authentication & Account Rules
- **BR-01 (Authentication Eligibility):** Only active accounts (`isActive = true`) with verified credentials can authenticate. Inactive users attempting login must receive an explicit error (`ACCOUNT_INACTIVE`).
- **BR-02 (Mandatory Password Change Enforcement):** Any user with `mustChangePassword = true` cannot access any protected resource other than `/api/auth/change-password` and `/api/auth/me`. Any other API request returns HTTP 403 (`PASSWORD_CHANGE_REQUIRED`).
- **BR-03 (Password Complexity Standards):** New passwords must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and must not match the immediate previous password.
- **BR-04 (Unique Identity per Email):** User email addresses must be unique across the system, case-insensitively trimmed, and properly formatted (`username@domain`).
- **BR-05 (Identity Authority):** The identity and role of the actor are derived solely from the cryptographically verified JWT server-side, never trusted from client-supplied request body parameters.

### Role & Access Rules
- **BR-06 (Role Boundaries):**
  - `REQUESTER`: Can only view and create their own tickets, view/add public comments on their tickets, and mark their ticket as "Appears Resolved". Cannot view internal notes, cannot view other requesters' tickets, cannot assign tickets, and cannot access Admin pages.
  - `IT_STAFF`: Can view all tickets in the queue, inspect full details, update ownership, adjust IT Priority, transition statuses, view/add public comments, and view/add internal notes. Cannot access Admin User Management.
  - `ADMINISTRATOR`: Holds all IT Staff capabilities plus full User Management privileges (Create, Read, Update users, Reset password).
- **BR-07 (Requester Data Isolation):** Requester queries for tickets or comments belonging to other requesters must return HTTP 403 Forbidden.

### Ticket & Lifecycle Rules
- **BR-08 (Initial Lifecycle State):** New tickets default to `currentStatus = NEW`, `itPriority = null` (or defaults to `requestedPriority`), and `ownerId = null` (Unassigned).
- **BR-09 (Valid Status Transitions):**
  - IT Staff and Admins may transition:
    - `NEW` → `OPEN`, `IN_PROGRESS`, `CANCELLED`
    - `OPEN` → `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
    - `IN_PROGRESS` → `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
    - `WAITING_FOR_REQUESTER` → `IN_PROGRESS`, `RESOLVED`, `CANCELLED`
    - `RESOLVED` → `CLOSED`, `REOPENED`
    - `CLOSED` → `REOPENED` (only if new related issue arises within allowable window)
    - `REOPENED` → `IN_PROGRESS`, `RESOLVED`
- **BR-10 (Requester Resolution Feedback):** Requesters cannot directly set status to `RESOLVED` or `CLOSED`. They can click "Mark as Appears Resolved" which adds a system-flagged public comment notifying IT Staff.
- **BR-11 (Ownership Assignment):** Ticket ownership (`ownerId`) may only be assigned to active users whose role is `IT_STAFF` or `ADMINISTRATOR`. Assigning ownership to a `REQUESTER` or inactive staff member is strictly rejected.
- **BR-12 (IT Priority Authority):** The official IT Priority (`itPriority`) can only be modified by IT Staff and Administrators. It overrides the requester's `requestedPriority` for queue triage and SLA calculation.

### Communication & Notes Rules
- **BR-13 (Public Comment Content Validation):** Public comment body is required, trimmed, and must contain between 2 and 2000 characters.
- **BR-14 (Internal Note Confidentiality):** Internal notes are strictly for IT Staff and Administrators. When a requester queries ticket details, internal notes are excluded from serialization at the database query level.
- **BR-15 (Immutable Communication Log):** Once posted, comments and notes cannot be edited or deleted to preserve an uncompromised audit trail.

### Administrator Safety Rules
- **BR-16 (Sole Administrator Safeguard):** The system must disallow deactivating (`isActive = false`) or changing the role of the final active Administrator.
- **BR-17 (Self-Deactivation Prevention):** An Administrator cannot deactivate their own active account or revoke their own Administrator role.
- **BR-18 (Password Reset Flow):** When an Administrator resets a user's password, a temporary password is set, and the user's `mustChangePassword` flag is set to `true`.

---

## 6. Authorization Matrix

| Operation / Endpoint | Requester | IT Staff | Administrator | Guest (Unauthenticated) |
|---|:---:|:---:|:---:|:---:|
| `POST /api/auth/login` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/auth/logout` | ✅ | ✅ | ✅ | ❌ |
| `GET /api/auth/me` | ✅ | ✅ | ✅ | ❌ |
| `POST /api/auth/change-password` | ✅ | ✅ | ✅ | ❌ |
| `GET /api/tickets` (My Tickets) | ✅ (Own only) | ❌ | ❌ | ❌ |
| `POST /api/tickets` (Create Ticket) | ✅ | ✅ | ✅ | ❌ |
| `GET /api/tickets/:id` (Requester Detail) | ✅ (Own only) | ✅ | ✅ | ❌ |
| `GET /api/staff/tickets` (Queue) | ❌ | ✅ | ✅ | ❌ |
| `GET /api/staff/tickets/:id` (Staff Detail) | ❌ | ✅ | ✅ | ❌ |
| `PATCH /api/staff/tickets/:id/assign` | ❌ | ✅ | ✅ | ❌ |
| `PATCH /api/staff/tickets/:id/priority` | ❌ | ✅ | ✅ | ❌ |
| `PATCH /api/staff/tickets/:id/status` | ❌ | ✅ | ✅ | ❌ |
| `GET /api/tickets/:id/comments` | ✅ (Own ticket) | ✅ | ✅ | ❌ |
| `POST /api/tickets/:id/comments` | ✅ (Own ticket) | ✅ | ✅ | ❌ |
| `GET /api/tickets/:id/notes` | ❌ | ✅ | ✅ | ❌ |
| `POST /api/tickets/:id/notes` | ❌ | ✅ | ✅ | ❌ |
| `GET /api/admin/users` | ❌ | ❌ | ✅ | ❌ |
| `POST /api/admin/users` | ❌ | ❌ | ✅ | ❌ |
| `PATCH /api/admin/users/:id` | ❌ | ❌ | ✅ | ❌ |
| `POST /api/admin/users/:id/reset-password` | ❌ | ❌ | ✅ | ❌ |

---

## 7. Data Changes & Prisma Schema

### 7.1 Schema Evolution
1. **New Enums:**
   - `UserRole`: `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`
   - Expanded `TicketStatus`: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`
2. **Unified `User` Model:**
   - Replaces standalone `RequesterUser`.
   - Fields: `id`, `name`, `email` (unique), `passwordHash`, `role` (`UserRole`), `department`, `isActive`, `mustChangePassword`, `createdAt`, `updatedAt`.
   - Relations: `ticketsSubmitted` (Ticket[]), `ticketsAssigned` (Ticket[]), `comments` (Comment[]), `notes` (InternalNote[]).
3. **Enhanced `Ticket` Model:**
   - `itPriority`: `Priority?` (nullable or defaults to requestedPriority)
   - `ownerId`: `Int?` (nullable reference to `User` for assigned IT Staff)
   - `requesterId`: References unified `User(id)`
   - Relations: `comments` (Comment[]), `notes` (InternalNote[]).
4. **New `Comment` Model (Public):**
   - Fields: `id`, `ticketId`, `authorId`, `message`, `isSystemGenerated`, `createdAt`.
   - Relations: `ticket` (Ticket), `author` (User).
5. **New `InternalNote` Model (Confidential):**
   - Fields: `id`, `ticketId`, `authorId`, `note`, `createdAt`.
   - Relations: `ticket` (Ticket), `author` (User).

### 7.2 Seed Data Plan
- **Admin Account:** 1 Active Administrator (`admin@toktickit.local`, default password `Password123!`).
- **IT Staff Accounts:** 3 Active IT Staff (`staff1@toktickit.local`, `staff2@toktickit.local`, `staff3@toktickit.local`), 1 Inactive IT Staff (`staff.inactive@toktickit.local`).
- **Requester Accounts:** 4 Active Requesters (`somchai@toktickit.local`, `manee@toktickit.local`, etc.), 1 Inactive Requester.
- **Sample Tickets:** Distributed across statuses (`NEW`, `IN_PROGRESS`, `RESOLVED`), assigned/unassigned, with initial comments and notes.

---

## 8. UI Specification Summary
The interface reinforces the **Zen Green Theme** with role-tailored dashboards:
- **Header:**
  - Displays TokTickIT brand logo.
  - Role-based tabs:
    - `REQUESTER`: "My Tickets", "Create Ticket"
    - `IT_STAFF`: "Ticket Queue"
    - `ADMINISTRATOR`: "Ticket Queue", "User Management"
  - Current user avatar, name, badge (`REQUESTER` / `IT STAFF` / `ADMIN`), and "Sign Out" button.
- **Login Screen:** Clean card layout with TokTickIT branding, email/password inputs, loading indicators, and informative authentication failure banners.
- **Mandatory Password Change Screen:** Locked layout forcing user to create and confirm a compliant password before accessing the app.
- **Staff Ticket Queue Screen:** Dense, high-productivity table view on desktop with quick filters (Status tabs, Priority pills, Owner dropdown) and responsive card layout on mobile.
- **Staff Ticket Detail Screen:** Two-panel desktop split view (Left: Requester summary, description, attachments; Right: Action card for Owner, IT Priority, Status; Bottom: Unified tabbed timeline for Public Comments and Internal Notes).
- **Admin User Management Screen:** User table with search, role filter, "Add User" button, edit user drawer/modal, and reset password confirmation modal.

---

## 9. Acceptance Criteria

- **AC-01 (Secure Login):** Active users can log in with registered email and password, receiving a valid session token and redirected to their role's default landing page.
- **AC-02 (Inactive Account Lockout):** Attempting to authenticate with an inactive account fails with an explicit message without issuing a token.
- **AC-03 (Mandatory Password Change Interception):** Users with `mustChangePassword = true` are intercepted on login, cannot navigate to application pages, and cannot call operational APIs until updating password.
- **AC-04 (Role-Based Route Protection):** Requesters navigating to `/staff/queue` or `/admin/users` are blocked and redirected to `/my-tickets` with HTTP 403 on corresponding API calls.
- **AC-05 (Staff Ticket Queue Visibility):** IT Staff and Admins can view all tickets, search keywords, filter by status, priority, and assignment, and sort with server-side pagination.
- **AC-06 (Staff Ticket Assignment):** IT Staff can claim an unassigned ticket, assign it to another active staff member, or clear assignment.
- **AC-07 (Staff Priority Adjustment):** IT Staff can set the official `itPriority` on any ticket, reflecting immediately in queue lists and detail views.
- **AC-08 (Staff Status Progression):** IT Staff can transition tickets through valid lifecycle states.
- **AC-09 (Public Comments Collaboration):** Both Requester and Staff can post public comments; all comments appear chronologically in the public thread.
- **AC-10 (Internal Note Privacy):** IT Staff can post internal notes; internal notes are completely hidden from Requesters in both API responses and UI.
- **AC-11 (Admin User Provisioning):** Admin can create a new user with specified role and department; user is created with initial password requiring change on first login.
- **AC-12 (Admin User Editing & Safety Rule):** Admin can update user attributes. Attempting to deactivate or demote the last remaining active Admin is rejected with HTTP 400.
- **AC-13 (Admin Password Reset):** Admin can reset any user's password, invalidating their old password and triggering mandatory password change upon their next login.
- **AC-14 (Requester Appears Resolved Action):** Requesters can mark their own open/in-progress ticket as "Appears Resolved", leaving a system comment for staff verification.
- **AC-15 (Zen Green Consistency & Responsiveness):** All new views adhere strictly to Zen Green palette and offer smooth layouts across Desktop (1280px), Tablet (768px), and Mobile (375px).

---

## 10. Definition of Done
- All schema migrations applied and seeded with multi-role accounts and tickets.
- All backend routes, auth middleware, and validation implemented and unit tested.
- All frontend screens built, responsive, and styled with Zen Green tokens.
- Old simulated `RequesterSelectorModal` and context removed cleanly without orphan code.
- Backend and frontend test suites pass with zero failures.
- E2E Playwright tests covering authentication, ticket triage flow, and admin user management pass.
- Complete documentation (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`, `reviewer.md`, `ai-use.md`) published under `docs/lab-03/`.
