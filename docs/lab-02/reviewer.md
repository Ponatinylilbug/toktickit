# Lab 2 — Peer Review Record

**Author:** Jinjuta Nunnarumit — 67070505210 — GitHub: @Ponatinylilbug  
**Peer reviewer:** Thitigant Surayotin — 67070505214 — GitHub: @thitigant

---

## Pull Requests I authored (reviewed by my partner)

| PR | Branch | Scope / Description | Reviewer verdict |
|:---|:---|:---|:---|
| #11 | `feature/lab2-spec-and-test-plan` | Sprint 2 specifications (`specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`) | Approved & Merged |
| #13 | `feature/lab2-database-and-seed` | Prisma schema, migrations, and idempotent seed script | Approved & Merged |
| #16 | `feature/lab2-requester-context` | Development Requester selector & context state | Approved & Merged |
| #18 | `feature/lab2-create-ticket` | Create Ticket API, form UI, and validation | Approved & Merged |
| #20 | `feature/lab2-my-tickets` | My Tickets paginated list, search, filter, and sort | Approved & Merged |
| #22 | `feature/lab2-ticket-detail-and-attachments` | Ticket detail view, attachment upload, download, and soft removal | Approved & Merged |
| #24 | `feature/lab2-e2e-and-responsive-review` | Playwright E2E tests, responsive validation, and documentation | Pending Review |

### Reviewer comments I received & My responses:
- **PR #11 (`feature/lab2-spec-and-test-plan`):**
  - **Reviewer comment:** Specifications are well structured and comprehensively cover all 15 acceptance criteria.
  - **How I responded:** Proceeded with TDD implementation following the planned test suite.
- **PR #16 (`feature/lab2-requester-context`):**
  - **Reviewer comment:** Header user context pill and localStorage persistence work smoothly across reloads.
  - **How I responded:** Kept context structure modular for reuse across Ticket and Detail views.
- **PR #18 (`feature/lab2-create-ticket`):**
  - **Reviewer comment:** Form validation cleanly preserves user inputs on failure.
  - **How I responded:** Ensured all field error states match Zen Green design tokens.
- **PR #20 (`feature/lab2-my-tickets`):**
  - **Reviewer comment:** Ticket isolation between simulated requesters functions properly.
  - **How I responded:** Added comprehensive filter reset and empty states.
- **PR #22 (`feature/lab2-ticket-detail-and-attachments`):**
  - **Reviewer comment:** Soft-removal preserves audit reason and disables download as required.
  - **How I responded:** Verified 410 Gone / 403 Forbidden rejection responses.

---

## Pull Requests I reviewed for my partner

| PR | Branch / Feature | Scope | My verdict |
|:---|:---|:---|:---|
| | | | |

### My comments & Partner's responses:
- **PR #:**
  - **My comment:** 
  - **Partner's response:** 
