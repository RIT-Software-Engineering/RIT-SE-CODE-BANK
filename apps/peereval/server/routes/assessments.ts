import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { connect } from "http2";

const router = Router();
const prisma = new PrismaClient();

// Get all assessments
// /assessments
router.get("/", async (req, res) => {
    const as = await prisma.assessment.findMany({
        orderBy: {
            name: "asc",
        },
    });

    res.json(as);
});

// Get assessment by id
// /assessments/:id
router.get("/:id", async (req, res) => {
    const id = req.params.id;

    const a = await prisma.assessment.findFirst({
        where: { id: id },
        include: {
            feedbackForm: {
                include: {
                    inquiries: {},
                },
            },
        },
    });

    res.json(a);
});

export default router;

// Get project's assessments
// /assessments/byProject/:id
router.get("/byProject/:id", async (req, res) => {
    const id = req.params.id;

    const as = await prisma.assessment.findMany({
        where: {
            project: {
                id: id,
            },
        },
    });

    res.json(as);
});

// Get peer's assessment responses
// /assessments/resposnes/:userId/:assessmentId
router.get("/responses/:userId/:assessmentId", async (req, res) => {
    const { userId, assessmentId } = req.params;

    const rs = await prisma.formResponse.findMany({
        include: {
            responses: {},
        },
    });

    res.json(rs);
});

// Set peer's response for a specific peer
// Updates multiple inquiry responses at once
// /assessments/:assessmentId/addFeedback/:responderId/:respondeeId
router.post(
    "/:assessmentId/addFeedback/:responderId/:respondeeId",
    async (req, res) => {
        const { assessmentId, responderId, respondeeId } = req.params;
        const { answers } = req.body as {
            answers: {
                qId: string;
                answer: string;
            }[];
        };

        answers.map((a) => {
            console.log(`${a.qId}: ${a.answer}`);
        });

        // Get the form response
        const formRes = await prisma.formResponse.upsert({
            where: {
                assessmentId_responderId_respondeeId: {
                    assessmentId,
                    responderId,
                    respondeeId,
                },
            },
            update: {},
            create: {
                assessmentId,
                responderId,
                respondeeId,
            },
        });

        // Upsert answers
        const inqRess = await Promise.all(
            answers.map((a) =>
                prisma.inquiryResponse.upsert({
                    where: {
                        formResponseId_inquiryId: {
                            formResponseId: formRes.id,
                            inquiryId: a.qId,
                        },
                    },
                    update: {
                        answer: a.answer,
                    },
                    create: {
                        formResponseId: formRes.id,
                        inquiryId: a.qId,
                        answer: a.answer,
                    },
                })
            )
        );

        res.status(201).json(inqRess);
    }
);
