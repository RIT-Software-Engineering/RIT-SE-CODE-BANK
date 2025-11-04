````markdown
# Notification Service (preferences + real-time dispatch)

This service now focuses on two things only:
- Manage per-user notification preferences (email and Slack)
- Dispatch notifications in real time via Email (SMTP) and Slack (Web API)

No notification history is stored anymore. There are no retrieval or pagination endpoints.

> New: See also `INTEGRATION.md` in this folder for a practical guide to using this service from any app, and `docs/Notifications-System.md` at the repo root for an end-to-end overview.

## Quick start (dev)

1) Copy environment file and set connection details

```powershell
cd services/notification-service
Copy-Item .env.example .env
# Optional: set Slack bot token in .env (SLACK_BOT_TOKEN)
```

2) Start dependencies and the service

```powershell
docker compose up --build
```

Defaults in dev:
- smtp4dev web UI: http://localhost:3005
- notification service: http://localhost:4000

3) Apply Prisma schema and seed example preferences (optional)

```powershell
npx prisma generate
npx prisma db push
npm run seed
```

## Environment variables

- PORT — HTTP port (default 4000)
- DATABASE_URL — Prisma connection string to MySQL/MariaDB
- SMTP_HOST — SMTP host (e.g., 127.0.0.1)
- SMTP_PORT — SMTP port (e.g., 2525)
- SMTP_FROM — Sender address (default se-apps@rit.edu)
- SLACK_BOT_TOKEN — Slack bot token for DMs (optional)

See `.env.example` for a ready-to-copy template.

## API

Base path: `/api/notifications`

1) GET /api/notifications/preferences/:appId/:userId
- Returns stored preferences or sensible defaults when missing.
- 200 body:
  `{ appId, userId, notifyEmail, notifySlack, userEmail, slackUsername }`

2) PUT /api/notifications/preferences/:appId/:userId
- Upserts a user preference record for the given app.
- Body fields: `notifyEmail?`, `notifySlack?`, `userEmail?`, `slackUsername?`
- 200 body: `{ ok: true, preference: { ... } }`

3) POST /api/notifications/dispatch/:appId
- Dispatches a notification immediately based on stored preferences.
- Two ways to call:
  - Simple: subject/message
  - Templated: event/context (+ optional role)
- Simple body:
```json
{
  "userId": "bgg6007",
  "subject": "TA Application Submitted",
  "message": "Your application was successfully submitted."
}
```
- Templated body (agnostic context):
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
- Behavior: looks up preferences, sends via each enabled channel. Returns 200 when all enabled channels succeed, 502 when any enabled channel fails, and 422 when no channels are enabled.

## Notes

- Only the `UserPreference` model remains in the database. Notification history was removed.
- Logging includes timestamp, appId, userId, and per-channel success/failure.
- You can extend later with a queue, retries, or a persistence layer without changing the external API.


Run a local MySQL (Docker) for Prisma
------------------------------------

If you don't have a development database running, you can start a local MySQL container for the notification service and Prisma to use. The examples below are PowerShell-ready.

1) Quick single-container start (MySQL 8):

```powershell
# start a MySQL container (detached)
docker run -d --name rit-mysql \
  -e MYSQL_ROOT_PASSWORD=changeme \
  -e MYSQL_DATABASE=rit_notifications \
  -e MYSQL_USER=rit \
  -e MYSQL_PASSWORD=ritpass \
  -p 3306:3306 \
  -v rit_mysql_data:/var/lib/mysql \
  mysql:8.0

# Example DATABASE_URL (use this to run Prisma commands locally):
$env:DATABASE_URL = 'mysql://rit:ritpass@127.0.0.1:3306/rit_notifications'
```

2) Docker Compose example (recommended for dev):

Create a small `docker-compose.db.yml` next to this README or use your existing compose file:

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: changeme
      MYSQL_DATABASE: rit_notifications
      MYSQL_USER: rit
      MYSQL_PASSWORD: ritpass
    ports:
      - '3306:3306'
    volumes:
      - rit_mysql_data:/var/lib/mysql

volumes:
  rit_mysql_data:
```

Start it with:

```powershell
docker compose -f docker-compose.db.yml up -d
$env:DATABASE_URL = 'mysql://rit:ritpass@127.0.0.1:3306/rit_notifications'
```

## Generate Prisma client and apply schema

From the `services/notification-service` folder run:

```powershell
npm install
npx prisma generate
npx prisma db push
```

Notes & troubleshooting
- If the port 3306 is already in use, change the host port in the docker command/compose and update `DATABASE_URL` accordingly.
- If Prisma cannot connect, confirm the container is healthy and the `DATABASE_URL` matches the container's credentials and host (use `127.0.0.1` instead of `localhost` on some Windows setups).
- Back up any important data before running schema-altering commands like `migrate`.

````
# Notification Service

Centralized notification service for the RIT-SE monorepo. This service renders role- and app-scoped Handlebars templates and dispatches notifications over SMTP (email) and Slack.

This single README contains:
- Quickstart (local dev)
- Environment variables table (.env)
- API reference with examples
- Templates: naming & resolution rules
- Testing & CI notes
- Troubleshooting
- Next steps / optional artifacts I can add for you

---

## Quickstart (local development)

Prereqs: Node 18+, Docker (recommended), npm

1) Start local dev SMTP and (optional) DB for preferences. Example uses `smtp4dev` and a local MariaDB for the preferences DB.

PowerShell:

```powershell
# smtp4dev (web UI on 3005)
docker run -p 3005:80 -p 2525:25 rnwood/smtp4dev

# Optional MariaDB for tests or preferences storage
docker run --name rit_notification_service_db -e MYSQL_ROOT_PASSWORD=changeme -e MYSQL_DATABASE=notification_service -e MYSQL_USER=notif -e MYSQL_PASSWORD=notifpass -p 127.0.0.1:3310:3306 -v rit_notification_db:/var/lib/mysql -d mariadb:10.11
```

2) Create `.env` in `services/notification-service` (see the env table below for variables and examples).

3) Install dependencies and start the service in dev mode:

```powershell
cd services\notification-service
npm install
npm run dev
```

4) Test sending a notification (example):

```powershell
curl -X POST http://localhost:4000/api/notifications/dispatch/ta-portal -H "Content-Type: application/json" -d '{
  "userId": "bgg6007",
  "event": "application_status_changed",
  "role": "candidate",
  "context": {
    "appName": "TA Portal",
    "recipient": { "name": "Ben G", "email": "bgg6007@rit.edu" },
    "item": { "title": "TA" },
    "status": { "new": "Approved" },
    "cta": { "url": "https://portal.example.com/apps/123?from=email" }
  }
}'
```

Open the smtp4dev UI at http://localhost:3005 to inspect email output.

---

## Environment variables

Create `.env` (or set environment variables) with these keys. Values shown are examples.

- `PORT` — HTTP port for service. Default: `4000`
- `DATABASE_URL` — Prisma DB connection string (for preferences). Example: `mysql://notif:notifpass@127.0.0.1:3310/notification_service`
- `SMTP_HOST` — SMTP host for Nodemailer. Example: `127.0.0.1`
- `SMTP_PORT` — SMTP port. Example: `2525`
- `SMTP_FROM` — From address (optional). Example: `se_svc_apps@rit.edu`
- `SMTP_USER` / `SMTP_PASS` — If SMTP requires auth (optional)
- `SLACK_BOT_TOKEN` — Bot token for Slack API (optional)
- `CID_LOGO_PATH` — Optional path to a local image to attach as a CID in email templates
- `DEBUG_NOTIFY` — When truthy, prints template selection/debug logs

---

## Testing

```powershell
cd services\notification-service
npm install
npm test
```

## Troubleshooting

- DB connection: verify `DATABASE_URL` and the DB container is running.
- Email: check smtp4dev UI and SMTP_HOST/SMTP_PORT values.
- Slack: ensure SLACK_BOT_TOKEN is set for your workspace and the bot has chat:write,user:read.email scopes.

