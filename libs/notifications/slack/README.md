# SE Portal Slack Integration Library

## Purpose
SE applications send automated Slack notifications (in addition to email) when important events occur for users.

### Examples
- **TA Portal**  
  - Application submissions  
  - Status updates  
  - Interview scheduling  (coming)

- **SCOOP Portal**  
  - Application submissions  
  - Status updates  
  - New or overdue action alerts  

- **CM Tool**  
  - (Planned events TBD)

This library provides **standardized Slack message templates** to keep notifications consistent across all SE department portals.
When integrating with a new portal, update templates.js with new notification templates as needed.
---

## Account Setup
All Slack notifications are sent from a **Slack Bot installed at the workspace level**.  

- Each Slack workspace must have its own app installation approved by the workspace owners.  
- Work with **GCCIS IT** to identify the workspace owners who can approve installing the SE Portal Slack app.  
 - For development and testing, you can either:
  - Create a **temporary Slack workspace** (free tier) where you have full admin access, install the app there, and test notifications safely.  
- The app bot must have the proper permissions (chat:write, im:write, users:read, users:read.email) in order to post messages.  
- For development, configure your portal project with:  
  - `SLACK_CLIENT_ID`  
  - `SLACK_CLIENT_SECRET`  
  - `SLACK_BOT_TOKEN`

For instructions on requesting workspace-level access, see:  
👉 [SE Portal Slack Integration Guide (Google Doc)](https://docs.google.com/document/d/1rtyZ5zDGE4vag-Rt-gpbRLs3VagHRuViQhNxUjc7EX8/edit?tab=t.0)

---

## Development Setup
1. Ensure the Slack app has been installed in the target workspace and you have a valid bot token.  
2. The Slack notification library already exists in this repo under: /libs/notifications/slack
You can import it directly into your backend code.  
3. Install the Slack Web API client if it isn’t already available in your portal project:  
```bash
npm install @slack/web-api