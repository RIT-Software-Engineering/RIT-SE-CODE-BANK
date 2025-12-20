# Notification Service

Centralized microservice for managing per-user notification preferences and dispatching real-time notifications via Email (SMTP) and Slack (Web API).

**Core functionality:**
- Manage per-user notification preferences (email and Slack)
- Dispatch notifications in real-time with role-based Handlebars templates
- No notification history storage (real-time dispatch only)

## Documentation

- **Integration Guide**: [`INTEGRATION.md`](INTEGRATION.md) - How to use this service from any app
- **System Overview**: [`../../docs/Notifications-System.md`](../../docs/Notifications-System.md) - End-to-end architecture

## Quick Start (Development)

1. **Copy environment file and set connection details**

```powershell
cd services/notification-service
Copy-Item .env.example .env
# Optional: set Slack bot token in .env (SLACK_BOT_TOKEN)
```

2. **Start dependencies and the service**

```powershell
docker compose up --build
```

**Default ports:**
- smtp4dev web UI: http://localhost:3005
- notification service: http://localhost:4000

3. **Apply Prisma schema and seed example preferences (optional)**

```powershell
npx prisma generate
npx prisma db push
npm run seed
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP port | 4000 |
| `DATABASE_URL` | Prisma connection string to MySQL/MariaDB | - |
| `SMTP_HOST` | SMTP host (e.g., 127.0.0.1) | - |
| `SMTP_PORT` | SMTP port (e.g., 2525) | - |
| `SMTP_FROM` | Sender address | se_svc_apps@rit.edu |
| `SMTP_USER` | SMTP username (optional) | - |
| `SMTP_PASS` | SMTP password (optional) | - |
| `SLACK_BOT_TOKEN` | Slack bot token for DMs (optional) | - |
| `CID_LOGO_PATH` | Optional logo image for emails | - |

See `.env.example` for a ready-to-copy template.

## API Reference

Base path: `/api/notifications`

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

## Database Setup (Development)

### Option 1: Quick single-container start (MySQL 8)

```powershell
# Start MySQL container (detached)
docker run -d --name rit-mysql `
  -e MYSQL_ROOT_PASSWORD=changeme `
  -e MYSQL_DATABASE=rit_notifications `
  -e MYSQL_USER=rit `
  -e MYSQL_PASSWORD=ritpass `
  -p 3306:3306 `
  -v rit_mysql_data:/var/lib/mysql `
  mysql:8.0

# Set DATABASE_URL for Prisma commands
$env:DATABASE_URL = 'mysql://rit:ritpass@127.0.0.1:3306/rit_notifications'
```

### Option 2: Docker Compose (recommended)

Create `docker-compose.db.yml`:

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

Start it:
```powershell
docker compose -f docker-compose.db.yml up -d
$env:DATABASE_URL = 'mysql://rit:ritpass@127.0.0.1:3306/rit_notifications'
```

### Generate Prisma client and apply schema

```powershell
npm install
npx prisma generate
npx prisma db push
```

## Testing

```powershell
npm test
```

## Troubleshooting

- **Database connection**: Verify `DATABASE_URL` and the DB container is running
- **Email delivery**: Check smtp4dev UI and SMTP_HOST/SMTP_PORT values  
- **Slack delivery**: Ensure SLACK_BOT_TOKEN is set with `chat:write` and `users:read.email` scopes
- **Port conflicts**: If port 3306 is in use, change the host port in docker command/compose and update `DATABASE_URL`
- **Windows networking**: Use `127.0.0.1` instead of `localhost` in connection strings