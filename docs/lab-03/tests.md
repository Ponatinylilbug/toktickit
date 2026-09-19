# Lab 3 Test Plan & Traceability Matrix: TokTickIT Users, Roles, IT Staff & Admin

## 1. Traceability Matrix

| Test ID | Type | Target AC | What It Tests | Expected Result | Test File |
|---|---|---|---|---|---|
| `TEST-AUTH-01` | Backend | AC-01 | Login with valid credentials | Returns 200 OK, signed JWT token, user profile | `server/tests/lab-03/auth.api.test.ts` |
| `TEST-AUTH-02` | Backend | AC-01 | Login with wrong password | Returns 401 Unauthorized | `server/tests/lab-03/auth.api.test.ts` |
| `TEST-AUTH-03` | Backend | AC-02 | Login with inactive user account | Returns 403 Forbidden with `ACCOUNT_INACTIVE` code | `server/tests/lab-03/auth.api.test.ts` |
| `TEST-AUTH-04` | Backend | AC-03 | User with `mustChangePassword` accessing protected API | Returns 403 Forbidden with `PASSWORD_CHANGE_REQUIRED` | `server/tests/lab-03/auth.api.test.ts` |
| `TEST-AUTH-05` | Backend | AC-03 | User changing password with compliant format | Returns 200 OK, sets `mustChangePassword=false` | `server/tests/lab-03/auth.api.test.ts` |
| `TEST-AUTH-06` | Backend | AC-01 | GET `/api/auth/me` with valid Bearer token | Returns 200 OK with authenticated user profile | `server/tests/lab-03/auth.api.test.ts` |
| `TEST-RBAC-01` | Backend | AC-04 | Requester accessing `/api/staff/tickets` | Returns 403 Forbidden | `server/tests/lab-03/authorization.api.test.ts` |
| `TEST-RBAC-02` | Backend | AC-04 | IT Staff accessing `/api/admin/users` | Returns 403 Forbidden | `server/tests/lab-03/authorization.api.test.ts` |
| `TEST-RBAC-03` | Backend | AC-04 | Unauthenticated request to protected endpoints | Returns 401 Unauthorized | `server/tests/lab-03/authorization.api.test.ts` |
| `TEST-QUEUE-01` | Backend | AC-05 | IT Staff fetching ticket queue | Returns 200 OK with paginated tickets list | `server/tests/lab-03/staff-queue.api.test.ts` |
| `TEST-QUEUE-02` | Backend | AC-05 | IT Staff filtering queue by status & priority | Returns filtered subset matching criteria | `server/tests/lab-03/staff-queue.api.test.ts` |
| `TEST-QUEUE-03` | Backend | AC-05 | IT Staff searching tickets by keyword | Returns tickets containing keyword | `server/tests/lab-03/staff-queue.api.test.ts` |
| `TEST-DETAIL-01` | Backend | AC-06 | IT Staff claiming ticket ownership (assign self) | Updates ticket `ownerId`, returns 200 OK | `server/tests/lab-03/staff-ticket-detail.api.test.ts` |
| `TEST-DETAIL-02` | Backend | AC-07 | IT Staff updating IT priority | Updates `itPriority`, returns 200 OK | `server/tests/lab-03/staff-ticket-detail.api.test.ts` |
| `TEST-DETAIL-03` | Backend | AC-08 | IT Staff transitioning ticket status to IN_PROGRESS | Updates `currentStatus`, returns 200 OK | `server/tests/lab-03/staff-ticket-detail.api.test.ts` |
| `TEST-COMM-01` | Backend | AC-09 | Requester posting public comment on own ticket | Creates comment, returns 201 Created | `server/tests/lab-03/comments-notes.api.test.ts` |
| `TEST-COMM-02` | Backend | AC-10 | IT Staff posting internal note on ticket | Creates note, returns 201 Created | `server/tests/lab-03/comments-notes.api.test.ts` |
| `TEST-COMM-03` | Backend | AC-10 | Requester attempting to view internal notes | Returns 403 Forbidden | `server/tests/lab-03/comments-notes.api.test.ts` |
| `TEST-ADMIN-01` | Backend | AC-11 | Admin listing all users | Returns 200 OK with list of users | `server/tests/lab-03/users-admin.api.test.ts` |
| `TEST-ADMIN-02` | Backend | AC-11 | Admin provisioning a new user | Creates user with `mustChangePassword=true` | `server/tests/lab-03/users-admin.api.test.ts` |
| `TEST-ADMIN-03` | Backend | AC-12 | Admin attempting to deactivate sole active Admin | Returns 400 Bad Request with safety error | `server/tests/lab-03/users-admin.api.test.ts` |
| `TEST-ADMIN-04` | Backend | AC-13 | Admin resetting user password | Updates password hash, sets flag to true | `server/tests/lab-03/users-admin.api.test.ts` |
| `TEST-UI-AUTH-01` | Frontend | AC-01 | LoginPage renders and handles submission | Triggers login API and stores token | `client/tests/lab-03/Login.test.tsx` |
| `TEST-UI-PWD-01` | Frontend | AC-03 | ChangePasswordPage enforces complexity rules | Displays validation errors until valid | `client/tests/lab-03/ChangePassword.test.tsx` |
| `TEST-UI-QUEUE-01` | Frontend | AC-05 | StaffTicketQueue displays ticket table & filters | Updates query on filter selection | `client/tests/lab-03/StaffTicketQueue.test.tsx` |
| `TEST-UI-DETAIL-01` | Frontend | AC-06,07 | StaffTicketDetail allows assign & priority change | Renders controls and handles save | `client/tests/lab-03/StaffTicketDetail.test.tsx` |
| `TEST-UI-ADMIN-01` | Frontend | AC-11,12 | UserManagement renders user list and modal | Opens modal and submits new user | `client/tests/lab-03/UserManagement.test.tsx` |
| `TEST-E2E-01` | E2E | AC-01,03 | Full login and mandatory password change flow | Authenticates and accesses dashboard | `e2e/lab-03/authentication.spec.ts` |
| `TEST-E2E-02` | E2E | AC-05-08 | IT Staff queue and ticket lifecycle progression | Claims ticket, changes priority and status | `e2e/lab-03/staff-ticket-flow.spec.ts` |
| `TEST-E2E-03` | E2E | AC-11-13 | Administrator user management workflow | Provisions user, edits role, tests safety | `e2e/lab-03/user-administration.spec.ts` |
