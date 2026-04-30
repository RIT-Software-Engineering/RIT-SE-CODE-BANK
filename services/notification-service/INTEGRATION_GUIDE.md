# Integration Guide for Applications

This guide shows how to properly integrate the Notification Service into your application.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Backend Proxy Pattern (Required)](#backend-proxy-pattern-required)
- [API Endpoints](#api-endpoints)
- [Frontend Integration Example](#frontend-integration-example)
- [Context Object Structure](#context-object-structure)

---

## Architecture Overview

The Notification Service is a standalone microservice that **must be accessed through your application's backend**, not directly from the frontend.

### Correct Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌────────────────────┐
│             │         │                  │         │                    │
│  Frontend   │────────▶│  Your Backend    │───────▶│  Notification      │
│  (React,    │  HTTPS  │  (Express,       │  HTTP   │  Service           │
│   Next.js)  │         │   Node.js)       │         │  (Port 4001)       │
│             │◀────────│                  │◀───────│                    │
└─────────────┘         └──────────────────┘         └────────────────────┘
```

**Why this pattern?**
- ✅ **No CORS issues**: Backend-to-backend calls don't involve browser restrictions
- ✅ **Security**: Notification service URL and tokens stay server-side
- ✅ **Production-ready**: Matches how services communicate in production
- ✅ **Error handling**: Backend can transform/log errors before returning to frontend

**Never do this:**
```
❌ Frontend → Notification Service directly (CORS, security issues), Won't work in prod
```

---

## Backend Proxy Pattern (Required)

Your application backend needs to proxy notification service calls. Here's how to implement it:

### Step 1: Create a Notification Client Utility

Create a utility file that wraps notification service API calls (e.g., `server/utils/notifications.js`):

```javascript
// server/utils/notifications.js
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4001';
const NOTIFICATION_API_EXTENSION = process.env.NOTIFICATION_API_EXTENSION || '/notifications'
const APP_ID = process.env.NOTIFICATION_CLIENT_APP_ID || 'your-app-name';

// Use fetch or a library like axios
const fetchImpl = globalThis.fetch || require('node-fetch');

/**
 * Get user notification preferences
 */
async function getPreferences(userId, appIdOverride) {
  const appId = appIdOverride || APP_ID;
  const url = `${NOTIFICATION_SERVICE_URL}${NOTIFICATION_API_EXTENSION}/preferences/${encodeURIComponent(appId)}/${encodeURIComponent(userId)}`;
  
  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`getPreferences failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Update user notification preferences
 */
async function setPreferences(userId, body, appIdOverride) {
  const appId = appIdOverride || APP_ID;
  const url = `${NOTIFICATION_SERVICE_URL}${NOTIFICATION_API_EXTENSION}/preferences/${encodeURIComponent(appId)}/${encodeURIComponent(userId)}`;
  
  const res = await fetchImpl(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) {
    throw new Error(`setPreferences failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Check if user is in Slack workspace
 */
async function checkSlackStatus(email, appIdOverride, userId) {
  const appId = appIdOverride || APP_ID;
  const url = `${NOTIFICATION_SERVICE_URL}${NOTIFICATION_API_EXTENSION}/preferences/${encodeURIComponent(appId)}/${encodeURIComponent(userId)}/slack-status?email=${encodeURIComponent(email)}`;
  
  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`checkSlackStatus failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Send a simple notification
 */
async function dispatchNotification(userId, { subject, message, userEmail }, appIdOverride) {
  const appId = appIdOverride || APP_ID;
  const url = `${NOTIFICATION_SERVICE_URL}${NOTIFICATION_API_EXTENSION}/dispatch/${encodeURIComponent(appId)}`;
  
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, userEmail, subject, message })
  });
  
  if (!res.ok) {
    throw new Error(`dispatchNotification failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Send a templated notification
 */
async function dispatchTemplated(userId, { event, context = {}, role, subject, userEmail }, appIdOverride) {
  const appId = appIdOverride || APP_ID;
  const url = `${NOTIFICATION_SERVICE_URL}${NOTIFICATION_API_EXTENSION}/dispatch/${encodeURIComponent(appId)}`;
  
  const payload = {
    userId,
    userEmail,
    event,
    context,
    ...(role ? { role } : {}),
    ...(subject ? { subject } : {})
  };
  
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) {
    throw new Error(`dispatchTemplated failed: ${res.status}`);
  }
  return res.json();
}

module.exports = {
  getPreferences,
  setPreferences,
  checkSlackStatus,
  dispatchNotification,
  dispatchTemplated
};
```

### Step 2: Create Backend API Routes

Create routes that proxy to the notification service (e.g., `server/routing/notifications_api.js`):

```javascript
// server/routing/notifications_api.js
const express = require('express');
const router = express.Router();
const notificationClient = require('../utils/notifications');

// GET /api/notifications/preferences/:appId/:identifier
router.get('/preferences/:appId/:identifier', async (req, res) => {
  const { appId, identifier } = req.params;
  try {
    const prefs = await notificationClient.getPreferences(identifier, appId);
    return res.json(prefs);
  } catch (err) {
    console.error('Failed to fetch preferences:', err.message);
    return res.status(502).json({ 
      error: 'Failed to fetch preferences', 
      detail: err.message 
    });
  }
});

// PUT /api/notifications/preferences/:appId/:identifier
router.put('/preferences/:appId/:identifier', async (req, res) => {
  const { appId, identifier } = req.params;
  const body = req.body || {};
  
  try {
    // Only forward toggle fields to avoid overwriting contact info
    const payload = {
      ...(body.hasOwnProperty('notifyEmail') ? { notifyEmail: !!body.notifyEmail } : {}),
      ...(body.hasOwnProperty('notifySlack') ? { notifySlack: !!body.notifySlack } : {}),
    };
    
    const result = await notificationClient.setPreferences(identifier, payload, appId);
    return res.json(result);
  } catch (err) {
    console.error('Failed to set preferences:', err.message);
    return res.status(502).json({ 
      error: 'Failed to set preferences', 
      detail: err.message 
    });
  }
});

// GET /api/notifications/preferences/:appId/:identifier/slack-status
router.get('/preferences/:appId/:identifier/slack-status', async (req, res) => {
  const { appId, identifier } = req.params;
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ error: 'email query parameter is required' });
  }
  
  try {
    const result = await notificationClient.checkSlackStatus(email, appId, identifier);
    return res.json(result);
  } catch (err) {
    console.error('Failed to check Slack status:', err.message);
    return res.status(502).json({ 
      error: 'Failed to check Slack status', 
      detail: err.message 
    });
  }
});

// POST /api/notifications/dispatch/:appId
router.post('/dispatch/:appId', async (req, res) => {
  const { appId } = req.params;
  const body = req.body || {};
  const { userId, userEmail } = body;
  
  if (!userId && !userEmail) {
    return res.status(400).json({ error: 'userId or userEmail is required' });
  }
  
  try {
    let result;
    if (body.event) {
      // Templated notification
      const { event, context = {}, role, subject } = body;
      result = await notificationClient.dispatchTemplated(
        userId || null,
        { event, context, role, subject, userEmail: userEmail || null },
        appId
      );
    } else {
      // Simple notification
      const { subject, message } = body;
      result = await notificationClient.dispatchNotification(
        userId || null,
        { subject, message, userEmail: userEmail || null },
        appId
      );
    }
    return res.json(result);
  } catch (err) {
    console.error('Failed to dispatch notification:', err.message);
    return res.status(502).json({ 
      error: 'Failed to dispatch notification', 
      detail: err.message 
    });
  }
});

module.exports = router;
```

### Step 3: Mount the Router

In your main server file (e.g., `server/routing/index.js` or `server.js`):

```javascript
const notificationsApi = require('./routing/notifications_api');

// Mount at /api/notifications
app.use('/api/notifications', notificationsApi);
```

### Step 4: Environment Variables

Add to your backend `.env`:

```bash
# Notification Service
NOTIFICATION_SERVICE_URL=http://localhost:4001
NOTIFICATION_API_EXTENSION=/notifications
NOTIFICATION_CLIENT_APP_ID=your-app-name
```

---

## API Endpoints

Once your backend proxy is set up, your frontend can call these endpoints:

### GET User Preferences

```http
GET notifications/preferences/:appId/:userId
```

**Response:**
```json
{
  "appId": "ta-portal",
  "userId": "abc1234",
  "notifyEmail": true,
  "notifySlack": false,
  "userEmail": "abc1234@rit.edu",
  "slackUsername": null
}
```

### Update User Preferences

```http
PUT notifications/preferences/:appId/:userId
Content-Type: application/json

{
  "notifyEmail": true,
  "notifySlack": true
}
```

**Response:** Same as GET (updated preferences)

### Check Slack Workspace Membership

```http
GET notifications/preferences/:appId/:userId/slack-status?email=user@rit.edu
```

**Response (in workspace):**
```json
{
  "inWorkspace": true,
  "userId": "U05RVPKT9QT"
}
```

**Response (not in workspace):**
```json
{
  "inWorkspace": false,
  "reason": "users_not_found"
}
```

### Send Notification (Templated)

```http
POST notifications/dispatch/:appId
Content-Type: application/json

{
  "userId": "abc1234",
  "userEmail": "abc1234@rit.edu",
  "event": "application_status_changed",
  "role": "candidate",
  "context": {
    "applicant": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "position": {
      "title": "SWEN-101 Grader"
    },
    "status": "Interview Scheduled",
    "deepLink": "https://ta-portal.rit.edu/applications/123"
  }
}
```

**Response:**
```json
{
  "results": [
    { "channel": "email", "messageId": "<abc@localhost>" }
  ],
  "errors": [],
  "summary": {
    "email": { "attempted": true, "sent": true, "to": "abc1234@rit.edu" },
    "slack": { "attempted": false, "sent": false }
  }
}
```

### Send Notification (Simple)

```http
POST notifications/dispatch/:appId
Content-Type: application/json

{
  "userId": "abc1234",
  "userEmail": "abc1234@rit.edu",
  "subject": "Your application was updated",
  "message": "Check the portal for details."
}
```

---

## Frontend Integration Example

Here's a complete example showing how to integrate notification preferences into a Settings page:

### Settings Page Component

```jsx
// src/app/Settings/page.js
"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Box, Switch, FormControlLabel, Alert, Link, CircularProgress } from '@mui/material';

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const [prefs, setPrefs] = useState({ notifyEmail: false, notifySlack: false });
  const [slackStatus, setSlackStatus] = useState({ inWorkspace: false, loading: true });
  const [loading, setLoading] = useState(true);
  
  // Your backend URL (from env vars)
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://localhost:3300';
  const APP_ID = 'your-app-name';
  
  // Load preferences on mount
  useEffect(() => {
    if (!currentUser?.username) return;
    
    async function loadPreferences() {
      try {
        const url = `${BACKEND_URL}/api/notifications/preferences/${APP_ID}/${currentUser.username}`;
        const res = await fetch(url);
        const data = await res.json();
        setPrefs({
          notifyEmail: data.notifyEmail || false,
          notifySlack: data.notifySlack || false
        });
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadPreferences();
  }, [currentUser?.username]);
  
  // Check Slack workspace membership
  useEffect(() => {
    if (!currentUser?.email) return;
    
    async function checkSlackMembership() {
      try {
        const url = `${BACKEND_URL}/api/notifications/preferences/${APP_ID}/${currentUser.username}/slack-status?email=${encodeURIComponent(currentUser.email)}`;
        const res = await fetch(url);
        const data = await res.json();
        setSlackStatus({ 
          inWorkspace: data.inWorkspace, 
          loading: false,
          reason: data.reason 
        });
      } catch (error) {
        console.error('Failed to check Slack status:', error);
        setSlackStatus({ inWorkspace: false, loading: false, reason: 'error' });
      }
    }
    
    checkSlackMembership();
  }, [currentUser?.email]);
  
  // Update preferences
  async function updatePreference(field, value) {
    try {
      const url = `${BACKEND_URL}/api/notifications/preferences/${APP_ID}/${currentUser.username}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      
      const data = await res.json();
      setPrefs({
        notifyEmail: data.notifyEmail || false,
        notifySlack: data.notifySlack || false
      });
    } catch (error) {
      console.error('Failed to update preference:', error);
    }
  }
  
  if (loading) {
    return <CircularProgress />;
  }
  
  return (
    <Box>
      <h2>Notification Preferences</h2>
      
      {/* Email Toggle */}
      <FormControlLabel
        control={
          <Switch
            checked={prefs.notifyEmail}
            onChange={(e) => updatePreference('notifyEmail', e.target.checked)}
          />
        }
        label="Email Notifications"
      />
      
      {/* Slack Toggle */}
      <FormControlLabel
        control={
          <Switch
            checked={prefs.notifySlack}
            onChange={(e) => updatePreference('notifySlack', e.target.checked)}
            disabled={slackStatus.loading || !slackStatus.inWorkspace}
          />
        }
        label="Slack Notifications"
      />
      
      {/* Slack Workspace Alert */}
      {!slackStatus.loading && !slackStatus.inWorkspace && (
        <Alert severity="info" sx={{ mt: 2 }}>
          You must join the SE-APPS Slack workspace before enabling Slack notifications.
          <Link href="https://rit-gccis-se-apps.slack.com" target="_blank">
            Join Workspace
          </Link>
        </Alert>
      )}
    </Box>
  );
}
```

### Key Implementation Details

1. **Load preferences on mount** - Fetch current settings when component loads
2. **Check Slack membership** - Verify user is in workspace before allowing toggle
3. **Disable Slack toggle** - Prevent enabling if not in workspace
4. **Show helpful alert** - Guide users to join workspace
5. **Call backend, not notification service** - All requests go through your backend proxy

---

## Context Object Structure

When sending templated notifications, the `context` object contains data passed to Handlebars templates.

### Example for TA Portal

```json
{
  "applicant": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "abc1234@rit.edu"
  },
  "position": {
    "title": "SWEN-101 Grader",
    "courseCode": "SWEN-101"
  },
  "status": "Interview Scheduled",
  "deepLink": "https://ta-portal.rit.edu/applications/123",
  "recipient": {
    "email": "abc1234@rit.edu"
  }
}
```

### Template Usage

In your template file (`templates/your-app/event_name/role_email.hbs`):

```handlebars
Hello {{applicant.firstName}},

Your application for {{position.title}} has been updated.

Status: {{status}}

View your application: {{deepLink}}
```

### Best Practices

- ✅ Include all data needed by templates
- ✅ Always include `deepLink` for actionable notifications
- ✅ Use nested objects for logical grouping
- ✅ Keep field names consistent across events
- ✅ Include recipient info for logging/debugging

---

## Complete Integration Checklist

- [ ] Create `server/utils/notifications.js` client
- [ ] Create `server/routing/notifications_api.js` proxy routes
- [ ] Mount router in main server file
- [ ] Add environment variables (`NOTIFICATION_SERVICE_URL`, `NOTIFICATION_CLIENT_APP_ID`)
- [ ] Create Settings page for user preferences
- [ ] Add Slack workspace membership check
- [ ] Create notification templates in `services/notification-service/templates/your-app/`
- [ ] Test end-to-end flow (preferences + dispatching)
- [ ] Add error handling and logging
- [ ] Document your app-specific events and context structure

---

## Need Help?

- See the TA Portal implementation as reference: 
  - `apps/ta-portal/server/server/routing/notifications_api.js`
- Review notification service docs in shared drive for template creation
- Check `services/notification-service/README.md` for service-level details
