# Lab 1 — Test Plan and Evidence  (fill this in)

All test files live under server/tests/lab-01/ and client/tests/lab-01/.

| # | Tool | Test | Result |
|---|------|------|--------|
| 1 | Supertest | GET /api/health returns 200, status=ok | |
| 2 | Supertest | GET /api/categories returns 4 seeded categories in id order | |
| 3 | Vitest | Heading renders | |
| 4 | Vitest | Success state shows Online + category list | |
| 5 | Vitest | Error state shows Offline + message | |

Paste your passing terminal output / screenshot below.


*For 1, 2:*

server> npm test

> toktickit-server@1.0.0 test
> vitest run


 RUN  v2.1.9 C:/XXXX/XXXX (idk should I be showin this)/Desktop/toktickit/server

 ✓ tests/lab-01/categories.test.ts (1)
 ✓ tests/lab-01/health.test.ts (1)

 Test Files  2 passed (2)
      Tests  2 passed (2)
   Start at  20:23:20
   Duration  501ms (transform 51ms, setup 0ms, collect 376ms, tests 15ms, environment 0ms, prepare 218ms)

*For 3-5:*

client> npm test

> toktickit-client@1.0.0 test
> vitest run


 RUN  v2.1.9 C:/XXXX/XXXX/Desktop/toktickit/client

 ✓ tests/lab-01/App.test.tsx (3)
   ✓ App (3)
     ✓ renders the TokTickIT heading
     ✓ shows Online and the seeded categories on success
     ✓ shows an Offline error message when the API is unavailable

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  20:24:20
   Duration  14.69s (transform 58ms, setup 2.20s, collect 1.49s, tests 32ms, environment 10.40s, prepare 311ms)