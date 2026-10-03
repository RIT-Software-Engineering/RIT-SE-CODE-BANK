import { Router } from "express";
import {
    getPreferences,
    setPreferences,
    dispatchNotification,
    dispatchTemplated,
    checkSlackStatus,
} from "../utils/notifications";

const router = Router();

// GET /notifications/preferences/:appId/:identifier
router.get("/preferences/:appId/:identifier", async (req, res) => {
    const { appId, identifier } = req.params;

    try {
        const prefs = await getPreferences(identifier);
        res.json(prefs);
    } catch (err) {
        console.error(
            "Failed to fetch preferences from notification service:",
            err
        );

        res.status(502).json({
            error: "Failed to fetch preferences",
            detail: String(err),
        });
    }
});

// PUT /notifications/preferences/:appId/:identifier
router.put("/preferences/:appId/:identifier", async (req, res) => {
    const { identifier } = req.params;
    const body = req.body || {};

    const payload: {
        notifyEmail?: boolean;
        notifySlack?: boolean;
    } = {};

    if (Object.prototype.hasOwnProperty.call(body, "notifyEmail")) {
        payload.notifyEmail = !!body.notifyEmail;
    }

    if (Object.prototype.hasOwnProperty.call(body, "notifySlack")) {
        payload.notifySlack = !!body.notifySlack;
    }

    try {
        const result = await setPreferences(identifier, payload);
        res.json(result);
    } catch (err) {
        console.error(
            "Failed to set preferences via notification service:",
            err
        );

        res.status(502).json({
            error: "Failed to set preferences",
            detail: String(err),
        });
    }
});

// GET /notifications/preferences/:appId/:identifier/slack-status
router.get(
    "/preferences/:appId/:identifier/slack-status",
    async (req, res) => {
        const { identifier } = req.params;
        const { email } = req.query;

        if (!email || typeof email !== "string") {
            res.status(400).json({
                error: "email query parameter is required",
            });
            return;
        }

        try {
            const result = await checkSlackStatus(email, identifier);
            res.json(result);
        } catch (err) {
            console.error("Failed to check Slack status:", err);

            res.status(502).json({
                error: "Failed to check Slack status",
                detail: String(err),
            });
        }
    }
);

// POST /notifications/dispatch/:appId
router.post("/dispatch/:appId", async (req, res) => {
    const body = req.body || {};
    const { userId, userEmail } = body;

    if (!userId && !userEmail) {
        res.status(400).json({
            error: "userId or userEmail is required",
        });
        return;
    }

    try {
        let result;

        if (body.event) {
            const {
                event,
                context = {},
                role,
                subject,
            } = body;

            result = await dispatchTemplated(userId || null, {
                event,
                context,
                role,
                subject,
                userEmail: userEmail || null,
            });
        } else {
            const {
                subject,
                message,
            } = body;

            result = await dispatchNotification(userId || null, {
                subject,
                message,
                userEmail: userEmail || null,
            });
        }

        res.json(result);
    } catch (err) {
        console.error(
            "Failed to dispatch via notification service:",
            err
        );

        res.status(502).json({
            error: "Failed to dispatch",
            detail: String(err),
        });
    }
});

export default router;