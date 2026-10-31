# Lab 4 — AI Use and Reflection

**LLMs / coding agents used:** Gemini 3.8 Flash, Claude Sonnet 4.6, ChatGPT, and Codex.

## Key prompts and verification

| # | Prompt summary | Use and verification |
| --- | --- | --- |
| 1 | Turn the Lab 4 handout into an engineering specification. | Used for `specification.md`; checked against the documented functional requirements, business rules, and acceptance criteria. |
| 2 | Define Actions Taken API, validation, authorization, and migration rules. | Used as design input for the Prisma model and API; verified by `actions-taken.api.test.ts`. |
| 3 | Design Actions Taken UI states and responsive behavior. | Used to guide the Ticket Detail component; verified by component tests and Playwright. |
| 4 | Define the Ticket status matrix and resolution gate. | Used as a contract for the backend workflow; verified by `ticket-workflow.api.test.ts` and E2E flow. |
| 5 | Design server-calculated role dashboards and drill-down navigation. | Used for dashboard endpoints and UI; verified by API, UI, and E2E tests. |
| 6 | Plan Lab 4 test traceability across API, UI, responsive, and E2E checks. | Used to produce `tests.md`; final suites were run locally against the dedicated test database. |
| 7 | Review authorization, requester isolation, and attachment handling. | Used as a hardening checklist; verified by regression tests and code review of route guards. |
| 8 | Configure Playwright so E2E work cannot touch the development database. | Used to make the config fail closed unless `TEST_DATABASE_URL` targets `toktickit_test`; Lab 4 E2E tests then passed. |
| 9 | Summarize GitHub review evidence for the final paper. | Used to update `reviewer.md`; only supplied approvals and merges are recorded. |

## My Reflection — draft for author review

AI can helps with lots of things, but it is not the definite truth. Mistakes are made and we are the one who is responsible for those faulty. We should use it to help not to replace our workflow.

**Author action:** Review and personalize the reflection above before submission so it accurately represents your own AI-use experience.
