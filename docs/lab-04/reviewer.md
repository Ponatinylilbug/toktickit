# Lab 4 — Peer Review Record

**Author:** Jinjuta Nunnarumit — 67070505210 — GitHub: @Ponatinylilbug  
**Peer reviewer:** Thitigant Surayotin — 67070505214 — GitHub: @thitigant

---

## Pull Requests I authored (reviewed by my partner)

| PR | Branch | Scope / Description | Reviewer verdict |
|:---|:---|:---|:---|
| #46 | `feature/lab4-spec-and-test-plan` | Sprint 4 specifications (`specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`) | Approved & Merged |
| #47 | `feature/lab4-actions-taken-foundation` | Prisma schema migration (ActionTaken), seed script, REST API endpoints (`POST`, `GET`, `PUT` on `/api/tickets/:id/actions`) | Approved & Merged |
| #48 | `feature/lab4-actions-taken-ui` | `ActionsTakenSection.tsx` component, create/edit modal form with conditional validation, role-based controls, client tests | Approved & Merged |
| #49 | `issue-4/ticket-workflow` | Formal ticket workflow transition matrix, Resolution Gate, advisory feedback, optimistic concurrency (409 Conflict) | Approved & Merged |
| #50 | `issue-5/role-dashboards` | Role-tailored dashboards for Requester and IT Staff, server-side metrics aggregation, drill-down filtering, client tests | Approved & Merged |
| #51 | `issue-6/final-regression` | Complete regression test suite across Labs 1-4, TypeScript strict verification, production build checks, tests.md matrix update | Approved & Merged |
| #52 | `lab4-staging` | Final Sprint 4 release merge from `lab4-staging` into `main` | Merged into main |

---

### Reviewer comments I received & My responses:

- **PR #46 (`feature/lab4-spec-and-test-plan`):**
  - **Reviewer comment:** Specifications are very thorough, especially the traceability matrix in `tests.md` linking every AC to specific test files, and the state transition diagram for the resolution gate.
  - **How I responded:** Followed the specification strictly throughout all sprint increments using Test-Driven Development (TDD).

- **PR #47 (`feature/lab4-actions-taken-foundation`):**
  - **Reviewer comment:** ActionTaken model properly enforces foreign key relationships and cascade delete on ticket removal. Non-owner staff can record actions without altering primary ticket ownership (BR-02).
  - **How I responded:** Verified with server test suite `actions-taken.api.test.ts` covering validation rules, permissions (403 for requesters), and database integrity.

- **PR #48 (`feature/lab4-actions-taken-ui`):**
  - **Reviewer comment:** Responsive card layout matches Zen Green aesthetics. Conditional follow-up note validation works properly and requesters see the section in read-only mode without create/edit buttons.
  - **How I responded:** Implemented strict form state validation and thorough client tests (`ActionsTaken.test.tsx`) asserting role badge rendering and modal validation behavior.

- **PR #49 (`issue-4/ticket-workflow`):**
  - **Reviewer comment:** The transition matrix correctly blocks illegal status jumps (e.g. NEW directly to RESOLVED/CLOSED). The advisory resolution indicator works as intended without prematurely resolving the ticket.
  - **How I responded:** Added optimistic concurrency checks using `expectedUpdatedAt` returning HTTP 409 Conflict on collisions, backed by automated API and UI tests.

- **PR #50 (`issue-5/role-dashboards`):**
  - **Reviewer comment:** Server-side authoritative metrics aggregation prevents client-side tampering (BR-11). Requester dashboard data is properly isolated to only the requester's own tickets (BR-10, AC-05). Staff dashboard provides 6 operational metrics with functional drill-down navigation.
  - **How I responded:** Added full fallback in-memory aggregation support for offline/testing environments, ensuring all 14 server tests and 9 client tests pass seamlessly.

- **PR #51 (`issue-6/final-regression`):**
  - **Reviewer comment:** Impressive regression verification: full regression across Labs 1 through 4 executed cleanly with 135/135 tests passing without a single failure. Both TypeScript strict checks and production builds compile with zero errors.
  - **How I responded:** Confirmed complete Pass status in `tests.md` and prepared repository for final integration into `main`.
