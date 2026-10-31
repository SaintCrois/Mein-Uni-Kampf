# Lab 4 REST API Contract
## TokTickIT: Actions Taken, Dashboards, and Final Regression Hardening

---

## 1. Authentication & Security Model
- **Mechanism**: Authenticated sessions continue using standard HTTP-only, secure cookies (or `Authorization: Bearer <token>`).
- **Session Extraction**: The backend extracts authenticated user identity and role directly from the verified session token. Client-supplied user/performer identity parameters are completely disregarded to prevent identity spoofing.
- **Role-Based Access Control (RBAC)**:
  - `REQUESTER`: Permitted to access personal dashboard, personal tickets, attachments, public comments, and read-only Actions Taken on owned tickets. Forbidden from staff queue, internal notes, user management, and writing Actions Taken.
  - `IT_STAFF`: Permitted to access staff dashboard, ticket queue, ticket detail, claim/assignment, priority changes, status transitions, public comments, internal notes, and creating/updating Actions Taken.
  - `ADMINISTRATOR`: Superset of IT Staff permissions plus access to admin dashboard and user management (`/api/admin/users`).

---

## 2. Global Conventions & Error Response Format

### 2.1. Standard Error Envelope
All error responses adhere strictly to the standardized JSON structure:
```json
{
  "error": "Human readable error description",
  "code": "MACHINE_READABLE_CODE",
  "details": []
}
```

### 2.2. Standard HTTP Status Codes
- `200 OK`: Request succeeded; returns data object or array.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Input validation failed, malformed payload, or invalid business rule state.
- `401 Unauthorized`: Missing, expired, or invalid authentication credentials.
- `403 Forbidden`: Authenticated user lacks permission for the requested action or target resource.
- `404 Not Found`: Target resource does not exist.
- `409 Conflict`: Concurrency conflict, stale update, or unique constraint violation.
- `500 Internal Server Error`: Uncaught server or database exception.

---

## 3. Endpoints Specification

### 3.1. Actions Taken Endpoints

#### `GET /api/tickets/:id/actions-taken`
- **Description**: Retrieves all Actions Taken sub-records for a ticket in ascending chronological order (`actionDateTime ASC, id ASC`).
- **Access**:
  - `REQUESTER`: Permitted **only** if the ticket belongs to the authenticated user (`ticket.requesterId === currentUser.id`).
  - `IT_STAFF` / `ADMINISTRATOR`: Permitted on any accessible ticket.
- **Path Parameters**:
  - `id` (integer, required): Target Ticket ID.
- **Responses**:
  - `200 OK`:
    ```json
    [
      {
        "id": 12,
        "ticketId": 105,
        "actionDateTime": "2026-09-24T14:30:00.000Z",
        "actionDescription": "Replaced faulty RAM module in slot 2 and ran memory diagnostic.",
        "result": "Diagnostics passed with zero errors. System stable.",
        "performedBy": {
          "id": 4,
          "name": "Somchai Jaidee",
          "role": "IT_STAFF"
        },
        "isFollowUpRequired": false,
        "followUpNote": null,
        "attachmentNotes": "memtest-results.pdf uploaded to ticket attachments.",
        "createdAt": "2026-09-24T14:35:00.000Z",
        "updatedAt": "2026-09-24T14:35:00.000Z"
      }
    ]
    ```
  - `401 Unauthorized`: Not authenticated.
  - `403 Forbidden`: Requester attempting to view Actions Taken on another user's ticket.
  - `404 Not Found`: Ticket does not exist.

---

#### `POST /api/tickets/:id/actions-taken`
- **Description**: Creates a new Action Taken record under the specified ticket. The performer is automatically bound to the authenticated user.
- **Access**: `IT_STAFF` or `ADMINISTRATOR` only.
- **Path Parameters**:
  - `id` (integer, required): Target Ticket ID.
- **Request Body**:
  ```json
  {
    "actionDateTime": "2026-09-24T14:30:00.000Z",
    "actionDescription": "Replaced faulty RAM module in slot 2.",
    "result": "Diagnostics passed. System stable.",
    "isFollowUpRequired": true,
    "followUpNote": "Monitor user system performance after 48 hours.",
    "attachmentNotes": "See memtest-results.pdf"
  }
  ```
- **Validation Rules**:
  - `actionDateTime`: ISO 8601 string. Optional; defaults to `new Date()` if omitted.
  - `actionDescription`: String, required, 3 to 2000 characters.
  - `result`: String, required, 1 to 2000 characters.
  - `isFollowUpRequired`: Boolean, optional, defaults to `false`.
  - `followUpNote`: String. **Mandatory** ($\ge 3$ characters, $\le 2000$ characters) if `isFollowUpRequired === true`. Must be omitted or `null` if `isFollowUpRequired === false`.
  - `attachmentNotes`: String, optional, max 1000 characters.
  - Client-supplied `performedById` is ignored.
- **Responses**:
  - `201 Created`: Returns newly created `ActionTaken` record.
  - `400 Bad Request`: Validation failure (e.g. `isFollowUpRequired` is true but `followUpNote` is empty).
  - `401 Unauthorized`: Not authenticated.
  - `403 Forbidden`: Requester attempting to create Action Taken.
  - `404 Not Found`: Ticket not found.

---

#### `PATCH /api/tickets/:id/actions-taken/:actionId`
- **Description**: Updates an existing Action Taken record. Performer identity (`performedById`) and `ticketId` remain immutable.
- **Access**: `IT_STAFF` or `ADMINISTRATOR`.
- **Path Parameters**:
  - `id` (integer, required): Target Ticket ID.
  - `actionId` (integer, required): Target Action Taken ID.
- **Request Body**:
  ```json
  {
    "actionDescription": "Replaced faulty RAM module in slot 2 and updated BIOS firmware.",
    "result": "Diagnostics passed and BIOS updated to v2.4.",
    "isFollowUpRequired": false,
    "followUpNote": null,
    "attachmentNotes": "Updated diagnostic log attached."
  }
  ```
- **Validation Rules**: Same rules as `POST`. If `isFollowUpRequired` is updated to `false`, `followUpNote` is automatically cleared to `null`.
- **Responses**:
  - `200 OK`: Returns updated `ActionTaken` record.
  - `400 Bad Request`: Invalid input or follow-up note validation failure.
  - `401 Unauthorized`: Not authenticated.
  - `403 Forbidden`: Requester attempting to edit.
  - `404 Not Found`: Action Taken or Ticket not found.

---

### 3.2. Operational Dashboard Endpoints

#### `GET /api/dashboards/requester`
- **Description**: Returns authoritative personal metrics and a list of the 5 most recently updated tickets owned by the authenticated Requester.
- **Access**: `REQUESTER` only.
- **Responses**:
  - `200 OK`:
    ```json
    {
      "metrics": {
        "totalOpenTickets": 3,
        "ticketsWaitingForRequester": 1,
        "recentlyResolvedTickets": 2,
        "attentionRequiredTickets": 1
      },
      "recentTickets": [
        {
          "id": 105,
          "ticketNumber": "TKT-2026-000105",
          "summary": "Laptop crashing during video calls",
          "status": "In Progress",
          "requestedPriority": "High",
          "category": "Hardware",
          "updatedAt": "2026-09-24T14:35:00.000Z",
          "hasActionsTaken": true,
          "actionsCount": 2,
          "requesterResolvedIndicator": false
        }
      ]
    }
    ```
  - `401 Unauthorized`: Not authenticated.
  - `403 Forbidden`: User does not hold `REQUESTER` role.

---

#### `GET /api/dashboards/staff`
- **Description**: Returns operational ticket backlog metrics, status/priority distributions, follow-up flags, and the top 5 urgent active tickets.
- **Access**: `IT_STAFF` or `ADMINISTRATOR`.
- **Responses**:
  - `200 OK`:
    ```json
    {
      "metrics": {
        "unassignedTickets": 4,
        "myAssignedTickets": 6,
        "followUpRequiredCount": 3
      },
      "ticketsByStatus": {
        "New": 4,
        "Open": 5,
        "In Progress": 7,
        "Waiting for Requester": 2,
        "Resolved": 8,
        "Closed": 15,
        "Reopened": 1,
        "Cancelled": 3
      },
      "ticketsByPriority": {
        "Low": 2,
        "Medium": 9,
        "High": 5,
        "Urgent": 2
      },
      "urgentTickets": [
        {
          "id": 108,
          "ticketNumber": "TKT-2026-000108",
          "summary": "Core switch in Server Room B offline",
          "status": "In Progress",
          "itPriority": "Urgent",
          "category": "Network",
          "owner": {
            "id": 4,
            "name": "Somchai Jaidee"
          },
          "updatedAt": "2026-09-24T15:10:00.000Z",
          "actionsCount": 3
        }
      ],
      "myRecentActions": [
        {
          "id": 14,
          "ticketId": 108,
          "ticketNumber": "TKT-2026-000108",
          "actionDescription": "Rerouted VLAN traffic through backup switch.",
          "actionDateTime": "2026-09-24T15:00:00.000Z",
          "isFollowUpRequired": true
        }
      ]
    }
    ```
  - `401 Unauthorized`: Not authenticated.
  - `403 Forbidden`: User does not hold `IT_STAFF` or `ADMINISTRATOR` role.

---

#### `GET /api/dashboards/admin`
- **Description**: Returns all IT Staff operational metrics plus comprehensive user account metrics.
- **Access**: `ADMINISTRATOR` only.
- **Responses**:
  - `200 OK`:
    ```json
    {
      "staffDashboard": {
        /* Complete staff dashboard object as specified above */
      },
      "userMetrics": {
        "totalUsers": 24,
        "activeUsers": 22,
        "inactiveUsers": 2,
        "usersByRole": {
          "REQUESTER": 16,
          "IT_STAFF": 6,
          "ADMINISTRATOR": 2
        }
      }
    }
    ```
  - `401 Unauthorized`: Not authenticated.
  - `403 Forbidden`: Non-administrator user.

---

### 3.3. Ticket Workflow Lifecycle Endpoint

#### `PATCH /api/staff/tickets/:id/status`
- **Description**: Validates and transitions ticket status according to the BR-11 lifecycle matrix.
- **Access**: `IT_STAFF` or `ADMINISTRATOR`.
- **Path Parameters**:
  - `id` (integer, required): Target Ticket ID.
- **Request Body**:
  ```json
  {
    "status": "Resolved"
  }
  ```
- **Validation Rules**:
  - Target `status` must be a valid status string.
  - Transition from current status to target status must exist in the permitted transition matrix (BR-11).
  - Transition from `New` to `Open` is rejected if `ownerId` is null (must be claimed or assigned).
  - Tickets in `Closed` or `Cancelled` cannot be transitioned (terminal states).
- **Responses**:
  - `200 OK`:
    ```json
    {
      "id": 105,
      "ticketNumber": "TKT-2026-000105",
      "status": "Resolved",
      "updatedAt": "2026-09-24T15:20:00.000Z",
      "permittedNextStatuses": ["Closed", "Reopened"]
    }
    ```
  - `400 Bad Request`:
    ```json
    {
      "error": "Invalid status transition from In Progress to Closed. Ticket must be Resolved first.",
      "code": "INVALID_STATUS_TRANSITION",
      "details": {
        "currentStatus": "In Progress",
        "attemptedStatus": "Closed",
        "permittedTransitions": ["Waiting for Requester", "Open", "Resolved", "Cancelled"]
      }
    }
    ```
  - `401 Unauthorized`: Not authenticated.
  - `403 Forbidden`: Non-staff user.
  - `404 Not Found`: Ticket not found.

---

### 3.4. Preserved Lab 1–3 REST Endpoints (Regression Continuity)
The following pre-existing endpoints remain fully active and backwards-compatible:

| Method | Endpoint | Access | Function |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate user credentials. |
| `POST` | `/api/auth/logout` | Authenticated | Terminate session and clear cookie. |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile. |
| `POST` | `/api/auth/change-password` | Authenticated | Password change endpoint. |
| `GET` | `/api/categories` | Authenticated | List active ticket categories. |
| `GET` | `/api/related-systems` | Authenticated | List active related systems. |
| `POST` | `/api/tickets` | Requester | Create new ticket (`status: New`, `itPriority = requestedPriority`). |
| `GET` | `/api/tickets` | Requester | List paginated tickets owned by authenticated user. |
| `GET` | `/api/tickets/:id` | Requester / Staff / Admin | Ticket detail inspection. |
| `POST` | `/api/tickets/:id/attachments` | Requester / Staff / Admin | Upload file attachment (max 5 active, max 5MB). |
| `GET` | `/api/tickets/:id/attachments/:attId/download` | Requester / Staff / Admin | Download active attachment file. |
| `DELETE`| `/api/tickets/:id/attachments/:attId` | Requester / Staff / Admin | Soft-remove attachment with mandatory reason. |
| `POST` | `/api/tickets/:id/resolve-indicator` | Requester | Toggle advisory `requesterResolvedIndicator`. |
| `GET` | `/api/tickets/:id/comments` | Requester / Staff / Admin | Retrieve plain list of Public Comments. |
| `POST` | `/api/tickets/:id/comments` | Requester / Staff / Admin | Post Public Comment on accessible ticket. |
| `GET` | `/api/tickets/:id/notes` | Staff / Admin | Retrieve Internal Notes (Requester receives 403). |
| `POST` | `/api/tickets/:id/notes` | Staff / Admin | Post Internal Note. |
| `GET` | `/api/staff/tickets` | Staff / Admin | Staff ticket queue with search, filters, pagination. |
| `PATCH`| `/api/staff/tickets/:id/claim` | Staff / Admin | Claim ticket (sets owner to current user, `New` $\to$ `Open`). |
| `PATCH`| `/api/staff/tickets/:id/assign` | Staff / Admin | Assign ticket to active IT Staff / Admin. |
| `PATCH`| `/api/staff/tickets/:id/priority` | Staff / Admin | Update IT Priority. |
| `GET` | `/api/admin/users` | Admin | List users with search and role filter. |
| `POST` | `/api/admin/users` | Admin | Create user with initial password. |
| `PATCH`| `/api/admin/users/:id` | Admin | Edit user details with safety guards. |
| `POST` | `/api/admin/users/:id/reset-password` | Admin | Set initial password with forced change flag. |
