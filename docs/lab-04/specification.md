# Lab 4 Sprint Engineering Specification
## TokTickIT: Actions Taken, Dashboards, and Final Regression Hardening

---

## 1. Sprint Goal
Deliver the final operational increment of TokTickIT by implementing a granular, auditable Actions Taken parent-child tracking model under Tickets, enforcing the definitive end-to-end Ticket status transition lifecycle and resolution gate, providing role-authoritative operational dashboards for Requesters, IT Staff, and Administrators, and hardening the full-stack system against regressions across all capabilities delivered in Labs 1 through 3 under the Zen Green design language.

---

## 2. Stakeholder Request Interpretation
The service desk currently enables ticket creation, basic queue triage, dual-priority tracking, and public/internal communication, but lacks operational work planning and tactical execution auditability. Stakeholders require:
1. **Actions Taken Sub-Records**: A structured parent-child relationship where multiple sequential or concurrent technical actions can be logged under a single Ticket. While the primary Ticket Owner maintains overall accountability, different IT Staff members or Administrators may perform and record specific actions (diagnostics, part replacements, configuration changes). Each action logs the date/time, action description, operational result, automatically identified performer, follow-up necessity with conditional notes, and references to associated attachments.
2. **Definitive Ticket Workflow & Resolution Gate**: A formalized, backend-enforced status transition lifecycle from creation through closure or cancellation. Requesters may signal that their issue appears resolved (`requesterResolvedIndicator`), but only authorized IT Staff or Administrators can formally transition the ticket to `Resolved` after reviewing the work and recorded Actions Taken.
3. **Role-Appropriate Operational Dashboards**: High-level, backend-authoritative dashboard views that summarize actionable metrics without duplicating detailed list views. Requesters see their active tickets and items needing user response; IT Staff see queue backlogs, unassigned tickets, personal assignments, and urgent items; Administrators monitor system-wide workload and user distribution.
4. **Final Regression & Hardening**: Strict preservation of all earlier features (authentication, RBAC, session management, file attachments, public comments, internal notes, user administration) with robust error handling, responsive viewports, and accessible UI controls.

---

## 3. Scope

### 3.1. Included
- **Actions Taken Data Model & Business Logic**:
  - `ActionTaken` model in PostgreSQL via Prisma with foreign keys to `Ticket` and `User` (performer).
  - Creation, updating, and listing of Actions Taken.
  - Performer auto-assignment from the authenticated session (tamper-proof).
  - Validation: conditional mandatory follow-up notes when follow-up is flagged; attachment notes referencing files.
  - Role-based visibility: Requesters view Actions Taken on owned tickets in read-only mode; IT Staff and Administrators create and update Actions Taken.
- **Definitive Ticket Status Workflow**:
  - Full status set: `New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`.
  - Authoritative backend state-transition validation matrix.
  - Advisory Requester resolution toggle (`requesterResolvedIndicator`) requiring staff verification before formal closure.
- **Operational Dashboards**:
  - **Requester Dashboard**: Open tickets count, waiting-for-requester count, recently resolved count, attention-required count, and recent tickets list.
  - **IT Staff Dashboard**: Unassigned tickets count, personal assigned tickets count, status breakdown, IT priority breakdown, follow-up required count, and urgent/recent tickets backlog.
  - **Administrator Dashboard**: Inherits IT Staff metrics and appends user account metrics (total users, active users, users by role).
  - Authoritative backend query computation; card-to-queue drill-down navigation.
- **Full-Stack Regression & Hardening**:
  - Zero regression across Labs 1, 2, and 3 capabilities.
  - Consistent Zen Green styling, accessible forms, responsive layout (Desktop, Tablet, Mobile).
  - Concurrency safety and structured API error handling.

### 3.2. Explicitly Excluded (Per Lab Sheet §4.2)
- Automatic SLA clocks, countdown timers, escalation engines, and automated breach notifications.
- External notifications (Email/SMTP, SMS, LINE, web push, webhooks).
- Inventory consumption, spare-parts catalogs, procurement workflows, and hardware asset tracking.
- Timesheet billing, hourly rate tracking, payroll calculation, or financial cost accounting.
- Multi-level hierarchical approval workflows and digital signature capture.
- Advanced business intelligence (BI) report builders, custom query builders, and CSV/PDF export data warehouses.
- Multi-tenant organizational partitioning and production-scale distributed cloud infrastructure.

---

## 4. Functional Requirements

### 4.1. Actions Taken
- **FR-01**: The system shall support a parent-child relationship where a Ticket contains zero, one, or multiple `ActionTaken` records.
- **FR-02**: The system shall allow authenticated IT Staff and Administrators to create an Action Taken record under an accessible Ticket.
- **FR-03**: The system shall automatically record the authenticated user as the performer (`performedById`) of an Action Taken, rejecting client-forged performer identities.
- **FR-04**: The system shall require an Action Date/Time (defaulting to current timestamp if omitted), Action Description, and Result for every Action Taken record.
- **FR-05**: The system shall allow marking an Action Taken with `isFollowUpRequired` (boolean). When `isFollowUpRequired` is `true`, the system shall require a non-empty `followUpNote`.
- **FR-06**: The system shall allow recording optional `attachmentNotes` detailing file names or physical inspection artifacts relevant to the action.
- **FR-07**: The system shall allow authenticated IT Staff and Administrators to update an existing Action Taken record while maintaining performer auditability.
- **FR-08**: The system shall allow an authenticated Requester to view all Actions Taken records associated with their owned Tickets in read-only mode, and shall strictly forbid Requesters from creating, modifying, or deleting Actions Taken.

### 4.2. Ticket Workflow & Resolution Gate
- **FR-09**: The system shall support the complete eight-state status lifecycle: `New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, and `Cancelled`.
- **FR-10**: The system shall enforce permitted status transitions on the backend according to the validated status transition matrix (BR-11).
- **FR-11**: The system shall allow Requesters to set the advisory `requesterResolvedIndicator` on owned tickets without changing the ticket status.
- **FR-12**: The system shall require an IT Staff member or Administrator to formally transition a ticket to `Resolved` or `Closed`, verifying that appropriate work or Actions Taken have been logged.
- **FR-13**: The system shall prevent Requesters from directly setting ticket status to `Resolved`, `Closed`, or `Open`.

### 4.3. Dashboards
- **FR-14**: The system shall provide an authenticated `GET /api/dashboards/requester` endpoint returning aggregated metrics and recent tickets strictly scoped to the authenticated Requester.
- **FR-15**: The system shall provide an authenticated `GET /api/dashboards/staff` endpoint for IT Staff and Administrators returning operational queue counts, status breakdowns, priority breakdowns, follow-up flags, and urgent tickets.
- **FR-16**: The system shall provide an authenticated `GET /api/dashboards/admin` endpoint returning staff operational metrics combined with user account metrics.
- **FR-17**: The system shall ensure all dashboard metrics are computed directly by the database engine via authoritative aggregation queries.
- **FR-18**: The system shall support interactive drill-down navigation from dashboard metric cards directly to filtered ticket queues or ticket detail views.

### 4.4. Hardening & System Quality
- **FR-19**: The system shall provide optimistic locking or conflict detection to prevent stale overwrite of ticket workflow status or actions taken.
- **FR-20**: The system shall maintain 100% functional continuity of all Lab 1-3 features (authentication, password changes, attachments, public comments, internal notes, user management).

---

## 5. Business Rules

### 5.1. Actions Taken Business Rules
- **BR-01**: **Parent-Child Integrity**: Every `ActionTaken` record must belong to exactly one valid `Ticket`. Deletion of a Ticket cascades to its Actions Taken records (though tickets are never hard-deleted in practice).
- **BR-02**: **Ownership vs. Performer Decoupling**: The Ticket Owner (`ownerId`) coordinates the ticket as a whole, but any active IT Staff member or Administrator may perform and log an Action Taken (`performedById`). The performer does not need to be the ticket owner.
- **BR-03**: **Performer Identity Authority**: The `performedById` field must always be assigned by the backend from the verified authenticated session. Any client-supplied performer ID in request payloads must be ignored or rejected.
- **BR-04**: **Follow-Up Conditional Requirement**: If `isFollowUpRequired === true`, `followUpNote` must be a non-empty string ($\ge 3$ characters, $\le 2000$ characters). If `isFollowUpRequired === false`, `followUpNote` must be stored as `null` or cleared.
- **BR-05**: **Attachment Notes Context**: The `attachmentNotes` field is an optional textual guide (maximum 1000 characters) pointing to active ticket attachments or physical evidence; it does not replace the `Attachment` model.
- **BR-06**: **Role-Based Action Taken Permissions**:
  - `REQUESTER`: Read-only access to Actions Taken on owned tickets. Write/update attempts return `403 Forbidden`.
  - `IT_STAFF`: Full read, create, and update access on all accessible tickets.
  - `ADMINISTRATOR`: Full read, create, and update access across all tickets.
- **BR-07**: **Immutable Performer and Chronological Audit**: Once created, an Action Taken's `ticketId` and initial `performedById` are immutable. Updates modify `actionDescription`, `result`, `isFollowUpRequired`, `followUpNote`, `attachmentNotes`, and set `updatedAt`.
- **BR-08**: **Action Taken Chronology**: Actions Taken must be sorted in ascending chronological order (`actionDateTime ASC, id ASC`) when rendered, representing the natural timeline of technical work.

### 5.2. Ticket Workflow & Status Transition Matrix
- **BR-09**: **Authorized Status Values**: The complete valid ticket status set consists strictly of:
  `New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`.
- **BR-10**: **Initial Status**: All tickets created by Requesters start strictly in status `New`.
- **BR-11**: **Permitted Status Transition Matrix**:
  The following state transition table governs all status changes:

| Current Status | Target Status | Authorized Roles | Trigger / Required Precondition |
| :--- | :--- | :--- | :--- |
| `New` | `Open` | IT Staff, Admin | Claiming ticket or explicitly assigning an owner (`ownerId` must be non-null). Direct update without owner is rejected. |
| `New` | `Cancelled` | IT Staff, Admin | Ticket cancelled prior to triage (e.g. duplicate or spam). |
| `Open` | `In Progress` | IT Staff, Admin | Staff commences active investigation or technical work. |
| `Open` | `Waiting for Requester` | IT Staff, Admin | Staff requires additional information or verification from requester. |
| `Open` | `Resolved` | IT Staff, Admin | Issue addressed directly without extended investigation. |
| `Open` | `Cancelled` | IT Staff, Admin | Ticket cancelled with documented justification. |
| `In Progress` | `Waiting for Requester` | IT Staff, Admin | Technical work blocked pending user response or testing. |
| `In Progress` | `Open` | IT Staff, Admin | Work paused or returned to general open queue. |
| `In Progress` | `Resolved` | IT Staff, Admin | Technical resolution verified; work logged in Actions Taken. |
| `In Progress` | `Cancelled` | IT Staff, Admin | Ticket cancelled by staff or admin. |
| `Waiting for Requester` | `In Progress` | IT Staff, Admin | Requester provided feedback (via comment) or staff resumes work. |
| `Waiting for Requester` | `Resolved` | IT Staff, Admin | Requester confirmed resolution or problem resolved after wait period. |
| `Waiting for Requester` | `Cancelled` | IT Staff, Admin | Abandoned request or no response. |
| `Resolved` | `Closed` | IT Staff, Admin | Formal administrative closure after resolution confirmation. |
| `Resolved` | `Reopened` | IT Staff, Admin | Problem recurs or resolution was incomplete. |
| `Reopened` | `In Progress` | IT Staff, Admin | Staff resumes technical work on reopened ticket. |
| `Reopened` | `Resolved` | IT Staff, Admin | Subsequent resolution achieved and verified. |
| `Reopened` | `Cancelled` | IT Staff, Admin | Reopened ticket deemed invalid or cancelled. |
| `Closed` | *None* | *None* | `Closed` is a terminal state. No transitions allowed *(Project Decision)*. |
| `Cancelled` | *None* | *None* | `Cancelled` is a terminal state. No transitions allowed *(Project Decision)*. |

- **BR-12**: **Advisory Resolution Gate**: When a Requester sets `requesterResolvedIndicator = true`, this represents an *advisory signal* only. It notifies IT Staff that the user believes the problem is resolved, but does NOT alter the ticket `status`. Only an IT Staff member or Administrator can advance the ticket to `Resolved`.
- **BR-13**: **Ownership Requirement for Open State**: Advancing a ticket from `New` to `Open` strictly requires that `ownerId` is populated (via `claim` or `assign` endpoint). Direct `PATCH /status` from `New` to `Open` without an owner returns `400 Bad Request`.

### 5.3. Dashboard Calculation Business Rules
- **BR-14**: **Requester Dashboard Metric Definitions**:
  - `totalOpenTickets`: `COUNT(*)` where `requesterId === currentUser.id` AND `status NOT IN ('Closed', 'Cancelled')`.
  - `ticketsWaitingForRequester`: `COUNT(*)` where `requesterId === currentUser.id` AND `status === 'Waiting for Requester'`.
  - `recentlyResolvedTickets`: `COUNT(*)` where `requesterId === currentUser.id` AND `status === 'Resolved'`.
  - `attentionRequiredTickets`: `COUNT(*)` where `requesterId === currentUser.id` AND (`status === 'Waiting for Requester'` OR (`status === 'Resolved' AND requesterResolvedIndicator === false`)).
  - `recentTickets`: Up to 5 most recently updated tickets owned by requester, ordered by `updatedAt DESC`.
- **BR-15**: **IT Staff Dashboard Metric Definitions**:
  - `unassignedTickets`: `COUNT(*)` where `ownerId IS NULL` AND `status NOT IN ('Closed', 'Cancelled')`.
  - `myAssignedTickets`: `COUNT(*)` where `ownerId === currentUser.id` AND `status NOT IN ('Closed', 'Cancelled')`.
  - `ticketsByStatus`: Map of counts for every status in the system for all active tickets.
  - `ticketsByPriority`: Map of counts grouped by `itPriority` for active tickets (`status NOT IN ('Closed', 'Cancelled')`).
  - `followUpRequiredCount`: `COUNT(DISTINCT t.id)` where ticket is active AND at least one associated `ActionTaken` has `isFollowUpRequired === true`.
  - `urgentTickets`: Up to 5 active tickets where `itPriority === 'Urgent'`, ordered by `updatedAt DESC`.
- **BR-16**: **Administrator Dashboard Metric Definitions**:
  - Inherits all IT Staff metrics (BR-15).
  - `totalUsers`: `COUNT(*)` from `User` table.
  - `activeUsers`: `COUNT(*)` from `User` where `isActive === true`.
  - `usersByRole`: Counts grouped by `role` (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`).
- **BR-17**: **Backend Authoritative Computation**: All dashboard metrics must be computed server-side via SQL aggregate queries (`count`, `groupBy`). Clients must never fetch complete ticket tables to calculate metrics in browser memory.
- **BR-18**: **Empty State Resilience**: When metric queries yield zero matching rows, the API must return `0` (or empty arrays `[]`), and UI cards must render `0` cleanly without error alerts or layout breaks.

### 5.4. Concurrency & Regression Rules
- **BR-19**: **Stale-Update / Optimistic Concurrency**: Status updates and Action Taken edits should check the ticket's `updatedAt` timestamp or current status. If another user modified the ticket concurrently, a `409 Conflict` response is returned.
- **BR-20**: **Preservation of Labs 1–3 Contracts**: All existing endpoints for authentication, categories, related systems, ticket creation, attachments, public comments, internal notes, and user administration must remain backwards-compatible.

---

## 6. UI Specification Summary
The UI preserves and refines the **Zen Green** design tokens (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#F5F7F6`):
- **Role-Adaptive Application Shell**:
  - Top navigation displays brand logo, active user pill with role badge, and context-sensitive primary links:
    - **Requester**: `Dashboard`, `My Tickets`, `Create Ticket`.
    - **IT Staff**: `Dashboard`, `Ticket Queue`.
    - **Administrator**: `Dashboard`, `Ticket Queue`, `User Management`.
- **Dashboard Views**:
  - **Requester Dashboard** (`/dashboard`): Responsive metric card grid (Open Tickets, Awaiting Info, Resolved, Needs Attention), quick "+ Create Ticket" call-to-action, and a "Recent Tickets" table with status pills.
  - **IT Staff Dashboard** (`/staff/dashboard`): Operational summary cards (Unassigned, My Tickets, Follow-Up Required), status distribution breakdown, IT Priority distribution bars, and an "Urgent & High Priority Backlog" table with direct drill-down links to the Queue.
  - **Admin Dashboard**: Adds a "User Accounts Overview" card row beneath operational metrics.
- **Actions Taken UI on Ticket Detail**:
  - Dedicated "Actions Taken" panel placed directly beneath Ticket Information.
  - **List/Table**: Displays Action Date/Time, Description, Result, Performed By (with role badge), Follow-Up status badge, and Attachment Notes.
  - **Follow-Up Highlighting**: Prominent amber badge `"Follow-Up Required"` with the associated note rendered.
  - **Action Modals**: "Add Action Taken" modal and "Edit Action Taken" modal with inline validation, automatic performer display, and dynamic follow-up note toggle.
  - **Requester View**: Read-only rendering with disabled action triggers, transparently showing the user what technical work has been performed.
- **Status Workflow Actions**:
  - Status progression dropdown/button-group displaying *only* valid next transitions according to the current ticket status (BR-11).
  - Clear confirmation for terminal states (`Closed`, `Cancelled`).

---

## 7. Data Changes & Migration Strategy

### 7.1. Prisma Schema Increment
A new `ActionTaken` model is added to `server/prisma/schema.prisma`:

```prisma
model ActionTaken {
  id                  Int          @id @default(autoincrement())
  ticketId            Int
  performedById       Int
  actionDateTime      DateTime     @default(now())
  actionDescription   String
  result              String
  isFollowUpRequired  Boolean      @default(false)
  followUpNote        String?
  attachmentNotes     String?
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt

  // Relations
  ticket              Ticket       @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  performedBy         User         @relation(fields: [performedById], references: [id])

  @@index([ticketId])
  @@index([performedById])
  @@index([isFollowUpRequired])
  @@index([actionDateTime])
}
```

The `Ticket` model is extended with the reverse relation:
```prisma
model Ticket {
  // ... existing fields ...
  actionsTaken        ActionTaken[]
}
```

The `User` model is extended with the reverse relation:
```prisma
model User {
  // ... existing fields ...
  actionsPerformed    ActionTaken[]
}
```

### 7.2. Database Design Decisions & Justification
1. **Decision 1: Decoupling Ticket Coordinator (`Ticket.ownerId`) from Tactical Performer (`ActionTaken.performedById`)**:
   - *Rationale*: In enterprise IT service desks, a senior staff member often coordinates ticket communication while junior specialists, database administrators, or network technicians perform discrete troubleshooting tasks. Linking each `ActionTaken` to its specific `performedById` provides an unforgeable chronological audit trail while keeping overall ticket accountability cleanly unified under `Ticket.ownerId`.
2. **Decision 2: Dedicated Relational Entity vs. Denormalized JSON Array**:
   - *Rationale*: Actions Taken could theoretically be stored in a JSONB column on `Ticket`. However, a dedicated relational table with foreign keys and database indexes (`@@index([ticketId])`, `@@index([isFollowUpRequired])`) ensures referential integrity (e.g. preventing orphaned user IDs if users are modified), allows database-level constraints (e.g. non-empty descriptions), and facilitates high-performance dashboard aggregations (such as counting follow-up requirements across all tickets) without expensive JSON deserialization.

### 7.3. Migration & Backfill Strategy
- **Additive Migration**: `npx prisma migrate dev --name add_actions_taken_model`.
- **Zero Data Loss**: Existing `User`, `Ticket`, `Category`, `RelatedSystem`, `Attachment`, `PublicComment`, and `InternalNote` records remain 100% untouched.
- **Legacy Ticket Handling**: Existing tickets created in Labs 1-3 have zero Actions Taken (`actionsTaken.length === 0`). The API and UI must cleanly handle tickets with no Actions Taken without errors or null-pointer exceptions.
- **Rollback Plan**: If needed, the migration can be reverted by running `prisma migrate resolve --rolled-back` and dropping the `ActionTaken` table without affecting pre-existing tables.

### 7.4. Seed Data Enhancements
The seed script (`server/prisma/seed.ts`) is updated idempotently to:
- Seed multiple realistic `ActionTaken` records across existing tickets:
  - Tickets with 0 actions (demonstrating empty state).
  - Tickets with 1 completed action (diagnostic without follow-up).
  - Tickets with multiple actions taken by different staff members (demonstrating multi-staff collaboration on a single ticket).
  - Tickets with `isFollowUpRequired = true` and detailed `followUpNote`.
  - Tickets with `attachmentNotes` referencing seeded files.
- Seed tickets across diverse statuses (`New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`) and priorities to ensure all dashboard metric cards show representative non-zero data.

---

## 8. REST API Contract Overview
Complete endpoint schemas, parameters, and payloads are defined in `docs/lab-04/api-spec.md`.

### Summary of New Endpoints:
- **Actions Taken**:
  - `GET /api/tickets/:id/actions-taken`: Retrieve chronological Actions Taken for a ticket (Requester on owned ticket, IT Staff, Admin).
  - `POST /api/tickets/:id/actions-taken`: Create an Action Taken (IT Staff, Admin). Performer automatically assigned from session.
  - `PATCH /api/tickets/:id/actions-taken/:actionId`: Update an existing Action Taken (IT Staff, Admin).
- **Dashboards**:
  - `GET /api/dashboards/requester`: Requester personal metrics and recent tickets list (Requester only).
  - `GET /api/dashboards/staff`: Operational backlog metrics, status/priority distributions, follow-up flags, and urgent tickets (IT Staff, Admin).
  - `GET /api/dashboards/admin`: Comprehensive system metrics including user account breakdown (Admin only).
- **Workflow & Hardening**:
  - `PATCH /api/staff/tickets/:id/status`: Enforces the final BR-11 transition matrix and returns updated ticket with next valid transitions.

---

## 9. Acceptance Criteria

- **AC-01 (Create Valid Action Taken)**: Given an authenticated IT Staff member or Administrator and a valid ticket, when `POST /api/tickets/:id/actions-taken` is submitted with valid description, result, and optional fields, then a `201 Created` response is returned and the record is stored with `performedById` equal to the authenticated user's ID.
- **AC-02 (Follow-Up Validation Rule)**: Given an IT Staff member creating or updating an Action Taken with `isFollowUpRequired === true`, when `followUpNote` is empty or missing, then the API rejects the request with `400 Bad Request` and an explicit validation error message.
- **AC-03 (Requester Actions Taken Read-Only)**: Given an authenticated Requester viewing their owned ticket, when `GET /api/tickets/:id/actions-taken` is requested, then the Actions Taken list is returned; when the Requester attempts `POST` or `PATCH` on Actions Taken, then the API returns `403 Forbidden`.
- **AC-04 (Multi-Staff Collaboration)**: Given a ticket owned by Staff A, when Staff B logs an Action Taken on that ticket, then the record is saved with `performedById = Staff B`, preserving the ticket's primary owner as Staff A.
- **AC-05 (Update Action Taken)**: Given an IT Staff member or Administrator, when `PATCH /api/tickets/:id/actions-taken/:actionId` is called with updated description or follow-up note, then the record is updated, `updatedAt` is refreshed, and initial `performedById` remains unchanged.
- **AC-06 (Permitted Status Transitions)**: Given an IT Staff member, when advancing a ticket along permitted transitions (`Open` $\to$ `In Progress` $\to$ `Resolved` $\to$ `Closed`), then the status updates successfully and the change is reflected in ticket queries.
- **AC-07 (Invalid Status Transition Rejection)**: Given a ticket in `New` status, when an IT Staff member attempts to transition directly to `In Progress`, `Resolved`, or `Closed` via the status endpoint, then the API rejects the transition with `400 Bad Request` and error code `INVALID_STATUS_TRANSITION`.
- **AC-08 (Advisory Resolution Gate)**: Given an authenticated Requester, when setting `requesterResolvedIndicator = true`, then the ticket status remains unchanged while staff receives the advisory indicator.
- **AC-09 (Requester Dashboard Metrics)**: Given an authenticated Requester, when `GET /api/dashboards/requester` is called, then the returned metrics (open tickets, waiting for requester, resolved) and recent tickets strictly reflect only tickets authored by that requester.
- **AC-10 (Requester Dashboard Isolation)**: Given Requester A and Requester B with separate tickets, when Requester A views their dashboard, then zero metrics or tickets belonging to Requester B are included.
- **AC-11 (IT Staff Dashboard Operational Metrics)**: Given an IT Staff member, when `GET /api/dashboards/staff` is requested, then accurate system-wide counts for unassigned tickets, personal assigned tickets, status breakdown, priority breakdown, and follow-up required are returned.
- **AC-12 (Dashboard Drill-Down Links)**: Given an IT Staff member viewing their dashboard, when clicking the "Unassigned Tickets" card or an urgent ticket row, then the application navigates to the Ticket Queue or Ticket Detail with the corresponding filter applied.
- **AC-13 (Admin Dashboard Extension)**: Given an Administrator, when requesting `GET /api/dashboards/admin`, then staff operational metrics plus total user counts and role distributions are returned; non-administrators requesting this endpoint receive `403 Forbidden`.
- **AC-14 (Dashboard Empty-State Resilience)**: Given a newly seeded or cleared system where a user has 0 tickets, when the dashboard loads, then cards render `0` without error alerts, spinners terminate cleanly, and an empty call-to-action is displayed.
- **AC-15 (Terminal Status Immutability)**: Given a ticket in `Closed` or `Cancelled` status, when any user attempts further status transitions, then the API rejects the request with `400 Bad Request`.
- **AC-16 (Full-Stack Regression Continuity)**: Given existing test suites for Labs 1, 2, and 3, when running the full test suite after Lab 4 changes, then 100% of previous tests pass without failure.

---

## 10. Product Definition of Done (DoD)

1. **Specification & Contract Integrity**:
   - Complete engineering specification (`specification.md`), UI spec (`ui-spec.md`), API contract (`api-spec.md`), and test plan (`tests.md`) maintained in `docs/lab-04/`.
   - All numbered requirements (FR-01 to FR-20), business rules (BR-01 to BR-25), and acceptance criteria (AC-01 to AC-16) fully documented and traceable.
2. **Database & Migration Quality**:
   - `ActionTaken` model implemented in `schema.prisma` with appropriate relational indexes.
   - Clean, reversible Prisma migration applied without data loss.
   - Idempotent seed script updated with realistic Actions Taken, follow-up flags, and diverse ticket statuses.
3. **Automated Test Coverage**:
   - 100% of Acceptance Criteria (AC-01 through AC-16) covered by automated tests.
   - Server API integration tests in `server/tests/lab-04/`.
   - Client component tests in `client/src/tests/lab-04/`.
   - Playwright multi-viewport E2E tests in `e2e/lab-04/`.
   - Zero regression failures across Lab 1, 2, and 3 test suites.
4. **Code Quality & Build Standards**:
   - Zero TypeScript errors (`tsc --noEmit`) in both `server/` and `client/`.
   - Production Vite client build succeeds cleanly (`npm run build`).
   - Clean git branch structure following Git Flow (`feature/*` $\to$ `lab4-staging` $\to$ `main`).
5. **Zen Green UI & Accessibility**:
   - Full compliance with Zen Green tokens across all new dashboard and Actions Taken components.
   - Responsive layout verified across Desktop ($1280\times 720$), Tablet ($800\times 1000$), and Mobile ($390\times 844$).
   - Explicit `<label>` associations, visible focus rings, keyboard navigability, and non-color status cues verified.
6. **Documentation & Review Evidence**:
   - Peer review record (`reviewer.md`) and AI reflection (`ai-use.md`) complete.
   - Screenshot artifacts captured and organized in `artifacts/lab-04/screenshots/`.

---

## 11. Project Assumptions and Decisions

1. **Terminal Status Policy (Project Decision)**:
   - *Issue*: The lab sheet defines `Closed` and `Cancelled` in the status set, but does not explicitly state whether tickets can be reopened after formal closure.
   - *Decision*: In alignment with ITIL best practices and service desk governance, `Closed` and `Cancelled` are designated strictly as **terminal states**. Once a ticket reaches `Closed` or `Cancelled`, no further status transitions are permitted. If a customer reports an ongoing issue after ticket closure, a new ticket referencing the previous ticket must be created.
2. **Requester Visibility of Actions Taken (Project Decision)**:
   - *Issue*: Lab sheet §4.3 states: "View Actions Taken information for owned Tickets where approved by the specification."
   - *Decision*: Requesters are granted transparent read-only access to all Actions Taken records on their own tickets. This promotes customer trust and eliminates ambiguity regarding technical progress. However, internal administrative technical notes remain restricted to the `InternalNote` model, maintaining staff confidentiality where necessary.
3. **Follow-Up Note Field Behavior (Project Decision)**:
   - *Issue*: Lab sheet §3 states: "Follow-up Note (required when follow-up is needed)".
   - *Decision*: When `isFollowUpRequired === true`, `followUpNote` is strictly validated as a non-empty string ($\ge 3$ characters). When `isFollowUpRequired === false`, `followUpNote` is stored as `null`. If a user unchecks follow-up during an edit, the follow-up note is cleared.
4. **Dashboard Aggregation Execution (Project Decision)**:
   - *Issue*: Dashboards could be computed client-side by fetching all tickets or server-side via SQL aggregates.
   - *Decision*: Enforce strictly backend-authoritative computation using Prisma `count` and `groupBy` queries. This guarantees optimal performance, minimizes payload sizes, and prevents leaking unowned ticket counts or data to Requesters.
