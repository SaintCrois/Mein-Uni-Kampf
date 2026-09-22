# Lab 3 Test Plan and Traceability

## 1. Test Strategy
Following Test-Driven Development (TDD) and Test-Driven Design (Test DD), this document establishes our test strategy, acceptance-criterion traceability, and test scenarios for **Lab 3: Users, Roles, IT Staff Ticketing, and Admin Screens** prior to implementation.

Testing is stratified across multiple testing layers:
- **Unit & Security Tests**: Password hashing, token encoding/decoding, role verification, and state machine transition logic.
- **Server API Integration Tests (Vitest + Supertest)**: Testing HTTP contracts, authentication cookies/headers, authorization barriers, queue querying, status updates, comment/note isolation, and user administration.
- **Client UI Component Tests (Vitest + React Testing Library)**: Testing Login forms, Change Password validation, Staff Ticket Queue table rendering, Ticket Detail operational controls, and Administrator User Management modals.
- **Security & Authorization Tests**: Direct verification of forbidden access across roles (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`), cross-requester ownership boundaries, internal note confidentiality, and admin self-deactivation safety guards.
- **Migration & Regression Tests**: Verification that Lab 2 tickets, categories, systems, and attachments remain 100% operational after migrating from Development Requester identities to the authenticated `User` model.
- **Playwright End-to-End Tests (Multi-Viewport)**: Real browser verification across **Desktop ($1280\times 720$)**, **Tablet ($800\times 1000$)**, and **Mobile ($390\times 844$)** covering the three user lifecycles: Authentication, IT Staff operations, and User Administration.

---

## 2. Planned Tests

| Test ID | Level / Type | Requirement / Rule | AC | What It Tests | Expected Result | Automated Test File Path | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **API-AUTH-01** | API | FR-01, BR-01 | AC-01 | Valid credential authentication | `200 OK`; sets session cookie/token; returns user profile and role. | `server/tests/lab-03/auth.api.test.ts` | Implemented |
| **API-AUTH-02** | API | FR-01, BR-01 | AC-02 | Invalid password / unknown email | `401 Unauthorized`; returns `"Invalid email or password"`. | `server/tests/lab-03/auth.api.test.ts` | Implemented |
| **API-AUTH-03** | API | FR-01, BR-01 | AC-03 | Deactivated account authentication | `401 Unauthorized`; access blocked without leaking account details. | `server/tests/lab-03/auth.api.test.ts` | Implemented |
| **API-AUTH-04** | API | FR-02, BR-02 | AC-04 | User with `mustChangePassword` tries normal API | `403 Forbidden` with password change requirement; blocked from queue/tickets. | `server/tests/lab-03/auth.api.test.ts` | Implemented |
| **API-AUTH-05** | API | FR-02, BR-03 | AC-04 | Valid first-login password change | `200 OK`; updates password hash; sets `mustChangePassword: false`. | `server/tests/lab-03/auth.api.test.ts` | Implemented |
| **API-AUTH-06** | API | FR-02, BR-03 | AC-04 | Change password with $<8$ chars or wrong current pass | `400 Bad Request` or `401 Unauthorized`; password remains unchanged. | `server/tests/lab-03/auth.api.test.ts` | Implemented |
| **API-AUTH-07** | API | FR-03, BR-04 | AC-01 | Current user retrieval (`GET /api/auth/me`) | `200 OK`; returns authenticated user payload without password hash. | `server/tests/lab-03/auth.api.test.ts` | Implemented |
| **API-AUTH-08** | API | FR-04, BR-04 | AC-05 | Logout action (`POST /api/auth/logout`) | `200 OK`; clears session; subsequent protected requests return `401`. | `server/tests/lab-03/auth.api.test.ts` | Implemented |
| **API-SEC-01** | Security | FR-05, BR-07 | AC-07 | Cross-requester ticket access rejection | `403 Forbidden`; Requester B cannot view Requester A's ticket. | `server/tests/lab-03/authorization.api.test.ts` | Implemented |
| **API-SEC-02** | Security | FR-05, BR-08 | AC-09 | Requester accesses `/api/staff/tickets` | `403 Forbidden`; non-staff role blocked from staff queue. | `server/tests/lab-03/authorization.api.test.ts` | Implemented |
| **API-SEC-03** | Security | FR-05, BR-08 | AC-14 | Non-admin accesses `/api/admin/users` | `403 Forbidden`; Requester and IT Staff blocked from user management. | `server/tests/lab-03/authorization.api.test.ts` | Implemented |
| **API-SEC-04** | Security | FR-05, BR-16 | AC-09 | Requester attempts to read or post Internal Notes | `403 Forbidden`; note content never disclosed. | `server/tests/lab-03/authorization.api.test.ts` | Implemented |
| **API-REG-01** | Regression | FR-08, BR-06 | AC-06 | Requester creates ticket using authenticated identity | `201 Created`; `requesterId` automatically assigned from session. | `server/tests/lab-03/staff-queue.api.test.ts` | Implemented |
| **API-REG-02** | Regression | FR-08, BR-06 | AC-06 | Requester lists owned tickets via `GET /api/tickets` | `200 OK`; returns only tickets authored by the authenticated user. | `server/tests/lab-03/staff-queue.api.test.ts` | Implemented |
| **API-REG-03** | Regression | FR-08 | AC-06 | Requester attachment upload, download, and soft removal | Preserves Lab 2 attachment lifecycle rules and 5MB / 5 files limits. | `server/tests/lab-03/staff-queue.api.test.ts` | Implemented |
| **API-QUEUE-01** | API | FR-11, BR-08 | AC-10 | IT Staff retrieves ticket queue with pagination | `200 OK`; returns paginated tickets list and total count metadata. | `server/tests/lab-03/staff-queue.api.test.ts` | Implemented |
| **API-QUEUE-02** | API | FR-11 | AC-10 | Search queue by Ticket Number and Summary | `200 OK`; filters items matching keyword. | `server/tests/lab-03/staff-queue.api.test.ts` | Implemented |
| **API-QUEUE-03** | API | FR-11 | AC-10 | Filter queue by Status, Category, and IT Priority | `200 OK`; returns items matching selected criteria. | `server/tests/lab-03/staff-queue.api.test.ts` | Implemented |
| **API-QUEUE-04** | API | FR-11 | AC-10 | Filter queue by Ownership (`all`, `unassigned`, `mine`) | `200 OK`; returns unassigned tickets or tickets owned by logged-in staff. | `server/tests/lab-03/staff-queue.api.test.ts` | Implemented |
| **API-STAFF-01** | API | FR-12, FR-13 | AC-11 | Claim unassigned ticket (`PATCH /claim`) | `200 OK`; sets `ownerId = currentUser.id`; status advances `NEW` $\to$ `OPEN`. | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Implemented |
| **API-STAFF-02** | API | FR-13, BR-09 | AC-11 | Reassign ticket to another active IT Staff | `200 OK`; `ownerId` updated; assignment logged. | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Implemented |
| **API-STAFF-03** | API | FR-14, BR-10 | AC-12 | Update IT Priority (`PATCH /priority`) | `200 OK`; updates `itPriority`; `requestedPriority` remains unchanged. | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Implemented |
| **API-STAFF-04** | API | FR-15, BR-13 | AC-13 | Valid status transitions (`OPEN` $\to$ `IN_PROGRESS` $\to$ `RESOLVED`) | `200 OK`; status updated according to transition matrix. | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Implemented |
| **API-STAFF-05** | API | FR-15, BR-13 | AC-13 | Invalid status transition (e.g. `NEW` $\to$ `CLOSED`) | `400 Bad Request`; transition rejected. | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Implemented |
| **API-STAFF-06** | API | FR-10, BR-14 | AC-06 | Requester sets "Problem Appears Resolved" flag | `200 OK`; `requesterResolvedIndicator` set to true; status not changed. | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Implemented |
| **API-COM-01** | API | FR-09, FR-16 | AC-08 | Post and retrieve Public Comments | `201 Created`; visible to Requester, IT Staff, and Admin; author set server-side. | `server/tests/lab-03/comments-notes.api.test.ts` | Implemented |
| **API-COM-02** | API | BR-18 | AC-08 | Reject empty or $>2000$ char Public Comment | `400 Bad Request`; comment rejected. | `server/tests/lab-03/comments-notes.api.test.ts` | Implemented |
| **API-NOTE-01** | API | FR-16, BR-16 | AC-09 | IT Staff posts and retrieves Internal Note | `201 Created`; stored with author and timestamp; visible to Staff/Admin. | `server/tests/lab-03/comments-notes.api.test.ts` | Implemented |
| **API-NOTE-02** | API | BR-18 | AC-09 | Reject empty or $>2000$ char Internal Note | `400 Bad Request`; note rejected. | `server/tests/lab-03/comments-notes.api.test.ts` | Implemented |
| **API-ADMIN-01** | API | FR-17, FR-18 | AC-14 | Admin lists users with search and role filter | `200 OK`; returns matching user profiles without passwords. | `server/tests/lab-03/users-admin.api.test.ts` | Implemented |
| **API-ADMIN-02** | API | FR-19, BR-05 | AC-14 | Admin creates user with single role and initial password | `201 Created`; `mustChangePassword` is set to `true`. | `server/tests/lab-03/users-admin.api.test.ts` | Implemented |
| **API-ADMIN-03** | API | BR-22 | AC-14 | Admin creates user with duplicate email | `409 Conflict`; email uniqueness enforced. | `server/tests/lab-03/users-admin.api.test.ts` | Implemented |
| **API-ADMIN-04** | API | FR-20, BR-21 | AC-14 | Admin edits user details (name, email, role, active status) | `200 OK`; profile updated; user deactivation supported without deletion. | `server/tests/lab-03/users-admin.api.test.ts` | Implemented |
| **API-ADMIN-05** | API | FR-21, BR-23 | AC-14 | Admin sets new initial password for user | `200 OK`; updates hash and forces `mustChangePassword = true`. | `server/tests/lab-03/users-admin.api.test.ts` | Implemented |
| **API-ADMIN-06** | API | FR-22, BR-19 | AC-15 | Admin attempts to deactivate own account | `400 Bad Request`; self-deactivation blocked. | `server/tests/lab-03/users-admin.api.test.ts` | Implemented |
| **API-ADMIN-07** | API | FR-22, BR-20 | AC-15 | Admin attempts to deactivate the sole active Administrator | `400 Bad Request`; last active admin protection enforced. | `server/tests/lab-03/users-admin.api.test.ts` | Implemented |
| **UI-LOGIN-01** | UI | FR-01, FR-02 | AC-01 | Login component validation, loading state, and error alert | Disables submit button during login; shows `"Invalid email or password"`. | `client/tests/lab-03/Login.test.tsx` | Implemented |
| **UI-PASS-01** | UI | FR-02, BR-03 | AC-04 | Change Password form validation and mismatch detection | Enforces $\ge 8$ chars, password matching, and submit disabling. | `client/tests/lab-03/ChangePassword.test.tsx` | Implemented |
| **UI-QUEUE-01** | UI | FR-11 | AC-10 | Staff Ticket Queue table rendering and empty/no-results state | Renders ticket rows, status badges, priority pills, and pagination. | `client/tests/lab-03/StaffTicketQueue.test.tsx` | Implemented |
| **UI-DETAIL-01** | UI | FR-12, FR-16 | AC-08 | Staff Ticket Detail green comments vs. amber notes separation | Visually separates public comments from internal notes with lock icons. | `client/tests/lab-03/StaffTicketDetail.test.tsx` | Implemented |
| **UI-ADMIN-01** | UI | FR-17, FR-19 | AC-14 | User Management table, search, and modal form submission | Renders user list, handles create modal input, and validates role select. | `client/tests/lab-03/UserManagement.test.tsx` | Implemented |
| **E2E-AUTH-01** | E2E | FR-01, FR-04 | AC-01 | Full authentication lifecycle across Desktop, Tablet, Mobile | Login $\to$ shell navigation $\to$ logout $\to$ direct URL blocked. | `e2e/lab-03/authentication.spec.ts` | Implemented |
| **E2E-AUTH-02** | E2E | FR-02, BR-02 | AC-04 | Initial password mandatory change on first login | First login triggers password change screen $\to$ normal app opens on success. | `e2e/lab-03/authentication.spec.ts` | Implemented |
| **E2E-STAFF-01** | E2E | FR-11, FR-13 | AC-10 | Staff queue workflow: search, filter, claim ticket, update status | Staff logs in, claims unassigned ticket, changes status, posts note. | `e2e/lab-03/staff-ticket-flow.spec.ts` | Implemented |
| **E2E-STAFF-02** | E2E | FR-09, FR-10 | AC-08 | Requester/Staff public comment conversation & resolved indicator | Requester marks problem resolved $\to$ staff sees indicator & resolves ticket. | `e2e/lab-03/staff-ticket-flow.spec.ts` | Implemented |
| **E2E-ADMIN-01** | E2E | FR-17, FR-22 | AC-14 | Admin creates user, edits role, sets initial pass, tests safety | Admin provisions user, verifies duplicate check, verifies self-deactivate block. | `e2e/lab-03/user-administration.spec.ts` | Implemented |

---

## 3. Acceptance-Criterion Traceability Matrix

| Acceptance Criterion | Description | Mapping to Planned Tests |
| :--- | :--- | :--- |
| **AC-01** | Valid authentication & session creation | `API-AUTH-01`, `API-AUTH-07`, `UI-LOGIN-01`, `E2E-AUTH-01` |
| **AC-02** | Invalid credentials rejection (`401`) | `API-AUTH-02`, `UI-LOGIN-01` |
| **AC-03** | Inactive account login rejection (`401`) | `API-AUTH-03`, `UI-LOGIN-01` |
| **AC-04** | Mandatory first-login password change | `API-AUTH-04`, `API-AUTH-05`, `API-AUTH-06`, `UI-PASS-01`, `E2E-AUTH-02` |
| **AC-05** | Logout invalidation (`POST /logout`) | `API-AUTH-08`, `E2E-AUTH-01` |
| **AC-06** | Lab 2 Requester regression continuity | `API-REG-01`, `API-REG-02`, `API-REG-03`, `API-STAFF-06`, `E2E-STAFF-02` |
| **AC-07** | Cross-requester ticket access block (`403`) | `API-SEC-01` |
| **AC-08** | Public Comments posting & visibility | `API-COM-01`, `API-COM-02`, `UI-DETAIL-01`, `E2E-STAFF-02` |
| **AC-09** | Internal Notes restriction to Staff/Admin | `API-SEC-04`, `API-NOTE-01`, `API-NOTE-02`, `UI-DETAIL-01` |
| **AC-10** | Staff Ticket Queue query, search & filters | `API-QUEUE-01`, `API-QUEUE-02`, `API-QUEUE-03`, `API-QUEUE-04`, `UI-QUEUE-01`, `E2E-STAFF-01` |
| **AC-11** | Ticket claiming & owner reassignment | `API-STAFF-01`, `API-STAFF-02`, `E2E-STAFF-01` |
| **AC-12** | IT Priority modification & dual-priority tracking | `API-STAFF-03`, `E2E-STAFF-01` |
| **AC-13** | Permitted status transitions & invalid block | `API-STAFF-04`, `API-STAFF-05`, `E2E-STAFF-01` |
| **AC-14** | Admin User Management (list, create, edit, reset pass) | `API-ADMIN-01`, `API-ADMIN-02`, `API-ADMIN-03`, `API-ADMIN-04`, `API-ADMIN-05`, `UI-ADMIN-01`, `E2E-ADMIN-01` |
| **AC-15** | Admin safety rules (no self-deactivation, last admin) | `API-ADMIN-06`, `API-ADMIN-07`, `E2E-ADMIN-01` |

---

## 4. Test Categories & Target File Paths

### 4.1 Server API Integration Tests (`server/tests/lab-03/`)
- `auth.api.test.ts`: Login, logout, session verification, and first-login password change.
- `authorization.api.test.ts`: Role-based route protection, cross-requester blocking, and internal note shielding.
- `staff-queue.api.test.ts`: Staff queue query pagination, search, status/priority filtering, and ownership queries.
- `staff-ticket-detail.api.test.ts`: Ticket claiming, owner reassignment, IT priority updates, and status transition validation.
- `comments-notes.api.test.ts`: Public comments and internal notes append/retrieval validation and character length constraints.
- `users-admin.api.test.ts`: Admin user listing, user creation, duplicate email rejection, editing, activation/deactivation, and safety rules.

### 4.2 Client UI Component Tests (`client/tests/lab-03/`)
- `Login.test.tsx`: Form rendering, loading states, validation errors, and invalid credential alert display.
- `ChangePassword.test.tsx`: Password length validation, password matching, and submit disabling.
- `StaffTicketQueue.test.tsx`: Queue table rendering, status/priority badge styles, pagination, and empty states.
- `StaffTicketDetail.test.tsx`: Visual separation of Public Comments (green) and Internal Notes (amber), operational dropdowns.
- `UserManagement.test.tsx`: User table rendering, search/filter controls, create/edit modal submission, and validation.

### 4.3 Playwright Multi-Viewport E2E Tests (`e2e/lab-03/`)
- `authentication.spec.ts`: Full login/logout flow, invalid credentials, inactive accounts, and mandatory first-login password change.
- `staff-ticket-flow.spec.ts`: End-to-end staff lifecycle: queue search/filtering, opening detail, claiming ticket, updating status, posting notes, and requester conversation.
- `user-administration.spec.ts`: Admin user management lifecycle: listing, searching, creating user, editing details, testing self-deactivation protection.

---

## 5. Responsive and Visual Inspection Checklist

Visual inspection must be conducted across all three required viewports:
- **Desktop**: $1280 \times 720\text{px}$
- **Tablet**: $800 \times 1000\text{px}$
- **Mobile**: $390 \times 844\text{px}$

### Checklist Items
- [ ] **Zen Green Design Alignment**: Primary Green (`#006B3C`), Secondary Green (`#0B7A46`), Pale Green (`#EAF6EF`), and neutral backgrounds (`#F5F7F6`).
- [ ] **Role-Based Header**: User name and role badge clearly visible; unauthorized nav links omitted from DOM.
- [ ] **Public Comments vs. Internal Notes**: Green accent for public discussion; distinct Amber/Gold accent (`#D97706`) with lock icon for internal operational notes.
- [ ] **Queue Responsiveness**: Desktop multi-column grid collapses cleanly on mobile into stacked cards without horizontal overflow.
- [ ] **Form Error Placement**: Inline validation text appears directly below invalid inputs in high-contrast danger text.
- [ ] **Loading & Busy States**: Submit buttons indicate `"Signing in..."`, `"Updating..."`, or `"Saving..."` and disable during submission.
- [ ] **Accessibility**: All interactive inputs have explicit `<label htmlFor="...">` attributes and clear focus outlines.

---

## 6. Test Execution Commands

```powershell
# 1. Run all Server API Integration tests
npm --prefix server test

# 2. Run all Client UI Component tests
npm --prefix client test

# 3. Verify Client TypeScript type checking
cd client; npx --no-install tsc --noEmit; cd ..

# 4. Verify Server TypeScript type checking
cd server; npx --no-install tsc --noEmit; cd ..

# 5. Run full Playwright E2E suite across Desktop, Tablet, and Mobile
npx playwright test e2e/lab-03/ --config=client/playwright.config.ts --workers=1
```

---

## 7. Known Limitations & Deferred Scenarios
- **Actions Taken Checklist**: In accordance with the Lab 3 handout, the formal IT Staff "Actions Taken" checklist and resolution blocking rule are explicitly deferred to Lab 4.
- **External Notifications**: Automated email delivery of reset tokens or ticket notifications is excluded from Lab 3 scope; initial passwords are communicated through local testing mechanisms.

