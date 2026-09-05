# Lab 2 Test Plan and Results

## 1. Test Strategy
We apply Test-Driven Development (TDD) by defining our test scenarios beforehand. Automated test coverage includes unit tests, API integration tests (via Supertest), UI component tests (via Vitest), responsive checks, and end-to-end tests (via Playwright).

## 2. Planned Tests
| Test ID | Requirement | AC | What It Tests | Expected Result | Automated Test File Path | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| API-01 | FR-02, BR-02 | AC-01 | Create valid ticket | 201 Created; unique Ticket Number generated; initial status is 'New'. | server/tests/lab-02/tickets.api.test.ts | Pass |
| API-02 | FR-06, BR-04 | AC-04 | Upload attachment > 5MB | 400 Bad Request; upload rejected; API returns explicit file size error. | server/tests/lab-02/attachments.api.test.ts | Pass |
| UI-01 | FR-01, BR-05 | AC-02 | Load Requester Selector | Dropdown populated *only* with active Requesters; inactive users are hidden. | client/tests/lab-02/RequesterSelection.test.tsx | Pass |
| UI-02 | FR-05, BR-03 | AC-02 | Create Ticket Validation & State | Form prevents empty submission, shows field messages, preserves data. | client/tests/lab-02/CreateTicket.test.tsx | Pass |
| E2E-01 | E2E Flow | AC-01 | Complete submission flow across viewports | Form submits successfully; UI updates to show the official Ticket Number on Desktop, Tablet, and Mobile. | e2e/lab-02/requester-ticket-flow.spec.ts | Pass |
| E2E-02 | FR-05 | AC-03 | Cross-requester ticket flow & detail | Selected requester sees owned tickets; searches, inspects details, and navigates back. | e2e/lab-02/requester-ticket-flow.spec.ts | Pass |

## 3. Acceptance-Criterion Traceability
- **AC-01**: Covered by `API-01`, `E2E-01`
- **AC-02**: Covered by `UI-01`, `UI-02`
- **AC-03**: Covered by `E2E-02`
- **AC-04**: Covered by `API-02`

## 4. Responsive and Visual Checklist
- Multi-column desktop layout ($\ge 992\text{px}$) verified via Playwright.
- Two-column tablet layout ($768\text{--}991\text{px}$) verified via Playwright.
- Stacked mobile layout ($< 768\text{px}$) with touch-friendly controls and no horizontal scrolling verified via Playwright.
- Zen Green color token contrast and correct red asterisks for required fields verified.

## 5. Test Commands
```bash
# Server API tests
npm --prefix server test

# Client UI tests
npm --prefix client test

# Playwright E2E tests (Desktop, Tablet, Mobile)
npx playwright test e2e/lab-02/requester-ticket-flow.spec.ts --config=client/playwright.config.ts
```

## 6. Final Results
- **Server API Tests**: npm --prefix server test
   
> toktickit-server@1.0.0 test
> vitest run


 RUN  v2.1.9 C:/Users/Cent/Desktop/toktickit/server

 ✓ tests/lab-01/categories.test.ts (1)
 ✓ tests/lab-01/health.test.ts (1)
 ✓ tests/lab-02/attachment-lifecycle.api.test.ts (4)
 ✓ tests/lab-02/attachments.api.test.ts (6)
 ✓ tests/lab-02/dev-requesters.api.test.ts (1)
 ✓ tests/lab-02/reference.api.test.ts (1)
 ✓ tests/lab-02/related-systems.api.test.ts (1)
 ✓ tests/lab-02/ticket-detail.api.test.ts (4)
 ✓ tests/lab-02/tickets.api.test.ts (12)

 Test Files  9 passed (9)
      Tests  31 passed (31)
   Start at  10:52:49
   Duration  993ms (transform 340ms, setup 0ms, collect 3.19s, tests 1.02s, environment 2ms, prepare 1.13s)
- **Client UI Tests**: npm --prefix client test
   
> toktickit-client@1.0.0 test
> vitest run


 RUN  v2.1.9 C:/Users/Cent/Desktop/toktickit/client

stdout | tests/lab-02/CreateTicket.test.tsx > Create Ticket > creates a ticket and displays the generated ticket number
CREATING TICKET { requesterId: 1, requesterName: 'Narin Chaiyo' }
TICKET CREATED { id: 123, ticketNumber: 'TKT-2026-000123', requesterId: 1 }

stdout | tests/lab-02/CreateTicket.test.tsx > Create Ticket > prevents duplicate submissions while creating a ticket
CREATING TICKET { requesterId: 1, requesterName: 'Narin Chaiyo' }

stdout | tests/lab-02/CreateTicket.test.tsx > Create Ticket > prevents duplicate submissions while creating a ticket
TICKET CREATED { id: 124, ticketNumber: 'TKT-2026-000124', requesterId: 1 }

stdout | tests/lab-02/CreateTicket.test.tsx > Create Ticket > shows an error and preserves entered values when creation fails
CREATING TICKET { requesterId: 1, requesterName: 'Narin Chaiyo' }

 ✓ tests/lab-01/App.test.tsx (4)
 ✓ tests/lab-02/CreateTicket.test.tsx (5) 3607ms
 ✓ tests/lab-02/RequesterSelection.test.tsx (3)

 Test Files  3 passed (3)
      Tests  12 passed (12)
   Start at  10:52:41
   Duration  4.71s (transform 171ms, setup 280ms, collect 513ms, tests 3.89s, environment 1.51s, prepare 371ms)
- **Playwright E2E Tests**:
npx playwright test e2e/lab-02/requester-ticket-flow.spec.ts --config=client/playwright.config.ts --workers=1

Running 9 tests using 1 worker

  ✓  1 …pec.ts:28:7 › TokTickIT Requester Ticketing MVP — Full E2E Lifecycle › 1. Create Ticket workflow, validation, invalid attachments, and API failure recovery (3.0s)
  ✓  2 …ow.spec.ts:181:7 › TokTickIT Requester Ticketing MVP — Full E2E Lifecycle › 2. My Tickets search, filtering, sorting, empty states, and requester switching (2.2s)
  ✓  3 …T Requester Ticketing MVP — Full E2E Lifecycle › 3. Ticket Detail view, attachment lifecycle (upload, download, soft removal), and cross-requester security (2.2s)
  ✓  4 …pec.ts:28:7 › TokTickIT Requester Ticketing MVP — Full E2E Lifecycle › 1. Create Ticket workflow, validation, invalid attachments, and API failure recovery (1.1s)
  ✓  5 …ow.spec.ts:181:7 › TokTickIT Requester Ticketing MVP — Full E2E Lifecycle › 2. My Tickets search, filtering, sorting, empty states, and requester switching (1.2s)
  ✓  6 …T Requester Ticketing MVP — Full E2E Lifecycle › 3. Ticket Detail view, attachment lifecycle (upload, download, soft removal), and cross-requester security (1.2s)
  ✓  7 …pec.ts:28:7 › TokTickIT Requester Ticketing MVP — Full E2E Lifecycle › 1. Create Ticket workflow, validation, invalid attachments, and API failure recovery (1.2s)
  ✓  8 …ow.spec.ts:181:7 › TokTickIT Requester Ticketing MVP — Full E2E Lifecycle › 2. My Tickets search, filtering, sorting, empty states, and requester switching (2.6s)
  ✓  9 …T Requester Ticketing MVP — Full E2E Lifecycle › 3. Ticket Detail view, attachment lifecycle (upload, download, soft removal), and cross-requester security (1.6s)

  9 passed (22.0s)
- **Screenshots Generated**: Get-ChildItem .\artifacts\lab-02\screenshots -Recurse -Filter *.png
   

    Directory: C:\Users\Cent\Desktop\toktickit\artifacts\lab-02\screenshots\create-ticket


Mode                 LastWriteTime         Length Name                                                                                                
----                 -------------         ------ ----                                                                                                
-a----         8/29/2026  10:50 AM          26842 01-requester-selection.png                                                                          
-a----         8/29/2026  10:50 AM          60906 02-create-ticket-initial-desktop.png                                                                
-a----         8/29/2026  10:50 AM          70057 03-create-ticket-validation-errors.png                                                              
-a----         8/29/2026  10:16 AM          73311 04-create-ticket-filled-form.png                                                                    
-a----         8/29/2026  10:50 AM          75150 04-create-ticket-invalid-attachment.png                                                             
-a----         8/29/2026  10:50 AM          63670 05-create-ticket-submitting-state.png                                                               
-a----         8/29/2026  10:50 AM         992311 06-create-ticket-success.png                                                                        
-a----         8/29/2026  10:50 AM          66469 07-create-ticket-api-failure.png                                                                    
-a----         8/29/2026  10:50 AM          57135 08-create-ticket-tablet.png                                                                         
-a----         8/29/2026  10:50 AM         233751 09-create-ticket-mobile.png                                                                         


    Directory: C:\Users\Cent\Desktop\toktickit\artifacts\lab-02\screenshots\my-tickets


Mode                 LastWriteTime         Length Name                                                                                                
----                 -------------         ------ ----                                                                                                
-a----         8/29/2026  10:50 AM        1001692 01-my-tickets-requester-a.png                                                                       
-a----         8/29/2026  10:50 AM          50045 02-my-tickets-search-filter.png                                                                     
-a----         8/29/2026  10:50 AM          49920 03-my-tickets-sorted.png                                                                            
-a----         8/29/2026  10:50 AM          38976 04-my-tickets-empty-or-no-results.png                                                               
-a----         8/29/2026  10:50 AM          35776 05-my-tickets-requester-b-switched.png                                                              
-a----         8/29/2026  10:50 AM        1063603 06-my-tickets-tablet.png                                                                            
-a----         8/29/2026  10:50 AM        4873793 07-my-tickets-mobile.png                                                                            


    Directory: C:\Users\Cent\Desktop\toktickit\artifacts\lab-02\screenshots\ticket-detail


Mode                 LastWriteTime         Length Name                                                                                                
----                 -------------         ------ ----                                                                                                
-a----         8/29/2026  10:50 AM          58278 01-ticket-detail-view-desktop.png                                                                   
-a----         8/29/2026  10:50 AM          63472 02-ticket-detail-attachments.png                                                                    
-a----         8/29/2026  10:50 AM          65392 03-ticket-detail-soft-remove-reason.png                                                             
-a----         8/29/2026  10:50 AM          35793 04-ticket-detail-unauthorized-access.png                                                            
-a----         8/29/2026  10:50 AM          54827 05-ticket-detail-tablet.png                                                                         
-a----         8/29/2026  10:50 AM         223963 06-ticket-detail-mobile.png                                                                         