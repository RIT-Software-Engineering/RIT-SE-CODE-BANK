import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { dispatchTemplated } from "../utils/notifications";

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
                            inquiry: {
                                include: { rows: true },
                            },
                        },
                        orderBy: { index: "asc" },
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

    res.json(inqs.map((i) => i.inquiry));
});

// Get project's assessments
// Can query by responder and receiver
// /assessments/byProject/:id
router.get("/byProject/:id", async (req, res) => {
    const id = req.params.id;
    const { responder, receiver } = req.query as {
        responder?: string;
        receiver?: string;
    };

    const as = await prisma.assessment.findMany({
        where: {
            projectId: id,
            ...(responder && {
                responders: {
                    some: {
                        id: responder,
                    },
                },
            }),
            ...(receiver && {
                receivers: {
                    some: {
                        id: receiver,
                    },
                },
            }),
        },
    });

    res.json(as);
});

// Get all assessment's responses
// /assessments/:id/responses
router.get("/:id/responses", async (req, res) => {
    const { id: assessmentId } = req.params;
    const requesterId = req.header("x-user-id");

    if (!requesterId) {
        res.status(400).json({
            message: "Missing user identity",
        });
        return;
    }

    const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        select: {
            project: {
                select: { overseerId: true },
            },
        },
    });

    if (!assessment) {
        res.status(404).json({
            message: "Assessment not found",
        });
        return;
    }

    if (assessment.project.overseerId !== requesterId) {
        res.status(403).json({
            message: "You are not authorized to view this assessment's responses",
        });
        return;
    }

    const responses = await prisma.formResponse.findMany({
        where: { assessmentId },
        include: { responses: true },
    });

    res.json(responses);
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
        const { answers = {}, submitted = false } = req.body as {
            answers: Record<string, string>;
            submitted?: boolean;
        };

        // Find the exisitng response and its saved answers
        const existingFormResponse = await prisma.formResponse.findUnique({
            where: {
                assessmentId_responderId_respondeeId: {
                    assessmentId,
                    responderId,
                    respondeeId,
                },
            },
            include: { responses: true },
        });

        // Get the response record if this is the first save
        const formRes = existingFormResponse ?? (await prisma.formResponse.create({
            data: {
                assessmentId,
                responderId,
                respondeeId,
            },
        }));

        // Check whether any answer actually changed.
        // Editing previously approved feedback invalidates its approval
        const oldAnswers = new Map<string, string>();

        for (const response of existingFormResponse?.responses ?? []) {
            oldAnswers.set(response.inquiryId, response.answer);
        }

        const answersChanged = Object.entries(answers).some(
            ([inquiryId, answer]) => oldAnswers.get(inquiryId) !== answer
        );

        // Save the answers
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

        if (submitted === true) {
            await prisma.formResponse.update({
                where: { id: formRes.id },
                data: {
                    submittedAt: new Date(),
                    releasedAt: null,
                },
            });
        } else if (answersChanged) {
            await prisma.formResponse.update({
                where: { id: formRes.id },
                data: {
                    submittedAt: null,
                    releasedAt: null,
                },
            });
        }

        if (submitted === true) {
            try {
                const assessment = await prisma.assessment.findUnique({
                    where: { id: assessmentId },
                    include: {
                        project: {
                            include: {
                                overseer: true,
                            },
                        },
                        responders: {
                            where: { id: responderId },
                        },
                    },
                });

                const responder = assessment?.responders[0];
                const overseer = assessment?.project.overseer;

                if (assessment && responder && overseer) {
                    await dispatchTemplated(overseer.id, {
                        event: "assessment_submitted",
                        role: "overseer",
                        userEmail: overseer.email,
                        subject: `Peer Assessment Submitted: ${assessment.name}`,
                        context: {
                            recipient: {
                                name: overseer.name,
                                email: overseer.email,
                            },
                            submittedBy: {
                                name: responder.name,
                                email: responder.email,
                            },
                            item: {
                                id: assessment.id,
                                title: assessment.name,
                                description: assessment.description,
                                projectId: assessment.project.id,
                                projectName: assessment.project.name,
                                dueDate: assessment.dueDate.toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                }),
                            },
                            cta: {
                                url: `${
                                    (process.env.PEEREVAL_BASE_URL || "http://localhost:3000")
                                        .replace(/\/$/, "")
                                }/projects/${encodeURIComponent(assessment.project.id)}/asOverseer`,
                            },
                            appName: "PeerEval",
                        },
                    });

                    console.log(
                        `[notifications] Sent assessment_submitted notification to ${overseer.email}`
                    );
                } else {
                    console.error(
                        `[notifications] Could not find assessment, responder, or overseer for submission ${assessmentId}`
                    );
                }
            } catch (err) {
                // A notification failure must not undo saved responses
                console.error(
                    `[notifications] Failed to notify overseer about assessment submission:`,
                    err
                );
            }
        }

        res.status(201).json(inqRess);
    }
);

// Get responses that are targeted at a certain peer
// /assessments/:assessmentId/responses/in/:respondeeId
router.get("/:assessmentId/responses/in/:respondeeId", async (req, res) => {
    const { respondeeId, assessmentId } = req.params;
    const requesterId = req.header("x-user-id");

    if (!requesterId) {
        res.status(400).json({
            message: "Missing user identity",
        });
        return;
    }

    if (requesterId !== respondeeId) {
        res.status(403).json({
            message: "You are not authorized to view this peer's responses",
        });
        return;
    }

    // Until feedback is released, the recipient sees no records of the feedback given to them
    const response = await prisma.formResponse.findMany({
        where: {
            assessmentId,
            respondeeId,
            releasedAt: { not: null },
        },
        include: {
            responses: true,
        },
    });

    res.json(response);
});

// Get peers assigned to an assessment
// /assessments/:id/peers
router.get("/:id/peers", async (req, res) => {
    const { id } = req.params;

    const peers = await prisma.assessment.findUnique({
        where: { id },
        select: {
            receivers: true,
            responders: true,
        },
    });

    res.json(peers);
});

router.post("/:assessmentId/responses/:responderId/:respondeeId/release", async (req, res) => {
    const { assessmentId, responderId, respondeeId } = req.params;
    const requesterId = req.header("x-user-id");

    if (!requesterId) {
        res.status(400).json({
            message: "Missing user identity",
        });
        return;
    }

    const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: { project: true },
    });

    if (!assessment) {
        res.status(404).json({
            message: "Assessment not found",
        });
        return;
    }

    if (assessment.project.overseerId !== requesterId) {
        res.status(403).json({
            message: "You are not authorized to release this peer's responses",
        });
        return;
    }

    const formResponse = await prisma.formResponse.findUnique({
        where: {
            assessmentId_responderId_respondeeId: {
                assessmentId,
                responderId,
                respondeeId,
            },
        },
        include: {
            responder: true,
            respondee: true,
        },
    });
    
    if (!formResponse) {
        res.status(404).json({
            message: "Feedback response not found",
        });
        return;
    }

    if (!formResponse.submittedAt) {
        res.status(400).json({
            message: "Cannot release feedback that has not been submitted",
        });
        return;
    }

    if (formResponse.releasedAt) {
        res.status(400).json({
            message: "Feedback has already been released",
            releasedAt: formResponse.releasedAt,
        });
        return;
    }

    const releasedAt = new Date();

    await prisma.formResponse.update({
        where: { id: formResponse.id },
        data: { releasedAt },
    });

    try {
        const baseUrl = (process.env.PEEREVAL_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
        await dispatchTemplated(formResponse.respondeeId, {
            event: "feedback_released",
            role: "peer",
            userEmail: formResponse.respondee.email,
            subject: `PeerEval Feedback Available: ${assessment.name}`,
            context: {
                recipient: {
                    name: formResponse.respondee.name,
                    email: formResponse.respondee.email,
                },
                submittedBy: {
                    name: formResponse.responder.name,
                    email: formResponse.responder.email,
                },
                item: {
                    id: assessment.id,
                    title: assessment.name,
                    description: assessment.description,
                    projectId: assessment.project.id,
                    projectName: assessment.project.name,
                },
                cta: {
                    url: `${baseUrl}/projects/${encodeURIComponent(assessment.project.id)}/assessments/${encodeURIComponent(assessment.id)}/received`,
                },
                appName: "PeerEval",
            },
        });

        console.log(
            `[notifications] Sent feedback_released notification to ${formResponse.respondee.email}`
        );
    } catch (err) {
        // A notification failure must not undo the release of feedback
        console.error(
            `[notifications] Feedback was released, but the availability email failed to send:`,
            err
        );
    }

    res.json({
        message: "Feedback released successfully",
        releasedAt,
    });
});

export default router;
