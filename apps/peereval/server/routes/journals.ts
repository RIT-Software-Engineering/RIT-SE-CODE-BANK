import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// Get all journals
// /jouranls
router.get("/", async (req, res) => {
    const j = await prisma.journal.findMany();

    res.json(j);
});

// Get journal by user
// Can query by tag (single tag only)
// /journals/:userId
router.get("/:userId", async (req, res) => {
    const { userId } = req.params;
    const { tag } = req.query as { tag?: string };

    const j = await prisma.journal.findUnique({
        where: { userId },
        include: {
            entries: {
                where: tag ? { tags: { some: { name: tag } } } : {},
                orderBy: { date: "desc" },
                include: { tags: { select: { name: true } } },
            },
        },
    });

    res.json(j);
});

// Add journal entry
// /journals
router.post("/", async (req, res) => {
    const { userId, re, content, tag } = req.body as {
        userId: string;
        re: string;
        content: string;
        tag: string;
    };

    // Get the user's journal
    const journal = await prisma.journal.findUnique({ where: { userId } });

    // Create entry
    const entry = await prisma.journalEntry.create({
        data: {
            journal: {
                connect: { id: journal?.id },
            },
            re,
            content,
            tags: {
                connectOrCreate: [
                    {
                        where: { name: tag },
                        create: { name: tag },
                    },
                ],
            },
        },
    });

    res.status(201).json(entry);
});

// Edit journal entry
// /journals/:id
router.put("/:id", async (req, res) => {
    const { id } = req.params;

    const { userId, re, content, tag } = req.body as {
        userId: string;
        re: string;
        content: string;
        tag: string;
    };

    const entry = await prisma.journalEntry.update({
        where: { id },
        data: {
            re,
            content,
            tags: {
                connectOrCreate: [
                    {
                        where: { name: tag },
                        create: { name: tag },
                    },
                ],
            },
            lastUpdated: new Date(),
        },
    });

    res.status(201).json(entry);
});

// Delete journal entry
// /journals/:id
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    await prisma.journalEntry.delete({
        where: { id },
    });

    res.status(204).send();
});

export default router;
