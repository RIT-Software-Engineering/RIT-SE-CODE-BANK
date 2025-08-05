import { Router } from "express";
import { $Enums, InquiryType, PrismaClient, RubricRow } from "@prisma/client";
import { exportForm } from "../utils/forms";

const router = Router();
const prisma = new PrismaClient();

// Get all forms
// /forms
router.get("/", async (req, res) => {
    const fs = await prisma.feedbackForm.findMany({
        orderBy: {
            name: "asc",
        },
        include: {
            inquiries: {
                include: {
                    rows: true,
                },
            },
        },
    });

    res.json(
        // There's gotta be a better way to do this...
        fs.map((f) => exportForm(f))
    );
});

// Create a form
// /forms
router.post("/", async (req, res) => {
    const { title, inquiries } = req.body as {
        title: string;
        inquiries: any[];
    };

    // First create inquiries
    const inqs = await Promise.all(
        inquiries.map((i) => prisma.inquiry.create({ data: i }))
    );

    // Then feedback form
    const form = await prisma.feedbackForm.create({
        data: {
            name: title,
            inquiries: { connect: inqs.map(({ id }) => ({ id })) },
        },
    });

    res.status(201).json(form);
});

export default router;
