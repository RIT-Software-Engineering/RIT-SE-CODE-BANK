// prisma/seed.ts
import { PrismaClient, InquiryType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // ----------------------------------------------------
    // USERS
    // ----------------------------------------------------

    const userData = [
        { name: "Alice", email: "alice@rit.edu" },
        { name: "Bob", email: "bob@rit.edu" },
        { name: "Charlie", email: "charlie@rit.edu" },
        { name: "Diana", email: "diana@rit.edu" },
        { name: "Ethan", email: "ethan@rit.edu" },
        { name: "Fiona", email: "fiona@rit.edu" },
        { name: "George", email: "george@rit.edu" },
        { name: "Hannah", email: "hannah@rit.edu" },
        { name: "Ivan", email: "ivan@rit.edu" },
        { name: "Julia", email: "julia@rit.edu" },
        { name: "Zebra", email: "zebra@rit.edu" },
    ];

    const users = await Promise.all(
        userData.map((u) => prisma.user.create({ data: u }))
    );

    // ----------------------------------------------------
    // PROJECTS
    // ----------------------------------------------------

    const project262 = await prisma.project.create({
        data: {
            name: "SWEN-262",
            description: "NutriApp semester project for SWEN-261",
            overseer: {
                connect: {
                    id: users[10].id,
                },
            },
            peers: {
                connect: [
                    { id: users[0].id },
                    { id: users[1].id },
                    { id: users[7].id },
                ],
            },
        },
    });

    const project444 = await prisma.project.create({
        data: {
            name: "SWEN-444",
            description: "UI/UX semester project for SWEN-444",
            overseer: {
                connect: {
                    id: users[userData.length - 1].id,
                },
            },
            peers: {
                connect: [
                    { id: users[0].id },
                    { id: users[2].id },
                    { id: users[8].id },
                ],
            },
        },
    });

    // ----------------------------------------------------
    // ASSESSMENTS
    // ----------------------------------------------------

    // First make Inquiries
    const inquiryData = [
        {
            type: InquiryType.FREE_RESPONSE,
            question: "What was this peer's biggest strength?",
        },
        {
            type: InquiryType.RATING,
            question: "How would you rate this peer's communication?",
            scale: 5,
            labels: "Poor;Excellent",
        },
        {
            type: InquiryType.RUBRIC,
            question: "Evaluate the following aspects:",
            rows: {
                create: [
                    { label: "Clarity", options: "Poor;Fair;Good;Excellent" },
                    { label: "Teamwork", options: "Poor;Fair;Good;Excellent" },
                ],
            },
        },
    ];

    const inquiries = await Promise.all(
        inquiryData.map((i) => prisma.inquiry.create({ data: i }))
    );

    // Then Feedback Form
    const feedbackForm = await prisma.feedbackForm.create({
        data: {
            name: "Basic Form",
            inquiries: {
                connect: [
                    { id: inquiries[0].id },
                    { id: inquiries[1].id },
                    { id: inquiries[2].id },
                ],
            },
        },
    });

    // Then Assessments
    function daysFromToday(days: number): Date {
        const today = new Date();
        today.setHours(0, 0, 0);
        today.setDate(today.getDate() + days);
        return today;
    }

    const assessmentData = [
        {
            project: {
                connect: { id: project262.id },
            },
            name: "Sprint 1 Review",
            description:
                "A beginning-of-the-semester peer evaluation to assess teamwork, communication, and individual contributions during the first half of the spring term.",
            startDate: daysFromToday(-9),
            dueDate: daysFromToday(-2),
            feedbackForm: {
                connect: { id: feedbackForm.id },
            },
        },
        {
            project: {
                connect: { id: project262.id },
            },
            name: "Sprint 2 Review",
            description:
                "A mid-semester peer evaluation to assess teamwork, communication, and individual contributions during the second half of the spring term.",
            startDate: daysFromToday(-1),
            dueDate: daysFromToday(6),
            feedbackForm: {
                connect: { id: feedbackForm.id },
            },
        },
        {
            project: {
                connect: { id: project262.id },
            },
            name: "Final Review",
            description:
                "A final peer evaluation to assess teamwork, communication, and individual contributions during the end of the spring term.",
            startDate: daysFromToday(7),
            dueDate: daysFromToday(14),
            feedbackForm: {
                connect: { id: feedbackForm.id },
            },
        },
        {
            project: {
                connect: { id: project444.id },
            },
            name: "Sprint 1 Review",
            description:
                "A beginning-of-the-semester peer evaluation to assess teamwork, communication, and individual contributions during the first half of the spring term.",
            startDate: daysFromToday(-9),
            dueDate: daysFromToday(-2),
            feedbackForm: {
                connect: { id: feedbackForm.id },
            },
        },
        {
            project: {
                connect: { id: project444.id },
            },
            name: "Sprint 2 Review",
            description:
                "A mid-semester peer evaluation to assess teamwork, communication, and individual contributions during the second half of the spring term.",
            startDate: daysFromToday(-1),
            dueDate: daysFromToday(6),
            feedbackForm: {
                connect: { id: feedbackForm.id },
            },
        },
        {
            project: {
                connect: { id: project444.id },
            },
            name: "Final Review",
            description:
                "A final peer evaluation to assess teamwork, communication, and individual contributions during the end of the spring term.",
            startDate: daysFromToday(7),
            dueDate: daysFromToday(14),
            feedbackForm: {
                connect: { id: feedbackForm.id },
            },
        },
    ];

    const assessments = await Promise.all(
        assessmentData.map((a) => prisma.assessment.create({ data: a }))
    );

    // Adds one more super simple form
    await prisma.feedbackForm.create({
        data: {
            name: "Super Simple Form",
            inquiries: {
                create: {
                    type: InquiryType.FREE_RESPONSE,
                    question: "What'd you think?",
                },
            },
        },
    });
}

main()
    .then(() => {
        console.log("🌱  Database seeded");
        return prisma.$disconnect();
    })
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
