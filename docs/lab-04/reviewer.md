# Lab 4 — Peer Review and Release Record

**Author:** Punnapob Wirojwongchai — 67070503425 — SaintCrois
**Peer reviewer:** Patcharak Plipat — 67070503427 — bravefe
**Repository:** `SaintCrois/Mein-Uni-Kampf`  
**Staging branch:** `lab4-staging`  
**Target release branch:** `main`

## Review record

| PR | Branch | Scope | Evidence-backed review outcome |
| --- | --- | --- | --- |
| [#58](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/58) | `feature/23-lab4-specification` | Engineering contract and six Lab 4 documents | bravefe approved on 25 September after confirming the specification and tests were included; merged into `lab4-staging`. |
| [#59](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/59) | `feature/24-actions-taken-backend` | ActionTaken schema, migration, seed, API, and tests | bravefe stated the backend implementation looked good and approved; merged into `lab4-staging` on 28 September. |
| [#60](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/60) | `feature/25-actions-ticket-workflow` | Actions Taken UI and ticket workflow | bravefe confirmed the client and E2E tests were present and approved; merged into `lab4-staging`. |
| [#61](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/61) | `feature/26-role-dashboards` | Requester and IT Staff dashboards | bravefe found the required test files and requirements complete, then approved; merged into `lab4-staging`. |
| [#62](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/62) | `feature/27-final-hardening` | Security, accessibility, responsive evidence, and regression hardening | bravefe reviewed the code and Lab tests and approved; merged into `lab4-staging`. |
| [#63](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/63) | `feature/28-final-lab4-integration` | Final E2E, integration, and release verification | bravefe reviewed the code and Lab tests and approved; merged into `lab4-staging`. |

## Reconstructed review pattern

The supplied GitHub history shows a consistent review exchange for PRs #58–#62: the reviewer checked the stated scope and tests, gave a short approval, the author requested a merge, and the PR was merged into `lab4-staging`. This is a concise reconstruction of the repeated pattern, not a verbatim transcript.

## Reviewer verification checklist

- [x] `ActionTaken` is related to Ticket and User in the Prisma schema.
- [x] API tests cover server-derived performer identity, validation, requester read-only access, and staff/admin writes.
- [x] Workflow API tests cover the status matrix, ownership gate, advisory indicator, and terminal states.
- [x] Dashboard API/UI tests cover scoped metrics, authorization, and drill-down behavior.
- [x] Server and client regression suites pass in the final local verification.
- [x] Lab 4 Playwright flows pass on desktop, tablet, and mobile using `toktickit_test`.
- [X] PR #63 reviewer approval and merge evidence — pending external GitHub activity.

## Submission evidence still external

The final PDF still needs actual GitHub/Kanban screenshots and, after it occurs, the PR #63 approval/merge evidence. These must be captured from GitHub rather than recreated locally.
