# Notification Service (Email + Slack)

Lightweight microservice that renders role-based templates and delivers notifications
over SMTP (email) and Slack. This README is a compact quick-start and developer guide.

Quick start (dev)

1. Copy environment example and (optionally) set a Slack bot token:

```powershell
cd services/notification-service
cp .env.example .env
# echo SLACK_BOT_TOKEN=xoxb-... >> .env
```

2. Start local dependencies and the service (docker-compose is recommended for dev):

```powershell
docker compose up --build
```

Defaults used in dev:
- smtp4dev web UI: http://localhost:3005
- notification service: http://localhost:4000

Test a notification (example):

```powershell
curl -X POST http://localhost:4000/send \
  -H "Content-Type: application/json" \
  -d '{
    "event": "application_status_changed",
    "context": {
      "job_title": "TA for SWEN-352",
      "new_status": "Interview",
      "app_link": "https://ta.se.rit.edu/applications/102",
      "candidate_name": "Ben Griffin"
    },
    "recipients": [
      { "role": "candidate", "email": "bgg6007@rit.edu" },
      { "role": "employer", "email": "prof.jones@rit.edu", "slack": "@profjones" }
    ]
  }'
```

Files and behavior
- Templates: `src/templates/<event>/<role>_(email|slack).hbs`. The service prefers app-scoped
  templates at `src/templates/<appId>/<event>/...` and falls back to global templates.
- Common context keys normalized server-side: `course_name`, `job_title`, `professor`, `candidate_name`, `app_link`.
- If no template exists, the service sends a compact HTML summary of the normalized context.

Testing

Unit tests cover helpers and the email/slack channel behavior. Run them from the service folder:

```powershell
cd services/notification-service
npm install
npm test
```

Cleanup notes

This repository has been simplified: duplicate helper definitions and development-only debug
scripts were removed and helpers are exported only when needed for tests. If you want the
service even smaller, we can remove Slack support or template partials next.

