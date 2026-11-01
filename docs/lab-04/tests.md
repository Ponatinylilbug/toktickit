# Lab 4 Test Engineering Deliverable: Traceability Matrix and Test Plan

## 1. Overview and Quality Assurance Strategy
Sprint 4 implements Test-Driven Development (TDD) across all layers: Database/ORM, Express API endpoints, React client components, and end-to-end integration flows. Every Acceptance Criterion defined in `specification.md` is strictly traced to one or more automated tests.

---

## 2. Test Traceability Matrix

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST-ACT-01** | API | AC-01, BR-01..03 | IT Staff creates valid Action Taken under accessible ticket | Saves to DB, binds authenticated actor, returns 201 Created | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **TEST-ACT-02** | API | AC-02, BR-04 | Create Action Taken with `followUpRequired=true` but missing `followUpNote` | Rejects with 400 Bad Request and validation error message | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **TEST-ACT-03** | API | AC-03, BR-05 | Requester attempts POST to create Action Taken | Rejects with 403 Forbidden | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **TEST-ACT-04** | API | AC-04, BR-13 | Requester retrieves Actions Taken for owned ticket | Returns 200 OK with stable chronologically ordered items | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **TEST-ACT-05** | API | AC-01, BR-02 | Non-owner IT Staff adds Action Taken to another staff's ticket | Succeeds with 201 Created; preserves primary ticket owner | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **TEST-ACT-06** | API | AC-01, BR-03 | IT Staff updates existing Action Taken | Returns 200 OK with updated result and refreshed timestamp | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **TEST-FLOW-01** | API | AC-07, BR-07 | IT Staff transitions ticket status to `RESOLVED` | Successfully updates `currentStatus` to RESOLVED; returns 200 | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **TEST-FLOW-02** | API | AC-08, BR-08 | Transition ticket from `NEW` directly to `CLOSED` or `RESOLVED` | Rejects illegal transition with 400 Bad Request | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **TEST-FLOW-03** | API | AC-07, BR-07 | Requester submits advisory "Problem Appears Resolved" feedback | Records feedback without changing `currentStatus` to RESOLVED | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **TEST-FLOW-04** | API | AC-09, BR-09 | Submit status update with stale `expectedUpdatedAt` | Rejects with 409 Conflict | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **TEST-DASH-01** | API | AC-05, BR-10 | Authenticated Requester fetches dashboard data | Returns counts and recent tickets belonging only to requester | `server/tests/lab-04/requester-dashboard.api.test.ts` | Pass |
| **TEST-DASH-02** | API | AC-06, BR-11 | Authenticated IT Staff fetches dashboard data | Authoritative counts for new, open, in-progress, myAssigned match DB | `server/tests/lab-04/staff-dashboard.api.test.ts` | Pass |
| **TEST-UI-01** | UI | AC-01, AC-04 | Actions Taken list renders on Ticket Detail with role badges | Displays chronological list; hides create/edit from Requester | `client/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| **TEST-UI-02** | UI | AC-02, BR-04 | Actions Taken create modal form validation | Enforces description, result, and conditional follow-up note | `client/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| **TEST-UI-03** | UI | AC-06, BR-11 | Staff Dashboard metric cards and drill-down links | Renders operational cards; clicking navigates with filter query | `client/tests/lab-04/StaffDashboard.test.tsx` | Pass |
| **TEST-UI-04** | UI | AC-05, BR-10 | Requester Dashboard displays user tickets and quick actions | Renders metric cards, recent tickets, and navigation buttons | `client/tests/lab-04/RequesterDashboard.test.tsx` | Pass |
| **TEST-UI-05** | UI | AC-07, AC-08 | Ticket detail workflow controls render permitted buttons | Disables disallowed transitions and presents resolution feedback | `client/tests/lab-04/TicketWorkflow.test.tsx` | Pass |
| **TEST-E2E-01** | E2E | AC-01..04 | Full Actions Taken lifecycle flow | IT Staff creates and modifies actions; Requester verifies view | `e2e/lab-04/actions-taken-flow.spec.ts` | Pass |
| **TEST-E2E-02** | E2E | AC-07..09 | Full Ticket Resolution and Gate verification | Requester advisory feedback verified; Staff executes resolution | `e2e/lab-04/ticket-resolution.spec.ts` | Pass |
| **TEST-E2E-03** | E2E | AC-05, AC-06 | Multi-role Dashboard and drill-down journey | Tests dashboard cards, count accuracy, and filtering navigation | `e2e/lab-04/dashboards.spec.ts` | Pass |
| **TEST-REG-01** | Reg | AC-10, FR-14 | Complete Labs 1 to 3 Regression Suite | All 105 legacy server and client tests pass with 0 errors | All legacy test suites | Pass |

---

## 3. Test Execution Commands
- Server Tests: `npm test` inside `toktickit/server`
- Client Tests: `npm test` inside `toktickit/client`
- E2E Tests: `npx playwright test` (or vitest E2E runners)
