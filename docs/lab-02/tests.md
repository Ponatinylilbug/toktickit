# Lab 2 Test Plan and Traceability: TokTickIT Requester MVP

## 1. Test Strategy
Testing follows a multi-tiered Test-Driven Development (TDD) approach:
- **Unit Tests:** Validate ticket number generation, input sanitization/trimming, file validation rules, and error formatting in isolation.
- **API Integration Tests (Supertest):** Validate server routes against business rules, database transactions, pagination, ownership isolation, file upload/streaming, and error codes.
- **UI Component Tests (Vitest + React Testing Library):** Validate form validation states, error messages, user context switching, pagination rendering, modal interactions, and loading/empty states.
- **End-to-End Tests (Playwright):** Simulate the complete requester journey from user selection to ticket creation, attachment upload, My Tickets filtering, and soft-removal across responsive viewports.

---

## 2. Planned-Test Table

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **UNIT-01** | Unit | BR-01, FR-04 | Ticket number formatting helper | Returns string matching `^TKT-\d{4}-\d{6}$` | `server/tests/lab-02/unit/ticket-number.test.ts` | Planned |
| **UNIT-02** | Unit | BR-10, BR-11 | File type and size validator | Rejects non-images/non-PDF and files > 5MB | `server/tests/lab-02/unit/file-validator.test.ts` | Planned |
| **API-01** | API | AC-01, BR-02 | Create valid ticket via API | Returns 201 Created with status `New` and unique Ticket Number | `server/tests/lab-02/create-ticket.api.test.ts` | Planned |
| **API-02** | API | AC-02, BR-06 | Create ticket validation failure (missing summary) | Returns 400 with specific field error message | `server/tests/lab-02/create-ticket.api.test.ts` | Planned |
| **API-03** | API | AC-06, BR-04 | List active Development Requesters | Returns 200 with only active requesters (no inactive users) | `server/tests/lab-02/requesters.api.test.ts` | Planned |
| **API-04** | API | AC-07, BR-05 | My Tickets ownership filtering | Returns only tickets for specified `requesterId` | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| **API-05** | API | AC-08, BR-15 | My Tickets search, filter, and pagination | Returns filtered items with matching pagination metadata | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| **API-06** | API | AC-09, AC-10 | Ticket Detail retrieval & ownership check | Returns 200 for owner; returns 403 for other requester | `server/tests/lab-02/ticket-detail.api.test.ts` | Planned |
| **API-07** | API | AC-03, AC-05 | Upload attachment to ticket | Returns 201 Created; returns 409 when exceeding 5 files | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| **API-08** | API | AC-11, AC-13 | Download active vs soft-removed attachment | Returns 200 stream for active; 410/404 for removed | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| **API-09** | API | AC-12, BR-13 | Soft-remove attachment with reason | Returns 200; sets `isRemoved: true` & persists reason | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| **UI-01** | UI | AC-06, AC-07 | Requester Selection dropdown & header display | Switches active user and stores context in app state | `client/tests/lab-02/RequesterSelector.test.tsx` | Planned |
| **UI-02** | UI | AC-02, BR-14 | Create Ticket inline validation & state retention | Shows inline error messages on invalid submit; keeps values | `client/tests/lab-02/CreateTicket.test.tsx` | Planned |
| **UI-03** | UI | AC-01 | Create Ticket submission success dialog | Displays generated Ticket Number upon successful creation | `client/tests/lab-02/CreateTicket.test.tsx` | Planned |
| **UI-04** | UI | AC-08 | My Tickets table pagination & filter interactions | Updates table data when filter changes or page clicked | `client/tests/lab-02/MyTickets.test.tsx` | Planned |
| **UI-05** | UI | AC-09, AC-12 | Ticket Detail read-only view & soft-remove modal | Shows read-only fields; opens modal and triggers remove | `client/tests/lab-02/RequesterTicketDetail.test.tsx` | Planned |
| **UI-06** | UI | AC-04, AC-05 | AttachmentSection file picker rules | Rejects >5MB / invalid types and disables when 5 files | `client/tests/lab-02/AttachmentSection.test.tsx` | Planned |
| **E2E-01** | E2E | AC-01..AC-15 | Complete Requester Flow across viewports | Full creation, search, detail inspection, and soft removal | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |

---

## 3. Acceptance-Criterion Traceability Matrix

| Acceptance Criterion | Description | Covered By Test IDs |
| :--- | :--- | :--- |
| **AC-01** | Create Valid Ticket & display official number | `API-01`, `UI-03`, `E2E-01` |
| **AC-02** | Form validation errors and input preservation | `API-02`, `UI-02`, `E2E-01` |
| **AC-03** | Attachment upload on ticket create | `API-07`, `UI-06`, `E2E-01` |
| **AC-04** | Invalid attachment format/size rejection | `UNIT-02`, `UI-06` |
| **AC-05** | Max 5 active attachments per ticket | `API-07`, `UI-06` |
| **AC-06** | Requester selector lists active users only | `API-03`, `UI-01` |
| **AC-07** | Requester switching isolates ticket list | `API-04`, `UI-01`, `E2E-01` |
| **AC-08** | My Tickets search, filter, sort, and pagination | `API-05`, `UI-04`, `E2E-01` |
| **AC-09** | Ticket Detail read-only layout | `API-06`, `UI-05`, `E2E-01` |
| **AC-10** | Cross-requester unauthorized access rejected (403) | `API-06` |
| **AC-11** | Active attachment download | `API-08`, `UI-05` |
| **AC-12** | Soft-removal with mandatory reason | `API-09`, `UI-05`, `E2E-01` |
| **AC-13** | Blocked download for soft-removed files | `API-08` |
| **AC-14** | API failure error banner with form preserved | `UI-02` |
| **AC-15** | Responsive layout across Desktop, Tablet, Mobile | `E2E-01` |

---

## 4. Responsive and Visual Checklist

- [ ] **Desktop (≥992px):** Centered main container, full multi-column form, complete table columns.
- [ ] **Tablet (768px–991px):** Two-column form layout, table with horizontal scroll protection.
- [ ] **Mobile (<768px):** Vertical single-column stack, card list representation for tickets, large touch targets.
- [ ] **Color Contrast & Theme:** Proper `#006B3C` primary green and Zen Green palette adherence.

---

## 5. Test Execution Commands

```bash
# Run server test suites
npm --prefix server test

# Run client test suites
npm --prefix client test

# Run end-to-end tests
npx playwright test
```

---

## 6. Final Results
*(To be populated after implementation and test execution)*

```bash
# Server Test Results:
# [Pending implementation]

# Client Test Results:
# [Pending implementation]

# E2E Test Results:
# [Pending implementation]
```

---

## 7. Known Limitations or Deferred Tests
- Authentication and role permission tests are deferred to Lab 3.
- IT Staff workflow tests are deferred to subsequent sprints.
