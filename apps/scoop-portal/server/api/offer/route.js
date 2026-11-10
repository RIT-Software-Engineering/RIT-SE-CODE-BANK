import { Router } from "express";
const router = Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Send offer to approved applicant
 * PUT /api/offer/:applicationId/send
 */
router.put("/:applicationId/send", async (req, res) => {
    const { applicationId } = req.params;
    
    try {
        const application = await prisma.application.findUnique({
            where: { id: Number(applicationId) }
        });

        if (!application) {
            return res.status(404).json({ error: "Application not found" });
        }

        if (application.status !== "PENDING") {
            return res.status(400).json({ 
                error: `Cannot send offer. Application status is ${application.status}` 
            });
        }

        const offerExpiresAt = new Date();
        offerExpiresAt.setDate(offerExpiresAt.getDate() + 7);

        const updated = await prisma.application.update({
            where: { id: Number(applicationId) },
            data: {
                status: "APPROVED",
                offerSentAt: new Date(),
                offerStatus: "PENDING",
                offerExpiresAt: offerExpiresAt
            }
        });

        await createJournalEntry(application, "APPROVED");

        res.json({
            message: "Application approved and offer sent",
            application: {
                ...updated,
                resumeFile: undefined,
                hasResume: updated.resumeFile ? true : false
            }
        });
    } catch (error) {
        console.error("Error sending offer:", error);
        res.status(500).json({ error: "Failed to send offer" });
    }
});

/**
 * Student responds to offer
 * POST /api/offer/:applicationId/respond
 * Body: { response: "ACCEPTED" | "DECLINED" }
 */
router.post("/:applicationId/respond", async (req, res) => {
    const { applicationId } = req.params;
    const { response } = req.body;

    if (!["ACCEPTED", "DECLINED"].includes(response)) {
        return res.status(400).json({
            error: "Invalid response. Must be ACCEPTED or DECLINED"
        });
    }

    try {
        const application = await prisma.application.findUnique({
            where: { id: Number(applicationId) }
        });

        if (!application) {
            return res.status(404).json({ error: "Application not found" });
        }

        if (application.offerStatus !== "PENDING") {
            return res.status(400).json({
                error: "No pending offer to respond to"
            });
        }

        if (new Date() > new Date(application.offerExpiresAt)) {
            return res.status(400).json({
                error: "This offer has expired"
            });
        }

        const updated = await prisma.application.update({
            where: { id: Number(applicationId) },
            data: {
                offerStatus: response,
                offerRespondedAt: new Date()
            }
        });

        if (response === "ACCEPTED") {
            await promoteToScooployee(application);
        } else {
            await updateUserToDeclined(application);
        }

        await createJournalEntry(application, response);

        res.json({
            message: `Offer ${response.toLowerCase()} successfully`,
            application: {
                ...updated,
                resumeFile: undefined,
                hasResume: updated.resumeFile ? true : false
            }
        });
    } catch (error) {
        console.error("Error responding to offer:", error);
        res.status(500).json({ error: "Failed to respond to offer" });
    }
});

/**
 * Get pending offer for a specific user
 * GET /api/offer/user/:userId/pending
 */
router.get("/user/:userId/pending", async (req, res) => {
    const { userId } = req.params;

    try {
        const pendingOffer = await prisma.application.findFirst({
            where: {
                applicant_id: userId,
                offerStatus: "PENDING"
            },
            orderBy: {
                offerSentAt: 'desc'
            }
        });

        if (!pendingOffer) {
            return res.status(404).json({ error: "No pending offer found" });
        }

        const transformed = {
            ...pendingOffer,
            hasResume: pendingOffer.resumeFile ? true : false,
            resumeFile: undefined
        };

        res.json(transformed);
    } catch (error) {
        console.error("Error fetching pending offer:", error);
        res.status(500).json({ error: "Failed to fetch pending offer" });
    }
});

/**
 * Get offer details by application ID
 * GET /api/offer/:applicationId
 */
router.get("/:applicationId", async (req, res) => {
    const { applicationId } = req.params;

    try {
        const application = await prisma.application.findUnique({
            where: { id: Number(applicationId) }
        });

        if (!application) {
            return res.status(404).json({ error: "Application not found" });
        }

        if (!application.offerStatus) {
            return res.status(404).json({ error: "No offer exists for this application" });
        }

        const transformed = {
            ...application,
            hasResume: application.resumeFile ? true : false,
            resumeFile: undefined
        };

        res.json(transformed);
    } catch (error) {
        console.error("Error fetching offer:", error);
        res.status(500).json({ error: "Failed to fetch offer" });
    }
});

async function promoteToScooployee(application) {
    try {
        await prisma.users.update({
            where: { id: application.applicant_id },
            data: {
                type: "scooployee",
                active: "active"
            }
        });
    } catch (error) {
        console.error("Error promoting user to scooployee:", error);
        throw error;
    }
}

async function updateUserToDeclined(application) {
    try {
        await prisma.users.update({
            where: { id: application.applicant_id },
            data: {
                active: "declined"
            }
        });
    } catch (error) {
        console.error("Error updating user status:", error);
        throw error;
    }
}

async function createJournalEntry(application, status) {
    let entry_string = "";
    
    if (status === "APPROVED") {
        entry_string = `${application.firstName} ${application.lastName} has been approved for SCOOP. Awaiting their response.`;
    } else if (status === "ACCEPTED") {
        entry_string = `${application.firstName} ${application.lastName} has accepted their SCOOP offer.`;
    } else if (status === "DECLINED") {
        entry_string = `${application.firstName} ${application.lastName} has declined their SCOOP offer.`;
    }

    if (!entry_string) return;

    try {
        await fetch(`${process.env.API_URL}/api/journal`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                date: new Date().toISOString(),
                sender_id: application.applicant_id,
                notes: entry_string,
                recipient_ids: [],
                topic_id: application.applicant_id,
                semester_GroupId: null,
                previous_entryid: null,
                entry_type: "AUTOMATED",
                visibility_level: 1,
                privacy_level: "PUBLIC",
            }),
        });
    } catch (error) {
        console.error("Error creating journal entry:", error);
    }
}

export default router;