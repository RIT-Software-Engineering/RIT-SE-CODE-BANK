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
curl -X POST http://localhost:4000/api/notifications/dispatch/ta-portal \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "bgg6007",
    "event": "application_status_changed",
    "role": "candidate",
    "context": {
      "appName": "TA Portal",
      "recipient": { "name": "Ben Griffin", "email": "bgg6007@rit.edu" },
      "item": { "title": "TA for SWEN-352" },
      "status": { "new": "Interview" },
      "cta": { "url": "https://ta.se.rit.edu/applications/102?from=seed" }
    }
  }'
```

Files and behavior
- Templates: `src/templates/<event>/<role>_(email|slack).hbs`. The service prefers app-scoped
  templates at `src/templates/<appId>/<event>/...` and falls back to global templates.
- Agnostic context contract: `recipient`, `item`, `status`, `cta`, plus optional `appName`, `comment`, and `flags`.
- If no template exists, the service sends a compact HTML summary of the context.

Testing

Unit tests cover helpers and the email/slack channel behavior. Run them from the service folder:

```powershell
cd services/notification-service
npm install
npm test
```

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

3) Generate Prisma client and apply schema

From the `services/notification-service` folder run:

```powershell
npm install
npx prisma generate
# Use db push to sync the schema without creating migration files:
npx prisma db push

# Or create a migration (recommended for tracked schema changes):
npx prisma migrate dev --name init
```

Notes & troubleshooting
- If the port 3306 is already in use, change the host port in the docker command/compose and update `DATABASE_URL` accordingly.
- If Prisma cannot connect, confirm the container is healthy and the `DATABASE_URL` matches the container's credentials and host (use `127.0.0.1` instead of `localhost` on some Windows setups).
- Back up any important data before running schema-altering commands like `migrate`.

Cleanup notes

This repository has been simplified: duplicate helper definitions and development-only debug
scripts were removed and helpers are exported only when needed for tests. If you want the
service even smaller, we can remove Slack support or template partials next.

