# Lab 2 Test Plan and Results

## 1. Test Strategy
We apply Test-Driven Development (TDD) by defining our test scenarios beforehand. Automated test coverage includes unit tests, API integration tests (via Supertest), UI component tests (via Vitest), responsive checks, and end-to-end tests (via Playwright).

## 2. Planned Tests
| Test ID | Requirement | AC | What It Tests | Expected Result | Automated Test File Path | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| API-01 | FR-02, BR-02 | AC-01 | Create valid ticket | 201 Created; unique Ticket Number generated; initial status is 'New'. | server/tests/lab-02/create-ticket.api.test.ts | Pending |
| API-02 | FR-06, BR-04 | AC-04 | Upload attachment > 5MB | 400 Bad Request; upload rejected; API returns explicit file size error. | server/tests/lab-02/attachments.api.test.ts | Pending |
| UI-01 | FR-01, BR-05 | AC-02 | Load Requester Selector | Dropdown populated *only* with active Requesters; inactive users are hidden. | client/.../CreateTicket.test.tsx | Pending |
| UI-02 | FR-05, BR-03 | AC-02 | Missing Requester Context | App blocks access to My Tickets and shows Requester Selection screen. | client/.../MyTickets.test.tsx | Pending |
| E2E-01 | E2E Flow | AC-01 | Complete submission flow | Form submits successfully; UI updates to show the official Ticket Number. | e2e/lab-02/requester-ticket-flow.spec.ts | Pending |
| E2E-02 | FR-05 | AC-03 | Cross-requester security | Requester A attempts to access Requester B's ticket ID; sees 403 or 404 error. | e2e/lab-02/requester-ticket-flow.spec.ts | Pending |

## 3. Acceptance-Criterion Traceability
- **AC-01**: Covered by `API-01`, `E2E-01`
- **AC-02**: Covered by `UI-01`, `UI-02`
- **AC-03**: Covered by `E2E-02`
- **AC-04**: Covered by `API-02`

## 4. Responsive and Visual Checklist
- Verify multi-column desktop layout ($\ge 992\text{px}$).
- Verify two-column tablet layout ($768\text{--}991\text{px}$).
- Verify stacked mobile layout ($< 768\text{px}$) with touch-friendly controls and no horizontal scrolling.
- Verify Zen Green color token contrast and correct red asterisks for required fields.

## 5. Test Commands
```bash
npm run test
npx playwright test