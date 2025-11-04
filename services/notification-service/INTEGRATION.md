# Integrating with the Notification Service

This guide shows how to add notifications (email + Slack) to any app in this monorepo or to an external service. You'll learn how to define events and templates, set user preferences, and dispatch messages reliably with robust CTAs.

> For a conceptual overview of how the whole system fits together, see [`../../docs/Notifications-System.md`](../../docs/Notifications-System.md)  
> For service setup and development, see [`README.md`](README.md)

## What you get

- **Role-aware templates** using Handlebars
- **Email delivery** via SMTP and **Slack DMs** via Slack Web API
- **Per-user, per-app preferences** (enable email/Slack, email address, Slack username)
- **Universal, robust CTAs** that survive login/role changes
- **Detailed dispatch logs** with per-channel success/failure reporting

## Quick start

1. **Pick an app ID** for your producer app, e.g., `ta-portal`
2. **Ensure the Notification Service is running** (default port 4000). See [`README.md`](README.md) for Docker/dev setup
3. **Create templates** for your events (see [Template resolution](#template-resolution) below)
4. **In your app**, capture the recipient's `userId` and prepare an event `context`
5. **Call the dispatch API**: `POST /api/notifications/dispatch/:appId` with your `appId` and payload

### Examples

**Save preferences for a user:**

```powershell
curl -s -X PUT http://localhost:4000/api/notifications/preferences/ta-portal/jdoe1234 -H "Content-Type: application/json" -d '{
  "notifyEmail": true,
  "notifySlack": false,
  "userEmail": "jdoe1234@rit.edu",
  "slackUsername": "@jdoe1234"
}'
```

**Send a templated event to a candidate:**

```bash
curl -X POST http://localhost:4000/api/notifications/dispatch/ta-portal \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "jdoe",
    "event": "application_status_changed",
    "role": "candidate",
    "context": {
      "recipient": { "name": "Jane Doe", "email": "jdoe@rit.edu" },
      "item": { "title": "Teaching Assistant" },
      "status": { "new": "Interview" },
      "cta": { "url": "https://apps.se.rit.edu/Applications?jobPositionId=123&applicationId=456" }
    }
  }'
```

**Response includes per-channel summary:**

```json
{
  "ok": true,
  "summary": {
    "email": { "attempted": true, "sent": true, "to": "jdoe1234@rit/edu" },
    "slack": { "attempted": false }
  }
}
```

## API Reference

Base path: `/api/notifications`

### GET `/preferences/:appId/:userId`
Returns stored preferences or defaults `{ notifyEmail: true, notifySlack: false }` when missing.

### PUT `/preferences/:appId/:userId`
Upserts a preference record.  
**Body fields**: `notifyEmail?`, `notifySlack?`, `userEmail?`, `slackUsername?`

### POST `/dispatch/:appId`
Dispatch a notification immediately.

**Usage modes:**
- **Simple**: `subject` + `message` (plaintext) when you don't need templating
- **Templated**: `event` + `context` (+ optional `role`) to render Handlebars templates

**Request body (templated):**

```json
{
  "userId": "string",
  "event": "string",
  "role": "candidate|employer|admin|...",
  "context": { "any": "json" },
  "subject": "optional subject override"
}
```

**Response codes:**
- `200`: All enabled channels succeeded
- `502`: One or more enabled channels failed (see `summary`)
- `422`: No channels are enabled for this user

## Template Resolution

Templates live under `services/notification-service/src/templates/<appId>/<eventKey>/` with this naming pattern:

- `<role>_email.hbs` – HTML email template
- `<role>_slack.hbs` – Slack message template (plain text)

**Example structure:**
```
services/notification-service/src/templates/my-app/application_status_changed/
├── candidate_email.hbs
├── candidate_slack.hbs
└── employer_email.hbs
```

**Important notes:**
- Shared partials (header/footer) are registered per render
- **Slack templates**: Use triple brackets for URLs `{{{cta.url}}}` to preserve query strings

## Context Contract

Context is app-defined, but the service uses a standardized app-agnostic structure:

| Field | Type | Description |
|-------|------|-------------|
| `recipient` | `{ name?, email?, slackUsername? }` | Target user information |
| `item` | `{ id?, title?, ownerName?, ownerEmail? }` | The entity this message is about |
| `status` | `{ new?, previous? }` | Status change information |
| `comment` | `string?` | Optional comment or message |
| `flags` | `{ applied?, hired?, acceptedOffer? }` | Boolean flags for state |
| `cta` | `{ url: string }` | Call-to-action URL |
| `appName` | `string?` | Application name |

> ⚠️ **Legacy fields removed**: Old aliases like `candidate_name`, `job_title`, `new_status`, `is_*`, and `app_link` are no longer supported. Update your producers and templates to use the standardized fields above.

### Building Robust CTAs

**Best practice**: Use a single universal route (like TA Portal's `/Applications`) with query params that identify the target item (e.g., `jobPositionId` and `applicationId`).

**Your UI should:**
- Determine the current user's role at runtime
- Redirect to the correct destination page  
- Optionally auto-open modals or scroll/focus/highlight the target element

## Recipient Resolution and Fallbacks

- **Primary**: Recipient info comes from user preferences for your `appId`
- **Email fallback**: Service uses `context.recipient.email` if preferences don't have an email set (avoids "No recipients defined" errors)
- **Slack**: Set `slackUsername` in preferences (recommended) or provide email in `context` for lookup

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 4000 |
| `DATABASE_URL` | Prisma DB connection string | - |
| `SMTP_HOST` | SMTP server host | - |
| `SMTP_PORT` | SMTP server port | - |
| `SMTP_FROM` | Sender email address | - |
| `SMTP_USER` | SMTP authentication user | - |
| `SMTP_PASS` | SMTP authentication password | - |
| `SLACK_BOT_TOKEN` | Slack bot token (`chat:write`, `users:read.email` scopes) | - |
| `CID_LOGO_PATH` | Optional logo image path for email embedding | - |

> See [`README.md`](README.md) for full local development setup instructions.

## Node.js Usage Example

```js
// server/notify.js (in your app)
import fetch from 'node-fetch'

const NOTIFY_BASE = process.env.NOTIFY_BASE || 'http://localhost:4000/api/notifications'
const APP_ID = 'my-app'

export async function notifyApplicationStatusChanged({ userId, context }) {
  const res = await fetch(`${NOTIFY_BASE}/dispatch/${APP_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, event: 'application_status_changed', role: 'candidate', context })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Dispatch failed: ${res.status} ${JSON.stringify(data)}`)
  return data.summary
}
```

## Testing Your Integration

1. **Use smtp4dev** (port 3005) to view and inspect email output in development
2. **Start simple**: Add basic templates first, then iterate on context and copy
3. **Check responses**: Verify dispatch response's per-channel summary to catch configuration issues early  
4. **Test CTAs**: Click links from email/Slack and ensure your UI resolves deep links correctly post-login

## Security and Deployment Notes

- **Don't expose publicly** without proper auth - restrict by network or gateway in internal environments
- **Production email**: Set real SMTP credentials and use a verified sender domain
- **Slack setup**: Use a dedicated bot and workspace app with minimum required scopes
- **Consider resilience**: Add queue and retry strategy before Internet-facing SMTP/Slack deployment

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **422: No channels enabled** | Confirm user preferences are set for your `appId` |
| **502: Partial failure** | Inspect `summary.email.error` or `summary.slack.error` for root cause (SMTP credentials, Slack token, invalid username) |
| **Slack URLs lose query params** | Use `{{{cta.url}}}` (triple brackets) in Slack templates |
| **UI build error with `useSearchParams`** | Wrap landing page handler in `Suspense` (see TA Portal's `/Applications`) |
