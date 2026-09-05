# Lab 2 — Peer Review Record

**Author:** Punnapob Wirojwongchai — 67070503425 — SaintCrois
**Peer reviewer:** Patcharak Plipat — 67070503427 — bravefe

## Pull Requests I authored (reviewed by my partner)

| PR | Branch | Reviewer verdict |
|----|--------|------------------|
| #16 | `docs/lab2-spec-plan` | Approved |
| #17 | `feat/lab2-db-context` | Approved |
| #18 | `feature/6-create-ticket` | Approved |
| #19 | `feature/7-my-tickets` | Approved |
| #20 | `feature/8-ticket-detail-attachments` | Approved |
| #21 | `feature/9-e2e-release` | Approved |

---

### PR #16 (`docs/lab2-spec-plan`)
**Reviewer comment I received:** "Thank you for the detailed PR description. Before I approve the work, could you please recheck `docs/lab-02/tests.md` in detail? In particular, please verify that: The test cases and expected results are sufficiently detailed and accurately reflect the requirements and acceptance criteria. Additionally, adding more detail to the specification file, where appropriate, would be welcome. Once you have rechecked and confirmed these points, please let me know so I can proceed with the review and approval."
**How I responded:** "Of course! Will look into that. Thank you. ... Hey! I have fixed the problem you've outlined. Please take a look!"
**Reviewer follow-up:** "I’ve reviewed your changes, and they include the additional information discussed. If there are no further changes needed, I’ll proceed with merging the PR."
**My final response:** "The problem had been solved. Please proceed with final review. Sorry for inconvenience."

---

### PR #17 (`feat/lab2-db-context`)
**Reviewer comment I received:** "Flawless work! All the data has been implemented correctly with the appropriate names and attributes. The only thing I noticed is that some of the dummy data looks oddly familiar. 😄 Other than that, there is nothing else that needs to be changed. Please let me know when you’re ready to merge the PR."
**How I responded:** "Thank you! Hehe. Please proceed to merge this PR."

---

### PR #18 (`feature/6-create-ticket`)
**Reviewer comment I received:** "I’ve tested the ticket creation functionality, and it works as intended. The related `.test` files are also included, and all the tests are passing. Please let me know when you’re ready for me to merge it."
**How I responded:** "Thank you! Please proceed to merge this PR."

---

### PR #19 (`feature/7-my-tickets`)
**Reviewer comment I received:** "I've seen that the my-ticket page have been add"
**How I responded:** "I'll assume you said there is no problem. If there is please comment. Else, please proceed to merge."
**Reviewer follow-up:** "🍇" *(Approved and merged)*

---

### PR #20 (`feature/8-ticket-detail-attachments`)
**Reviewer comment I received:** "I’ve seen that the attachments have been implemented and that the API for reviewing tickets has also been added. Before I merge the PR, I have a few confirmation questions. ... For the My Tickets page, should each ticket display additional information, considering that the API already provides fields such as status and createdAt? ... Recommendation / Thought: Would it be better for each major page to have its own dedicated route/address? For example: `/create` — Create Ticket, `/tickets` — My Tickets, `/ticket/:id` — Ticket Details. I think having separate routes would make the pages easier to navigate, bookmark, and maintain as the application grows."
**How I responded:** "Thank you for your comments. The three suggestions will be implement in next issue as planned. If there are more suggestions you would like to make, please do so. If not, then please proceed to merge this request."
**Reviewer follow-up:** "Ok, very nice. I shall now merge this PR."

---

### PR #21 (`feature/9-e2e-release`)
**Reviewer comment I received:** "Everything is included according to the lab sheet. The website artifact and the E2E testing are also included. It seems you decided to include the page route/address as well, which is fine since it isn’t required for the lab. The document is complete. In my opinion, I would have included a bit more back-and-forth communication regarding some of the issues in `reviewer.md`, but apart from that, your project is ready to be submitted. Please let me know when you’re ready to merge."
**How I responded:** "Thank you! Please proceed to merge."

---

## Pull Requests I reviewed for my partner (bravefe/cpe334_lab01_67070503427)

| PR | Branch | Reviewer verdict |
|----|--------|------------------|
| #23 | `feature/5-specification` | Approved (Changes requested & addressed) |
| #25 | `feature/6-database` | Approved (Changes requested & addressed) |
| #32 | `feature/7-ticket-2` | Approved |
| #33 | `feature/8-create-ticket-and-ticket-view` | Approved |
| #34 | `feature/9-attachment` | Approved |

---

### PR #23 (`feature/5-specification`)
**My comment:** "Hey! I see you have done a nice work there. I saw some inconsistency, but it is no major issue. Here are the details:
- `docs/lab-02/ui-spec.md` — §5 My Tickets: includes IT Priority and Ticket Owner even though they're excluded from Lab 2.
- `docs/lab-02/ui-spec.md` — §6 Ticket Detail: includes Public Comments, Service Actions, Event Log, and Resolution Summary even though they're out of scope.
- `docs/lab-02/test.md` — §1 Test Strategy: says E2E is out of scope, but `specification.md` §10.1 requires E2E tests.
- `docs/lab-02/specification.md` — §7.1 Status: status values differ from the earlier required status definition; confirm which set is correct."
**Partner's response:** "Nice catch. Thank you for your thorough and in-depth review. I will proceed to edit my `specification.md` file. ... I have made further changes to `test.md`, including additional test cases as well as coverage for E2E and unit testing. Additionally: `itPriority` has been removed from both the API and UI but will still remain in database for future implementation. Public comments, service actions, and event logs have been removed from the API for the current implementation, but their UI components will remain in place for future implementation. Thank you for your understanding. For `docs/lab-02/specification.md`, I have also rechecked the current database tables and confirmed that the structure is correct. Please review these changes as well and let me know if everything is clear and ready to merge."
**My follow-up:** "Very good! Everything is cleared. I'll proceed to merge now."
**Partner follow-up:** "Please use squash merge for this issue due to confusing commit timeline."
**My final response:** "Sure!" *(Merged into lab2-staging)*

---

### PR #25 (`feature/6-database`)
**My comment:** "Hey, Great job! I spot some of the explicitly excluded functions included here:
- `server/prisma/schema.prisma`: remove PublicComment, ServiceAction, and EventLog models because collaboration features are explicitly excluded from Lab 2 scope.
- `server/prisma/schema.prisma`: rename `ticketCode` to `ticketNumber` and `fileSizeBytes` to `fileSize` because the code must exactly match the approved Phase 1 specification fields.
- `server/prisma/seed.ts`: change the generated ticket prefix from `TK-2026-` to `TKT-2026-` because FR-02 strictly mandates the `TKT-YYYY-######` format. Please check. I may be wrong."
**Partner's response:** "After reconsidering the changes, I’ve made the following updates: Removed the PublicComment, ServiceAction, and EventLog models/databases entirely. Renamed `ticketCode` to `ticketNumber` and `fileSizeBytes` to `fileSize` in `schema.prisma`. Updated `server/prisma/seed.ts` to change the generated ticket prefix from `TK-2026-` to `TKT-2026-` (`TKT-YYYY-######`). Please have another look when you have a chance."
**My follow-up:** "Great! I see you had fixed most of the issues. Unfortunately, there is just a little bit more that we can make this perfect:
- Attachment Status Type Mismatch: It looks like `Attachment.status` was changed from an Enum (`ACTIVE`, `REMOVED`) to a boolean (`isActive`). The Phase 1 spec strictly requires an Enum so we can add future states (like `QUARANTINED` or `ARCHIVED`) without breaking the database.
- Doc Contradiction: The update to `specification.md` created a self-contradiction where section 6 now literally states 'attachment.isActive is an enum... rather than a boolean'. I may be wrong! If you feel like these are incorrect or unnecessary you can always inform me."
**Partner follow-up:** "Thank you for the detailed review. I’ve made the requested changes by restoring `Attachment.status` as an Enum with `ACTIVE` and `REMOVED`, and I’ve also corrected the contradiction in `specification.md` regarding `attachment.isActive`. I also made some further improvements to the seed data to make it more realistic. Please recheck and tell me when it's ready to merge."
**My final response:** "Hey! I see you've done a Grape job! Please tell me when you are ready to merge this PR." *(Merged into lab2-staging)*

---

### PR #32 (`feature/7-ticket-2`)
**Partner's comment:** "Issue 5 — Specification: Added and updated the Lab 2 engineering specification and test plan... Please just merge right away."
**My review comment:** "Good work! It is amazing to see a lot of commits before you finally settle with this version. Shows how much effort you've put into this work. After reviewing, I see no wrong with your code. It seems to align with what you've written in description and issue. Approved." *(Merged into lab2-staging)*

---

### PR #33 (`feature/8-create-ticket-and-ticket-view`)
**Partner's comment:** "Implement the 2 Page `/create-ticket` and `/ticket/:ticketNo`, add api test for create ticket and ticket detail."
**My review comment:** "After reviewing I see you have done a great job. Please tell me when you are ready to merge."
**Partner's response:** "Thank you very much please proceed to merge." *(Merged into lab2-staging)*

---

### PR #34 (`feature/9-attachment`)
**Partner's comment:** "Complete all the test, add attachment."
**My review comment:** "I checked the PR. The attachment functionality and related tests appear to be implemented, including the client attachment test and ticket/requester detail tests. Make sure that your tests pass. That's all. Great job. Notify me when you want to merge." *(Approved)*
