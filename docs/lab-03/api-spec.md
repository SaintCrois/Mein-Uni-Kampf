# Lab 3 REST API Contract

## 1. Authentication & Security Model
- **Mechanism**: Authenticated sessions are established using standard HTTP-only, secure cookies (or `Authorization: Bearer <token>`).
- **Session Payload**: Encodes user ID, email, and role.
- **CSRF & Security**: Credentials are encrypted; password hashes use bcrypt ($\ge 10$ rounds). Passwords are never returned in responses.
- **Context Extraction**: The server extracts authenticated user identity directly from the verified token; client-supplied `requesterId` parameters are completely disregarded.

---

## 2. Global Response Conventions & Error Format

All error responses adhere to a consistent JSON structure:
```json
{
  "error": "Human readable error message",
  "code": "ERROR_CODE_STRING",
  "details": []
}
```

### Standard Status Codes:
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Input validation failed, malformed payload, or invalid business rule state.
- `401 Unauthorized`: Missing, expired, or invalid authentication credentials.
- `403 Forbidden`: Authenticated user lacks permission for the requested action or resource (or user must change initial password).
- `404 Not Found`: Target resource does not exist.
- `409 Conflict`: Conflict with existing data (e.g. duplicate email address).
- `500 Internal Server Error`: Unexpected server or database exception.

---

## 3. Endpoints Specification

### 3.1 Authentication

#### `POST /api/auth/login`
- **Access**: Public.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "user": {
        "id": 1,
        "name": "Narin Chaiyo",
        "email": "narin@example.com",
        "role": "REQUESTER",
        "mustChangePassword": false
      }
    }
    ```
  - `401 Unauthorized`: Invalid email or password, or inactive account.

#### `POST /api/auth/logout`
- **Access**: Authenticated.
- **Request Body**: Empty.
- **Responses**:
  - `200 OK`: `{ "message": "Successfully logged out." }`

#### `GET /api/auth/me`
- **Access**: Authenticated.
- **Responses**:
  - `200 OK`: Returns authenticated user profile.
  - `401 Unauthorized`: Not logged in.

#### `POST /api/auth/change-password`
- **Access**: Authenticated (including users with `mustChangePassword === true`).
- **Request Body**:
  ```json
  {
    "currentPassword": "InitialPassword123!",
    "newPassword": "SecureNewPassword2026!"
  }
  ```
- **Responses**:
  - `200 OK`: `{ "message": "Password changed successfully." }`
  - `400 Bad Request`: New password does not meet requirements (min 8 characters) or matches current password.
  - `401 Unauthorized`: Current password verification failed.

---

### 3.2 Requester Ticketing (Lab 2 Continuity)

#### `GET /api/categories`
- **Access**: Authenticated.
- **Responses**: `200 OK` with list of active categories.

#### `GET /api/related-systems`
- **Access**: Authenticated.
- **Responses**: `200 OK` with list of active related systems.

#### `POST /api/tickets`
- **Access**: Authenticated `REQUESTER`.
- **Request Body**: Multi-part form or JSON with `categoryId`, `relatedSystemId`, `priority`, `summary`, `description`, and optional attachments.
- **Responses**: `201 Created` with created ticket object and generated `ticketNumber`.

#### `GET /api/tickets`
- **Access**: Authenticated `REQUESTER`.
- **Query Params**: `page`, `pageSize`, `search`, `status`, `priority`, `categoryId`, `sortBy`, `sortOrder`.
- **Behavior**: Strictly returns tickets where `requesterId === currentUser.id`.
- **Responses**: `200 OK` with `{ "items": [], "page": 1, "pageSize": 10, "totalItems": 24, "totalPages": 3 }`.

#### `GET /api/tickets/:id`
- **Access**: Authenticated `REQUESTER` (must own ticket) or `IT_STAFF` / `ADMINISTRATOR`.
- **Responses**:
  - `200 OK`: Complete ticket detail.
  - `403 Forbidden`: Requester does not own ticket.
  - `404 Not Found`: Ticket does not exist.

#### `POST /api/tickets/:id/resolve-indicator`
- **Access**: Authenticated `REQUESTER` (must own ticket).
- **Request Body**: `{ "resolved": true }`
- **Responses**:
  - `200 OK`: Updates `requesterResolvedIndicator` flag.
  - `403 Forbidden`: User does not own ticket.

#### `POST /api/tickets/:id/attachments`
- **Access**: Authenticated `REQUESTER` (must own ticket) or `IT_STAFF`.
- **Restrictions**: Max 5 active files per ticket, max 5 MiB per file, types: JPG, PNG, WEBP, PDF.
- **Responses**: `201 Created` with attachment metadata.

#### `GET /api/tickets/:id/attachments/:attachmentId/download`
- **Access**: Authenticated `REQUESTER` (must own ticket) or `IT_STAFF` / `ADMINISTRATOR`.
- **Responses**:
  - `200 OK`: Binary file stream.
  - `403 Forbidden`: Removed attachment (`status === "REMOVED"`) or cross-requester ownership violation.

#### `DELETE /api/tickets/:id/attachments/:attachmentId`
- **Access**: Authenticated `REQUESTER` (must own ticket) or `IT_STAFF`.
- **Request Body**: `{ "reason": "Uploaded wrong file" }`
- **Responses**: `200 OK` with updated attachment metadata (`status: "REMOVED"`).

---

### 3.3 Public Comments & Internal Notes

#### `GET /api/tickets/:id/comments`
- **Access**: Authenticated `REQUESTER` (owns ticket), `IT_STAFF`, or `ADMINISTRATOR`.
- **Responses**:
  - `200 OK`:
    ```json
    [
      {
        "id": 1,
        "author": { "id": 2, "name": "Aj. Toey", "role": "IT_STAFF" },
        "content": "Please restart your router and try again.",
        "createdAt": "2026-09-12T10:30:00Z"
      }
    ]
    ```

#### `POST /api/tickets/:id/comments`
- **Access**: Authenticated `REQUESTER` (owns ticket), `IT_STAFF`, or `ADMINISTRATOR`.
- **Request Body**: `{ "content": "The reboot solved the issue, thank you!" }`
- **Validation**: 1 to 2000 characters; whitespace-only rejected.
- **Responses**: `201 Created` with created comment object.

#### `GET /api/tickets/:id/notes`
- **Access**: Strictly `IT_STAFF` or `ADMINISTRATOR`.
- **Responses**:
  - `200 OK`: List of internal notes.
  - `403 Forbidden`: Request made by a `REQUESTER`.

#### `POST /api/tickets/:id/notes`
- **Access**: Strictly `IT_STAFF` or `ADMINISTRATOR`.
- **Request Body**: `{ "content": "Internal check: verified switch port 4 configuration." }`
- **Validation**: 1 to 2000 characters; whitespace-only rejected.
- **Responses**:
  - `201 Created`: Created internal note object.
  - `403 Forbidden`: Request made by a `REQUESTER`.

---

### 3.4 IT Staff Ticket Operations

#### `GET /api/staff/tickets`
- **Access**: `IT_STAFF` or `ADMINISTRATOR`.
- **Query Params**:
  - `search`: string (matches Ticket Number or Summary)
  - `status`: TicketStatus (or comma-separated values)
  - `categoryId`: number
  - `itPriority`: Priority
  - `ownership`: `all` | `unassigned` | `mine`
  - `sortBy`: `createdAt` | `ticketNumber` | `itPriority` | `status`
  - `sortOrder`: `asc` | `desc`
  - `page`: number (default: 1)
  - `pageSize`: number (default: 10, max: 50)
- **Responses**:
  - `200 OK`: `{ "items": [], "page": 1, "pageSize": 10, "totalItems": 45, "totalPages": 5 }`
  - `403 Forbidden`: Non-staff user.

#### `PATCH /api/staff/tickets/:id/claim`
- **Access**: `IT_STAFF` or `ADMINISTRATOR`.
- **Behavior**: Sets `ownerId = currentUser.id`. If status is `NEW`, advances status to `OPEN`.
- **Responses**: `200 OK` with updated ticket.

#### `PATCH /api/staff/tickets/:id/assign`
- **Access**: `IT_STAFF` or `ADMINISTRATOR`.
- **Request Body**: `{ "ownerId": 3 }` (must be active IT Staff or Administrator).
- **Behavior**: Assigns ticket owner. If status is `NEW`, advances to `OPEN`.
- **Responses**: `200 OK` with updated ticket.

#### `PATCH /api/staff/tickets/:id/priority`
- **Access**: `IT_STAFF` or `ADMINISTRATOR`.
- **Request Body**: `{ "itPriority": "HIGH" }`
- **Responses**: `200 OK` with updated ticket.

#### `PATCH /api/staff/tickets/:id/status`
- **Access**: `IT_STAFF` or `ADMINISTRATOR`.
- **Request Body**: `{ "status": "IN_PROGRESS" }`
- **Validation**: Validates transition against the BR-13 transition state machine.
- **Responses**:
  - `200 OK`: Updated ticket.
  - `400 Bad Request`: Invalid status transition.

---

### 3.5 Administrator User Management

#### `GET /api/admin/users`
- **Access**: Strictly `ADMINISTRATOR`.
- **Query Params**:
  - `search`: string (matches Name or Email)
  - `role`: Role (`REQUESTER` | `IT_STAFF` | `ADMINISTRATOR`)
- **Responses**:
  - `200 OK`:
    ```json
    [
      {
        "id": 1,
        "name": "Suthep Madarasmi",
        "email": "suthep@toktickit.local",
        "role": "ADMINISTRATOR",
        "isActive": true,
        "mustChangePassword": false,
        "createdAt": "2026-09-01T08:00:00Z"
      }
    ]
    ```
  - `403 Forbidden`: Non-administrator user.

#### `POST /api/admin/users`
- **Access**: Strictly `ADMINISTRATOR`.
- **Request Body**:
  ```json
  {
    "name": "Patcharak Plipat",
    "email": "patcharak@toktickit.local",
    "role": "IT_STAFF",
    "initialPassword": "Password123!",
    "isActive": true
  }
  ```
- **Validation**: Name required, valid email, exactly one role, password $\ge 8$ chars. Sets `mustChangePassword = true`.
- **Responses**:
  - `201 Created`: User object (excluding password hash).
  - `400 Bad Request`: Validation failure.
  - `409 Conflict`: Email already in use.

#### `PATCH /api/admin/users/:id`
- **Access**: Strictly `ADMINISTRATOR`.
- **Request Body**:
  ```json
  {
    "name": "Patcharak Plipat",
    "email": "patcharak.p@toktickit.local",
    "role": "IT_STAFF",
    "isActive": false
  }
  ```
- **Safety Validations**:
  - Cannot deactivate own account (`currentUser.id === targetId && isActive === false` $\to$ `400 Bad Request`).
  - Cannot deactivate or demote last active administrator ($\to$ `400 Bad Request`).
- **Responses**:
  - `200 OK`: Updated user profile.
  - `400 Bad Request`: Safety violation or invalid input.
  - `409 Conflict`: New email conflicts with existing user.

#### `POST /api/admin/users/:id/reset-password`
- **Access**: Strictly `ADMINISTRATOR`.
- **Request Body**:
  ```json
  {
    "initialPassword": "NewInitialPass123!"
  }
  ```
- **Behavior**: Updates password hash and sets `mustChangePassword = true`.
- **Responses**:
  - `200 OK`: `{ "message": "Initial password set. User must change password at next login." }`
  - `400 Bad Request`: Password does not meet 8-character minimum.
