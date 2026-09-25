# Lab 4 - AI Use and Reflection
## TokTickIT: Actions Taken, Dashboards, and Final Regression Hardening

**LLM / coding agent used:** Gemini 3.8 Flash, Claude Sonnet 4.6

---

## 1. Selected Key Prompts

| # | Prompt (Summarised) | How the Result Was Used and Verified |
| :--- | :--- | :--- |
| 1 | Transform the Lab 4 handout requirements into a comprehensive Sprint 4 engineering specification (`specification.md`) defining Actions Taken, workflow state machine, role dashboards, and acceptance criteria. | Used to author `docs/lab-04/specification.md`. Verified against coursework handout sections §1 through §14 to ensure complete coverage without out-of-scope creep. |
| 2 | Specify REST API endpoints for Actions Taken (`POST`, `GET`, `PATCH`), role-based dashboards, and ticket status transitions with strict validation and safe error payloads. | Used to author `docs/lab-04/api-spec.md`. Reviewed against existing Lab 1–3 routes to guarantee backwards-compatibility and safe conflict handling. |
| 3 | Design the Zen Green UI specification (`ui-spec.md`) extending brand tokens, defining dashboard card layouts, Actions Taken modal interactions, and responsive breakpoints. | Used to author `docs/lab-04/ui-spec.md`. Verified visual hierarchy, color tokens, and accessibility standards (WCAG AA, explicit labels, visible focus rings). |
| 4 | Develop the complete test strategy and Acceptance-Criterion traceability matrix (`tests.md`) spanning server API, client UI, authorization barriers, and multi-viewport Playwright E2E tests. | Used to author `docs/lab-04/tests.md`. Mapped AC-01 through AC-16 to explicit test files and verified legacy regression coverage. |
| 5 | Structure the Sprint 4 peer review and release record (`reviewer.md`) incorporating the 9 required Answer Parts and reviewer checklist. | Used to author `docs/lab-04/reviewer.md` to guide peer review and submission evidence collection. |
| 6 | *[Planned]* Implement the `ActionTaken` Prisma model, database migration dev script, and idempotent seed enhancements. | *To be documented during Issue 24 implementation.* |
| 7 | *[Planned]* Implement server-side Actions Taken endpoints with session-derived performer binding and conditional follow-up note validation. | *To be documented during Issue 24 implementation.* |
| 8 | *[Planned]* Implement the Actions Taken UI table and modal dialogs on Ticket Detail with requester read-only protection. | *To be documented during Issue 25 implementation.* |
| 9 | *[Planned]* Implement the final ticket status transition matrix and resolution gate enforcement. | *To be documented during Issue 26 implementation.* |
| 10 | *[Planned]* Implement the Requester and IT Staff dashboard APIs and responsive metric card components. | *To be documented during Issue 27 implementation.* |

---

## 2. My Reflection.
