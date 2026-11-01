# Lab 4 — AI Assistance Log & Reflection

**LLM Model Used:** Antigravity IDE (Gemini 3.8 Flash & Claude 4.6 Thinking)

---

## Key Prompts and Purposes

| # | Prompt Summary / Key Instruction | Purpose & Outcome |
|---|---|---|
| 1 | "Review Lab 4 requirements: Actions Taken parent-child logging, Ticket Workflow & Resolution Gate, Role Dashboards, and Final Regression." | Synthesized operational requirements, authorization rules, state transitions, and concurrency controls across all stakeholder roles. |
| 2 | "Draft comprehensive docs/lab-04/specification.md covering Sprint 4 Goal, FR-01..14, BR-01..14, Data Models, AC-01..10, and DoD." | Established formal engineering specification and business rules driving Test-Driven Development (TDD). |
| 3 | "Draft docs/lab-04/api-spec.md specifying all REST endpoints, payloads, status codes, and error formats for actions, workflows, and dashboards." | Documented explicit REST contracts including validation errors (400), authentication/RBAC errors (401, 403), and optimistic concurrency conflict (409). |
| 4 | "Draft docs/lab-04/ui-spec.md defining visual layouts, Zen Green design tokens, modal form validation, and responsive dashboards." | Formulated design specifications for Actions Taken cards, modal validations, Requester Dashboard, and IT Staff Dashboard. |
| 5 | "Draft docs/lab-04/tests.md with test strategy and requirement-traceability matrix." | Outlined testing matrix mapping all 10 Acceptance Criteria to automated server and client test cases. |
| 6 | "Update Prisma schema to add ActionTaken model with cascade delete, foreign keys, and seed realistic operational data in seed.ts." | Implemented normalized relational schema for Actions Taken and seeded diverse tickets with varying actions and statuses. |
| 7 | "Implement Actions Taken REST APIs: POST, GET, PUT endpoints with RBAC role authorization and input validation." | Built `/api/tickets/:id/actions` endpoints with role checks, non-owner staff recording, and conditional follow-up note validation. |
| 8 | "Implement ActionsTakenSection.tsx responsive component, create/edit modal forms, and client tests." | Developed responsive Zen Green UI component with chronological sorting, technician badges, and strict validation. |
| 9 | "Implement formal Ticket Workflow transition matrix, resolution gate, advisory feedback, and optimistic concurrency (409 Conflict)." | Enforced transition rules preventing illegal jumps, preserved technician authority over resolution, and detected stale updates. |
| 10 | "Implement backend endpoints and frontend components for role-appropriate operational dashboards with server-side metrics aggregation." | Created `/api/dashboard/requester` and `/api/dashboard/staff`, alongside `RequesterDashboard.tsx` and `StaffDashboard.tsx` with drill-down filters. |
| 11 | "Execute complete regression testing across Labs 1 through 4, perform TypeScript strict type checks, and verify production builds." | Verified all 34 test files and 135 automated unit/integration tests passing (100% pass rate) with zero TypeScript or build errors. |

---

## My Reflection

Sprint 4 successfully finalized the TokTickIT service desk platform by implementing parent-child technical work tracking (Actions Taken), enforcing operational workflow discipline (Resolution Gate), providing role-specific executive and tactical dashboards, and hardening the entire application across all previous lab increments.

Spec-Driven Development and strict Test-Driven Development (TDD) proved invaluable once again:
- Writing the test traceability matrix before implementing backend or frontend logic ensured that every business constraint—such as requiring a follow-up note when `followUpRequired` is checked, or rejecting stale status updates with HTTP 409 Conflict—was comprehensively covered by automated tests.
- By isolating the requester's advisory feedback ("Problem Appears Resolved") from the actual technician transition to `RESOLVED`, we preserved operational integrity while enhancing user experience.
- The authoritative server-side metrics aggregation on both the Requester and IT Staff dashboards eliminates client-side tampering and delivers instantaneous visibility into queue health.

Using the AI assistant accelerated our engineering workflow across database migrations, Express REST API implementations, and responsive React component development, while ensuring all 135 automated tests (90 server tests, 45 client tests) passed with zero regressions. The result is a secure, resilient, and production-ready service desk application.
