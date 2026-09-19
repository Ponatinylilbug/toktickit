# Lab 3 REST API Specification: TokTickIT Users, Roles, IT Staff & Admin

## 1. Overview
This specification details all HTTP endpoints for TokTickIT Sprint 3.
Base URL: `http://localhost:3000/api`

### 1.1 Authentication & Header Conventions
All protected endpoints require an `Authorization` header formatted as:
```http
Authorization: Bearer <jwt-token>
```
Standard JSON responses include data payloads or error objects formatted as:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error explanation.",
    "details": []
  }
}
```

---

## 2. Authentication Endpoints

### 2.1 Login
- **Endpoint:** `POST /api/auth/login`
- **Access:** Public (Unauthenticated)
- **Request Body:**
  ```json
  {
    "email": "staff1@toktickit.local",
    "password": "Password123!"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": 2,
      "name": "Alex Triage",
      "email": "staff1@toktickit.local",
      "role": "IT_STAFF",
      "department": "IT Operations",
      "mustChangePassword": false
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Missing email or password.
  - `401 Unauthorized`: Invalid credentials.
  - `403 Forbidden`: Account is inactive (`ACCOUNT_INACTIVE`).

### 2.2 Logout
- **Endpoint:** `POST /api/auth/logout`
- **Access:** Authenticated (Any Role)
- **Request Body:** None
- **Response `200 OK`:**
  ```json
  {
    "message": "Successfully logged out"
  }
  ```

### 2.3 Get Current User Profile
- **Endpoint:** `GET /api/auth/me`
- **Access:** Authenticated (Any Role, including users needing password change)
- **Response `200 OK`:**
  ```json
  {
    "user": {
      "id": 2,
      "name": "Alex Triage",
      "email": "staff1@toktickit.local",
      "role": "IT_STAFF",
      "department": "IT Operations",
      "mustChangePassword": false
    }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Token missing or invalid.

### 2.4 Change Password
- **Endpoint:** `POST /api/auth/change-password`
- **Access:** Authenticated (Any Role)
- **Request Body:**
  ```json
  {
    "currentPassword": "OldPassword123!",
    "newPassword": "NewSecurePassword456!"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "message": "Password changed successfully",
    "mustChangePassword": false
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: New password does not meet complexity rules or matches old password.
  - `401 Unauthorized`: Incorrect current password.

---

## 3. IT Staff Ticket Queue & Detail Endpoints

### 3.1 Get Ticket Queue
- **Endpoint:** `GET /api/staff/tickets`
- **Access:** IT_STAFF, ADMINISTRATOR
- **Query Parameters:**
  - `search` (string, optional): Search keyword in summary, description, ticketNumber, requester name.
  - `status` (string, optional): Filter by `TicketStatus` (`NEW`, `OPEN`, `IN_PROGRESS`, etc.).
  - `priority` (string, optional): Filter by `itPriority` or `requestedPriority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
  - `ownerId` (number | "unassigned" | "me", optional): Filter by assigned staff ID.
  - `categoryId` (number, optional): Filter by category.
  - `sortBy` (string, default: `createdAt`): `createdAt` | `updatedAt` | `itPriority` | `ticketNumber`.
  - `sortOrder` (string, default: `desc`): `asc` | `desc`.
  - `page` (number, default: 1): Page number.
  - `pageSize` (number, default: 10): Items per page.
- **Response `200 OK`:**
  ```json
  {
    "data": [
      {
        "id": 12,
        "ticketNumber": "TKT-2026-000012",
        "summary": "VPN connection dropping repeatedly",
        "requestedPriority": "HIGH",
        "itPriority": "HIGH",
        "currentStatus": "IN_PROGRESS",
        "createdAt": "2026-09-19T08:00:00.000Z",
        "updatedAt": "2026-09-19T08:30:00.000Z",
        "requester": {
          "id": 5,
          "name": "Somchai Jaidee",
          "email": "somchai@toktickit.local",
          "department": "Engineering"
        },
        "owner": {
          "id": 2,
          "name": "Alex Triage",
          "email": "staff1@toktickit.local"
        },
        "category": { "id": 1, "name": "Network" },
        "relatedSystem": { "id": 3, "name": "VPN" }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalCount": 45,
      "totalPages": 5
    }
  }
  ```

### 3.2 Get Staff Ticket Detail
- **Endpoint:** `GET /api/staff/tickets/:id`
- **Access:** IT_STAFF, ADMINISTRATOR
- **Response `200 OK`:**
  ```json
  {
    "ticket": {
      "id": 12,
      "ticketNumber": "TKT-2026-000012",
      "summary": "VPN connection dropping repeatedly",
      "description": "Every 10 minutes the VPN tunnel disconnects while connected to campus Wi-Fi.",
      "requestedPriority": "HIGH",
      "itPriority": "HIGH",
      "currentStatus": "IN_PROGRESS",
      "createdAt": "2026-09-19T08:00:00.000Z",
      "updatedAt": "2026-09-19T08:30:00.000Z",
      "requester": {
        "id": 5,
        "name": "Somchai Jaidee",
        "email": "somchai@toktickit.local",
        "department": "Engineering"
      },
      "owner": {
        "id": 2,
        "name": "Alex Triage",
        "email": "staff1@toktickit.local"
      },
      "category": { "id": 1, "name": "Network" },
      "relatedSystem": { "id": 3, "name": "VPN" },
      "attachments": []
    }
  }
  ```
- **Error Responses:**
  - `404 Not Found`: Ticket does not exist.

### 3.3 Assign Ticket Ownership
- **Endpoint:** `PATCH /api/staff/tickets/:id/assign`
- **Access:** IT_STAFF, ADMINISTRATOR
- **Request Body:**
  ```json
  {
    "ownerId": 2
  }
  ```
  *(Pass `null` to unassign)*
- **Response `200 OK`:**
  ```json
  {
    "message": "Ticket ownership updated",
    "ticket": {
      "id": 12,
      "ownerId": 2,
      "owner": {
        "id": 2,
        "name": "Alex Triage"
      }
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Assigned user is not an active IT Staff or Administrator.

### 3.4 Update IT Priority
- **Endpoint:** `PATCH /api/staff/tickets/:id/priority`
- **Access:** IT_STAFF, ADMINISTRATOR
- **Request Body:**
  ```json
  {
    "itPriority": "URGENT"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "message": "IT Priority updated",
    "ticket": {
      "id": 12,
      "itPriority": "URGENT"
    }
  }
  ```

### 3.5 Update Ticket Status
- **Endpoint:** `PATCH /api/staff/tickets/:id/status`
- **Access:** IT_STAFF, ADMINISTRATOR
- **Request Body:**
  ```json
  {
    "status": "RESOLVED"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "message": "Ticket status updated",
    "ticket": {
      "id": 12,
      "currentStatus": "RESOLVED"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid status transition.

---

## 4. Communication Endpoints (Comments & Internal Notes)

### 4.1 Get Public Comments
- **Endpoint:** `GET /api/tickets/:id/comments`
- **Access:** Requester (only own ticket), IT_STAFF, ADMINISTRATOR
- **Response `200 OK`:**
  ```json
  {
    "comments": [
      {
        "id": 1,
        "ticketId": 12,
        "author": {
          "id": 2,
          "name": "Alex Triage",
          "role": "IT_STAFF"
        },
        "message": "We have reconfigured your gateway profile. Please test again.",
        "isSystemGenerated": false,
        "createdAt": "2026-09-19T09:00:00.000Z"
      }
    ]
  }
  ```

### 4.2 Post Public Comment
- **Endpoint:** `POST /api/tickets/:id/comments`
- **Access:** Requester (only own ticket), IT_STAFF, ADMINISTRATOR
- **Request Body:**
  ```json
  {
    "message": "Thank you! Testing now."
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "comment": {
      "id": 2,
      "ticketId": 12,
      "authorId": 5,
      "message": "Thank you! Testing now.",
      "isSystemGenerated": false,
      "createdAt": "2026-09-19T09:05:00.000Z"
    }
  }
  ```

### 4.3 Get Internal Notes
- **Endpoint:** `GET /api/tickets/:id/notes`
- **Access:** IT_STAFF, ADMINISTRATOR only (Strictly blocks Requesters with `403`)
- **Response `200 OK`:**
  ```json
  {
    "notes": [
      {
        "id": 1,
        "ticketId": 12,
        "author": {
          "id": 2,
          "name": "Alex Triage",
          "role": "IT_STAFF"
        },
        "note": "Root cause was DHCP lease exhaustion on Pool B.",
        "createdAt": "2026-09-19T08:45:00.000Z"
      }
    ]
  }
  ```

### 4.4 Post Internal Note
- **Endpoint:** `POST /api/tickets/:id/notes`
- **Access:** IT_STAFF, ADMINISTRATOR only
- **Request Body:**
  ```json
  {
    "note": "Restarted radius daemon. Monitoring packet drop rates."
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "note": {
      "id": 2,
      "ticketId": 12,
      "authorId": 2,
      "note": "Restarted radius daemon. Monitoring packet drop rates.",
      "createdAt": "2026-09-19T09:10:00.000Z"
    }
  }
  ```

---

## 5. Administrator User Management Endpoints

### 5.1 List Users
- **Endpoint:** `GET /api/admin/users`
- **Access:** ADMINISTRATOR only
- **Query Parameters:**
  - `search` (string, optional): Search by name or email.
  - `role` (string, optional): Filter by `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`.
  - `isActive` (boolean, optional): Filter active/inactive.
  - `page` (number, default: 1): Page number.
  - `pageSize` (number, default: 20): Items per page.
- **Response `200 OK`:**
  ```json
  {
    "users": [
      {
        "id": 1,
        "name": "System Administrator",
        "email": "admin@toktickit.local",
        "role": "ADMINISTRATOR",
        "department": "IT Administration",
        "isActive": true,
        "mustChangePassword": false,
        "createdAt": "2026-09-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalCount": 15,
      "totalPages": 1
    }
  }
  ```

### 5.2 Create User
- **Endpoint:** `POST /api/admin/users`
- **Access:** ADMINISTRATOR only
- **Request Body:**
  ```json
  {
    "name": "Jane Developer",
    "email": "jane@toktickit.local",
    "role": "REQUESTER",
    "department": "Engineering",
    "temporaryPassword": "InitialPassword123!"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "user": {
      "id": 16,
      "name": "Jane Developer",
      "email": "jane@toktickit.local",
      "role": "REQUESTER",
      "department": "Engineering",
      "isActive": true,
      "mustChangePassword": true
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Email already registered or invalid fields.

### 5.3 Update User
- **Endpoint:** `PATCH /api/admin/users/:id`
- **Access:** ADMINISTRATOR only
- **Request Body:**
  ```json
  {
    "name": "Jane Lead",
    "department": "Engineering Management",
    "role": "REQUESTER",
    "isActive": true
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "user": {
      "id": 16,
      "name": "Jane Lead",
      "email": "jane@toktickit.local",
      "role": "REQUESTER",
      "department": "Engineering Management",
      "isActive": true
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Cannot deactivate or demote the sole active Administrator; cannot self-deactivate.

### 5.4 Reset User Password
- **Endpoint:** `POST /api/admin/users/:id/reset-password`
- **Access:** ADMINISTRATOR only
- **Request Body:**
  ```json
  {
    "temporaryPassword": "TempPassword999!"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "message": "User password reset successfully",
    "mustChangePassword": true
  }
  ```
