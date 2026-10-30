# Centralized Notification Service

## SE-APP Integration and Onboarding Guide

| Document information     | Details                                                |
| ------------------------ | ------------------------------------------------------ |
| Audience                 | SCOOP developers maintaining SE-APPS                   |
| Maintainer               | RIT Software Engineering Department / SCOOP COMPs team |
| Status                   | Internal onboarding guide                              |
| Reference implementation | PeerEval                                               |

## Contents

- [1. Purpose and scope](#1-purpose-and-scope)
- [2. Architecture](#2-architecture)
- [3. Repository map](#3-repository-map)
- [4. Local environment and configuration](#4-local-environment-and-configuration)
  - [4.1 Local endpoints](#41-local-endpoints)
  - [4.2 PeerEval environment variables](#42-peereval-environment-variables)
  - [4.3 SMTP mode](#43-smtp-mode)
- [5. Starting and checking the local Notification Service](#5-starting-and-checking-the-local-notification-service)
  - [5.1 Docker networking](#51-docker-networking)
- [6. Sending a notification from an application](#6-sending-a-notification-from-an-application)
- [7. Email template convensions](#7-email-template-conventions)
- [8. PeerEval reference events](#8-peereval-reference-events)
- [9. Testing an integration](#9-testing-an-integration)
- [10. Integrating another SE-APP](#10-integrating-another-se-app)
- [11. Integration checklist](#11-integration-checklist)
- [12. Summary](#12-summary)

## 1. Purpose and scope

This guide explains how an SE-APP backend integrates with the centralized Notification Service. It uses PeerEval as the reference implementation so future developers can follow an established pattern rather than independently redisovering configuration, template, delivery, and troubleshooting details.

**Core rule:** application backend decides when a business event occurs and who should be notified. They send a structured request to the Notification Service. The Notification Service applies notification preferences, renders the appropriate template, and sends the message through the configured channel. Applications should not implement their own SMTP delivery for these notifications.

This guide covers:

- the request and delivery architecture
- local configuration and Docker services
- calling the service from an application backend
- creating event and role-specific email templates
- the PeerEval reference events and workflows
- testing and delivery troubleshooting
- a checklist for integrating another SE-APP.

## 2. Architecture

```text
SE-APP backend
  └─ dispatchTemplated(userId, { event, role, userEmail, subject, context })
       └─ POST /notifications/dispatch/{appId}
            └─ Notification Service
                  ├─ resolves user and per-app notification preferences
                  ├─ finds and renders a Handlebars template, when available
                  └─ calls the configured notification channel
                        └─ Email channel / Nodemailer
                             └─ configured SMTP server
                                  ├─ smtp4dev (local development/testing)
                                  └─ Postfix - RIT SMTP relay (real-inboc testing)
```

| Component            | Responsibility                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| SE-APP backend       | Detects the business event, selects recipients, builds the notification context, and calls the Notification Service. |
| Notification Service | Resolves preferences, chooses templates, renders message content, and dispatches enabled channels.                   |
| Handlebars templates | Define message wording and presentation. Keep business logic in the application backend, not in templates.           |
| Email channel        | Uses Nodemailer and the active `SMTP_HOST`, `SMTP_PORT`, and `SMTP_FROM` settings.                                   |
| SMTP relay           | Accepts or rejects the message for onward delivery. It is a separate step from rendering and dispatch.               |

A successful Notification Service means the configured mail transport accepted the message. It does **not** by itself prove that the message reached the recipient's inbox. When using Postfix, check the Postfix logs and queue as well.

## 3. Repository map

| Path                                                              | Purpose                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `services/notification-service/src/index.js`                      | Starts the Notification Service and mounts the preferences and dispatch notes. The source defaults to port `4000` if `PORT` is unset. The local integration configuration used port `4001`. Check the active environment and port mapping. |
| `services/notification-service/src/routes/dispatch.js`            | Handles dispatch requests, preferences, template rendering, and enabled channels.                                                                                                                                                          |
| `services/notification-service/src/routes/preferences.js`         | Provides notification preference endpoints.                                                                                                                                                                                                |
| `services/notification-service/src/lib/templates.js`              | Loads and renders Handlebars templates, registers shared partials, and provides fallback rendering.                                                                                                                                        |
| `services/notification-service/src/channels/email.js`             | Sends emails with Nodemailer using the configured SMTP transport.                                                                                                                                                                          |
| `services/notification-service/src/channels/slack.js`             | Slack dispatch support when configured and enabled.                                                                                                                                                                                        |
| `services/notification-service/src/templates/partials/header.hbs` | Shared email header partial.                                                                                                                                                                                                               |
| `services/notification-service/src/templates/partials/footer.hbs` | Shared email footer partial.                                                                                                                                                                                                               |
| `apps/peereval/server/utils/notifications.ts`                     | PeerEval helper for calling the Notification Service.                                                                                                                                                                                      |
| `apps/peereval/server/routes/projects.ts`                         | PeerEval project membership and assessment assignment events.                                                                                                                                                                              |
| `apps/peereval/server/routes/assessments.ts`                      | PeerEval submission, response retrieval, and feedback release logic.                                                                                                                                                                       |
| `apps/peereval/server/utils/assessmentReminderScheduler.ts`       | PeerEval deadline reminder scheduler.                                                                                                                                                                                                      |
| `apps/peereval/server/prisma/schema.prisma`                       | PeerEval response submission/release timestamps and persisted reminder records.                                                                                                                                                            |

## 4. Local environment and configuration

### 4.1 Local endpoints

The following ports were used during PeerEval integration. They are local development values, not universal deployment settings.

| Service              | Local endpoint / port   | Notes                                                                               |
| -------------------- | ----------------------- | ----------------------------------------------------------------------------------- |
| PeerEval frontend    | `http://localhost:3000` | Next.js development server.                                                         |
| PeerEval backend     | `http://localhost:3006` | Express API. Started from `apps/peereval/server`.                                   |
| Notification Service | `http://localhost:4001` | Host port used by the local Compose setup. Check actual Compose mapping and `PORT`. |
| smtp4dev             | `http://localhost:3005` | Local inbox viewer when the staging configuration routes mail to smtp4dev.          |
| Postfix              | Container port `25`     | Local SMTP relay used for real-inbox testing.                                       |

### 4.2 PeerEval environment variables

In `apps/peereval/server/.env`, the local values used by the PeerEval notification helper are:

```dotenv
NOTIFICATION_SERVICE_URL="http://localhost:4001"
NOTIFICATION_API_EXTENSION="/notifications"
NOTIFICATION_CLIENT_APP_ID="peer-eval"
```

The helper in `apps/peereval/utils/notifications.ts` combines the service URL and API extensions. The resulting local endpoints are:

```text
POST http://localhost:4001/notifications/dispatch/peer-eval
GET http://localhost:4001/notifications/preferences/peer-eval/{userId}
```

The app ID `peer-eval` is a routing and template namespace. Use it consistently in the backend configuration and the directory under `src/templates`.

### 4.3 SMTP mode

For real-inbox testing, the Notification Service container used:

```dotenv
SMTP_HOST=postfix
SMTP_PORT=25
SMTP_FROM=se_svc_apps@rit.edu
```

The local Postfix configuration relays to `smtp-server.rit.edu:25`. A working connection to the RIT network/VPN is required for the relay used in this environment. Use a real, valid recipient address for real-inbox tests, placeholder addresses used during development were rejected by RIT.

The staging configuration can instead direct email to smtp4dev. **Do not assume the Container filename tells you which SMTP configuration is active.** Inspect the running container:

```bash
docker exec notification-service-notify-1 -sh -lc 'env | grep "^SMTP_"'
```

For real-inbox testing, verify that `SMTP_HOST=postfix`. For local-only email inspection, use the documented staging setup and verify the active values before testing.

## 5. Starting and checking the local Notification Service

Build the Notification Service image when its code or bundled templates change:

```bash
cd ~/RIT-SE-CODE-BANK/services/notification-service
docker compose -f compose.build.yaml build notify
```

For real-inbox testing, the integration used this command to recreate the `notify` service with explicit SMTP settings. The supporting containers must already be running and connected to the necessary Docker networks:

```bash
SMTP_HOST=postfix SMTP_PORT=25 SMTP_FROM=se_svc_apps@rit.edu \
docker compose -f compose.run-production.yaml up -d --force-recreate --no-deps notify
```

Useful checks:

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
docker logs --tail 80 notification-service-notify-1
curl -i http://localhost:4001/notifications/preferences/peer-eval/{userId}
docker exec notification-service-postfix-1 postqueue -p
```

Replace `{userId}` with a real user ID. An HTTP error response can still confirm that the host/port is reachable. Inspect the response to determine whether the route and parameters are valid.

### 5.1 Docker networking

The Notification Service must be able to reach and connect to both `mariadb:3306` and `postfix:25` by container hostname. During integration, `notify` and `postfix` were on `notification-service_mailnet`, while MariaDB was initially only on `notification-service_default`. The Notification Service failed its Prisma startup migration with `P1001: Can't reach database server at mariadb:3306` and was unavailable to PeerEval.

A temporary recovery used:

```bash
docker network connect --alias mariadb notification-service_mailnet notification-service-mariadb-1
```

This is a **temporary workaround**, not a permanent Compose fix. When maintaining the Compose files, make sure `notify`, `mariadb`, and `postfix` share the required notwork, then recreate the services through Compose and verify the network attachments.

## 6. Sending a notification from an application

### 6.1 Use the shared helper

PeerEval uses `dispatchTemplated` from `apps/peereval/server/utils/notifications.ts`. A typical call is:

```typescript
try {
  await dispatchTemplated(user.id, {
    event: "assessment_assigned",
    role: "responder",
    userEmail: user.email,
    subject: `New Peer Evaluation Assigned: ${assessment.name}`,
    context: {
      recipient: {
        name: user.name,
        email: user.email,
      },
      item: {
        id: assessment.id,
        title: assessment.name,
        description: assessment.description,
        projectId: project.id,
        projectName: project.name,
        dueDate: assessment.dueDate,
      },
      cta: {
        url: `${process.env.PEEREVAL_BASE_URL || "http://localhost:3000"}/projects/${project.id}`,
      },
      appName: "PeerEval",
    },
  });
} catch (error) {
  // Notification failure should not undo the completed application operation.
  console.error("Failed to send notification:", error);
}
```

This is an illustrative pattern. Adapt the event name, recipient, context fields, subject, and call-to-action URL to the app and business event being implemented. Only include a CTA URL when there is an appropriate destination in that app.

### 6.2 Request fields

| Field       | Meaning                                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| `userId`    | Stable user ID used for per-app notification preferences. Use it when available.                                       |
| `event`     | Event key used to find the event template directory. It must match the template folder name exactly.                   |
| `role`      | Recipient role used to select a role-specific template, such as `peer`, `responder`, or `overseer`.                    |
| `userEmail` | Explicit email address for the recipient. Provide a valid address for email delivery.                                  |
| `subject`   | Optional explicit subject. Prefer a clear, app-specific subject.                                                       |
| `context`   | Structured data passed to Handlebars. PeerEval commonly uses `recipient`, `item`, `submittedBy`, `cta`, and `appName`. |

The Notification Service checks per-app, per-user preferences. In the current dispatcher, when no preference record exists, email defaults to enabled and Slack defaults to disabled. A real app should test preference behavior rather than assume all recipients have idential settings.

### 6.3 When to dispatch

Call the notification helper **after the underlying business operation has been saved successfully**. Catch and log notification failures so a temporary service or mail outage does not undo a valid project, assignment, submission, or release operation.

PeerEval intentionally distinguishes autosaving assessment answers from the responder's deliberate Submit action. Only the deliberate submission triggers `assessment_submitted`.

## 7. Email template conventions

### 7.1 File layout and lookup

App-specific email templates use this pattern:

```text
services/notification-service/src/templates/{appId}/{event}/{role}_email.hbs
```

For example:

```text
services/notification-service/templates/peer-eval/assessment_assigned/responder_email.hbs
services/notification-service/templates/peer-eval/assessment_due_soon/responder_email.hbs
services/notification-service/templates/peer-eval/assessment_overdue/responder_email.hbs
services/notification-service/templates/peer-eval/assessment_submitted/overseer_email.hbs
services/notification-service/templates/peer-eval/feedback_released/peer_email.hbs
services/notification-service/templates/peer-eval/peer_added/peer_email.hbs
services/notification-service/templates/peer-eval/peer_removed/peer_email.hbs
```

The value passed in `event` must match `{event}` in the template path, and `role` determines `{role}_email.hbs`. For example, a dispatch with `event: "feedback_released"` and `role: "peer"` looks for `peer-eval/feedback_released/peer_email.hbs`.

The template loader registers partials from `templates/partials`, checks the app-specific template first, then a generic event template if available. It looks for a role-specific file (for example, `responder_email.hbs`) before a generic `email.hbs`. If no template is found, it can use the supplied fallback message. A successful dispatch log alone does not prove the intended template was selected.

### 7.2 Style and content

Follow the existing RIT SE-APP email conventions:

- Begin with `{{> header}}` and end with `{{> footer}}`.
- Use table-based layout and inline styles for email-client compatibility.
- Use the existing Helvetica/Arial font stack, readable 16 px body text, and approximately 24 px line height.
- Use RIT orange `#F76902` for the call-to-action button, with white text (`#FFFFFF`).
- Use Handlebars conditionals for optional values, such as `{{#if item.projectName}}`.
- Include a clear subject, concise explanation, relevant item details, and one main CTA when appropriate.
- Use the RIT Software Engineering Department sign-off where appropriate.
- Do not put private feedback contents into reminder emails. Link to the app so the recipient can view information in the intended access-controlled interface.

Example CTA pattern:

```handlebars
{{#if cta.url}}
  <p style="margin-top:24px;margin-bottom:24px;">
    <a
      href="{{cta.url}}"
      style="display:inline-block;
                background-color:#F76902;
                color:#FFFFFF;
                padding:12px 20px;
                border-radius:4px;
                text-decoration:none;
                font-size:16px;
                font-weight:500;"
    >
      Complete Evaluation
    </a>
  </p>
{{/if}}
```

## 8. PeerEval reference events

These events describe the implementation observed during PeerEval integration. Other apps should define their own business events and recipient rules rather than copy PeerEval-specific names without review.

| Event                  | Trigger                                                                    | Recipient                                      | Role        | Template                                  | Notes                                                                             |
| ---------------------- | -------------------------------------------------------------------------- | ---------------------------------------------- | ----------- | ----------------------------------------- | --------------------------------------------------------------------------------- |
| `peer_added`           | A peer is added to a project.                                              | Added peer                                     | `peer`      | `peer_added/peer_email.hbs`               | Sent after the project operation succeeds.                                        |
| `peer_removed`         | A peer is removed from a project.                                          | Removed peer                                   | `peer`      | `peer_removed/peer_email.hbs`             | Notification failure is logged and does not reverse removal.                      |
| `assessment_assigned`  | An assessment is assigned.                                                 | Each assigned responder                        | `responder` | `assessment_assigned/responder_email.hbs` | Context includes assessment/project details and due date.                         |
| `assessment_submitted` | A responder clicks Submit for one responder-to-recipient response.         | Project overseer                               | `overseer`  | `assessment_submitted/overseer_email.hbs` | Autosaves must not trigger this event.                                            |
| `feedback_released`    | The overseer released a reviewed response.                                 | Recipient of that response                     | `peer`      | `feedback_released/peer_email.hbs`        | Recipient-facing response endpoints return released feedback only.                |
| `assessment_due_soon`  | The scheduler detects an assessment deadline within the next 24 hours.     | Responders with outstanding required feedback. | `responder` | `assessment_due_soon/responder_email.hbs` | Persistent tracking prevents repeated successful dispatches of the same reminder. |
| `assessment_overdue`   | The scheduler detects a past-deadline ssessment with outstanding feedback. | Responders with outstanding required feedback. | `responder` | `assessment_overdue/responder_email.hbs`  | Tracked separately from the due-soon reminder.                                    |

### 8.1 Feedback submission and release

PeerEval added these optional timestamps to `FormResponse`:

| Field         | Meaning                                                                               |
| ------------- | ------------------------------------------------------------------------------------- |
| `submittedAt` | Populated when the responder explicitly submits that responder-to-recipient response. |
| `releasedAt`  | Populated when the overseer releases that response.                                   |

The intended states are:

- `submittedAt = null`: draft / not submitted
- `submittedAt` is set and `releasedAt = null`: submitted, awaiting overseer review
- both timestamps are set: released and available to the recipient.

The recipient endpoint filters for a non-null `releasedAt`. The project page uses the recipient endpoints to decide which assessments appear under **Your Received Feedback**. Changes to answers after submission reset the submission/release state so the changed response must be reviewed again.

The current development release and recipient checks use an `x-user-id` header supplied by the client. This is **not sufficient for production authorization**. Once the app's authentication work is available, the server must derive the user identity from a trusted authenticated session/token and enforce overseer ownsership and recipient access on the backend.

### 8.2 Automated deadline reminders

PeerEval starts its reminder scheduler from the backend entry point. The scheduler:

- checks immediately at startup, then every 15 minutes;
- sends a due-soon reminder for an assessment whose deadline is within the next 24 hours and has not passed
- sends an overdue reminder after the deadline
- checks each responder's required recipients and skips reminders when all required feedback has been submitted
- does not expect responders to evaluate themselves.

The `AssessmentReminder` model stores a unique record for each assessment, responder, and reminder type. `sentAt` prevents the scheduler from dispatching that same reminder again after the Notification Service request succeeds.

**Delivery note:** `sentAt` records successful dispatch through the Notification Service. It does not guarantee final inbox delivery. If Postfix accepts a message locally but the upstream RIT relay defers or rejects it, the reminder tracker may still consider the dispatch successful. Use Postfix logs and the queue to diagnose actual delivery.

## 9. Testing an integration

Test each layer separately so a template issue is not mistaken for an SMTP problem.

### 9.1 Validate template rendering

Run a Node script inside the Notification Service container that imports `renderEmail` from `.src/lib/templates.js` and supplies the exact `event`, `role`, `appId`, and representative `context` used by the application. Confirm that:

- `html` is a non-empty string
- the expected heading and body content are present
- the shared header and footer appear
- optional values behave correctly when omitted
- the CTA points to the intended app route.

This test isolates template lookup/rendering from SMTP delivery.

### 9.2 Test dispatch through the API

The local endpoint is:

```text
POST http://localhost:4001/notifications/dispatch/{appId}
Content-Type: application/json
```

Example request for testing the overdue templates (replace the address with a valid recipient mailbox when doing real-inbox testing):

```json
{
  "userId": "template-test-user",
  "userEmail": "valid-recipient@rit.edu",
  "event": "assessment_overdue",
  "role": "responder",
  "subject": "TEST - Overdue Template",
  "context": {
    "recipient": {
      "name": "Template Test",
      "email": "valid-recipient@rit.edu"
    },
    "item": {
      "title": "Demo Assessment",
      "projectName": "Demo Project",
      "dueDate": "October 15, 2026"
    },
    "cta": {
      "url": "http://localhost:3000"
    },
    "appName": "PeerEval"
  }
}
```

### 9.3 Inspect dispatch and delivery

Notification Service logs:

```bash
docker logs --since 15m notification-service-notify-1 2>&1 | grep -Ei 'Sending Email|event=|email=fail|error'
```

Postfix logs:

```bash
docker logs --since 15m notification-service-postfix-1 2>&1 | grep -Ei 'status=sent|status=deferred|status=bounced|452|550|554'
docker exec notification-service-postfix-1 postqueue -p
```

Interpret the results as follows:

| Signal                                                   | Interpretation                                                                                                              |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Notification Service `email=ok` / `sent=true`            | The configured SMTP transport accepted the message. This does not prove inbox arrival.                                      |
| Postfix `status=sent (250 ok: Message ... accepted)`     | The upstream STMP relay accepted the message.                                                                               |
| `status=deferred`                                        | Delivery is delayed. Postfix generally retries queued mail.                                                                 |
| `status=bounced` with `550 #5.1.0 Address rejected`      | The recipient address was rejected. Use a valid account.                                                                    |
| `452 Too many recipients received this hour`             | Temporary SMTP rate limit. Stop repeated tests and allow the limit to clear.                                                |
| `554 This service is not available to you`               | The relay refused access in the observed network/VPN configuration. Check the required network/VPN and relay setup.         |
| `ECONNREFUSED` from PeerEval to the Notification Service | The service may not be listening, may be restarting, or the configured host/port may be incorrect.                          |
| Prisma `P1001` for `mariadb:3306`                        | The Notification Service cannot reach its database. Check startup logs and shared Docker networks.                          |
| Subject present but body missing                         | Call `renderEmail` directly, then veridy the event, app ID, role, template path, and rendered `html` passed to `sendEmail`. |

The recipient inbox is the final practical check for a real-inbox test.

## 10. Integrating another SE-APP

Follow these steps for a new application:

1. **Define the events and recipients:** Document the business event, the user to notify, and the action the notification should support.
2. **Confirm user identity and email:** Use a stable user ID for preference lookup and a valid recipient email address.
3. **Configure the application:** Set `NOTIFICATION_SERVICE_URL`, `NOTIFICATION_API_EXTENSION`, and a unique, consistent `NOTIFICATION_CLIENT_APP_ID`.
4. **Create or reuse a helper:** Follow the `dispatchTemplated` request format. Do not send SMTP directly from the application.
5. **Define the event contract:** Record the event key, role, recipient, subject, context fields, and expected trigger.
6. **Create templates:** Add `{appId}/{event}/{role}_email.hbs` under `services/notification-services/src/templates` and follow the shared visual conventions.
7. **Trigger after persistence:** Dispatch onlyafter the applicationn operation succeeds. Catch and log notification failures.
8. **Test rendering separately:** Verify the correct template and context before testing email transport.
9. **Test delivery in the intended environemnt:** Start with smtp4dev for template development, then use a single controlled real-inbox test with Postfix and the required network/VPN.
10. **Verify preferences and authorization:** Test preference behavior and ensure sensitive actions rely on trusted server-side identiy.
11. **Document and review:** Add the event and template to the app's integration notes and verify the event key, role, and template path all match.

## 11. Integration checklist

- A consistent app ID and environment configuration are defined.
- The app has a helper that calls `/notifications/dispatch/{appId}`.
- Each event has a defined trigger, recipient, role, subject, and context contract.
- Event keys exactly match template directory names.
- Role-specific template filenames match the role sent in the request.
- App-specific Handlebars templates follow the shared header/footer and inline style conventions.
- Optional fields and CTA links render correctly.
- Notifications are triggered after successful persistence, and failures are logged.
- Notification preferences are tested for the inteded recipient.
- Template rendering is tested independently of SMTP delivery.
- At least one end-to-end test is verified in the intended email environment.
- Postfix logs and queue behavior are checked when real-inbox delivery is used.
- Sensitive actions are authorized with trusted server-side identity.

## 12. Summary

PeerEval demonstrates the full notification lifecycle: project membership changes, assessment assignment, deliberate submission, overseer review and release, recipient access to released feedback, and automated deadline reminders.

Other SE-APPs should reuse the centralized dispatch and template convensions while defining their own event keys, recipients, roles, context, and app-specific templates.
