# Lab 2 — AI Assistance Log & Reflection

**LLM Model Used:** Gemini 3.7 Flash (Antigravity IDE)

---

## Key Prompts and Purposes

| # | Prompt Summary / Key Instruction | Purpose & Outcome |
|---|---|---|
| 1 | "Read Lab_02_labsheet.pdf and summarize requirements, scope, scoring criteria, and deliverable structure." | Extracted all 22 pages of the labsheet, mapping out 9 grading sections and core functional requirements. |
| 2 | "Draft comprehensive docs/lab-02/specification.md covering Sprint Goal, FR-01..10, BR-01..15, AC-01..15, Data Changes, and DoD." | Generated formal engineering specification and business rules to drive Spec DD. |
| 3 | "Draft docs/lab-02/ui-spec.md with Zen Green design tokens, component hierarchy, responsive layouts, and visual checklist." | Established color palette (`#006B3C`, `#0B7A46`, etc.) and multi-viewport responsive design rules. |
| 4 | "Draft docs/lab-02/api-spec.md specifying all REST endpoints, query parameters, payloads, status codes, and error formats." | Formulated explicit REST contracts for tickets, attachments, requesters, and reference data. |
| 5 | "Draft docs/lab-02/tests.md with test strategy, planned-test table, and AC-to-test traceability matrix." | Defined 17 planned tests across Unit, API, UI, and E2E layers with clear acceptance criteria links. |
| 6 | "Design Prisma schema models for RequesterUser, Ticket, Attachment, Category, and RelatedSystem with idempotent seed data." | Planned database entities, foreign keys, enums, soft-removal fields, and repeatable seeding. |
| 7 | "Implement TDD Supertest suite for ticket creation, validation errors, and unique ticket number generation." | Planned failing API tests before writing backend controller logic. |
| 8 | "Implement React CreateTicket component with Zen Green styling, field validation, and busy state." | Planned UI form adhering to inline error placement and design tokens. |
| 9 | "Implement Issue #15 Development Requester selector and context: TDD API test for GET /api/requesters, endpoint with active user filtering, RequesterContext, Zen Green Header, and UI test." | Implemented API-03 (Supertest) & UI-01 (Vitest), filtered inactive users, created RequesterContext with localStorage persistence, and Header with Change Requester action. |
| 10 | "Implement Issue #17 Create Ticket API, form UI, and validation: UNIT-01 (ticket number), UNIT-02 (file validator), GET /api/related-systems, POST /api/tickets, CreateTicket React form with inline validation and state retention, UI-02, UI-03." | Implemented full ticket creation lifecycle, robust input sanitization, inline error states, Ticket Number generation, and automated tests. |
| 11 | "Implement Issue #19 My Tickets paginated list, search, filter, and sort: API-04 (isolation), API-05 (filtering/pagination), GET /api/tickets, MyTickets React component with Zen Green Theme, UI-04." | Implemented strict requester data ownership isolation, multi-column search, category/priority/status filters, pagination controls, and component tests. |

---

## My Reflection

Using an AI assistant within a Spec-Driven Development workflow allowed us to transform unstructured stakeholder requirements into rigorous, testable specifications and API contracts before touching any production code. Establishing clear business rules (such as unique ticket numbering formats, strict soft-removal rules, and multi-viewport layout constraints) upfront prevented architectural ambiguities and ensured full traceability from Acceptance Criteria to automated tests.
