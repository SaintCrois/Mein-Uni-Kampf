# Lab 1 — Peer Review Record  (fill this in)

**Author:** Punnapob Wirojwongchai — 67070503425 — SaintCrois
**Peer reviewer:** Patcharak Plipat — 67070503427 — bravefe

## Pull Requests I authored (reviewed by my partner)

| PR | Branch | Reviewer verdict |
|----|--------|------------------|
| #1 | feature/1-project-foundation | Approved |
| #2 | feature/2-health-check | Approved |
| #3 | feature/3-category-seed | Approved |
| #4 | feature/4-category-list | Approved |

---

### PR #1 (`feature/1-project-foundation`)
**Reviewer comment I received:** "Very nice. Include setup guide in readme.md. Question: is the change in App.tsx needed?"
**How I responded:** Bootstrap is installed and visible in the frontend. So yes.

---

### PR #2 (`feature/2-health-check`)
**Reviewer comment I received:** "Wait you are merging with main. Do you have the lab1-staging or something?"
**How I responded:** Oh thank you. Changed that.

---

### PR #3 (`feature/3-category-seed`)
**Reviewer comment I received:** "The seed is safe to run more than once without duplicates. Wait, how do I do that."
**How I responded:** I used prisma.category.upsert() in prisma/seed.ts. If a category name already exists in the database, it performs an empty update:{} instead of creating a duplicate, making the seed script completely safe to run multiple times.

---

### PR #4 (`feature/4-category-list`)
**Reviewer comment I received:** All the code are being implemented also include all the necessary document. He warned me about the test.md file that isn't fixed. Then, he approved.
**How I responded:** I fixed the test.md for both front and backend. After he approved, I add Heart Emoji, Thumb Emoji, Celebrate Emoji. Merged.

---

## Pull Requests I reviewed for my partner

### Issue 1 (`feature/1-project-foundation`)
**My comment:** "Nice work setting up the project foundation! The README setup instructions are clear and easy to follow, and Bootstrap is properly installed and visible in the React frontend. Everything meets the acceptance criteria. All clear, good job!"  
**Partner's response:** "Thanks! Merged into `lab1-staging`."

---

### Issue 2 (`feature/2-health-check`)
**My comment:** "Great job implementing the health check! The `/api/health` endpoint returns the correct HTTP 200 payload with `status: ok`, and the frontend in `App.tsx` handles the status updates smoothly. Nice attention to detail on adding the top-margin tweak for better UI spacing too. Looks good to merge—just don't forget to create your `feature/3-category-seed` branch right after!"  
**Partner's response:** "Thanks for the review! Created the new branch and merged into `lab1-staging`."

---

### Issue 3 (`feature/3-category-seed`)
**My comment:** "Awesome work on the database setup! The Prisma `Category` schema is set up correctly with unique name constraints, and the seed script inserts all 4 default categories without creating duplicates on re-runs. Great initiative updating the `README.md` with instructions on how to run the Docker database as well. Overall it's a go, please merge!"  
**Partner's response:** "Thank you! Merging into `lab1-staging` now."

---

### Issue 4 (`feature/4-category-list`)
**My comment:** Nice, great work. Everything looks good and ready to merge:

Backend Route: The GET /api/categories endpoint in server/src/app.ts correctly selects id and name, sorts by id: "asc", and properly handles error status codes (500).
Testing: The Supertest suite in categories.test.ts cleanly verifies both the HTTP 200 response and the exact order of the 4 seeded categories.
Documentation: docs/lab-01/ai_use.md and docs/lab-01/tests.md are updated
Ok plz merge.  
**Partner's response:** He said thank you for the review.

---