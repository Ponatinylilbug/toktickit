# Lab 3 — AI Assistance Log & Reflection

**LLM Model Used:** Antigravity IDE (Gemini 3.8 Flash & Claude 4.6 Thinking)

---

## Key Prompts and Purposes

| # | Prompt Summary / Key Instruction | Purpose & Outcome |
|---|---|---|
| 1 | "Review Lab 3 requirements: Users, Roles, IT Staff Operations, and Administrator User Management." | Extracted all functional requirements, security rules, and user journeys across the 3 organizational roles. |
| 2 | "Draft comprehensive docs/lab-03/specification.md covering Sprint 3 Goal, FR-01..20+, BR-01..25+, Authorization Matrix, AC-01..20+, and DoD." | Generated formal engineering specification and comprehensive business rules to drive Spec-Driven Development. |
| 3 | "Draft docs/lab-03/api-spec.md specifying all REST endpoints, payloads, status codes, and error codes for auth, staff, comments, notes, and admin." | Formulated explicit REST contracts including JWT authentication, error formats, and RBAC responses (401, 403, 404, 409). |
| 4 | "Draft docs/lab-03/ui-spec.md defining visual layouts, Zen Green design tokens, role-based navigation, and interactive states." | Established UI specifications for Login, Change Password, Staff Ticket Queue, Staff Ticket Detail, and User Management. |
| 5 | "Draft docs/lab-03/tests.md with test strategy and AC-to-test traceability matrix." | Outlined testing strategy across backend API integration tests and frontend Vitest component tests. |
| 6 | "Update Prisma schema to add User, Comment, InternalNote models, UserRole enum, TicketStatus enum additions, and update seed.ts." | Designed normalized relational schema with password hashing via bcrypt, user role enumeration, and comprehensive seed data. |
| 7 | "Implement backend auth middleware and routes: JWT token issuance, verification, role-based authorization, and password change flow." | Implemented `authMiddleware`, `requireRole`, `requirePasswordChanged`, and `/api/auth` endpoints with automated tests. |
| 8 | "Implement IT Staff routes: ticket queue with pagination/filtering, detail inspection, owner assignment, actual priority update, and status workflow." | Built `/api/staff/tickets` endpoints with search, multi-field filtering, role validation, and full audit timestamping. |
| 9 | "Implement Public Comments and Internal Notes APIs with strict RBAC isolation." | Built `/api/tickets/:id/comments` and `/api/tickets/:id/notes`, guaranteeing Requesters cannot read or write internal notes. |
| 10 | "Implement Administrator User Management API with safety invariants (sole active admin and self-deactivation protection)." | Built `/api/admin/users` CRUD endpoints, temporary password generation, and forced password change flags. |
| 11 | "Implement Frontend components: AuthContext, LoginPage, ChangePasswordPage, StaffTicketQueue, StaffTicketDetail, UserManagement, and Header role navigation." | Developed complete responsive React interface with state retention, inline validation feedback, and Zen Green aesthetics. |
| 12 | "Fix test suite race conditions and stabilize React state updates to achieve 100% automated test pass rate." | Debugged Prisma connection probing and React state reference identity in AuthContext, resulting in all 105 server and client tests passing. |

---

## My Reflection

Lab 3 introduced complex multi-role authorization and security constraints into the TokTickIT platform. Leveraging Spec-Driven Development was crucial: before writing backend controllers or React components, writing detailed API and UI specifications made it possible to specify subtle edge cases—such as preventing the deactivation of the last active administrator, enforcing mandatory password changes before accessing any privileged endpoints, and isolating internal technician notes from ticket requesters.

Using the AI assistant allowed us to rapidly iterate on both backend and frontend layers while maintaining high test coverage. By structuring our tests against explicit Acceptance Criteria (AC-01 through AC-15), we caught subtle bugs early—such as asynchronous state updates in React context causing table re-mounting during test runs. The result is a robust, production-grade application where all 72 server tests and all 33 client tests pass reliably with zero regressions on previous Lab 1 and Lab 2 functionality.
