# Lab 3 Sprint Engineering Specification

## 1. Sprint Goal
Evolve TokTickIT from a temporary simulated-requester prototype into a secure, multi-role ticketing application supporting authenticated Requesters, operational IT Staff workflows (ticket queue, claim/assignment, IT priority, permitted status transitions, public comments, and internal notes), and a minimalist Administrator user management interface, while preserving all existing Lab 2 data and functionality under the Zen Green design system.

## 2. Stakeholder Request Interpretation
The stakeholder requires the retirement of the simulated Development Requester selector in favor of real, secure credential-based authentication with a mandatory first-login password change for accounts provisioned with initial passwords. 

The application must support three distinct roles:
1. **Requester**: Uses their authenticated account to create and manage their own tickets and attachments, communicate with IT Staff via Public Comments, and indicate when an issue appears resolved.
2. **IT Staff**: Uses a shared, responsive Ticket Queue to discover work, claim or reassign tickets, adjust IT Priority, record private Internal Notes, converse via Public Comments, and formally advance tickets through their operational lifecycle.
3. **Administrator**: Manages user accounts through a streamlined User Management interface (create, edit basic info, assign one role, activate/deactivate, reset initial passwords) with safeguards protecting against self-deactivation or removing the last active administrator.

Authorization must be enforced on the backend at every route and data layer; frontend button hiding is merely UX feedback, not security.

## 3. Scope

### Included
- Real authentication with email and securely hashed passwords (bcrypt).
- Session/token-based authenticated context with secure cookie or Authorization header and `/api/auth/me` endpoint.
- Mandatory first-login password change enforcement (`mustChangePassword`).
- Role-based server-side authorization for three roles: `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`.
- Migration of Lab 2 Development Requesters into the `User` table without data loss.
- Continued support for all Lab 2 Requester capabilities (ticket creation, search, filter, attachment upload/download/soft-remove) bound to authenticated user identity.
- Public Comments (visible to Requester, IT Staff, Administrator) on tickets.
- Internal Notes (visible strictly to IT Staff and Administrator) on tickets.
- Requester "Problem Appears Resolved" indication.
- IT Staff Ticket Queue with search, category/priority/status/ownership filters, column sorting, and pagination.
- IT Staff Ticket Detail with ticket claiming, assigning/reassigning, IT Priority modification, and permitted status transitions.
- Minimalist Administrator User Management (list users, search by name/email, filter by role, create user with initial password, edit basic account details, activate/deactivate, set new initial password).
- Administrator safety rules (no self-deactivation, no deactivation of last active administrator, no user deletion).
- Zen Green UI extension for Login, Password Change, IT Queue, Staff Ticket Detail, and User Management across desktop, tablet, and mobile breakpoints.

### Explicitly Excluded
- Self-registration / public sign-up for accounts.
- Multi-factor authentication (MFA), OAuth / Social Login, Single Sign-On (SSO).
- Email delivery services (SMTP, password reset emails, activation links).
- User deletion, bulk user operations, import/export, role history, and audit log screens.
- Multiple roles assigned to a single user.
- Department, organizational hierarchy, profile photos, and extended profile fields.
- Actions Taken by IT Staff (deferred to Lab 4).
- Formal SLA calculations, escalation timers, and notification webhooks.
- Advanced queue analytics and KPI dashboards beyond basic counts.
- Account unlocking workflows and advanced IAM identity governance.

## 4. Functional Requirements

### Authentication & Account Security
- **FR-01**: The system shall allow registered users to authenticate using a valid email address and password.
- **FR-02**: The system shall enforce a mandatory password change immediately upon successful login if `mustChangePassword` is true, blocking access to all normal application views until completed.
- **FR-03**: The system shall provide an endpoint (`GET /api/auth/me`) returning the current authenticated user's profile and assigned role.
- **FR-04**: The system shall provide a logout endpoint (`POST /api/auth/logout`) that invalidates authenticated access and clears client credentials.

### Authorization & Access Control
- **FR-05**: The system shall enforce server-side role-based authorization for all protected endpoints (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`).
- **FR-06**: The system shall verify ticket ownership so that Requesters can only access and view their own tickets and attachments.
- **FR-07**: The system shall return standard HTTP error codes (`401 Unauthorized` for missing/invalid credentials, `403 Forbidden` for role or ownership violations) without leaking resource existence.

### Requester Capabilities & Regression
- **FR-08**: The system shall preserve all Lab 2 Requester ticketing features (creation, listing, filtering, attachment upload, download, and soft removal) using the authenticated Requester identity.
- **FR-09**: The system shall allow an authenticated Requester to post Public Comments on tickets they own.
- **FR-10**: The system shall allow an authenticated Requester to indicate that their reported issue appears resolved.

### IT Staff Workflows
- **FR-11**: The system shall provide an IT Staff Ticket Queue listing all system tickets with search (by ticket number or summary), multi-parameter filtering (status, category, requested priority, IT priority, ownership), sorting, and pagination.
- **FR-12**: The system shall provide an IT Staff Ticket Detail view allowing IT Staff to inspect complete ticket metadata, attachments, Public Comments, and Internal Notes.
- **FR-13**: The system shall allow IT Staff to claim an unassigned ticket or reassign ownership to another active IT Staff / Administrator.
- **FR-14**: The system shall allow IT Staff to update the IT Priority of a ticket (`Low`, `Medium`, `High`, `Urgent`).
- **FR-15**: The system shall allow IT Staff to execute permitted ticket status transitions according to the defined lifecycle state machine.
- **FR-16**: The system shall allow IT Staff to post Public Comments and private Internal Notes on any ticket.

### Administrator User Management
- **FR-17**: The system shall provide an Administrator-only User Management view displaying a list of users with Name, Email, Role, Status, and Edit action.
- **FR-18**: The system shall support searching users by name or email, with an optional role filter.
- **FR-19**: The system shall allow an Administrator to create a new user account specifying Name, Email, exactly one permitted Role, Active state, and an initial password.
- **FR-20**: The system shall allow an Administrator to edit an existing user's Name, Email, Role, and Active state.
- **FR-21**: The system shall allow an Administrator to set a new initial password for an existing user, automatically flagging the account to require a password change on next login.
- **FR-22**: The system shall prevent an Administrator from deactivating their own account and prevent deactivating the last active Administrator in the system.

## 5. Business Rules

### Authentication & Credentials
- **BR-01**: **Authentication Eligibility**: Only an active user account (`isActive === true`) with matching credentials may authenticate. Inactive accounts receive an uninformative authentication failure message (`Invalid email or password`).
- **BR-02**: **Mandatory Initial Password Change**: Any user with `mustChangePassword === true` is strictly restricted to the password change endpoint (`POST /api/auth/change-password`). All requests to normal ticket or administration APIs must return `403 Forbidden` with a password change requirement code.
- **BR-03**: **Password Constraints**: Passwords must contain a minimum of 8 characters. Passwords must never be logged, transmitted in plaintext responses, or stored in plaintext in the database (bcrypt hash with $\ge 10$ rounds).
- **BR-04**: **Session Invalidation**: Logging out immediately clears authenticated access on both client and server. Expired or invalidated tokens must be rejected with `401 Unauthorized`.

### Roles & Ownership
- **BR-05**: **Single Role Mandate**: Every user is assigned exactly one role from the enumeration: `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`. Role-blending or multi-role assignment is prohibited.
- **BR-06**: **Authenticated Ownership Enforcement**: The authenticated user ID extracted from the verified session, never a client-supplied identifier, dictates the `requesterId` of new tickets and ownership checks.
- **BR-07**: **Requester Isolation**: Requesters are strictly forbidden from viewing tickets, downloading attachments, or reading comments belonging to other users. Unauthorized requests must return `403 Forbidden` (or `404 Not Found`) without revealing ticket existence.
- **BR-08**: **Role Separation of Concerns**: Administrators manage user accounts; IT Staff manage tickets. An Administrator does not have operational ticket privileges unless specifically acting under permitted administrative support scopes. Non-administrators attempting to access `/api/users` must receive `403 Forbidden`.

### Ticket Management & Priority
- **BR-09**: **Ticket Ownership Assignment**: A ticket may have zero or one primary `ownerId`. The owner must be an active user with role `IT_STAFF` or `ADMINISTRATOR`.
- **BR-10**: **Priority Dual-Tracking**: 
  - `requestedPriority`: Selected by the Requester at creation; immutable thereafter.
  - `itPriority`: Initially initialized to equal `requestedPriority` upon ticket creation. May subsequently be changed exclusively by IT Staff or Administrator.

### Ticket Status Workflow & Transitions
- **BR-11**: **Permitted Status Values**: The complete set of valid ticket status values is:
  `New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`.
- **BR-12**: **Initial Status**: All newly created tickets strictly start with status `New`.
- **BR-13**: **Status Transition Matrix**:
  - `New` $\to$ `Open`: Triggered when ticket is claimed or assigned to an IT Staff owner.
  - `Open` $\leftrightarrow$ `In Progress`: Managed by IT Staff actively working the issue.
  - `In Progress` $\leftrightarrow$ `Waiting for Requester`: Set by IT Staff when additional user information is needed.
  - `In Progress` / `Waiting for Requester` / `Open` $\to$ `Resolved`: Set by IT Staff when work is complete. (Accelerated if Requester toggles "Problem Appears Resolved").
  - `Resolved` $\to$ `Closed`: Formally closed by IT Staff or Administrator.
  - `Resolved` $\to$ `Reopened`: Triggered if Requester or IT Staff indicates the issue persists.
  - Any non-closed state $\to$ `Cancelled`: Authorized IT Staff or Administrator cancellation.
- **BR-14**: **Requester Resolution Limit**: A Requester cannot directly set a ticket status to `Resolved` or `Closed`. They may only toggle the `requesterResolvedIndicator` flag, signaling IT Staff to review and formally resolve the ticket.

### Communication: Public Comments & Internal Notes
- **BR-15**: **Public Comment Visibility**: Public comments are shared communication visible to the ticket's Requester, all IT Staff, and Administrators.
- **BR-16**: **Internal Note Visibility**: Internal notes are strictly operational private notes. They are visible *only* to IT Staff and Administrators. Requesters must never receive, view, or query Internal Notes.
- **BR-17**: **Append-Only Immutability**: Comments and Notes are strictly append-only. Editing, deletion, and timestamp overrides are prohibited. Author identity and timestamps are determined server-side from the authenticated session.
- **BR-18**: **Content Validation**: Comments and Notes must not be empty or whitespace-only, and must not exceed 2000 characters.

### Administrator Safety Rules
- **BR-19**: **Self-Deactivation Prevention**: An Administrator cannot deactivate their own active account.
- **BR-20**: **Last Administrator Protection**: The system shall reject any deactivation, demotion, or deletion attempt if it would leave the system with zero active Administrators.
- **BR-21**: **No User Deletion**: User accounts are never deleted from the database to preserve historical ticket, comment, and audit relations. Inactive accounts have `isActive = false`.
- **BR-22**: **Unique Email Constraint**: User email addresses must be unique across all accounts (case-insensitive). Duplicate creation or updates must return `409 Conflict`.
- **BR-23**: **Initial Password Reset Behavior**: When an Administrator resets a user's password, the new password is set as an initial password, and `mustChangePassword` is automatically reset to `true`.

## 6. UI Specification Summary
The UI adheres strictly to the **Zen Green** design tokens established in Lab 2:
- **Application Shell**: Displays user name and role badge (`Requester`, `IT Staff`, `Administrator`) with a clean Logout button in the header.
- **Role-Based Navigation**: 
  - Requester: "My Tickets", "Create Ticket".
  - IT Staff: "Ticket Queue".
  - Administrator: "User Management".
- **Login & Password Change Screens**: Centered, distraction-free cards with input validation, password toggle, and clear feedback alerts.
- **Staff Ticket Queue**: High-density table featuring status badges, priority comparison (Requested vs IT), owner indicator, search bar, and filter controls.
- **Staff Ticket Detail**: Split-view layout clearly distinguishing Public Comments (green accent) from Internal Notes (amber/gold accent) to prevent accidental public data leaks.
- **Admin User Management**: Streamlined table with user search, role filter, "Add User" modal, and "Edit User" modal with activation toggle and password reset action.
- Detailed token definitions, responsive rules, and visual inspection checklists are documented in `docs/lab-03/ui-spec.md`.

## 7. Data Model Changes

### Prisma Schema Evolution

```prisma
enum Role {
  REQUESTER
  IT_STAFF
  ADMINISTRATOR
}

enum TicketStatus {
  NEW
  OPEN
  IN_PROGRESS
  WAITING_FOR_REQUESTER
  RESOLVED
  CLOSED
  REOPENED
  CANCELLED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum AttachmentStatus {
  ACTIVE
  REMOVED
}

model User {
  id                 Int              @id @default(autoincrement())
  email              String           @unique
  passwordHash       String
  name               String
  role               Role             @default(REQUESTER)
  isActive           Boolean          @default(true)
  mustChangePassword Boolean          @default(false)
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  // Relationships
  submittedTickets   Ticket[]         @relation("TicketRequester")
  assignedTickets    Ticket[]         @relation("TicketOwner")
  publicComments     PublicComment[]
  internalNotes      InternalNote[]

  @@index([email])
  @@index([role, isActive])
}

model Category {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  tickets   Ticket[]
}

model RelatedSystem {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  tickets   Ticket[]
}

model Ticket {
  id                         Int              @id @default(autoincrement())
  ticketNumber               String           @unique
  requesterId                Int
  ownerId                    Int?
  categoryId                 Int
  relatedSystemId            Int
  summary                    String
  description                String
  status                     TicketStatus     @default(NEW)
  priority                   Priority         @default(LOW) // Requested Priority
  itPriority                 Priority         @default(LOW) // IT Operational Priority
  requesterResolvedIndicator Boolean          @default(false)
  createdAt                  DateTime         @default(now())
  updatedAt                  DateTime         @updatedAt

  // Relationships
  requester                  User             @relation("TicketRequester", fields: [requesterId], references: [id])
  owner                      User?            @relation("TicketOwner", fields: [ownerId], references: [id])
  category                   Category         @relation(fields: [categoryId], references: [id])
  relatedSystem              RelatedSystem    @relation(fields: [relatedSystemId], references: [id])
  attachments                Attachment[]
  publicComments             PublicComment[]
  internalNotes              InternalNote[]

  @@index([requesterId])
  @@index([ownerId])
  @@index([status])
  @@index([itPriority])
}

model Attachment {
  id            Int              @id @default(autoincrement())
  ticketId      Int
  fileName      String
  fileSize      Int
  mimeType      String
  storagePath   String
  status        AttachmentStatus @default(ACTIVE)
  removalReason String?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  ticket        Ticket           @relation(fields: [ticketId], references: [id])

  @@index([ticketId])
}

model PublicComment {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  authorId  Int
  content   String
  createdAt DateTime @default(now())

  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  author    User     @relation(fields: [authorId], references: [id])

  @@index([ticketId])
}

model InternalNote {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  authorId  Int
  content   String
  createdAt DateTime @default(now())

  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  author    User     @relation(fields: [authorId], references: [id])

  @@index([ticketId])
}
```

### Migration from Lab 2
1. Create `User` table.
2. For each existing `DevRequester` row in Lab 2, create a matching `User` row with `role: REQUESTER`, `email: <requester_slug>@toktickit.local`, default password hash (`Password123!`), `mustChangePassword: false`, and `isActive: true`.
3. Update `Ticket.requesterId` foreign key to point to `User(id)`.
4. Add `ownerId`, `itPriority`, and `requesterResolvedIndicator` columns to `Ticket`.
5. Remove the obsolete `DevRequester` model.
6. All existing tickets, categories, related systems, and attachments remain intact.

## 8. REST API Contract Overview
Complete request/response schemas, validation rules, and error codes are detailed in `docs/lab-03/api-spec.md`.

### Core Endpoint Summary:
- **Authentication**:
  - `POST /api/auth/login`: Authenticate email & password; returns user profile and sets session/token.
  - `POST /api/auth/logout`: Terminate session.
  - `GET /api/auth/me`: Retrieve currently authenticated user.
  - `POST /api/auth/change-password`: Mandatory or user-initiated password change.
- **Requester Ticketing (Continued from Lab 2)**:
  - `GET /api/categories`: Active categories.
  - `GET /api/related-systems`: Active related systems.
  - `POST /api/tickets`: Create ticket (authenticated user is author).
  - `GET /api/tickets`: List authenticated requester's tickets.
  - `GET /api/tickets/:id`: Get ticket detail (owner check).
  - `POST /api/tickets/:id/attachments`: Upload attachment (max 5 active, max 5MB).
  - `GET /api/tickets/:id/attachments/:attachmentId/download`: Download active attachment.
  - `DELETE /api/tickets/:id/attachments/:attachmentId`: Soft-remove attachment with reason.
  - `POST /api/tickets/:id/resolve-indicator`: Requester sets "Problem Appears Resolved".
- **Comments & Notes**:
  - `GET /api/tickets/:id/comments`: Retrieve Public Comments (all roles).
  - `POST /api/tickets/:id/comments`: Post Public Comment (all roles).
  - `GET /api/tickets/:id/notes`: Retrieve Internal Notes (IT Staff & Admin only).
  - `POST /api/tickets/:id/notes`: Post Internal Note (IT Staff & Admin only).
- **IT Staff Queue & Operations**:
  - `GET /api/staff/tickets`: Ticket queue with search, filters, sorting, and pagination.
  - `GET /api/staff/tickets/:id`: Staff ticket detail view.
  - `PATCH /api/staff/tickets/:id/claim`: Claim unassigned ticket.
  - `PATCH /api/staff/tickets/:id/assign`: Assign/reassign ticket to specific IT Staff.
  - `PATCH /api/staff/tickets/:id/priority`: Update IT Priority.
  - `PATCH /api/staff/tickets/:id/status`: Transition ticket status.
- **Administrator User Management**:
  - `GET /api/admin/users`: List users with name/email search and role filter.
  - `POST /api/admin/users`: Create user with single role and initial password.
  - `PATCH /api/admin/users/:id`: Edit user details (name, email, role, active status).
  - `POST /api/admin/users/:id/reset-password`: Set new initial password (`mustChangePassword: true`).

## 9. Non-Functional Requirements
- **NFR-01**: **Security First**: Authentication credentials and session tokens must use HTTP-only secure cookies or standardized Bearer tokens. Passwords must use bcrypt ($\ge 10$ rounds).
- **NFR-02**: **Defensive Authorization**: Every endpoint must strictly enforce role and ownership checks server-side regardless of client presentation.
- **NFR-03**: **Data Privacy & Leak Prevention**: Unauthorized requests for another user's tickets, attachments, or internal notes must return `403 Forbidden` or `404 Not Found` without disclosing metadata.
- **NFR-04**: **Performance & Scalability**: Queue listing and user lists must utilize indexed database queries (`@@index([requesterId])`, `@@index([status])`, etc.).
- **NFR-05**: **Safe Error Responses**: API error payloads must follow a consistent JSON format (`{ "error": string, "details"?: any }`) without leaking stack traces or database errors in production.
- **NFR-06**: **Responsive Usability**: All UI screens must be fully functional across Desktop ($\ge 992\text{px}$), Tablet ($768\text{--}991\text{px}$), and Mobile ($< 768\text{px}$) without horizontal scrolling.

## 10. Acceptance Criteria

- **AC-01** (Valid Authentication): Given an active user with valid credentials, when `POST /api/auth/login` is submitted, then the server returns `200 OK` with user profile and establishes an authenticated session.
- **AC-02** (Invalid Credentials): Given invalid email or password, when login is attempted, then the server returns `401 Unauthorized` with `"Invalid email or password"`.
- **AC-03** (Inactive Account): Given a deactivated user account, when login is attempted with correct password, then the server returns `401 Unauthorized` and denies access.
- **AC-04** (Mandatory Password Change): Given a user with `mustChangePassword === true`, when login succeeds, then the user is redirected to the Change Password screen and cannot access any other protected screen or API until a valid new password is saved.
- **AC-05** (Logout Invalidation): Given an authenticated user, when `POST /api/auth/logout` is called, then the session is cleared and subsequent requests to protected endpoints return `401 Unauthorized`.
- **AC-06** (Requester Regression): Given an authenticated Requester, when creating tickets or viewing My Tickets, then all Lab 2 ticket and attachment capabilities function identically using the authenticated identity.
- **AC-07** (Requester Cross-Access Block): Given Requester A owns Ticket 1, when Requester B attempts to access Ticket 1, then the API returns `403 Forbidden` and exposes no ticket or attachment data.
- **AC-08** (Public Comments): Given an authenticated user (Requester, IT Staff, or Admin), when posting a non-empty Public Comment on an accessible ticket, then the comment is stored and visible to all permitted viewers with server-assigned author and timestamp.
- **AC-09** (Internal Notes Authorization): Given an authenticated Requester, when requesting `GET /api/tickets/:id/notes` or `POST /api/tickets/:id/notes`, then the API returns `403 Forbidden`.
- **AC-10** (Staff Ticket Queue): Given an IT Staff user, when accessing the Ticket Queue, then all tickets are listed with pagination, searchable by summary/number, and filterable by status, category, and priority.
- **AC-11** (Claim & Assignment): Given an IT Staff user, when viewing an unassigned ticket, then clicking "Claim" sets the ticket owner to the current user and advances status from `NEW` to `OPEN`.
- **AC-12** (IT Priority Update): Given an IT Staff user, when updating IT Priority, then the value updates while `requestedPriority` remains unchanged.
- **AC-13** (Status Transitions): Given an IT Staff user, when advancing ticket status through valid transitions (`OPEN` $\to$ `IN_PROGRESS` $\to$ `RESOLVED`), then the status updates successfully; invalid transitions return `400 Bad Request`.
- **AC-14** (Admin User Creation): Given an Administrator, when creating a user with unique email, valid name, single role, and initial password, then the user is created with `mustChangePassword === true`. Duplicate emails return `409 Conflict`.
- **AC-15** (Admin Safety Rules): Given an Administrator, when attempting to deactivate their own account or the sole active Administrator, then the system rejects the operation with `400 Bad Request`.

## 11. Product Definition of Done
1. **Specification Adherence**: All functional requirements (FR-01 to FR-22) and business rules (BR-01 to BR-23) implemented.
2. **Database Integrity**: PostgreSQL schema migrated cleanly via Prisma without loss of Lab 2 ticket/attachment records; idempotent seed script runs repeatedly.
3. **Automated Test Coverage**: 100% of Acceptance Criteria covered by passing Unit, API Integration, and Playwright E2E test suites on `main`.
4. **Zero TypeScript / Lint Errors**: Clean compilation across client and server workspaces (`tsc --noEmit`).
5. **Zen Green UI Alignment**: All screens conform to `ui-spec.md` with verified responsive layouts (desktop, tablet, mobile) and accessible controls.
6. **Documentation Complete**: `specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`, `reviewer.md`, and `ai-use.md` fully completed in `docs/lab-03/`.

## 12. Assumptions and Decisions
1. **Authentication Token Strategy**: We adopt signed HTTP-only cookies storing JWT sessions for web client security, mitigating XSS token theft while maintaining stateless API verification.
2. **Seed Passwords**: Local development seed accounts utilize the standardized initial password `Password123!` with `mustChangePassword = true` for provisioned users to streamline E2E testing.
3. **Actions Taken Deferral**: Following the stakeholder specification, the formal "Actions Taken" checklist and resolution block are deferred to Lab 4.
