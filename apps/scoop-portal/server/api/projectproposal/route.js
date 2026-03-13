import { Router } from "express";
const router = Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * POST a new project proposal (scoopervisor only)
 * @param {Object} req - The request object containing proposal data
 * @param {Object} res - The response object to send back the saved proposal or an error
 */
router.post("/", async (req, res) => {
    const { title, description, submittedById } = req.body;

    if (!title || !description || !submittedById) {
        return res.status(400).json({ error: "title, description, and submittedById are required" });
    }

    try {
        const proposal = await prisma.projectProposal.create({
            data: {
                title,
                description,
                submittedById,
            },
        });

        res.status(200).json({ message: "Proposal submitted", proposal });
    } catch (error) {
        console.error("Error saving proposal:", error);
        res.status(500).json({ message: "Error saving proposal", error: error.message });
    }
});

/**
 * GET all proposals (with submitter and reviewer info)
 */
router.get("/", async (req, res) => {
    try {
        const proposals = await prisma.projectProposal.findMany({
            include: {
                submittedBy: {
                    select: { id: true, fname: true, lname: true, email: true },
                },
                reviewedBy: {
                    select: { id: true, fname: true, lname: true, email: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(proposals);
    } catch (error) {
        console.error("Error fetching proposals:", error);
        res.status(500).json({ error: "Failed to fetch proposals" });
    }
});

/**
 * GET a single proposal by ID
 */
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const proposal = await prisma.projectProposal.findUnique({
            where: { id: Number(id) },
            include: {
                submittedBy: {
                    select: { id: true, fname: true, lname: true, email: true },
                },
                reviewedBy: {
                    select: { id: true, fname: true, lname: true, email: true },
                },
            },
        });

        if (!proposal) {
            return res.status(404).json({ error: "Proposal not found" });
        }

        res.json(proposal);
    } catch (error) {
        console.error("Error fetching proposal:", error);
        res.status(500).json({ error: "Failed to fetch proposal" });
    }
});

/**
 * PATCH a proposal (scoopdinator only — update status and/or review notes)
 * @param {string} status - PENDING | APPROVED | REJECTED
 * @param {string} reviewNotes - Optional notes from the reviewer
 * @param {string} reviewedById - ID of the scoopdinator reviewing
 */
router.patch("/:id", async (req, res) => {
    const { id } = req.params;
    const { status, reviewNotes, reviewedById } = req.body;

    const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be one of: " + validStatuses.join(", ") });
    }

    try {
        const updated = await prisma.projectProposal.update({
            where: { id: Number(id) },
            data: {
                ...(status && { status }),
                ...(reviewNotes !== undefined && { reviewNotes }),
                ...(reviewedById && { reviewedById }),
            },
        });

        res.json({ message: "Proposal updated", proposal: updated });
    } catch (error) {
        console.error("Error updating proposal:", error);
        res.status(500).json({ error: "Failed to update proposal" });
    }
});

export default router;