const { permissionTypes } = require("../api/consts");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    ///////////
    // Users //
    ///////////

    // const userData = [
    //     { name: "Alice", email: "alice@rit.edu" },
    //     { name: "Bob", email: "bob@rit.edu" },
    //     { name: "Charlie", email: "charlie@rit.edu" },
    //     { name: "Diana", email: "diana@rit.edu" },
    //     { name: "Ethan", email: "ethan@rit.edu" },
    //     { name: "Fiona", email: "fiona@rit.edu" },
    //     { name: "George", email: "george@rit.edu" },
    //     { name: "Hannah", email: "hannah@rit.edu" },
    //     { name: "Ivan", email: "ivan@rit.edu" },
    //     { name: "Julia", email: "julia@rit.edu" },
    //     { name: "Zebra", email: "zebra@rit.edu" },
    // ];

    // const users = await Promise.all(
    //     userData.map((u) =>
    //         prisma.user.upsert({
    //             where: { ...u },
    //             create: { ...u },
    //             update: { ...u },
    //         })
    //     )
    // );

    users = Array.from({ length: 10 }, (_, i) => ({ id: (i + 1).toString() }));

    ///////////////
    // Workflows //
    ///////////////

    const workflowData = [
        {
            name: "Workflow 1",
            description: "This is the first workflow in the seed data.",
            metadata: [],
            userId: users[0].id,
        },
        {
            name: "Workflow 2",
            description: "This is the second workflow in the seed data.",
            metadata: [],
            userId: users[0].id,
        },
        {
            name: "Bob's Workflow",
            description:
                "This workflow was created to show the difference between workflows being owned by different people",
            metadata: [],
            userId: users[1].id,
        },
    ];

    const workflows = await Promise.all(
        workflowData.map((w) =>
            prisma.workflowAttributes.create({
                data: {
                    baseAction: {
                        create: {
                            name: w.name,
                            description: w.description,
                            metadata: {
                                create: w.metadata,
                            },
                            permissions: {
                                createMany: {
                                    data: permissionTypes.map(
                                        (permissionType) => ({
                                            userId: w.userId,
                                            permissionType: permissionType,
                                        })
                                    ),
                                },
                            },
                        },
                    },
                },
            })
        )
    );

    /////////////
    // Actions //
    /////////////

    const actionData = [
        {
            name: "Action 1",
            description: "This is the first action in Workflow 1.",
            metadata: [],
            userId: users[0].id,
        },
        {
            name: "Action 2",
            description: "This is the second action in Workflow 1.",
            metadata: [],
            userId: users[0].id,
        },
        {
            name: "Action 3",
            description: "This is the third action in Workflow 1.",
            metadata: [],
            userId: users[0].id,
        },
    ];

    const actions = await Promise.all(
        actionData.map((a) =>
            prisma.action.create({
                data: {
                    name: a.name,
                    description: a.description,
                    metadata: {
                        create: a.metadata,
                    },
                    permissions: {
                        createMany: {
                            data: permissionTypes.map((permissionType) => ({
                                userId: a.userId,
                                permissionType: permissionType,
                            })),
                        },
                    },
                },
            })
        )
    );

    ///////////////////
    // Relationships //
    ///////////////////
    await prisma.workflowAttributes.update({
        where: { id: workflows[0].id },
        data: {
            rootAction: { connect: { id: actions[0].id } },
        },
    });

    await prisma.action.update({
        where: { id: actions[0].id },
        data: {
            nextAction: { connect: { id: actions[1].id } },
        },
    });

    await prisma.action.update({
        where: { id: actions[1].id },
        data: {
            nextAction: { connect: { id: actions[2].id } },
        },
    });

    // // Add workflow state
    // const workflowState = await prisma.workflowStates.create({
    //     data: {
    //         user_id: user.id,
    //         workflow_id: workflow.id,
    //     },
    // });

    // // Add action state
    // await prisma.actionStates.create({
    //     data: {
    //         workflow_state_id: workflowState.id,
    //         action_id: action.id,
    //         state_type: 'not_started',
    //         index: 0,
    //     },
    // });

    console.log("🌱 Seed data created successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
