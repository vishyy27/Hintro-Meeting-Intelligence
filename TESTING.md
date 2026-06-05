# Testing Documentation (`TESTING.md`)

This document outlines the testing strategy, test suites, edge cases covered, and instructions to execute the tests.

## Testing Architecture
We use **Jest** as our test runner and **ts-jest** for in-process TypeScript transpilation.
To ensure tests are fast, deterministic, and isolated (requiring no live external services or active database instances), we mock our data layers:
1. **Prisma Client mocking**: Using `jest-mock-extended` to intercept database reads, writes, updates, and transactions.
2. **AI SDK mocking**: Mocking the Gemini API client methods inside `ai.service.ts` so that tests can simulate AI outputs under various conditions.
3. **HTTP Fetch mocking**: Mocking global `fetch` to test Slack/Discord webhook reminder delivery outcomes.

---

## Test Scenarios Executed

### 1. Authentication (`tests/controllers/auth.controller.spec.ts`)
- **Successful Registration**: Validates that new users can register, password hashing with `bcrypt` is triggered, and a valid JSON Web Token (JWT) is issued.
- **Duplicate Registration**: Verifies that registering with an already existing email returns a `400 VALIDATION_ERROR` instead of creating a duplicate entry.
- **Centralized Handling**: Ensures that runtime errors from database queries are forwarded directly to the Express `next()` error chain.

### 2. Meeting Analysis (`tests/controllers/meeting.controller.spec.ts`)
- **Success Path**: Checks that transcript analysis parses properly, invokes the Gemini SDK, updates the database meeting record with the structured JSON output, and inserts the generated action items.
- **Meeting Not Found**: Verifies that analyzing a non-existent meeting ID or a meeting belonging to a different user returns a `404 NOT_FOUND` error.
- **AI Failure Handling**: Ensures that failures within the Gemini SDK propagate gracefully.

### 3. Zod Input Validation (`tests/middlewares/validation.spec.ts`)
- **Strict Format Matching**: Verifies that request bodies with valid properties are approved.
- **Transcript MM:SS Timestamp Validation**:
  - **Pass**: Timestamps matching `MM:SS` (e.g. `00:00`, `12:34`) are accepted.
  - **Fail**: Malformed timestamps (e.g., `0:00` missing leading zero, or `12:345` with extra characters) are rejected with a clear validation error.

### 4. Overdue Reminder Webhook (`tests/services/reminder.service.spec.ts`)
- **Success dispatch**: Simulates finding overdue items, constructing the markdown payload, posting via `fetch`, and writing a `SUCCESS` entry in `ReminderHistory` with the active trace ID.
- **Fail dispatch**: Simulates a `400 Bad Request` or network drop during webhook dispatch, ensuring the error is caught and a `FAILED` record containing the exact error message is logged in `ReminderHistory`.

---

## Edge Cases Considered
1. **Trace ID Context Propagation**: Used `AsyncLocalStorage` to ensure the trace ID is preserved across database await boundaries and within scheduled cron run contexts. Tested that asynchronous tasks don't drop or swap trace IDs.
2. **Missing Webhook Configuration**: Handled cases where `WEBHOOK_URL` is omitted from `.env`. The system logs `FAILED` in the audit history with a descriptive error instead of crashing.
3. **Empty transcripts**: Validation schemas assert that transcripts cannot be empty arrays.

---

## Execution Instructions

To execute the test suite, run the following command in the workspace directory:

```bash
npx jest
```

### Script configuration in package.json
Ensure your package.json has a test runner shortcut:
```json
"scripts": {
  "test": "jest"
}
```
If configured, you can run:
```bash
npm test
```
