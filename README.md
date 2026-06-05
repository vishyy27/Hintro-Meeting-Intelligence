# Hintro Meeting Intelligence Service (`README.md`)

An AI-powered meeting intelligence backend service to track meetings, extract insights with citations, manage action items, and trigger automated reminders.

---

## Features
- **JWT Authentication**: Secure registration and login flow.
- **Meeting Management**: Create and retrieve meetings, list transcripts with pagination.
- **AI Analysis Pipeline**: Trigger Gemini API to summarize, extract decisions, follow-ups, and action items with transcript citations (`MM:SS`).
- **Outbound Webhooks**: Slack/Discord compatible overdue action items reminders.
- **Background Cron Scheduler**: Automatically scans and dispatches overdue action items.
- **Unified Response Interceptor**: Enforces `{ traceId, success, data/error }` JSON format for all endpoints.
- **Request Traceability**: Employs `AsyncLocalStorage` to trace IDs globally across HTTP routes and background jobs.
- **Structured Logging**: Timestamps and trace IDs included in Winston logs.
- **Swagger/OpenAPI UI**: Interactive API documentation.

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- SQLite3

### 1. Installation
Clone the repository, navigate to the folder, and install dependencies:
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory and define the following variables:
```env
PORT=3000
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your_jwt_secret_key"
GEMINI_API_KEY="your_google_gemini_api_key"
WEBHOOK_URL="your_slack_or_discord_webhook_url"
CRON_SCHEDULE="0 * * * *"  # Defaults to every hour
```

### 3. Database Migration
Initialize and sync the SQLite database using Prisma:
```bash
npx prisma db push
```

---

## 🚀 Execution Steps

### Development Server
Start the server locally with auto-reload:
```bash
npm run dev
```

### Production Server
Build and run the production compiled JavaScript version:
```bash
npm run build
npm run start
```

### Run Tests
Execute the automated Jest test suite:
```bash
npm test
```

---

## 📖 API Documentation (Swagger)
The API documentation is served interactively via Swagger UI:
- **Local URL**: `http://localhost:3000/api-docs`

---

## 📝 API Usage Examples

### 1. Register a User
- **Endpoint**: `POST /api/auth/register`
- **Body**:
  ```json
  {
    "email": "candidate@example.com",
    "password": "securepassword123",
    "name": "John Doe"
  }
  ```

### 2. Create Meeting
- **Endpoint**: `POST /api/meetings`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "title": "Weekly Sprint Sync",
    "meetingDate": "2026-06-05T10:00:00Z",
    "transcript": [
      { "timestamp": "00:10", "speaker": "John", "text": "We should deploy the backend." },
      { "timestamp": "00:20", "speaker": "Alice", "text": "I will prepare the release notes." }
    ]
  }
  ```

### 3. Trigger AI Analysis
- **Endpoint**: `POST /api/meetings/:id/analyze`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "traceId": "abc-123-uuid",
    "success": true,
    "data": {
      "summary": [
        { "text": "The team plans to deploy the backend.", "citations": [{ "timestamp": "00:10" }] }
      ],
      "actionItems": [
        { "task": "Prepare release notes", "assignee": "Alice", "citations": [{ "timestamp": "00:20" }] }
      ],
      "decisions": [],
      "followUpSuggestions": []
    }
  }
  ```

---

## 🚀 Deployment Instructions
The application is pre-configured for deployment on **Render**:
1. Connect your GitHub repository to Render.
2. Create a new **Web Service**.
3. Set the build command to `npm install && npm run build` and start command to `npm start`.
4. Configure environment variables in Render dashboard.
5. Set `PORT` and `DATABASE_URL` appropriately.
