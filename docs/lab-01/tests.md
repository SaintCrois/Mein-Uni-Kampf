# Lab 1 — Test Plan and Evidence  (fill this in)

All test files live under server/tests/lab-01/ and client/tests/lab-01/.

| # | Tool | Test | Result |
|---|------|------|--------|
| 1 | Supertest | GET /api/health returns 200, status=ok | PASS |
| 2 | Supertest | GET /api/categories returns 4 seeded categories in id order | PASS |
| 3 | Vitest | Heading renders | PASS |
| 4 | Vitest | Success state shows Online + category list | PASS |
| 5 | Vitest | Error state shows Offline + message | PASS |

Paste your passing terminal output / screenshot below.


*For 1, 2:*

server> npm test

> toktickit-server@1.0.0 test
> vitest run


 RUN  v2.1.9 C:/Users/Cent/Desktop/toktickit/server

 ✓ tests/lab-01/categories.test.ts (1)
 ✓ tests/lab-01/health.test.ts (1)

 Test Files  2 passed (2)
      Tests  2 passed (2)
   Start at  19:47:40
   Duration  599ms (transform 55ms, setup 0ms, collect 388ms, tests 54ms, environment 0ms, prepare 331ms)

*For 3-5:*

client> npm test

> toktickit-client@1.0.0 test
> vitest run


 RUN  v2.1.9 C:/Users/XXXX/Desktop/toktickit/client

 ✓ tests/lab-01/App.test.tsx (3)
   ✓ App (3)
     ✓ renders the TokTickIT heading
     ✓ shows Online and the seeded categories on success
     ✓ shows an Offline error message when the API is unavailable

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  19:41:30
   Duration  18.42s (transform 87ms, setup 2.68s, collect 1.94s, tests 66ms, environment 12.59s, prepare 718ms)