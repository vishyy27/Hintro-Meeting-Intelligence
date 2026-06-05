# Decisions

## Database Choice
**Decision:** SQLite via Prisma ORM
**Why it was chosen:** SQLite is extremely easy to setup for an assignment and does not require running external Docker containers or database instances. Prisma provides a strictly typed ORM which pairs perfectly with TypeScript.
**Alternatives considered:** PostgreSQL or MongoDB. PostgreSQL is great for production but requires setup overhead for a review process. MongoDB is schema-less and great for fast iteration, but relational data like Meetings and Action Items fit well in SQL.
**Trade-offs:** SQLite lacks some advanced features of full RDBMS (like robust concurrent writes), but for an internship assignment, this trade-off is acceptable to maximize ease of evaluation.

## Authentication Strategy
**Decision:** JWT (JSON Web Token) via a simple registration/login endpoint.
**Why it was chosen:** JWT is stateless and easy to implement. It scales well and is standard for API development. We will store hashed passwords using `bcryptjs`.
**Alternatives considered:** Session-based authentication.
**Trade-offs:** JWTs are harder to revoke before expiration unless a blacklist or short expiry with refresh tokens is used. For this assignment, a simple short-lived JWT is sufficient.

## Unified API Response Format
**Decision:** Global response wrapper middleware/utility.
**Why it was chosen:** Ensures that all APIs return a consistent JSON structure `{ traceId, success, data/error }`.
**Alternatives considered:** Manual formatting in each controller.
**Trade-offs:** A wrapper enforces uniformity but slightly obscures the raw Express response interface. We manage this by providing a clean `sendSuccess` helper.

## Project Structure
**Decision:** Standard 3-tier architecture (`routes` -> `controllers` -> `services`).
**Why it was chosen:** Keeps routing logic separated from request handling and business logic. Easy to test and scale.
**Alternatives considered:** Feature-based slicing (e.g., all meeting files in one folder).
**Trade-offs:** Feature-based is better for very large apps, but 3-tier is simpler for smaller services and easier to navigate for reviewers.

## Background Jobs & Scheduler
**Decision:** `node-cron` running inside the application process.
**Why it was chosen:** `node-cron` is lightweight, has no external service dependencies (like Redis for bullmq), and allows running tasks exactly on defined cron expressions. It is extremely simple to configure for review.
**Alternatives considered:** BullMQ, agenda, or external trigger services (like cron-job.org).
**Trade-offs:** Running cron jobs in-process consumes application memory and doesn't scale well across multi-instance clusters (which could run the task multiple times). For this service, since we run a single node instance and value simplicity, this trade-off is optimal.

## Webhook Integration & Auditing
**Decision:** Outbound Webhooks (Slack/Discord formatted markdown) with a relational `ReminderHistory` audit table.
**Why it was chosen:** A standard HTTP POST payload with compatible Slack/Discord properties (`text`/`content`) is highly interoperable. Logging outcomes to `ReminderHistory` linked to `ActionItem` under the global trace ID ensures we maintain audit trails for reminders.
**Alternatives considered:** Email dispatchers (like SendGrid/Resend). Webhooks were selected because they are easier to set up, test, and demonstrate immediately.
**Trade-offs:** We depend on the external webhook availability; if Discord/Slack is down, delivery fails. We mitigated this by catching execution errors and auditing them as `FAILED` alongside the detailed error messages in the database.

