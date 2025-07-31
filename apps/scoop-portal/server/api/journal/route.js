import { Router } from "express";
const router = Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Get all journal entries
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
router.get("/", async (req, res) => {
    try {
        const entries = await prisma.journal_Entry.findMany();
        res.status(200).json(entries);
    } catch (error) {
        console.error("Error fetching journal entries:", error);
        res.status(500).json({ message: "Error fetching journal entries" });
    }
});

/**
 * Create a new journal entry
 * @param {Object} req - The request object containing the journal entry data
 * @param {Object} res - The response object to send back the created entry or an error
 */
router.post("/", async (req, res) => {
    const { date, notes } = req.body;
    try {
        const newEntry = await prisma.journal_Entry.create({
            data: { date, notes },
        });
        res.status(201).json(newEntry);
    } catch (error) {
        console.error("Error creating journal entry:", error);
        res.status(500).json({ message: "Error creating journal entry" });
    }
});

/**
 * Update an existing journal entry
 */
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    try {
        const updatedEntry = await prisma.journal_Entry.update({
            where: { id: Number(id) },
            data: { notes },
        });
        res.status(200).json(updatedEntry);
    } catch (error) {
        console.error("Error updating journal entry:", error);
        res.status(500).json({ message: "Error updating journal entry" });
    }
});

export default router;
