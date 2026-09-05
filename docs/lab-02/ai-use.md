# Lab 2 — AI Use and Reflection

**LLM/agent used:** Gemini 3.7 Flash & Claude 3.5 Sonnet & Chat GPT

## Selected key prompts (6–10)

| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Help refine the Sprint 2 engineering specification (`specification.md`) and define business rules BR-01 to BR-05. | Populated `docs/lab-02/specification.md` with functional requirements, business rules, and acceptance criteria. |
| 2 | Design the REST API endpoints and data model for Development Requesters, Tickets, Attachments, Categories, and Systems. | Documented the request/response payloads in `docs/lab-02/api-spec.md` and updated `prisma/schema.prisma`. |
| 3 | Create the Prisma seed script with 4 active requesters, 1 inactive requester, 4 categories, and 6 related systems. | Added idempotent upsert queries in `prisma/seed.ts` to prevent duplicate rows on re-runs. |
| 4 | Implement the Development Requester selection dropdown and context provider in React. | Created `client/src/context/RequesterContext.tsx` and `client/src/pages/RequesterSelection.tsx`. |
| 5 | Build the Create Ticket screen adhering to the Zen Green theme with client-side validation and file attachment size checks. | Implemented `client/src/pages/CreateTicket.tsx` with error messages under each field and submit disabling during submission. |
| 6 | Implement the My Tickets list with search by ticket number, category/priority filtering, and sorting. | Implemented `client/src/pages/MyTickets.tsx` with table responsiveness and empty/no-results states. |
| 7 | Create the Ticket Detail view displaying read-only form fields and attachments download functionality. | Built `client/src/pages/TicketDetail.tsx` with read-only styling and secure download handlers. |
| 8 | Diagnose why the Playwright E2E test failed on `getByText(summary)` when inspecting Ticket Details. | Identified that read-only input elements must be asserted using `getByLabel().toHaveValue()` or `getByDisplayValue()` rather than `getByText()`, and added accessible IDs/labels to `TicketDetail.tsx`. |
| 9 | Configure Playwright multi-viewport projects (Desktop, Tablet, Mobile) and automate saving screenshots to `artifacts/lab-02/screenshots/`. | Updated `client/playwright.config.ts` and `e2e/lab-02/requester-ticket-flow.spec.ts` to automatically capture all 13 required screenshot paths. |

## Reflection

Using the AI agent as a pair programmer allowed us to strictly follow Spec-Driven Development and Test-Driven Development. Defining the specification and tests before coding ensured that every functional requirement had clear acceptance criteria and corresponding automated test files. 

One place I had to correct the AI was during the E2E verification on the Ticket Detail screen: the agent originally used `page.getByText(summary)` to find the ticket summary, but because Ticket Detail renders values inside read-only `<input>` and `<textarea>` controls, text node lookups failed. I corrected the implementation by adding accessible `id` and `htmlFor` attributes to `TicketDetail.tsx` and asserting via `expect(page.getByLabel("Summary")).toHaveValue(...)`.

