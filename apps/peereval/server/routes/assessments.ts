import { Router } from "express";
import { $Enums, PrismaClient } from "@prisma/client";
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
        where: { id },
    });

    res.json(a);
});

type ReturnedInquiry = {
    id: string;
    type: $Enums.InquiryType;
    question: string;
    scale?: number;
    labels?: string[];
    rows?: {
        id: string;
        label: string;
        options: string[];
    }[];
};

// Get assessment inquiries by id
// /assessments/:id/inquiries
router.get("/:id/inquiries", async (req, res) => {
    const id = req.params.id;

    const a = await prisma.assessment.findFirst({
        where: { id: id },
        include: {
            feedbackForm: {
                include: {
                    inquiries: {
                        include: {
                            rows: {},
                        },
                    },
                },
            },
        },
    });

    if (!a) {
        res.status(404).json({
            message: "Could not find assessment with ID " + id,
        });
        return;
    }

    const inqs = a.feedbackForm.inquiries!;

    res.json(
        inqs.map(
            (i) =>
                ({
                    ...i,
                    labels: i.labels?.split(";") ?? [],
                    rows: i.rows.map((row) => ({
                        ...row,
                        options: row.options.split(";"),
                    })),
                } as ReturnedInquiry)
        )
    );
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
// /assessments/resposnes/:responderId/:assessmentId
router.get("/responses/:responderId/:assessmentId", async (req, res) => {
    const { responderId, assessmentId } = req.params;

    const rs = await prisma.formResponse.findMany({
        where: {
            assessmentId,
            responderId,
        },
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
            answers: Record<string, string>;
        };

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
            Object.entries(answers).map(([inquiryId, answer]) =>
                prisma.inquiryResponse.upsert({
                    where: {
                        formResponseId_inquiryId: {
                            formResponseId: formRes.id,
                            inquiryId,
                        },
                    },
                    update: {
                        answer,
                    },
                    create: {
                        formResponseId: formRes.id,
                        inquiryId,
                        answer,
                    },
                })
            )
        );

        res.status(201).json(inqRess);
    }
);
