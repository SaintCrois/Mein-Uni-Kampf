# Lab 2 Test Plan and Results

## 1. Test Strategy
We apply Test-Driven Development (TDD) by defining our test scenarios beforehand. Automated test coverage includes unit tests, API integration tests (via Supertest), UI component tests (via Vitest), responsive checks, and end-to-end tests (via Playwright)[cite: 2].

## 2. Planned Tests
| Test ID | Requirement / Type | AC | What It Tests | Expected Result | Automated Test File Path | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| API-01 | API | AC-01 | Create valid ticket | 201 Created; one saved Ticket; official number returned | server/tests/lab-02/create-ticket.api.test.ts[cite: 2] | Pending |
| UI-01 | UI | AC-02 | Submit without required summary | Field inline validation message; API not called | client/src/.../lab-02 tests/CreateTicket.test.tsx[cite: 2] | Pending |
| E2E-01 | E2E | AC-01, AC-05 | Complete responsive submission flow | Confirmation displays official ticket number | e2e/lab-02/requester-ticket-flow.spec.ts[cite: 2] | Pending |

## 3. Acceptance-Criterion Traceability
- **AC-01**: Covered by `API-01`, `E2E-01`[cite: 2]
- **AC-02**: Covered by `UI-01`[cite: 2]
- **AC-03**: Covered by ownership security integration tests[cite: 2]

## 4. Responsive and Visual Checklist
- Verify multi-column desktop layout ($\ge 992\text{px}$)[cite: 2].
- Verify two-column tablet layout ($768\text{--}991\text{px}$)[cite: 2].
- Verify stacked mobile layout ($< 768\text{px}$) with touch-friendly controls and no horizontal scrolling[cite: 2].
- Verify Zen Green color token contrast and correct red asterisks for required fields[cite: 2].

## 5. Test Commands
```bash
npm run test
npx playwright test