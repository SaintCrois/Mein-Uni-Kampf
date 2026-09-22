# Lab 3 - Review and Release Record

**Author:** Punnapob Wirojwongchai - 67070503425 - SaintCrois  
**Peer reviewer:** Patcharak Plipat - 67070503427 - bravefe  
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
| Server API, security, and Lab 2 regression tests | 148 passed, 0 failed | Ready for maintainer approval. |
| Client component and regression tests | 33 passed, 0 failed | Ready for maintainer approval. |
| Playwright E2E | 12 passed, 0 failed across desktop, tablet, and mobile | Ready for maintainer approval. |
| Acceptance-criterion traceability | AC-01 through AC-15 mapped in `tests.md` | Ready for maintainer approval. |
| UI screenshot evidence | 18 screenshots under `artifacts/lab-03/screenshots/` | Ready for maintainer approval. |

## Final-PDF Evidence Checklist (Answer Parts 1โ€“9)

- [x] Part 1 โ€” Engineering specification: `docs/lab-03/specification.md`.
- [x] Part 2 โ€” API contract: `docs/lab-03/api-spec.md`.
- [x] Part 3 โ€” UI design and responsive/accessibility record: `docs/lab-03/ui-spec.md`.
- [x] Part 4 โ€” Test strategy and acceptance-criterion traceability: `docs/lab-03/tests.md`.
- [x] Part 5 โ€” Authentication, roles, authorization, and requester-regression evidence: server/client/E2E tests.
- [x] Part 6 โ€” IT Staff queue/detail workflow evidence: server/client/E2E tests and screenshots.
- [x] Part 7 โ€” Administrator user-management evidence: server/client/E2E tests and screenshots.
- [x] Part 8 โ€” Desktop, tablet, and mobile screenshot evidence: `artifacts/lab-03/screenshots/`.
- [x] Part 9 โ€” Review, AI-use, seed, migration, and final release verification: this file and `ai-use.md`.

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

---

## Pull Requests I reviewed for my partner (bravefe/cpe334_lab01_67070503427)

| PR | Branch | Reviewer verdict |
|----|--------|------------------|
| [#44](https://github.com/bravefe/cpe334_lab01_67070503427/pull/44) | `document/lab3` | Approved |
| [#46](https://github.com/bravefe/cpe334_lab01_67070503427/pull/46) | `feature/lab3-data-model` | Approved (Changes requested & addressed) |
| [#48](https://github.com/bravefe/cpe334_lab01_67070503427/pull/48) | `feature/12-lab3-auth` | Approved |
| [#49](https://github.com/bravefe/cpe334_lab01_67070503427/pull/49) | `feature/14-lab3-staff-ticket-management` | Approved |
| [#50](https://github.com/bravefe/cpe334_lab01_67070503427/pull/50) | `feature/lab3-admin-users` | Approved |
| [#51](https://github.com/bravefe/cpe334_lab01_67070503427/pull/51) | `feature/16-lab3-integration-qa` | Pending |

---

### PR #44 (`document/lab3`)

**My review comment:** Approved. The Lab 3 specification documents and issue board setup were complete and in order.

**Partner's response:** "Please merge, thank you."

**Approval:** `SaintCrois` approved the changes and merged commit `42f8406` into `lab3-staging`.

---

### PR #46 (`feature/lab3-data-model`)

**My review comment:** "Looking great! I am not quite sure about uploading the uploads into GitHub. If you would like to fix that, you may do it now. If not, then please get to me when you are ready to merge!"

**Partner's response:** "I have removed the uploaded files and updated .gitignore to exclude the uploads folder. If there is nothing else left, please proceed to merge."

**Approval:** `SaintCrois` approved the changes and merged commit `169a961` into `lab3-staging`.

---

### PR #48 (`feature/12-lab3-auth`)

**My review comment:** Approved. Authentication, authorization, application shell, and authenticated requester workflow were all correctly implemented.

**Partner's response:** "Great, thanks. Please merge."

**Approval:** `SaintCrois` approved the changes and merged commit `7c7c1b4` into `lab3-staging`.

---

### PR #49 (`feature/14-lab3-staff-ticket-management`)

**My review comment:** Approved. IT Staff ticket queue, ticket detail operations, public comments, and internal notes were all implemented correctly.

**Partner's response:** "Nice, please merge."

**Partner follow-up:** "Wait, I noticed a UI bug and am fixing it."

**Partner follow-up (2):** "I have fixed the UI issues, including consistency updates and the resolution summary behavior. Please let me know when you are ready for the final review."

**Approval:** `SaintCrois` approved the changes and merged commit `b9f99cf` into `lab3-staging`.

---

### PR #50 (`feature/lab3-admin-users`)

**My review comment:** Approved. Administrator user management API and UI were implemented correctly, including all security restrictions and field validation.

**Partner's response:** "Thank you, please merge."

**Approval:** `SaintCrois` approved the changes and merged commit `23f00c6` into `lab3-staging`.

---

### PR #51 (`feature/16-lab3-integration-qa`)

**My review comment:** Great work! Please let me know when you would like it merged.

**Partner's response:** "Thank you, please merge."

**Approval:** `SaintCrois` approved the changes and merged commit into `lab3-staging`.
