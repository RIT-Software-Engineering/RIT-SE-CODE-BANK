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
curl -X POST http://localhost:4000/send -H "Content-Type: application/json" -d '{
  "event": "application_status_changed",
  "context": {
    "appName": "TA Portal",
    "new_status": "approved",
    "candidate_name": "Ben G",
    "job_title": "TA",
    "course_name": "CS 101",
    "professor": "Dr. Ada Lovelace",
    "app_link": "https://portal.example.com/apps/123"
  },
  "recipients": [
    {"role":"candidate","email":"bgg6007@rit.edu"},
    {"role":"employer","email":"prof@example.com"},
    {"role":"admin","email":"alice@example.com"}
  ]
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

## API reference

Base path: `/`

1) GET /api/v1/preferences/:appId/:identifier
- Purpose: Read notification prefs for a user within an app
- Params: `appId` (string), `identifier` (email or username)
- Response 200: `{ notifyEmail: boolean, notifySlack: boolean, username?:string, userEmail?:string }`
- When missing, returns defaults `{ notifyEmail: true, notifySlack: false }`

2) PUT /api/v1/preferences/:appId/:identifier
- Purpose: Upsert preferences
- Body: `{ userEmail?: string, username?: string, notifyEmail?: boolean, notifySlack?: boolean }`
- Behavior: `userEmail` is canonical identity (lowercased). If missing, service may attempt to resolve by username and return `400` if it cannot.
- Response 200: `{ ok: true, preference: { ... } }`

3) POST /send
- Purpose: Dispatch a templated notification to multiple recipients
- Body shape example:

```json
{
  "event": "application_status_changed",
  "context": { /* arbitrary context keys; normalized server-side */ },
  "recipients": [
    { "role": "candidate", "email": "..." },
    { "role": "employer", "email": "...", "slack": "@user" }
  ]
}
```

- Response: `{ ok: true, results: [ { type: 'email'|'slack', to/channel, messageId|ts, error? } ] }`

Notes & examples: templating details are covered in the Templates section.

---

## Templates: naming & resolution rules

Location: `src/templates/`

- App-scoped templates (preferred): `src/templates/<appId>/<event>/<role>_<kind>.hbs`
- Global templates (fallback): `src/templates/<event>/<role>_<kind>.hbs`
- Partials: `src/templates/partials/*` (header/footer etc.)
- Role names: `candidate`, `applicant` (treated like candidate), `employer`, `admin`, `recipient` (generic)
- Kinds: `email`, `slack`

Resolution algorithm (high level):
1. If `appId` provided, try `src/templates/<appId>/<event>/<role>_<kind>.hbs`
2. If not found, try `src/templates/<event>/<role>_<kind>.hbs`
3. For non-admin roles, try aliases (e.g. `applicant` -> `candidate`) then fall back to `src/templates/<event>/<kind>.hbs` (generic)
4. Admins: the service prefers admin-specific templates only — ensure `admin_email.hbs` exists app-scoped or globally to avoid admin receiving employer/candidate templates.

Template context available to templates:
- All keys in the `context` object passed to `/send` (normalizeContext maps aliases: `course_name`, `job_title`, `professor`, `candidate_name`, `app_link`)
- `recipient` object with recipient-specific fields (e.g. `recipient.name`)

---

## Testing & CI notes

Unit tests
- Run from service folder:

```powershell
cd services\notification-service
npm install
npm test
```

## Troubleshooting

- If templates are not selected as expected: set `DEBUG_NOTIFY=1` and look for `using template` debug lines in logs.
- DB connection: verify `DATABASE_URL` and that the DB is reachable on the configured host/port.
- Prisma Windows issues: if `prisma generate` errors with EPERM try closing editors or restarting shell.

