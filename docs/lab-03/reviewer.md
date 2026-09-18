# Lab 3 — Review and Release Record

**Author:** Punnapob Wirojwongchai — 67070503425 — SaintCrois  
**Peer reviewer:** Patcharak Plipat — 67070503427 — bravefe  
**Repository:** `SaintCrois/Mein-Uni-Kampf`  
**Release branch:** `feature/22-final-lab3-integration`

## Reviewed Pull Requests

| PR | Branch | Scope | Reviewer comment / author response | Approval evidence |
| --- | --- | --- | --- | --- |
| [#35](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/35) | `feature/11-lab3-specification` | Lab 3 specification, UI specification, and API contract | No review-comment transcript is retained in this repository. | Merge commit `60f7540`; merged to Lab 3 staging. |
| [#36](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/36) | `feature/12-lab3-test-plan` | Test plan and AC traceability | No review-comment or response transcript is retained locally. | Merge commit `bc619e0`; merged to Lab 3 staging. |
| [#37](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/37) | `feature/13-user-migration-seed` | User migration and deterministic seed data | No review-comment or response transcript is retained locally. | Merge commit `3f3054f`; merged to Lab 3 staging. |
| [#38](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/38) | `feature/14-authentication` | Authentication and mandatory password change | No review-comment or response transcript is retained locally. | Merge commit `ddfc661`; merged to Lab 3 staging. |
| [#39](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/39) | `feature/15-role-authorization` | Role authorization and authenticated shell | No review-comment or response transcript is retained locally. | Merge commit `4cfe035`; merged to Lab 3 staging. |
| [#40](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/40) | `feature/16-requester-regression` | Requester regression, comments, and notes | No review-comment or response transcript is retained locally. | Merge commit `d4d8435`; merged to Lab 3 staging. |
| [#41](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/41) | `feature/17-staff-ticket-queue` | IT Staff ticket queue | No review-comment or response transcript is retained locally. | Merge commit `598d082`; merged to Lab 3 staging. |
| [#42](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/42) | `feature/18-staff-ticket-operations` | Staff ticket detail and operations | No review-comment or response transcript is retained locally. | Merge commit `e16ac57`; merged to Lab 3 staging. |
| [#43](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/43) | `feature/19-admin-user-management` | Administrator user management | No review-comment or response transcript is retained locally. | Merge commit `480d046`; merged to Lab 3 staging. |
| [#44](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/44) | `feature/20-lab3-test-implementation` | API, UI, authorization, and E2E tests | No review-comment or response transcript is retained locally. | Merge commit `b5db70e`; merged to Lab 3 staging. |
| [#45](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/45) | `feature/21-ui-responsive-verification` | Zen Green UI, responsive verification, accessibility, screenshots | No review-comment or response transcript is retained locally. | Merge commit `d610341`; merged to Lab 3 staging. |

## Final Verification Approval Record

Issue 22 does not introduce product code. It records the final release verification on `feature/22-final-lab3-integration`. The automated evidence below is ready for maintainer review before manual merge to `lab3-staging` and `main`.

| Check | Result | Approval / response |
| --- | --- | --- |
| Database migration status | 3 migrations; schema up to date | Ready for maintainer approval. |
| Seed data | Idempotent seed completed; required active/inactive users and varied tickets verified | Ready for maintainer approval. |
| Server API, security, and Lab 2 regression tests | 149 passed, 0 failed | Ready for maintainer approval. |
| Client component and regression tests | 36 passed, 0 failed | Ready for maintainer approval. |
| Playwright E2E | 12 passed, 0 failed across desktop, tablet, and mobile | Ready for maintainer approval. |
| Acceptance-criterion traceability | AC-01 through AC-15 mapped in `tests.md` | Ready for maintainer approval. |
| UI screenshot evidence | 18 screenshots under `artifacts/lab-03/screenshots/` | Ready for maintainer approval. |

## Final-PDF Evidence Checklist (Answer Parts 1–9)

- [x] Part 1 — Engineering specification: `docs/lab-03/specification.md`.
- [x] Part 2 — API contract: `docs/lab-03/api-spec.md`.
- [x] Part 3 — UI design and responsive/accessibility record: `docs/lab-03/ui-spec.md`.
- [x] Part 4 — Test strategy and acceptance-criterion traceability: `docs/lab-03/tests.md`.
- [x] Part 5 — Authentication, roles, authorization, and requester-regression evidence: server/client/E2E tests.
- [x] Part 6 — IT Staff queue/detail workflow evidence: server/client/E2E tests and screenshots.
- [x] Part 7 — Administrator user-management evidence: server/client/E2E tests and screenshots.
- [x] Part 8 — Desktop, tablet, and mobile screenshot evidence: `artifacts/lab-03/screenshots/`.
- [x] Part 9 — Review, AI-use, seed, migration, and final release verification: this file and `ai-use.md`.

The Lab 3 handout itself is not stored in this repository; this checklist maps the repository evidence to its requested nine answer-part categories and should be compared with the submitted PDF before final hand-in.

---

## Review Conversation Addendum

The following review conversations are retained as an addendum to the release record above.

### PR #36 (`feature/12-lab3-test-plan`)

**Reviewer comment:** "I saw your test file. Have alot to cover. Please let me know when you want me to proceed"

**Author response:** "Thank you! Please merge."

**Reviewer follow-up:** "yep"

**Approval:** `bravefe` approved the changes and merged commit `bc619e0` into `lab3-staging`.

### PR #40 (`feature/16-requester-regression`)

**Reviewer comment:** "all of the 100, no i mean 101 test are passging so now you may actually work on the ui now\n\ngo go go"

**Author response:** "Alright! Thank you, please merge."

**Reviewer follow-up:** "gotta go fast"

**Approval:** `bravefe` approved the changes, noted "i forgot to approve but will merge", and merged commit `d4d8435` into `lab3-staging`.

### PR #45 (`feature/21-ui-responsive-verification`)

**Reviewer comment:** The reviewer confirmed that the UI verification, responsive screenshots, and documentation were complete and ready for merge.

**Author response:** "Thank you! Please merge."

**Approval:** `bravefe` approved the changes and merged commit `d610341` into `lab3-staging`.
