# Notifications System Overview

This document explains how notifications work across the repo today, end to end. It covers the Notification Service (email/Slack dispatch and user preferences), the TA Portal server components that prepare context and trigger events, and the UI deep-linking behavior that makes CTAs reliable across environments and authentication states.

If you want to integrate notifications in another app, see the companion guide:
- services/notification-service/INTEGRATION.md

## High‑level architecture

- Producer apps (e.g., TA Portal server) trigger events with a small context payload.
- Notification Service renders role- and app‑scoped Handlebars templates and dispatches messages over:
  - Email (SMTP via Nodemailer)
  - Slack DMs (Slack Web API)
- User preferences (enable email/Slack, email address, Slack username) are stored by app in the Notification Service DB (Prisma + MySQL/MariaDB).
- CTAs use a universal deep link built server‑side that survives login and role changes and routes the user to the correct page in the UI.

```
Producer (TA Portal server) ──events/context──> Notification Service ──SMTP/Slack──> Users
                 │                                                      ▲
                 └────── universal CTA (/Applications?... ) ────────────┘
```

## Key concepts

- App ID: A short identifier for the producing app. For the TA Portal we use `ta-portal`.
- Event key: A semantic name for a notification event (e.g., `application_status_changed`, `admin_hire_notification`).
- Role target: Candidate, Employer, Admin, and other roles as needed. Template names include the target (e.g., `candidate_email.hbs`, `admin_slack.hbs`).
- Context: A JSON object that carries event‑specific fields used by templates and CTAs. App‑agnostic structure:
  - `recipient { name?, email?, slackUsername? }`
  - `item { id?, title?, ownerName?, ownerEmail? }`
  - `status { new?, previous? }`
  - `comment`, `flags { applied?, hired?, acceptedOffer? }`
  - `cta { url }`
  Legacy aliases (e.g., `candidate_name`, `job_title`, `new_status`, `app_link`, `is_*`) have been removed. Producers and templates must use the agnostic fields above.
- Universal CTA: A URL like `/Applications?jobPositionId=...&applicationId=...` generated on the server. The UI resolves the user’s role and redirects to the right page, optionally opening modals or focusing specific cards.

## Notification Service (dispatch + preferences)

- API base: `/api/notifications`
- Core endpoints:
  1) GET `/preferences/:appId/:userId` – fetch or default a user’s preferences
  2) PUT `/preferences/:appId/:userId` – upsert preferences
  3) POST `/dispatch/:appId` – send a notification now (simple or templated)
- Channels: email and Slack; both consult user preferences for the app.
- Template resolution: `services/notification-service/src/templates/<appId>/<eventKey>/<target>.(hbs|html|txt)` with `target` in `{candidate_email, employer_email, admin_email, candidate_slack, employer_slack, admin_slack}`. Fallbacks can be defined per event.
- Rendering details:
  - Handlebars with per‑render partial registration; shared header/footer restored.
  - Slack uses triple mustaches (`{{{cta.url}}}`) to avoid URL escaping that strips query params.
  - Subjects are standardized in email templates, with optional override via request body.
- Recipient resolution:
  - For email: primary from preferences; robust fallback from provided `context` via `recipient.email`. This eliminates the prior "No recipients defined" failures.
  - For Slack: user lookup by stored `slackUsername` (or by email if provided).
- Logging: each dispatch returns a summary indicating attempted/sent/to/error per channel for easy troubleshooting.

### Environment variables (service)

- `PORT` – HTTP port (default 4000)
- `DATABASE_URL` – Prisma connection string
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER`, `SMTP_PASS` – SMTP config
- `SLACK_BOT_TOKEN` – Slack bot token for DMs
- `CID_LOGO_PATH` – optional logo attached as CID for emails
- `DEBUG_NOTIFY` – enable verbose template selection logs

See `services/notification-service/README.md` for full dev quickstart.

## TA Portal server integration (current state)

- Location: `apps/ta-portal/server/server/database/query_db.js` (notification orchestration lives near DB ops that change application state).
- On status changes or hiring actions, the server:
  - Builds the universal CTA (`cta.url`) pointing at `/Applications` with `jobPositionId` and `applicationId`.
  - Sets flags in context (`flags.applied`, `flags.hired`, `flags.acceptedOffer`).
  - Includes optional `comment` when relevant (omitted for initial application receipt).
  - Calls Notification Service’s `POST /dispatch/:appId` for the relevant event and role targets (candidate, employer, admin as applicable).

### Events in use

- `application_status_changed` – sent to candidate and employer; admin optionally.
- `admin_hire_notification` – sent to admins when an offer is accepted; includes strong CTA for hiring flow.

## UI deep‑linking behavior (Next.js App Router)

- A universal landing route `/Applications` accepts `jobPositionId` and `applicationId` query params.
- The page evaluates the signed‑in user’s role and immediately redirects to role‑specific destinations:
  - Admin: Applications page; when deep‑linked and relevant tab is active, auto‑opens the Hire modal for the targeted application.
  - Employer, Candidate, Employee: The page scrolls to, focuses, and highlights the target application card for quick action.
- The landing is wrapped in `Suspense` to satisfy `useSearchParams` constraints in the App Router and ensure production builds succeed.

## Errors, resilience, and logs

- Dispatch logs contain per‑channel results and a final status; they’re printed server‑side and returned in the API response for callers.
- Email recipient fallback avoids common context omissions.
- Slack links use unescaped URLs to preserve query strings.
- Build hygiene: UI page wraps search params handling in `Suspense`; known ESLint warnings are non‑blocking.

## Testing the full path

1) Change an application status in the TA Portal (or run the server helper scripts under `apps/ta-portal/server/scripts/`).
2) Verify Notification Service logs show each channel’s attempted/sent/to/error.
3) Open the email/Slack in dev (smtp4dev web UI at :3005, Slack test workspace) and click the CTA.
4) Confirm the UI route lands correctly, opens modals for Admin deep links, and focuses/highlights target cards for other roles.

## Where to look in the repo

- Notification Service
  - `services/notification-service/src/routes/dispatch.js` – dispatch logic, recipient fallbacks, response summary
  - `services/notification-service/src/templates/ta-portal/...` – email and Slack templates per role/event
- TA Portal
  - `apps/ta-portal/server/server/database/query_db.js` – context builder + event emitters
  - `apps/ta-portal/ui/src/app/Applications/page.js` – universal landing + role redirect
  - `apps/ta-portal/ui/src/components/...ApplicationCard.js` – card highlighting/focus behavior

## Roadmap / optional improvements

- Centralize `TA_PORTAL_BASE_URL` and other base URLs per environment.
- Resolve minor ESLint warnings in UI pages (hooks deps, unused disables).
- Add queue/retry for channels and dead‑letter logging if needed.
- Add template tests and previews to validate required context fields per event.
