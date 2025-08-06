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
                    inquiry: { include: { rows: true } },
                },
                orderBy: { index: "asc" },
            },
        },
    });

    res.json(
        fs.map((f) => ({
            ...f,
            inquiries: f.inquiries.map((i) => i.inquiry),
        }))
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
            inquiries: {
                create: inqs.map((inq, index) => ({
                    index,
                    inquiry: { connect: { id: inq.id } },
                })),
            },
        },
        include: {
            inquiries: {
                include: {
                    inquiry: { include: { rows: true } },
                },
                orderBy: { index: "asc" },
            },
        },
    });

    res.status(201).json({
        ...form,
        inquiries: form.inquiries.map((i) => i.inquiry),
    });
});

export default router;
