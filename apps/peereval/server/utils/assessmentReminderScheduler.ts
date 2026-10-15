
import {
    AssessmentReminderType,
    PrismaClient,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { dispatchTemplated } from "./notifications";

const prisma = new PrismaClient();

const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const DUE_SOON_WINDOW_MS = 24 * 60 * 60 * 1000;

const assessmentReminderInclude = {
    project: {
        select: {
            id: true,
            name: true,
        },
    },
    responders: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
    receivers: {
        select: {
            id: true,
        },
    },
    peerResponses: {
        select: {
            responderId: true,
            respondeeId: true,
            submittedAt: true,
        },
    },
} satisfies Prisma.AssessmentInclude;

type ReminderAssessment = Prisma.AssessmentGetPayload<{
    include: typeof assessmentReminderInclude;
}>;

type ReminderResponder = ReminderAssessment["responders"][number];

function hasOutstandingFeedback(
    assessment: ReminderAssessment,
    responderId: string
): boolean {
    // A responder does not evaluate themself.
    const requiredReceiverIds = assessment.receivers
        .filter((receiver) => receiver.id !== responderId)
        .map((receiver) => receiver.id);

    // There is nothing outstanding if no other recipients are assigned.
    if (requiredReceiverIds.length === 0) {
        return false;
    }

    // Only explicitly submitted responses count as completed.
    const submittedReceiverIds = new Set(
        assessment.peerResponses
            .filter(
                (response) =>
                    response.responderId === responderId &&
                    response.submittedAt !== null
            )
            .map((response) => response.respondeeId)
    );

    return !requiredReceiverIds.every((receiverId) =>
        submittedReceiverIds.has(receiverId)
    );
}

async function sendReminder(
    assessment: ReminderAssessment,
    responder: ReminderResponder,
    type: AssessmentReminderType
): Promise<void> {
    if (!hasOutstandingFeedback(assessment, responder.id)) {
        return;
    }

    const uniqueKey = {
        assessmentId_responderId_type: {
            assessmentId: assessment.id,
            responderId: responder.id,
            type,
        },
    };

    // Create a persistent record before attempting delivery.
    // An unsent record can be retried on a later scheduler run.
    const reminder = await prisma.assessmentReminder.upsert({
        where: uniqueKey,
        create: {
            assessmentId: assessment.id,
            responderId: responder.id,
            type,
        },
        update: {},
    });

    // This reminder was already successfully dispatched.
    if (reminder.sentAt) {
        return;
    }

    const baseUrl = (
        process.env.PEEREVAL_BASE_URL || "http://localhost:3000"
    ).replace(/\/$/, "");

    const isDueSoon = type === AssessmentReminderType.DUE_SOON;
    const event = isDueSoon
        ? "assessment_due_soon"
        : "assessment_overdue";

    const subject = isDueSoon
        ? `Peer Assessment Due Soon: ${assessment.name}`
        : `Peer Assessment Overdue: ${assessment.name}`;

    const dueDate = assessment.dueDate.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });

    try {
        await dispatchTemplated(responder.id, {
            event,
            role: "responder",
            userEmail: responder.email,
            subject,
            context: {
                recipient: {
                    name: responder.name,
                    email: responder.email,
                },
                item: {
                    id: assessment.id,
                    title: assessment.name,
                    projectId: assessment.project.id,
                    projectName: assessment.project.name,
                    dueDate,
                },
                cta: {
                    url: `${baseUrl}/projects/${encodeURIComponent(
                        assessment.project.id
                    )}/assessments/${encodeURIComponent(assessment.id)}`,
                },
                appName: "PeerEval",
            },
        });
    } catch (error) {
        // Leave sentAt null so the scheduler can retry later.
        console.error(
            `[assessment-reminders] Failed to dispatch ${type} reminder to ${responder.email} for "${assessment.name}":`,
            error
        );
        return;
    }

    // Record success only after the notification service accepts the request.
    await prisma.assessmentReminder.update({
        where: { id: reminder.id },
        data: { sentAt: new Date() },
    });

    console.log(
        `[assessment-reminders] Dispatched ${type} reminder to ${responder.email} for "${assessment.name}"`
    );
}

async function processAssessments(
    assessments: ReminderAssessment[],
    type: AssessmentReminderType
): Promise<void> {
    for (const assessment of assessments) {
        for (const responder of assessment.responders) {
            try {
                await sendReminder(assessment, responder, type);
            } catch (error) {
                // Keep one failed reminder from interrupting other assessments.
                console.error(
                    `[assessment-reminders] Failed processing assessment "${assessment.name}" for ${responder.email}:`,
                    error
                );
            }
        }
    }
}

let checkInProgress = false;

async function checkForReminders(): Promise<void> {
    // Prevent overlapping checks within this server process.
    if (checkInProgress) {
        return;
    }

    checkInProgress = true;

    try {
        const now = new Date();
        const dueSoonCutoff = new Date(
            now.getTime() + DUE_SOON_WINDOW_MS
        );

        const include = assessmentReminderInclude;

        const [dueSoonAssessments, overdueAssessments] =
            await Promise.all([
                prisma.assessment.findMany({
                    where: {
                        startDate: { lte: now },
                        dueDate: {
                            gt: now,
                            lte: dueSoonCutoff,
                        },
                    },
                    include,
                }),
                prisma.assessment.findMany({
                    where: {
                        startDate: { lte: now },
                        dueDate: { lte: now },
                    },
                    include,
                }),
            ]);

        await processAssessments(
            dueSoonAssessments,
            AssessmentReminderType.DUE_SOON
        );

        await processAssessments(
            overdueAssessments,
            AssessmentReminderType.OVERDUE
        );
    } catch (error) {
        console.error(
            "[assessment-reminders] Scheduler check failed:",
            error
        );
    } finally {
        checkInProgress = false;
    }
}

export function startAssessmentReminderScheduler(): void {
    console.log(
        "[assessment-reminders] Scheduler started. Checking every 15 minutes."
    );

    // Check immediately on startup, then repeat every 15 minutes.
    void checkForReminders();

    setInterval(() => {
        void checkForReminders();
    }, CHECK_INTERVAL_MS);
}
