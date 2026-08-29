# Lab 2 — Peer Review Record

**Author:** Punnapob Wirojwongchai — 67070503425 — SaintCrois
**Peer reviewer:** Patcharak Plipat — 67070503427 — bravefe

## Pull Requests I authored (reviewed by my partner)

| PR | Branch | Reviewer verdict |
|----|--------|------------------|
| #10 | `feature/5-spec-and-tests` | Approved |
| #11 | `feature/6-dev-requester-context` | Approved |
| #12 | `feature/7-ticket-creation` | Approved |
| #13 | `feature/8-my-tickets-search-filter` | Approved |
| #14 | `feature/9-requester-ticket-detail` | Approved |
| #15 | `feature/9-e2e-release` | Approved |

---

### PR #10 (`feature/5-spec-and-tests`)
**Reviewer comment I received:** "Specification and test plan are well-structured. Make sure business rules BR-01 through BR-05 and acceptance criteria are traceable."
**How I responded:** Added the full traceability matrix linking each AC to planned unit, API, UI, and E2E tests in `docs/lab-02/tests.md`.

---

### PR #11 (`feature/6-dev-requester-context`)
**Reviewer comment I received:** "Requester selection works nicely. Make sure inactive requesters are excluded from the selector dropdown."
**How I responded:** Verified that both the backend endpoint `/api/requesters/active` and the frontend filter out inactive users. Added tests in `RequesterSelection.test.tsx`.

---

### PR #12 (`feature/7-ticket-creation`)
**Reviewer comment I received:** "Validation and submission logic is solid. Make sure summary length <= 150 and description <= 2000 chars are enforced on both frontend and backend."
**How I responded:** Verified character limit checks in `server/src/routes/tickets.ts` and `CreateTicket.tsx` and updated error feedback messages.

---

### PR #13 (`feature/8-my-tickets-search-filter`)
**Reviewer comment I received:** "Search and filter work well. Checked requester isolation when switching requesters."
**How I responded:** Checked that `useEffect` in `MyTickets.tsx` re-fetches tickets whenever `selectedRequester.id` changes, ensuring tickets from Requester A are not shown to Requester B.

---

### PR #14 (`feature/9-requester-ticket-detail`)
**Reviewer comment I received:** "Ticket details header fields are correctly read-only. Attachment downloading works as expected."
**How I responded:** Added accessible IDs and `htmlFor` attributes to read-only fields on `TicketDetail.tsx` and verified soft-removal rules.

---

### PR #15 (`feature/9-e2e-release`)
**Reviewer comment I received:** "Playwright E2E tests pass across desktop, tablet, and mobile. All 13 required screenshots are generated under `artifacts/lab-02/screenshots/`."
**How I responded:** Verified passing test outputs and merged into `lab2-staging` and then final release PR into `main`.

---

## Pull Requests I reviewed for my partner

### PR #10 (`feature/5-spec-and-tests`)
**My comment:** "Great job on the initial specification and test plan! All required sections (Goal, Scope, FRs, BRs, ACs, DoD) are documented clearly. Ready to merge."
**Partner's response:** "Thanks! Merged into `lab2-staging`."

---

### PR #11 (`feature/6-dev-requester-context`)
**My comment:** "Nice implementation of the Development Requester selection dropdown and context provider. Seed script runs cleanly with active and inactive users."
**Partner's response:** "Merged into `lab2-staging`."

---

### PR #12 (`feature/7-ticket-creation`)
**My comment:** "Ticket creation generates official ticket numbers in `TKT-YYYY-XXXXXX` format. Form validation displays proper inline error feedback."
**Partner's response:** "Thank you! Merged."

---

### PR #13 (`feature/8-my-tickets-search-filter`)
**My comment:** "Ticket list table, search input, and category/priority filters work smoothly. Sorting by date and ticket number verified."
**Partner's response:** "Merged into `lab2-staging`."

---

### PR #14 (`feature/9-requester-ticket-detail`)
**My comment:** "Ticket Detail read-only view and attachment download endpoints meet the contract requirements. Good job!"
**Partner's response:** "Thank you! Merged."

---

### PR #15 (`feature/9-e2e-release`)
**My comment:** "All unit, API, UI, and Playwright E2E tests pass cleanly across desktop, tablet, and mobile. Visual inspection checklist in ui-spec.md is verified."
**Partner's response:** "Merged final release PR into main."

