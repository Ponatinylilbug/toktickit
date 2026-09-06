# Lab 1 — AI Use and Reflection

**LLM/agent used:** Gemini 3.7 Flash (Antigravity Agent)

## Selected key prompts (6–10)
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Help verify project foundation setup for React + Express with TypeScript and Bootstrap | Reviewed generated project structure, verified dependencies, and confirmed build pipelines worked. |
| 2 | Implement `GET /api/health` endpoint returning JSON `{ status: "ok", service: "TokTickIT API" }` and Supertest test | Reviewed the route implementation and verified the test passed against the Express app instance. |
| 3 | Define Prisma `Category` schema with unique name and create idempotent seed script for the 4 IT categories | Checked `schema.prisma`, ran migration commands, and verified `seed.ts` prevented duplicate insertions. |
| 4 | Implement `GET /api/categories` endpoint returning seeded categories sorted by ID | Tested the endpoint response format against the acceptance criteria in the lab specification. |
| 5 | Create React UI to fetch health and categories with loading, Online, and Offline states | Integrated API client functions into `App.tsx` and styled status badges and category cards with Bootstrap. |
| 6 | Write Vitest unit tests for `App.tsx` covering initial render, success (Online), and failure (Offline) states | Executed `npm run test` in client directory and verified all 3 test assertions passed. |
| 7 | Diagnose why `categories.test.ts` failed with 500 in server test environment | Implemented Vitest spy mocking for Prisma client to isolate database calls during test runs. |
| 8 | Explain Git workflow regarding duplicate Pull Requests and verify final merge to main | Cleaned up project board Kanban cards, mapped correct PR numbers in documentation, and validated network graph. |

## Reflection
Structuring prompts with explicit constraints (such as exact API response payloads, TypeScript interfaces, and testing frameworks) significantly improved the quality and accuracy of the generated code. In one instance, the agent initially attempted to connect directly to PostgreSQL during isolated unit tests, which caused a 500 status code; I corrected this by instructing the agent to mock the Prisma database client so the tests could run deterministically without external database dependencies.
