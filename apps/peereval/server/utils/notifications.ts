const DEFAULT_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL;
const NOTIFICATION_API_EXTENSION =
    process.env.NOTIFICATION_API_EXTENSION || "/notifications";

const APP_ID =
    process.env.NOTIFICATION_CLIENT_APP_ID || "peer-eval";

const BASE_URL = `${DEFAULT_SERVICE_URL}${NOTIFICATION_API_EXTENSION}`;

/**
 * Get the notification preferences for a user.
 */
export async function getPreferences(userId: string) {
    const url =
        `${BASE_URL}/preferences/` +
        `${encodeURIComponent(APP_ID)}/` +
        `${encodeURIComponent(userId)}`;

    const res = await fetch(url);

    if (!res.ok) {
        const text = await res.text().catch(() => "<unreadable>");
        throw new Error(
            `getPreferences failed ${res.status} ${text}`
        );
    }

    return res.json();
}

/**
 * Set the notification preferences for a user.
 */
export async function setPreferences(
    userId: string,
    body: {
        notifyEmail?: boolean;
        notifySlack?: boolean;
        userEmail?: string;
        slackUsername?: string;
    }
) {
    const url =
        `${BASE_URL}/preferences/` +
        `${encodeURIComponent(APP_ID)}/` +
        `${encodeURIComponent(userId)}`;

    const res = await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "<unreadable>");
        throw new Error(
            `setPreferences failed ${res.status} ${text}`
        );
    }

    return res.json();
}

/**
 * Send a basic notification.
 */
export async function dispatchNotification(
    userId: string | null,
    {
        subject,
        message,
        userEmail,
    }: {
        subject: string;
        message: string;
        userEmail?: string | null;
    }
) {
    const url =
        `${BASE_URL}/dispatch/${encodeURIComponent(APP_ID)}`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            userId,
            userEmail,
            subject,
            message,
        }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "<unreadable>");
        throw new Error(
            `dispatchNotification failed ${res.status} ${text}`
        );
    }

    return res.json();
}

/**
 * Send a notification using a notification-service template.
 */
export async function dispatchTemplated(
    userId: string | null,
    {
        event,
        context = {},
        role,
        subject,
        userEmail,
    }: {
        event: string;
        context?: Record<string, unknown>;
        role?: string;
        subject?: string;
        userEmail?: string | null;
    }
) {
    const url =
        `${BASE_URL}/dispatch/${encodeURIComponent(APP_ID)}`;

    const payload = {
        userId,
        userEmail,
        event,
        context,
        ...(role ? { role } : {}),
        ...(subject ? { subject } : {}),
    };

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "<unreadable>");
        throw new Error(
            `dispatchTemplated failed ${res.status} ${text}`
        );
    }

    return res.json();
}

/**
 * Check whether a user has a Slack account available
 * through the notification service.
 */
export async function checkSlackStatus(
    email: string,
    userId: string
) {
    const url =
        `${BASE_URL}/preferences/` +
        `${encodeURIComponent(APP_ID)}/` +
        `${encodeURIComponent(userId)}` +
        `/slack-status?email=${encodeURIComponent(email)}`;

    const res = await fetch(url);

    if (!res.ok) {
        const text = await res.text().catch(() => "<unreadable>");
        throw new Error(
            `checkSlackStatus failed ${res.status} ${text}`
        );
    }

    return res.json();
}