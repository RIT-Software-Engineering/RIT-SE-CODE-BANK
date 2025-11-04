# Integrating with the Notification Service

This guide shows how to add notifications (email + Slack) to any app in this monorepo or to an external service. You’ll learn how to define events and templates, set user preferences, and dispatch messages reliably with robust CTAs.

If you need a conceptual overview of how the whole system fits together, read docs/Notifications-System.md.

## What you get

- Role‑aware templates using Handlebars
- Email via SMTP and Slack DMs via Slack Web API
- Per‑user, per‑app preferences (enable email/Slack, email address, Slack username)
- Universal, robust CTAs that survive login/role changes
- Helpful per‑channel dispatch logs in responses

## Quick start

1) Pick an app ID for your producer app, e.g., `ta-portal`.
2) Ensure the Notification Service is running (example uses port 4000). See its README for Docker/dev instructions.
3) Create templates for your events (see Template resolution below).
4) In your app, capture the recipient’s `userId` and prepare an event `context`.
5) Call `POST /api/notifications/dispatch/:appId` with your `appId` and payload.

### Minimal curl examples

- Save preferences for a user:

```powershell
curl -s -X PUT http://localhost:4000/api/notifications/preferences/ta-portal/jdoe1234 -H "Content-Type: application/json" -d '{
  "notifyEmail": true,
  "notifySlack": false,
  "userEmail": "jdoe1234@rit.edu",
  "slackUsername": "@jdoe1234"
}'
```

- Send a templated event to a candidate:

```bash
curl -s -X POST http://localhost:4000/api/notifications/dispatch/ta-portal -H "Content-Type: application/json" -d '{
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

The response includes a per‑channel summary like:

```json
{
  "ok": true,
  "summary": {
    "email": { "attempted": true, "sent": true, "to": "jdoe1234@rit/edu" },
    "slack": { "attempted": false }
  }
}
```

## API reference

Base path: `/api/notifications`

1) GET `/preferences/:appId/:userId`
- Returns stored preferences or defaults `{ notifyEmail: true, notifySlack: false }` when missing.

2) PUT `/preferences/:appId/:userId`
- Upserts a preference record.
- Body fields: `notifyEmail?`, `notifySlack?`, `userEmail?`, `slackUsername?`

3) POST `/dispatch/:appId`
- Dispatch a notification immediately.
- Usage modes:
  - Simple: `subject` + `message` (plaintext) when you don’t need templating.
  - Templated: `event` + `context` (+ optional `role`) to render Handlebars templates.
- Request body (templated):

```json
{
  "userId": "string",
  "event": "string",
  "role": "candidate|employer|admin|...",
  "context": { "any": "json" },
  "subject": "optional subject override"
}
```

- Response codes:
  - 200: all enabled channels succeeded
  - 502: one or more enabled channels failed (see `summary`)
  - 422: no channels are enabled for this user

## Template resolution

Templates live under `services/notification-service/src/templates/<appId>/<eventKey>/` with this naming pattern:

- `<role>_email.hbs` – HTML email
- `<role>_slack.hbs` – Slack message (plain text)

Examples:

```
services/notification-service/src/templates/my-app/application_status_changed/
  candidate_email.hbs
  candidate_slack.hbs
  employer_email.hbs
```

Note:
- Register shared partials (header/footer) per render;
- Slack templates must use triple brackets for URLs: use `{{{cta.url}}}` to preserve query strings.

## Context contract (what your templates can expect)

Context is app‑defined, but the service now uses an app‑agnostic structure:

- `recipient`: `{ name?, email?, slackUsername? }`
- `item`: `{ id?, title?, ownerName?, ownerEmail? }`  // the entity this message is about
- `status`: `{ new?, previous? }`
- `comment`: `string?`
- `flags`: `{ applied?: boolean, hired?: boolean, acceptedOffer?: boolean }`
- `cta`: `{ url: string }`
- `appName`: `string?`

Legacy fields are no longer supported. Remove old aliases like `candidate_name`, `job_title`, `new_status`, `is_*`, and `app_link` from your producers and templates.

### Building robust CTAs

- Prefer a single universal route (like TA Portal’s `/Applications`) with query params that identify the target item (e.g., `jobPositionId` and `applicationId`). Put this in `cta.url`.
- Your UI should:
  - Determine the current user’s role at runtime
  - Redirect to the correct destination page
  - Optionally auto‑open modals or scroll/focus/highlight the target element

## Recipient resolution and fallbacks

- Primary recipient info comes from user preferences for your `appId`.
- Email fallback: the service will use `context.recipient.email` if preferences don’t have an email set. This avoids the “No recipients defined” error.
- Slack: we recommend setting `slackUsername` in preferences; lookup by email is possible if you provide it in `context`.

## Environment variables (service)

- `PORT` – service port (default 4000)
- `DATABASE_URL` – Prisma DB connection string
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER`, `SMTP_PASS` – SMTP settings
- `SLACK_BOT_TOKEN` – Slack bot token with `chat:write` and `users:read.email` scopes
- `CID_LOGO_PATH` – Optional logo image to embed via CID in emails

See `services/notification-service/README.md` for full local dev instructions (Docker smtp4dev, Prisma setup, etc.).

## Node usage example

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

## Testing your integration

- Use smtp4dev (port 3005) to view and inspect email output in dev.
- Add basic templates first, then iterate on context and copy.
- Verify the dispatch response’s per‑channel summary to catch configuration issues early.
- Click CTAs from email/Slack and ensure your UI resolves deep links correctly post‑login.

## Security and deployment notes

- Don’t expose the service publicly without proper auth. In internal environments, restrict by network or gateway.
- For production email, set real SMTP credentials and a verified sender domain.
- For Slack, use a dedicated bot and workspace app with minimum scopes.
- Consider adding a queue and retry strategy before Internet‑facing SMTP/Slack.

## Troubleshooting

- 422: No channels enabled – confirm user preferences are set for your `appId`.
- 502: Partial failure – inspect `summary.email.error` or `summary.slack.error` for root cause (SMTP credentials, Slack token, invalid username).
-- Slack URLs lose query params – use `{{{cta.url}}}` in Slack templates.
- UI build error related to `useSearchParams` – wrap landing page handler in `Suspense` (see TA Portal’s `/Applications`).
