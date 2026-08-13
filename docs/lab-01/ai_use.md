# Lab 1 — AI Use and Reflection  (fill this in)

**LLM/agent used:** ChatGPT and Gemini (3.6 Flash & 3.1 Pro)

## Selected key prompts (6–10)
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Asked for overall project planning and structure. | Reviewed the 4-issue sequence to understand the scope of the full-stack lab. |
| 2 | Requested a detailed, step-by-step breakdown for each of the 4 issues. | Used the detailed steps to guide my implementation for the backend routes, database, and frontend UI. |
| 3 | Asked for a step-by-step guide to start Issue 1 (Health Check). | Added the `GET /api/health` route handler code to `server/src/app.ts`. |
| 4 | Asked how to set up Docker PostgreSQL and seed the database for Issue 3. | Ran the provided Docker run command, executed Prisma migrations, seeded the database, and generated the Prisma client. |
| 5 | Asked how to fix a TypeScript error (red underline) on the Prisma query in `app.ts`. | Added parentheses to properly invoke the `getPrisma()` function in my route handler instead of just referencing it. |
| 6 | Asked how to implement the `GET /api/categories` route and unskip the tests. | Pasted the route logic into `app.ts` and changed `test.todo`/`test.skip` to `test()` in the test suite. |
| 7 | Asked how to connect the frontend API client to fix the "not implemented yet" error. | Replaced the dummy stub in `client/src/api.ts` with the provided HTTP `fetch` logic. |
| 8 | Asked how to fix a React crash (`Cannot read properties of undefined (reading 'map')`). | Added array validation to my frontend state setter and added optional chaining (`?.map`) to the JSX in `App.tsx`. |
| 9 | Asked why visiting `http://localhost:3000` resulted in a "Cannot GET /" error. | Realized port 3000 is only for the API. Switched to testing the UI on port 5173. |
| 10 | Asked if an already open Pull Request updates automatically when new commits are pushed. | Pushed my final commits to the existing branch without closing or recreating the PR. |

## Reflection
Two or three sentences: what made your prompts better, and one place you had to
correct or reject what the agent produced.

I mainly use Chat-gpt and Gemini. I used what have been taught in class. First I asked it to plan everything out. Then I demand strp-by-step, I specific "WHAT, WHY, WHERE, HOW" which made work alot easier. I know where to look, what it does, how to paste it, and why. I reject some answers at the very end where I asked it to summarizes what I had asked it. It failed to answer properly for 2 times. I changed the model.

PS. I am so embarrassed for most of the questions. Please do not read through it; I do not want you to question why is this kid so dumbo. Thank you.
