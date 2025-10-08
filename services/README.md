# Notification Service (Email + Slack) — Ready to Run

This is a minimal microservice you can call from TA Portal, SCOOP, or CM Tool
to send **role-based notifications** over **Email (SMTP)** and **Slack (bot)**.

## Quick Start (Dev)

1) Copy `.env.example` to `.env` and (optionally) set `SLACK_BOT_TOKEN` if you want Slack DMs.

```bash
cp notification-service/.env.example notification-service/.env
# echo SLACK_BOT_TOKEN=xoxb-... >> notification-service/.env
```

2) Start everything (SMTP test server + service) with Docker Compose:
```bash
docker compose up --build
```

- smtp4dev Web UI → http://localhost:3005
- notification service → http://localhost:4000/health

3) Test a notification:
```bash
curl -X POST http://localhost:4000/send       -H "Content-Type: application/json"       -d '{
    "event": "application_status_changed",
    "context": {
      "job_title": "TA for SWEN-352",
      "new_status": "Interview",
      "app_link": "https://ta.se.rit.edu/applications/102",
      "applicant_name": "Ben Griffin"
    },
    "recipients": [
      { "role": "applicant", "email": "bgg6007@rit.edu", "name": "Ben" },
      { "role": "employer", "email": "prof.jones@rit.edu", "slack": "@profjones" }
    ]
  }'
```

Open smtp4dev at http://localhost:3005 — you should see **two emails**.
If `SLACK_BOT_TOKEN` is set and your bot is installed in the workspace,
the employer will also get a Slack DM.

## How it Works

- **Templates** live in `src/templates/<event>/<role>_(email|slack).hbs`
- If no template exists for a case, the service falls back to sensible defaults
- Slack DM resolution:
  - Pass `slack: "C..."` (channel ID) to post to a channel
  - Pass `slack: "@username"` to DM by handle (uses users.list; consider caching)
  - Or omit `slack` and provide `email` — the service will DM by **email** via `users.lookupByEmail`

## Add a New Event

1) Create templates:
```
src/templates/interview_scheduled/applicant_email.hbs
src/templates/interview_scheduled/employer_email.hbs
src/templates/interview_scheduled/employer_slack.hbs
```

2) POST with `event: "interview_scheduled"` and include the right `context` fields.
