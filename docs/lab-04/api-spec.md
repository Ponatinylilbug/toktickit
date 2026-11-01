# Lab 4 REST API Specification: TokTickIT Actions Taken, Dashboards, and Hardening

## 1. Authentication and Global Headers
All Lab 4 endpoints require a standard Bearer JWT token in the `Authorization` header:
```http
Authorization: Bearer <jwt-token>
```
Standard JSON responses are returned with `Content-Type: application/json`.

---

## 2. Actions Taken Endpoints

### 2.1 List Actions Taken for Ticket
- **Method & Path:** `GET /api/tickets/:id/actions`
- **Roles Permitted:** `REQUESTER` (owned tickets only), `IT_STAFF`, `ADMINISTRATOR`
- **Path Parameters:**
  - `id` (integer, required): Target ticket ID.
- **Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "ticketId": 101,
    "performedById": 2,
    "performedBy": {
      "id": 2,
      "name": "Alex Triage",
      "email": "staff1@toktickit.local"
    },
    "actionDate": "2026-05-12T09:14:00.000Z",
    "description": "Inspected battery health diagnostics; updated power management firmware.",
    "result": "Firmware update applied; discharge rate normalized.",
    "followUpRequired": true,
    "followUpNote": "Monitor battery discharge cycle over next 48 hours.",
    "attachmentNotes": "battery_diagnostic_report.pdf",
    "createdAt": "2026-05-12T09:14:00.000Z",
    "updatedAt": "2026-05-12T09:14:00.000Z"
  }
]
```
- **Error Responses:**
  - `401 Unauthorized`: Token missing or invalid.
  - `403 Forbidden`: Authenticated Requester does not own this ticket.
  - `404 Not Found`: Ticket with ID does not exist.

---

### 2.2 Create Action Taken
- **Method & Path:** `POST /api/tickets/:id/actions`
- **Roles Permitted:** `IT_STAFF`, `ADMINISTRATOR` (Requesters return 403 Forbidden)
- **Path Parameters:**
  - `id` (integer, required): Target ticket ID.
- **Request Body:**
```json
{
  "actionDate": "2026-05-12T09:14:00.000Z",
  "description": "Ran hardware diagnostics and reset network adapter.",
  "result": "Adapter passed all diagnostic tests.",
  "followUpRequired": true,
  "followUpNote": "Verify Wi-Fi reconnection after reboot.",
  "attachmentNotes": "hardware_log.txt"
}
```
- **Validation Rules:**
  - `description`: String, required, minimum 3 non-whitespace characters.
  - `result`: String, required, minimum 3 non-whitespace characters.
  - `followUpRequired`: Boolean, required.
  - `followUpNote`: String, required if `followUpRequired` is `true`. Must return 400 if empty when required.
- **Success Response (201 Created):**
```json
{
  "id": 2,
  "ticketId": 101,
  "performedById": 2,
  "performedBy": {
    "id": 2,
    "name": "Alex Triage",
    "email": "staff1@toktickit.local"
  },
  "actionDate": "2026-05-12T09:14:00.000Z",
  "description": "Ran hardware diagnostics and reset network adapter.",
  "result": "Adapter passed all diagnostic tests.",
  "followUpRequired": true,
  "followUpNote": "Verify Wi-Fi reconnection after reboot.",
  "attachmentNotes": "hardware_log.txt",
  "createdAt": "2026-05-12T09:14:00.000Z",
  "updatedAt": "2026-05-12T09:14:00.000Z"
}
```
- **Error Responses:**
  - `400 Bad Request`: Validation failure (e.g., missing description or missing followUpNote when followUpRequired=true).
  - `401 Unauthorized`: Missing or invalid token.
  - `403 Forbidden`: User role is `REQUESTER` or inactive.
  - `404 Not Found`: Ticket ID not found.

---

### 2.3 Update Action Taken
- **Method & Path:** `PUT /api/tickets/:id/actions/:actionId`
- **Roles Permitted:** `IT_STAFF`, `ADMINISTRATOR`
- **Path Parameters:**
  - `id` (integer): Target ticket ID.
  - `actionId` (integer): Target action taken ID.
- **Request Body:** (Partial or full update)
```json
{
  "description": "Updated diagnostic steps description.",
  "result": "Completed verification.",
  "followUpRequired": false,
  "followUpNote": null,
  "attachmentNotes": "diagnostics_v2.png"
}
```
- **Success Response (200 OK):** Returns updated Action Taken object.
- **Error Responses:**
  - `400 Bad Request`: Validation failure.
  - `401 Unauthorized`: Token error.
  - `403 Forbidden`: Unauthorized role.
  - `404 Not Found`: Action Taken not found under this ticket.

---

## 3. Role Dashboard Endpoints

### 3.1 Requester Dashboard Data
- **Method & Path:** `GET /api/dashboard/requester`
- **Roles Permitted:** `REQUESTER`, `ADMINISTRATOR`
- **Description:** Aggregates operational counts strictly scoped to the authenticated requester (`requesterId = req.user.id`).
- **Success Response (200 OK):**
```json
{
  "metrics": {
    "totalOpen": 3,
    "inProgress": 2,
    "resolved": 5,
    "closed": 12
  },
  "recentTickets": [
    {
      "id": 101,
      "ticketNumber": "TKT-2026-000101",
      "summary": "Laptop battery drains quickly",
      "currentStatus": "IN_PROGRESS",
      "requestedPriority": "MEDIUM",
      "updatedAt": "2026-05-12T09:14:00.000Z"
    }
  ]
}
```

---

### 3.2 IT Staff Dashboard Data
- **Method & Path:** `GET /api/dashboard/staff`
- **Roles Permitted:** `IT_STAFF`, `ADMINISTRATOR`
- **Description:** Returns authoritative operational queue metrics across all tickets and personal assignments.
- **Success Response (200 OK):**
```json
{
  "metrics": {
    "new": 14,
    "open": 23,
    "inProgress": 18,
    "waitingForRequester": 7,
    "myAssigned": 16,
    "unassigned": 12
  },
  "recentTickets": [
    {
      "id": 101,
      "ticketNumber": "TKT-2026-000101",
      "summary": "Laptop battery drains quickly",
      "currentStatus": "IN_PROGRESS",
      "actualPriority": "HIGH",
      "owner": {
        "id": 2,
        "name": "Alex Triage"
      },
      "updatedAt": "2026-05-12T09:14:00.000Z"
    }
  ]
}
```

---

## 4. Ticket Workflow & Resolution Endpoints

### 4.1 Update Ticket Status (Formal Transition)
- **Method & Path:** `PUT /api/staff/tickets/:id/status`
- **Roles Permitted:** `IT_STAFF`, `ADMINISTRATOR`
- **Request Body:**
```json
{
  "status": "RESOLVED",
  "expectedUpdatedAt": "2026-05-12T09:14:00.000Z"
}
```
- **Enforcement Rules:**
  - Status must be a valid enum: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`.
  - Matrix transitions must be valid according to BR-08.
  - If `expectedUpdatedAt` is provided and does not match the ticket's current `updatedAt`, return `409 Conflict`.
- **Success Response (200 OK):** Returns updated ticket object with refreshed `updatedAt`.
- **Error Responses:**
  - `400 Bad Request`: Disallowed transition (e.g. `NEW` to `CLOSED`).
  - `401 Unauthorized`: Missing credentials.
  - `403 Forbidden`: Non-staff user attempting formal status transition.
  - `404 Not Found`: Ticket not found.
  - `409 Conflict`: Stale update detected. Body:
```json
{
  "error": "STALE_UPDATE_CONFLICT",
  "message": "Ticket has been modified by another process. Please refresh and retry."
}
```

### 4.2 Requester Resolution Advisory
- **Method & Path:** `PUT /api/requester/tickets/:id/resolve-feedback`
- **Roles Permitted:** `REQUESTER` (owner only)
- **Request Body:**
```json
{
  "appearsResolved": true
}
```
- **Description:** Records the user's perception without transitioning the ticket status to `RESOLVED` directly (enforcing the Resolution Gate).
- **Success Response (200 OK):**
```json
{
  "message": "Requester feedback recorded. IT Staff will verify and formally resolve the ticket.",
  "problemAppearsResolved": true
}
```
