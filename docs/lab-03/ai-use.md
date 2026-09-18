# Lab 3 — AI Use and Reflection

**LLM / coding agent used:** OpenAI Codex (GPT-5)

## Selected Key Prompts

| # | Prompt (summarised) | How the result was used and verified |
| --- | --- | --- |
| 1 | Turn the Lab 3 brief into an engineering specification with role, authentication, and lifecycle requirements. | Used to structure `specification.md`; requirements were reviewed against the coursework scope. |
| 2 | Define API contracts, validation, status transitions, and authorization expectations for authenticated ticketing. | Used to prepare `api-spec.md` and guide route-level API tests. |
| 3 | Plan acceptance-criterion traceability before implementation. | Used to create `tests.md`, mapping AC-01 through AC-15 to API, UI, and E2E tests. |
| 4 | Implement secure login, logout, current-user identity, and mandatory initial-password change without exposing credentials. | Result was checked with authentication API tests and browser tests. |
| 5 | Add role-based UI navigation and backend authorization boundaries for Requester, IT Staff, and Administrator. | Result was checked with authorization tests and role-specific E2E flows. |
| 6 | Build the IT Staff queue/detail workflow with claim, assignment, priority, status transitions, public comments, and private notes. | Result was checked with staff API tests, UI tests, and the staff browser flow. |
| 7 | Build administrator user management with active-account and sole-administrator safeguards. | Result was checked with administration API/UI/E2E tests. |
| 8 | Verify and refine the existing Zen Green UI at desktop, tablet, and mobile sizes without changing business logic. | Result was checked visually and captured in the Lab 3 screenshot artifacts. |
| 9 | Perform final release verification: migrate/seed, run test suites, audit artifacts, and complete release documentation. | Results are recorded in `reviewer.md`; all commands and outputs were reviewed before documenting them. |

## My Reflection

I increased the AI use in this lab. Escepially with tight schedule of 1 week; AI usage became inevitable. I reviewed its generated code and see if its fit the critrea and code are as intended.