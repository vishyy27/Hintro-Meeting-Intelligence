# Changelog (`CHANGELOG.md`)

All notable changes and milestones for the Hintro Meeting Intelligence Service project are documented below.

## [1.0.0] - 2026-06-05

### Added
- **Authentication**: Implemented JWT registration and login routes with password hashing using `bcryptjs` and request validation.
- **Meeting CRUD**: Standardized endpoints for creating, retrieving, and listing meeting transcripts with page/limit pagination.
- **AI Analysis**: Connected Gemini SDK with structured JSON schemas (`SchemaType.OBJECT`) to extract meeting summaries, action items, decisions, and follow-ups.
- **Traceability Middleware**: Built custom `AsyncLocalStorage` middleware tracing request IDs globally across all asynchronous boundaries, including error routing and background cron processes.
- **Response Interceptor**: Implemented global Express monkey-patch for consistent API response structures: `{ traceId, success, data }` and `{ traceId, success, error }`.
- **Zod Validation**: Added runtime request validation schemas. Enforced the `MM:SS` regex structure on transcript timestamps.
- **Overdue Actions & Webhooks**: Implemented `GET /api/action-items/overdue` and a cron job using `node-cron` scanning for pending past-due items and posting markdown alerts to Slack/Discord webhooks.
- **Reminder Audit Logs**: Added the `ReminderHistory` table to record success and failure statuses of automated notifications.
- **Metadata Endpoints**: Introduced public `/health` and `/api/evaluation` endpoints with raw JSON output.
- **Automated Tests**: Completed Jest testing suite covering controllers, validations, and reminder jobs with prisma/fetch mocking.

### Refactored & Fixed
- **Trace Context Fix**: Replaced global request mutation with structured TypeScript augmentations in `express.d.ts`, avoiding typescript compile-time casts (`(req as any)`).
- **Double Wrapping Bug**: Eliminated double JSON encapsulation by centralizing wrapper logic into the response interceptor and using `res.locals.__errorPayload` in the global error handler.
- **Logging Integration**: Directed all console error streams through the Winston logging client, appending trace IDs automatically.
