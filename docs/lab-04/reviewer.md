# Lab 4 - Peer Review and Release Record
## TokTickIT: Actions Taken, Dashboards, and Final Regression Hardening

**Author:** Punnapob Wirojwongchai - 67070503425 - SaintCrois  
**Peer reviewer:** Patcharak Plipat - 67070503427 - bravefe  
**Repository:** `SaintCrois/Mein-Uni-Kampf`  
**Staging branch:** `lab4-staging`  
**Target release branch:** `main`

---

## 1. Planned & Executed Pull Requests (Sprint 4)

| PR | Branch | Scope | Reviewer Verdict / Comments | Approval Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **#52** | `feature/23-lab4-specification` | Sprint 4 Engineering Contract (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`, `reviewer.md`, `ai-use.md`) | In Review | Pending merge into `lab4-staging` |
| **#53** | `feature/24-lab4-actions-taken-backend` | `ActionTaken` Prisma model, database migration, idempotent seed updates, Actions Taken REST endpoints, authorization tests | Planned | Planned |
| **#54** | `feature/25-lab4-actions-taken-ui` | Actions Taken UI on Ticket Detail (table, Add/Edit modals, follow-up badge, requester read-only mode) | Planned | Planned |
| **#55** | `feature/26-lab4-ticket-workflow` | Complete BR-11 status-transition matrix, advisory resolution gate, terminal state enforcement, workflow tests | Planned | Planned |
| **#56** | `feature/27-lab4-dashboards` | Requester, IT Staff, and Admin dashboard endpoints, metric cards, queue drill-downs, responsive layouts, tests | Planned | Planned |
| **#57** | `feature/28-lab4-final-hardening-regression` | Labs 1–3 full regression test suite pass, multi-viewport E2E runs, accessibility audit, final screenshot artifacts | Planned | Planned |

---

## 2. Reviewer Verification Guide
The peer reviewer must verify each of the following technical requirements before approving pull requests:

### 2.1. Actions Taken Verification
- [ ] Verify `ActionTaken` model exists in `schema.prisma` with foreign keys to `Ticket` and `User`.
- [ ] Confirm `POST /api/tickets/:id/actions-taken` automatically assigns `performedById` from the authenticated session.
- [ ] Confirm client-side attempts to submit arbitrary performer IDs are strictly rejected or ignored.
- [ ] Confirm validation: `isFollowUpRequired === true` strictly requires a non-empty `followUpNote`.
- [ ] Confirm Requesters can view Actions Taken on owned tickets in read-only mode, and receive `403 Forbidden` if attempting `POST` or `PATCH`.
- [ ] Verify that a non-owner IT Staff member can log an Action Taken on another staff member's ticket.

### 2.2. Ticket Workflow Verification
- [ ] Verify that `New` $\to$ `Open` strictly requires ticket claim or assignment (`ownerId` must be non-null).
- [ ] Verify that attempting invalid transitions (e.g. `New` $\to$ `In Progress`, `New` $\to$ `Closed`) returns `400 Bad Request` with `INVALID_STATUS_TRANSITION`.
- [ ] Verify that `requesterResolvedIndicator` is advisory and does not change ticket status to `Resolved`.
- [ ] Verify that `Closed` and `Cancelled` are terminal states; no further transitions are permitted.

### 2.3. Dashboards Verification
- [ ] Verify Requester Dashboard metrics (`totalOpenTickets`, `ticketsWaitingForRequester`, `recentlyResolvedTickets`) match database reality.
- [ ] Verify Requester Dashboard displays zero data or metrics belonging to other users.
- [ ] Verify IT Staff Dashboard displays accurate counts for unassigned tickets, personal tickets, and priority distributions.
- [ ] Verify clicking dashboard metric cards navigates directly to the Ticket Queue with pre-applied filter parameters.
- [ ] Verify empty dashboard states render `0` cleanly with friendly empty-state graphics.

### 2.4. Regression & Non-Functional Verification
- [ ] 100% pass rate on all legacy test suites (`tests/lab-01/`, `tests/lab-02/`, `tests/lab-03/`).
- [ ] Zero TypeScript errors in both client and server (`tsc --noEmit`).
- [ ] Clean Vite client production build (`npm run build`).
- [ ] Zen Green design language maintained across Desktop ($1280\times 720$), Tablet ($800\times 1000$), and Mobile ($390\times 844$) without horizontal scrolling.

---

## 3. Required Submission Evidence Checklist (Answer Parts 1–9)
To guarantee full marks (60/60) on the submitted PDF report, verify that all nine sections match coursework requirements:

- [ ] **Answer Part 1: Git Use with Engineering Workflow (10 pts)**
  - GitHub Repository URL, Kanban board URL.
  - Kanban board screenshot showing all Sprint 4 issues moved from Backlog $\to$ In Progress $\to$ Review $\to$ Done.
  - Git history graph screenshot showing feature branches merged into `lab4-staging` and then `main`.
  - Rendered `reviewer.md` with reviewer identity, PR links, comments, and approvals.
  - README and `.gitignore` evidence.
- [ ] **Answer Part 2: Spec DD (5 pts)**
  - Link to and rendered `docs/lab-04/specification.md`.
  - Numbered FRs, BRs, Actions Taken rules, transition matrix, dashboard calculations, ACs, and DoD.
- [ ] **Answer Part 3: Test DD and Traceability (10 pts)**
  - Link to and rendered `docs/lab-04/tests.md`.
  - AC-to-test traceability matrix with automated test file paths.
  - Terminal output showing all Unit, API, and E2E tests passing on `main`.
- [ ] **Answer Part 4: AI Use with Reflection (5 pts)**
  - Rendered `docs/lab-04/ai-use.md` naming LLMs used with 6–10 prompt summaries.
  - "My Reflection" on specification-agent and coding-agent pairing.
- [ ] **Answer Part 5: Working IT Staff Dashboard UI (5 pts)**
  - Screenshots of IT Staff Dashboard showing metric cards, status/priority breakdown, urgent tickets table, and drill-down links.
  - Database verification proving metric accuracy.
- [ ] **Answer Part 6: Working Actions Taken UI (10 pts)**
  - Screenshots of Actions Taken list on Ticket Detail, Add Action Taken modal, Edit modal, and Follow-Up Required highlighting.
  - Screenshot proving multi-staff action logging on a single ticket.
  - Screenshot of Requester read-only Actions Taken view.
- [ ] **Answer Part 7: Working Ticket Workflow (5 pts)**
  - Screenshots of valid status transitions, terminal state confirmation, and advisory resolution banner.
- [ ] **Answer Part 8: Working Requester Dashboard and Final Regression UI (5 pts)**
  - Screenshots of Requester Dashboard with owned metrics, recent tickets, and drill-down to My Tickets.
  - Evidence of Lab 1-3 regression continuity (Login, Password Change, Attachments, Comments/Notes, Admin).
- [ ] **Answer Part 9: Zen Green UI, Responsive, Accessibility, and Final Polish (5 pts)**
  - Responsive screenshots across Desktop ($1280\times 720$), Tablet ($800\times 1000$), and Mobile ($390\times 844$).
  - Completed visual inspection and accessibility checklist.

---

## 4. Review Conversations & Approvals Log

### PR #52: `feature/23-lab4-specification`
- **Scope**: Lab 4 Specification, API Contract, UI Spec, and Test Plan.
- **Reviewer Comment:** Pending maintainer review.
- **Author Response:** Specifications prepared based on coursework handout §1 to §14.
- **Approval:** In progress.
