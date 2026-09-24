# Lab 4 Test Plan and Traceability
## TokTickIT: Actions Taken, Dashboards, and Final Regression Hardening

---

## 1. Test Strategy
Following Test-Driven Development (TDD) and Test-Driven Design (Test DD), this document establishes our test strategy, automated test categories, and complete Acceptance-Criterion traceability for **Lab 4: Actions Taken, Dashboards, and Final Regression** prior to code implementation.

### 1.1. Testing Layers
1. **Server API Integration Tests (Vitest + Supertest)**:
   - Verification of REST API contracts, request validation, authentication, role enforcement, database transactions, and authoritative aggregation queries.
   - Files located in `server/tests/lab-04/`.
2. **Client UI Component Tests (Vitest + React Testing Library)**:
   - Verification of UI state rendering (loading, empty, populated, error), modal forms, conditional validation, accessibility bindings, and interactive button actions.
   - Files located in `client/tests/lab-04/` (or `client/src/tests/lab-04/`).
3. **Security & Authorization Barriers**:
   - Explicit negative testing verifying that Requesters cannot write Actions Taken, access another requester's data, view staff/admin dashboards, or bypass status transition rules.
4. **Lifecycle & Concurrency Tests**:
   - Verification of end-to-end status transitions along the BR-11 state matrix, terminal state immutability, and advisory resolution decoupling.
5. **Playwright Multi-Viewport E2E Tests**:
   - Real browser verification across **Desktop ($1280\times 720$)**, **Tablet ($800\times 1000$)**, and **Mobile ($390\times 844$)** viewports covering complete user journeys for Actions Taken logging, ticket resolution, and dashboard analytics.
   - Files located in `e2e/lab-04/`.
6. **Full-Stack Regression Suite**:
   - 100% execution of all automated tests from Lab 1 (health check, categories), Lab 2 (requester tickets, attachments lifecycle), and Lab 3 (authentication, RBAC, staff queue, comments/notes, user management).

---

## 2. Planned Tests

| Test ID | Level / Type | Requirement / Rule | AC | What It Tests | Expected Result | Automated Test File Path | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **API-ACT-01** | API | FR-02, BR-02, BR-03 | AC-01 | Create valid Action Taken by IT Staff | `201 Created`; saved under ticket with `performedById = currentUser.id`. | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-ACT-02** | API | FR-03, BR-03 | AC-01 | Reject or ignore client-supplied `performedById` | Performer is bound to session user; client attempt to forge author is ignored. | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-ACT-03** | API | FR-05, BR-04 | AC-02 | Validation: `isFollowUpRequired === true` requires `followUpNote` | `400 Bad Request` if `followUpNote` is empty or whitespace-only. | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-ACT-04** | API | FR-05, BR-04 | AC-02 | Setting `isFollowUpRequired === false` clears `followUpNote` | `followUpNote` stored as `null` when follow-up is false. | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-ACT-05** | API | FR-06, BR-05 | AC-01 | Action Taken with valid `attachmentNotes` | `201 Created`; attachment notes stored and retrieved correctly. | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-ACT-06** | API | FR-08, BR-06 | AC-03 | Requester retrieves Actions Taken on owned ticket | `200 OK`; returns list of actions in chronological order. | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-ACT-07** | Security | FR-08, BR-06 | AC-03 | Requester attempts to create Action Taken (`POST`) | `403 Forbidden`; Requesters cannot create Actions Taken. | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-ACT-08** | Security | FR-08, BR-06 | AC-03 | Requester attempts to edit Action Taken (`PATCH`) | `403 Forbidden`; Requesters cannot edit Actions Taken. | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-ACT-09** | Security | FR-08, BR-06 | AC-03 | Requester attempts to view Actions Taken on another user's ticket | `403 Forbidden` (or `404 Not Found`); zero cross-requester disclosure. | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-ACT-10** | API | FR-01, BR-02 | AC-04 | Non-owner IT Staff logs Action Taken on assigned ticket | `201 Created`; action performed by Staff B while ticket owner remains Staff A. | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-ACT-11** | API | FR-07, BR-07 | AC-05 | Update existing Action Taken details | `200 OK`; updates description/result; initial performer remains immutable. | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-WF-01** | API | FR-10, BR-11 | AC-06 | Permitted transition: `Open` $\to$ `In Progress` | `200 OK`; ticket status updated to `In Progress`. | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **API-WF-02** | API | FR-10, BR-11 | AC-06 | Permitted transition: `In Progress` $\to$ `Waiting for Requester` | `200 OK`; ticket status updated to `Waiting for Requester`. | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **API-WF-03** | API | FR-10, BR-11 | AC-06 | Permitted transition: `In Progress` $\to$ `Resolved` | `200 OK`; ticket status updated to `Resolved`. | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **API-WF-04** | API | FR-10, BR-11 | AC-06 | Permitted transition: `Resolved` $\to$ `Closed` | `200 OK`; ticket status updated to `Closed`. | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **API-WF-05** | API | FR-10, BR-11 | AC-06 | Permitted transition: `Resolved` $\to$ `Reopened` | `200 OK`; ticket status updated to `Reopened`. | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **API-WF-06** | API | FR-10, BR-11 | AC-07 | Invalid transition: `New` directly to `In Progress` | `400 Bad Request` with `INVALID_STATUS_TRANSITION`. | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **API-WF-07** | API | FR-10, BR-13 | AC-07 | Invalid transition: `New` $\to$ `Open` without owner | `400 Bad Request`; advancing to Open requires claim/assign. | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **API-WF-08** | API | FR-10, BR-11 | AC-15 | Terminal status immutability: transition from `Closed` | `400 Bad Request`; `Closed` is a terminal state. | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **API-WF-09** | API | FR-10, BR-11 | AC-15 | Terminal status immutability: transition from `Cancelled` | `400 Bad Request`; `Cancelled` is a terminal state. | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **API-WF-10** | API | FR-11, BR-12 | AC-08 | Requester resolution indicator toggle does not change status | `200 OK`; `requesterResolvedIndicator = true`; status remains unchanged. | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **API-DASH-01** | API | FR-14, BR-14 | AC-09 | Requester dashboard metrics calculation | `200 OK`; returns exact counts for open, waiting, resolved, attention. | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **API-DASH-02** | Security | FR-14, BR-14 | AC-10 | Requester dashboard strictly excludes other users' tickets | Verified against multi-user seed; metrics reflect only owned tickets. | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **API-DASH-03** | Security | FR-14 | AC-10 | IT Staff or Admin accessing Requester dashboard | Returns requester-specific metrics or empty counts if no tickets submitted. | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **API-DASH-04** | API | FR-15, BR-15 | AC-11 | IT Staff dashboard operational counts | `200 OK`; returns unassigned, assigned, status breakdown, priority breakdown. | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **API-DASH-05** | API | FR-15, BR-15 | AC-11 | IT Staff dashboard follow-up required calculation | `200 OK`; counts distinct tickets with pending action follow-up. | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **API-DASH-06** | Security | FR-15 | AC-11 | Requester blocked from IT Staff dashboard | `403 Forbidden`; Requesters cannot query staff dashboard. | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **API-DASH-07** | API | FR-16, BR-16 | AC-13 | Admin dashboard returns user metrics and staff metrics | `200 OK`; returns total users, active users, and role distribution. | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **API-DASH-08** | Security | FR-16 | AC-13 | Non-admin blocked from Admin dashboard | `403 Forbidden` for Requester and IT Staff roles. | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **API-DASH-09** | API | BR-18 | AC-14 | Dashboard calculations with zero matching records | `200 OK`; returns `0` counts and `[]` lists without null errors. | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **UI-ACT-01** | UI | FR-02, FR-05 | AC-01 | "Add Action Taken" modal form validation & conditional note | Follow-up note field toggles visibility/requirement based on checkbox. | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-ACT-02** | UI | FR-08 | AC-03 | Requester view renders Actions Taken in read-only mode | Hides Add and Edit action buttons; displays action timeline cleanly. | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-WF-01** | UI | FR-10, BR-11 | AC-06 | Status transition selector renders only valid next statuses | Verifies that invalid transitions are excluded from the dropdown. | `client/tests/lab-04/TicketWorkflow.test.tsx` | Planned |
| **UI-DASH-01** | UI | FR-14, BR-18 | AC-09 | Requester Dashboard renders cards, recent tickets, empty state | Renders 4 metric cards, table, and friendly empty-state when 0 tickets. | `client/tests/lab-04/RequesterDashboard.test.tsx` | Planned |
| **UI-DASH-02** | UI | FR-15, BR-18 | AC-11 | IT Staff Dashboard renders metrics, queue breakdown, backlog | Renders unassigned cards, priority breakdown, and urgent tickets table. | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| **E2E-ACT-01** | E2E | FR-02, FR-04 | AC-01 | Full Actions Taken lifecycle across Desktop, Tablet, Mobile | Staff logs in $\to$ adds Action Taken $\to$ verifies in list $\to$ edits action. | `e2e/lab-04/actions-taken-flow.spec.ts` | Planned |
| **E2E-ACT-02** | E2E | FR-08 | AC-03 | Requester views Actions Taken logged by staff | Requester logs in $\to$ views owned ticket $\to$ inspects technical work read-only. | `e2e/lab-04/actions-taken-flow.spec.ts` | Planned |
| **E2E-WF-01** | E2E | FR-10, FR-12 | AC-06 | End-to-end ticket lifecycle from `New` to `Closed` | Staff claims ticket $\to$ `Open` $\to$ logs action $\to$ `Resolved` $\to$ `Closed`. | `e2e/lab-04/ticket-resolution.spec.ts` | Planned |
| **E2E-WF-02** | E2E | FR-11, FR-12 | AC-08 | Requester indicates resolved $\to$ Staff verifies & resolves | Requester toggles indicator $\to$ Staff sees banner $\to$ marks Resolved. | `e2e/lab-04/ticket-resolution.spec.ts` | Planned |
| **E2E-DASH-01** | E2E | FR-14, FR-15 | AC-09 | Role dashboards & drill-down navigation | Requester checks dashboard $\to$ clicks drill-down; Staff checks backlog. | `e2e/lab-04/dashboards.spec.ts` | Planned |

---

## 3. Acceptance-Criterion Traceability Matrix

| Acceptance Criterion | Description | Primary Automated Test Cases |
| :--- | :--- | :--- |
| **AC-01** | Create valid Action Taken with authenticated performer | `API-ACT-01`, `API-ACT-02`, `API-ACT-05`, `UI-ACT-01`, `E2E-ACT-01` |
| **AC-02** | Follow-up conditional requirement validation | `API-ACT-03`, `API-ACT-04`, `UI-ACT-01` |
| **AC-03** | Requester Actions Taken read-only access | `API-ACT-06`, `API-ACT-07`, `API-ACT-08`, `API-ACT-09`, `UI-ACT-02`, `E2E-ACT-02` |
| **AC-04** | Multi-staff collaboration on single ticket | `API-ACT-10`, `E2E-ACT-01` |
| **AC-05** | Update existing Action Taken details | `API-ACT-11`, `E2E-ACT-01` |
| **AC-06** | Permitted status transitions through full lifecycle | `API-WF-01`, `API-WF-02`, `API-WF-03`, `API-WF-04`, `API-WF-05`, `UI-WF-01`, `E2E-WF-01` |
| **AC-07** | Invalid status transition rejection (`400`) | `API-WF-06`, `API-WF-07`, `UI-WF-01` |
| **AC-08** | Advisory resolution gate decoupling | `API-WF-10`, `E2E-WF-02` |
| **AC-09** | Requester dashboard personal metrics computation | `API-DASH-01`, `UI-DASH-01`, `E2E-DASH-01` |
| **AC-10** | Requester dashboard isolation and privacy | `API-DASH-02`, `API-DASH-03` |
| **AC-11** | IT Staff dashboard operational backlog metrics | `API-DASH-04`, `API-DASH-05`, `API-DASH-06`, `UI-DASH-02`, `E2E-DASH-01` |
| **AC-12** | Dashboard drill-down navigation | `UI-DASH-01`, `UI-DASH-02`, `E2E-DASH-01` |
| **AC-13** | Admin dashboard user metrics extension | `API-DASH-07`, `API-DASH-08` |
| **AC-14** | Dashboard empty-state resilience | `API-DASH-09`, `UI-DASH-01`, `UI-DASH-02` |
| **AC-15** | Terminal status immutability (`Closed`, `Cancelled`) | `API-WF-08`, `API-WF-09` |
| **AC-16** | Full regression coverage for Labs 1, 2, and 3 | All pre-existing test suites in `server/tests/` and `client/tests/` |

---

## 4. Test File Locations & Coverage Mapping

### 4.1. Server API Tests (`server/tests/lab-04/`)
- `actions-taken.api.test.ts`: Covers `API-ACT-01` through `API-ACT-11`.
- `ticket-workflow.api.test.ts`: Covers `API-WF-01` through `API-WF-10`.
- `requester-dashboard.api.test.ts`: Covers `API-DASH-01` through `API-DASH-03`.
- `staff-dashboard.api.test.ts`: Covers `API-DASH-04` through `API-DASH-09`.

### 4.2. Client UI Tests (`client/tests/lab-04/`)
- `ActionsTaken.test.tsx`: Covers `UI-ACT-01` and `UI-ACT-02`.
- `TicketWorkflow.test.tsx`: Covers `UI-WF-01`.
- `RequesterDashboard.test.tsx`: Covers `UI-DASH-01`.
- `StaffDashboard.test.tsx`: Covers `UI-DASH-02`.

### 4.3. Playwright E2E Tests (`e2e/lab-04/`)
- `actions-taken-flow.spec.ts`: Covers `E2E-ACT-01` and `E2E-ACT-02`.
- `ticket-resolution.spec.ts`: Covers `E2E-WF-01` and `E2E-WF-02`.
- `dashboards.spec.ts`: Covers `E2E-DASH-01`.

---

## 5. Lab 1–3 Regression Strategy
To guarantee that no regressions occur as Lab 4 features are implemented, the automated test harness executes the entire legacy suite on every integration step:

1. **Lab 1**:
   - `server/tests/lab-01/health.test.ts` (API health endpoint)
   - `server/tests/lab-01/categories.test.ts` (Active categories)
   - `client/tests/lab-01/App.test.tsx` (Application root mounting)
2. **Lab 2**:
   - `server/tests/lab-02/tickets.api.test.ts` (Ticket creation & pagination)
   - `server/tests/lab-02/ticket-detail.api.test.ts` (Ticket detail inspection)
   - `server/tests/lab-02/attachments.api.test.ts` (Attachment uploads & 5MB/5 files limits)
   - `server/tests/lab-02/attachment-lifecycle.api.test.ts` (Attachment soft-removal)
   - `client/tests/lab-02/CreateTicket.test.tsx` (Ticket creation form)
3. **Lab 3**:
   - `server/tests/lab-03/auth.api.test.ts` (Login, logout, session verification)
   - `server/tests/lab-03/authorization.api.test.ts` (Role boundaries & cross-access prevention)
   - `server/tests/lab-03/staff-queue.api.test.ts` (Staff queue filtering, search, pagination)
   - `server/tests/lab-03/staff-ticket-detail.api.test.ts` (Claim, assign, priority, status)
   - `server/tests/lab-03/comments-notes.api.test.ts` (Public comments & confidential internal notes)
   - `server/tests/lab-03/users-admin.api.test.ts` (Admin user management & safety guards)
   - `server/tests/lab-03/user-model-seed.test.ts` (User model integrity & seed validation)
   - `client/tests/lab-03/Login.test.tsx` (Login UI)
   - `client/tests/lab-03/StaffTicketQueue.test.tsx` (Staff queue UI)
   - `client/tests/lab-03/UserManagement.test.tsx` (User management UI)

*Target Completion Criteria: 100% of Lab 1-3 test files (17+ server test suites, 9+ client test suites) must pass with zero failures.*
