# Lab 2 REST API Specification: TokTickIT Requester API Contract

## 1. Overview & Base Conventions

- **Base URL:** `http://localhost:3000/api`
- **Content-Type:** `application/json` (unless handling multipart file uploads)
- **Error Response Shape:**
  ```json
  {
    "error": "Human-readable error summary",
    "details": ["Optional list of specific field validation errors"],
    "statusCode": 400
  }
  ```

---

## 2. API Endpoints

### 2.1 Get Active Development Requesters
- **Endpoint:** `GET /api/requesters`
- **Description:** Returns all active simulated requesters for selection.
- **Query Parameters:** None
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "name": "Jennifer Anderson",
      "email": "jennifer.anderson@example.com",
      "department": "Engineering",
      "isActive": true
    },
    {
      "id": 2,
      "name": "Michael Brown",
      "email": "michael.brown@example.com",
      "department": "Design",
      "isActive": true
    }
  ]
  ```

---

### 2.2 Get Active Categories
- **Endpoint:** `GET /api/categories`
- **Description:** Returns seeded active ticket categories.
- **Response (200 OK):**
  ```json
  [
    { "id": 1, "name": "Account and Access" },
    { "id": 2, "name": "Hardware" },
    { "id": 3, "name": "Software" },
    { "id": 4, "name": "Network" }
  ]
  ```

---

### 2.3 Get Active Related Systems
- **Endpoint:** `GET /api/related-systems`
- **Description:** Returns seeded active IT related systems.
- **Response (200 OK):**
  ```json
  [
    { "id": 1, "name": "Email" },
    { "id": 2, "name": "Campus Wi-Fi" },
    { "id": 3, "name": "VPN" },
    { "id": 4, "name": "LEB2 App" },
    { "id": 5, "name": "Grade Submission App" },
    { "id": 6, "name": "Printer" },
    { "id": 7, "name": "Corporate Laptop" }
  ]
  ```

---

### 2.4 Create a Support Ticket
- **Endpoint:** `POST /api/tickets`
- **Content-Type:** `application/json` or `multipart/form-data`
- **Headers:** `x-requester-id: <id>` (or `requesterId` in body)
- **Request Body (JSON):**
  ```json
  {
    "requesterId": 1,
    "categoryId": 2,
    "relatedSystemId": 7,
    "requestedPriority": "MEDIUM",
    "summary": "Laptop battery drains quickly after OS update",
    "description": "My laptop battery is draining much faster than usual even when idle."
  }
  ```
- **Validation Rules:**
  - `requesterId`: Required, must correspond to an active `RequesterUser`.
  - `categoryId`: Required, must exist in `Category`.
  - `relatedSystemId`: Required, must exist in `RelatedSystem`.
  - `requestedPriority`: Enum `LOW`, `MEDIUM`, `HIGH`, `URGENT` (default `MEDIUM`).
  - `summary`: Required string, 5–100 chars (trimmed).
  - `description`: Required string, 10–2000 chars (trimmed).
- **Response (201 Created):**
  ```json
  {
    "id": 101,
    "ticketNumber": "TKT-2026-000101",
    "requesterId": 1,
    "categoryId": 2,
    "relatedSystemId": 7,
    "requestedPriority": "MEDIUM",
    "currentStatus": "New",
    "summary": "Laptop battery drains quickly after OS update",
    "description": "My laptop battery is draining much faster than usual even when idle.",
    "createdAt": "2026-09-03T10:00:00.000Z",
    "updatedAt": "2026-09-03T10:00:00.000Z",
    "attachments": []
  }
  ```
- **Error Statuses:**
  - `400 Bad Request`: Validation failure (missing summary, invalid category, etc.).
  - `422 Unprocessable Entity`: Inactive or non-existent requester.

---

### 2.5 Query My Tickets (Paginated List)
- **Endpoint:** `GET /api/tickets`
- **Query Parameters:**
  - `requesterId` (Required integer): The ID of the requester whose tickets to fetch.
  - `search` (Optional string): Search string matched against `summary`, `description`, or `ticketNumber`.
  - `categoryId` (Optional integer): Filter by Category ID.
  - `requestedPriority` (Optional string): Filter by Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
  - `currentStatus` (Optional string): Filter by Status (`New`, etc.).
  - `page` (Optional integer, default `1`): Page number.
  - `pageSize` (Optional integer, default `10`, max `50`): Number of items per page.
  - `sortBy` (Optional string, default `createdAt`): `createdAt`, `ticketNumber`, `requestedPriority`.
  - `sortOrder` (Optional string, default `desc`): `asc` or `desc`.
- **Response (200 OK):**
  ```json
  {
    "items": [
      {
        "id": 101,
        "ticketNumber": "TKT-2026-000101",
        "summary": "Laptop battery drains quickly",
        "category": { "id": 2, "name": "Hardware" },
        "relatedSystem": { "id": 7, "name": "Corporate Laptop" },
        "requestedPriority": "MEDIUM",
        "currentStatus": "New",
        "createdAt": "2026-09-03T10:00:00.000Z",
        "updatedAt": "2026-09-03T10:00:00.000Z",
        "attachmentCount": 1
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalItems": 1,
      "totalPages": 1
    }
  }
  ```
- **Error Statuses:**
  - `400 Bad Request`: Missing or invalid `requesterId` query parameter.

---

### 2.6 Get Ticket Details (with Ownership Enforcement)
- **Endpoint:** `GET /api/tickets/:id`
- **Headers / Query:** `requesterId: <id>` (passed in header `x-requester-id` or query param)
- **Description:** Returns full ticket details and associated attachments. Rejects access if the ticket belongs to a different requester.
- **Response (200 OK):**
  ```json
  {
    "id": 101,
    "ticketNumber": "TKT-2026-000101",
    "requester": { "id": 1, "name": "Jennifer Anderson", "email": "jennifer.anderson@example.com" },
    "category": { "id": 2, "name": "Hardware" },
    "relatedSystem": { "id": 7, "name": "Corporate Laptop" },
    "requestedPriority": "MEDIUM",
    "currentStatus": "New",
    "summary": "Laptop battery drains quickly",
    "description": "My laptop battery is draining much faster than usual even when idle.",
    "createdAt": "2026-09-03T10:00:00.000Z",
    "updatedAt": "2026-09-03T10:00:00.000Z",
    "attachments": [
      {
        "id": 501,
        "fileName": "501_battery_log.png",
        "originalName": "battery_log.png",
        "fileSize": 145200,
        "mimeType": "image/png",
        "isRemoved": false,
        "createdAt": "2026-09-03T10:00:00.000Z"
      }
    ]
  }
  ```
- **Error Statuses:**
  - `403 Forbidden`: Ticket exists but belongs to a different requester.
  - `404 Not Found`: Ticket does not exist.

---

### 2.7 Upload Attachment to Existing Ticket
- **Endpoint:** `POST /api/tickets/:id/attachments`
- **Content-Type:** `multipart/form-data`
- **Headers:** `x-requester-id: <id>`
- **Form Fields:** `file` (binary payload)
- **Validation Rules:**
  - Ticket must be owned by the requesting `requesterId`.
  - MIME type must be one of `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
  - File size must be `≤ 5,242,880 bytes` (5MB).
  - Total active (non-removed) attachments for this ticket must be `< 5`.
- **Response (201 Created):**
  ```json
  {
    "id": 502,
    "ticketId": 101,
    "originalName": "system_diagnostics.pdf",
    "fileSize": 524000,
    "mimeType": "application/pdf",
    "isRemoved": false,
    "createdAt": "2026-09-03T10:15:00.000Z"
  }
  ```
- **Error Statuses:**
  - `400 Bad Request`: Unsupported file type or file > 5MB.
  - `403 Forbidden`: Requester does not own this ticket.
  - `409 Conflict`: Ticket already has 5 active attachments.

---

### 2.8 Download Active Attachment
- **Endpoint:** `GET /api/attachments/:id/download`
- **Headers / Query:** `requesterId: <id>`
- **Description:** Streams the raw file content for download.
- **Response (200 OK):** Binary stream with `Content-Disposition: attachment; filename="battery_log.png"`.
- **Error Statuses:**
  - `403 Forbidden`: Requesting user does not own the parent ticket.
  - `404 Not Found`: Attachment does not exist.
  - `410 Gone` (or `404`): Attachment has been soft-removed (`isRemoved: true`).

---

### 2.9 Soft-Remove Attachment
- **Endpoint:** `PATCH /api/attachments/:id/soft-remove`
- **Headers:** `x-requester-id: <id>`
- **Request Body (JSON):**
  ```json
  {
    "removalReason": "Uploaded incorrect diagnostic screenshot"
  }
  ```
- **Validation Rules:**
  - `removalReason` is required string (min 3 chars).
  - User must own the parent ticket.
  - Attachment must currently be active (`isRemoved === false`).
- **Response (200 OK):**
  ```json
  {
    "id": 501,
    "ticketId": 101,
    "originalName": "battery_log.png",
    "isRemoved": true,
    "removedAt": "2026-09-03T11:00:00.000Z",
    "removalReason": "Uploaded incorrect diagnostic screenshot"
  }
  ```
- **Error Statuses:**
  - `400 Bad Request`: Missing or empty `removalReason`.
  - `403 Forbidden`: User does not own the parent ticket.
  - `404 Not Found`: Attachment not found.
  - `409 Conflict`: Attachment is already removed.
