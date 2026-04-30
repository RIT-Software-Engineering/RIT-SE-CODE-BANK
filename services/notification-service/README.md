# Notification Service

Centralized microservice for managing per-user notification preferences and dispatching real-time notifications via Email (SMTP) and Slack (Web API).

**Core functionality:**
- Manage per-user notification preferences (email and Slack)
- Dispatch notifications in real-time with role-based Handlebars templates
- No notification history storage (real-time dispatch only)

## Documentation

- **Integration Guide**: [`INTEGRATION_GUIDE.md`](INTEGRATION_GUIDE.md) - How to use this service from any app

**Default ports:**
- smtp4dev web UI: http://localhost:3005
- notification service: http://localhost:4001

## Quick Start (Development)

1. **Start dependencies and the service**

```powershell
docker compose -f compose.yaml -f compose.staging.yaml up --build
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP port | 4001 |
| `DATABASE_URL` | Prisma connection string to MySQL/MariaDB | - |
| `SMTP_HOST` | SMTP host (e.g., 127.0.0.1) | - |
| `SMTP_PORT` | SMTP port (e.g., 2525) | - |
| `SMTP_FROM` | Sender address | se_svc_apps@rit.edu |
| `SMTP_USER` | SMTP username (optional) | - |
| `SMTP_PASS` | SMTP password (optional) | - |
| `SLACK_BOT_TOKEN` | Slack bot token for DMs (optional) | - |
| `CID_LOGO_PATH` | Logo image for emails (optional)| - |

## API Reference

Base path: `/notifications`

### GET `/preferences/:appId/:userId`
Returns stored preferences or sensible defaults when missing.

**Response (200):**
```json
{ 
  "appId": "ta-portal", 
  "userId": "user123", 
  "notifyEmail": true, 
  "notifySlack": false, 
  "userEmail": "user@rit.edu", 
  "slackUsername": "@user123" 
}
```

### PUT `/preferences/:appId/:userId`
Upserts a user preference record for the given app.

**Body fields:** `notifyEmail?`, `notifySlack?`, `userEmail?`, `slackUsername?`

**Response (200):**
```json
{ "ok": true, "preference": { ... } }
```

### POST `/dispatch/:appId`
Dispatches a notification immediately based on stored preferences.

**Simple mode (subject/message):**
```json
{
  "userId": "bgg6007",
  "subject": "TA Application Submitted",
  "message": "Your application was successfully submitted."
}
```

**Templated mode (event/context):**
```json
{
  "userId": "bgg6007",
  "event": "application_status_changed",
  "context": {
    "appName": "TA Portal",
    "recipient": { "name": "Ben G", "email": "bgg6007@rit.edu" },
    "item": { "title": "TA" },
    "status": { "new": "Interview" },
    "cta": { "url": "https://portal.example.com/apps/123" }
  },
  "role": "candidate"
}
```

**Response codes:**
- `200`: All enabled channels succeeded
- `502`: Any enabled channel failed  
- `422`: No channels enabled for this user

## Troubleshooting

- **Database connection**: Verify `DATABASE_URL` and the DB container is running. Make sure that the prisma commands were ran within the docker container.
- **Email delivery**: Check smtp4dev UI and SMTP_HOST/SMTP_PORT values  
- **Slack delivery**: Ensure SLACK_BOT_TOKEN is set with `chat:write` and `users:read.email` scopes
- **Port conflicts**: If port 3307 is in use, change the host port in docker command/compose. The database url in the environment file should be able to remain the same as it is using the internal docker port.
