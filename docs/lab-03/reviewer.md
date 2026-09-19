# Lab 3 — Peer Review Record

**Author:** Jinjuta Nunnarumit — 67070505210 — GitHub: @Ponatinylilbug  
**Peer reviewer:** Thitigant Surayotin — 67070505214 — GitHub: @thitigant

---

## Pull Requests I authored (reviewed by my partner)

| PR | Branch | Scope / Description | Reviewer verdict |
|:---|:---|:---|:---|
| #26 | `feature/lab3-spec-and-test-plan` | Sprint 3 specifications (`specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`) | Approved & Merged |
| #28 | `feature/lab3-database-and-seed` | Prisma schema migration (User, Comment, InternalNote), bcryptjs & JWT setup, seed script | Approved & Merged |
| #30 | `feature/lab3-auth-and-rbac` | Authentication middleware, JWT verification, RBAC role guard, and `/api/auth` routes | Approved & Merged |
| #32 | `feature/lab3-staff-operations` | IT Staff queue (`/api/staff/tickets`), detail view, claim/assign owner, priority, and status operations | Approved & Merged |
| #34 | `feature/lab3-comments-and-notes` | Public comments (`/api/tickets/:id/comments`) and private internal notes (`/api/tickets/:id/notes`) | Approved & Merged |
| #36 | `feature/lab3-admin-user-management` | Admin user management (`/api/admin/users`), user creation, updates, and password reset | Approved & Merged |
| #38 | `feature/lab3-frontend-and-testing` | AuthContext, LoginPage, ChangePasswordPage, StaffTicketQueue, StaffTicketDetail, UserManagement, and full test suite | Approved & Merged |

### Reviewer comments I received & My responses:
- **PR #26 (`feature/lab3-spec-and-test-plan`):**
  - **Reviewer comment:** The specifications clearly distinguish the 3 roles (Requester, IT Staff, Administrator) and map each to explicit acceptance criteria and business rules.
  - **How I responded:** Followed the specification directly to drive TDD implementation with 100% traceability.
- **PR #30 (`feature/lab3-auth-and-rbac`):**
  - **Reviewer comment:** JWT verification properly checks for Bearer token format and rejects expired/tampered tokens with 401. RBAC correctly protects staff and admin endpoints with 403.
  - **How I responded:** Added mandatory password change enforcement middleware (`mustChangePassword`) to protect sensitive resources until updated.
- **PR #32 (`feature/lab3-staff-operations`):**
  - **Reviewer comment:** Staff queue filters work accurately for status, priority, and unassigned/assigned tickets.
  - **How I responded:** Integrated both actual priority and requested priority display in the queue and detail cards.
- **PR #34 (`feature/lab3-comments-and-notes`):**
  - **Reviewer comment:** Internal notes are strictly isolated from Requesters (both read and write attempts return 403 Forbidden).
  - **How I responded:** Verified with automated tests `comments-notes.api.test.ts` covering both positive and negative permission scenarios.
- **PR #36 (`feature/lab3-admin-user-management`):**
  - **Reviewer comment:** Safety rules prevent self-deactivation and deactivating the last active administrator.
  - **How I responded:** Enforced both safety checks at database/service layer and returned descriptive 400 error codes.
- **PR #38 (`feature/lab3-frontend-and-testing`):**
  - **Reviewer comment:** UI transitions smoothly between roles, retains Zen Green theme tokens, and handles mandatory password resets seamlessly.
  - **How I responded:** Ensured test suites run cleanly across all 105 server and client automated tests with zero regressions.

---

## Pull Requests I reviewed for my partner

| PR | Branch / Feature | Scope | My verdict |
|:---|:---|:---|:---|
| #27 | `feature/lab3-auth-service` | User authentication service and bcrypt hash comparisons | Approved & Merged |
| #31 | `feature/lab3-staff-api-routes` | Staff ticket detail and owner assignment controller | Approved & Merged |
| #35 | `feature/lab3-user-admin-routes` | Admin user CRUD endpoints and password reset logic | Approved & Merged |

### My comments & Partner's responses:
- **PR #27:**
  - **My comment:** Ensure deactivated accounts receive an explicit 403 response message indicating inactive status rather than a generic invalid credentials error.
  - **Partner's response:** Added `ACCOUNT_INACTIVE` error code with specific user-friendly message.
- **PR #31:**
  - **My comment:** Verify that assigning ticket owner validates that the target user has `IT_STAFF` or `ADMINISTRATOR` role, rejecting assignment to Requesters.
  - **Partner's response:** Added validation check in `/api/staff/tickets/:id/assign` returning 400 if user role is not IT Staff or Admin.
