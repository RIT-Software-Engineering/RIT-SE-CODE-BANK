const { permissionTypes } = require("../api/consts");
const { PrismaClient, StateType } = require("@prisma/client");
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
    //     userData.map((u) => prisma.user.upsert({
    //         where: { ...u },
    //         create: { ...u },
    //         update: { ...u}
    //     }))
    // );

    const users = Array.from({ length: 10 }, (_, i) => ({ id: (i + 1).toString() }));

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

    //////////////////////////
    // Onboarding Demo Data //
    //////////////////////////
    const onboardingWorkflowData = {
        name: "Onboarding Workflow",
        description: "Proof of concept demo for an admin walking through an onboarding process",
        metadata: [],
        userId: "1",
    };

    const onboardingWorkflow = await prisma.workflowAttributes.create({
        data: {
            baseAction: {
                create: {
                    name: onboardingWorkflowData.name,
                    description: onboardingWorkflowData.description,
                    metadata: {
                        create: onboardingWorkflowData.metadata,
                    },
                    permissions: {
                        createMany: {
                            data: permissionTypes.map((permissionType) => ({
                                userId: onboardingWorkflowData.userId,
                                permissionType: permissionType,
                            })),
                        },
                    },
                },
            },
        },
    });

    console.log("Created onboardingWorkflow with ID:", onboardingWorkflow.id);

    const onboardingActionsData = [
        {
            name: "Review Applications",
            description: "Review pending student applications and accept or reject students.",
            metadata: [],
            userId: "1",
        },
        {
            name: "Upload Students CSV and View Employees",
            description: "Upload additional CSV file of new hires and verify current employees.",
            metadata: [],
            userId: "1",
        },
        {
            name: "Create and Assign Teams",
            description: "Assign students to teams, new or existing.",
            metadata: [],
            userId: "1",
        },
        {
            name: "Create and Assign Projects",
            description: "Assign projects to teams, new or existing.",
            metadata: [],
            userId: "1",
        },
        {
            name: "Start Semester",
            description: "Kick off the semester officially!",
            metadata: [],
            userId: "1",
        },

    ];

    const onboardingActions = await Promise.all(
        onboardingActionsData.map((action) =>
            prisma.action.create({
                data: {
                    name: action.name,
                    description: action.description,
                    metadata: {
                        create: action.metadata,
                    },
                    permissions: {
                        createMany: {
                            data: permissionTypes.map((permissionType) => ({
                                userId: "1",
                                permissionType: permissionType,
                            })),
                        },
                    },
                },
            })
        )
    );

    const onboardingWorkflowState = await prisma.workflowState.create({
      data: {
        userId: "1",
        workflowId: onboardingWorkflow.id,
      },
    });

    // Seed Action States for each step
    await Promise.all(
      onboardingActions.map((action, index) =>
        prisma.actionState.create({
          data: {
            workflowStateId: onboardingWorkflowState.id,
            actionId: action.id,
            stateType: StateType.notStarted,
            index,
          },
        })
      )
    );

    await prisma.workflowAttributes.update({
        where: { id: onboardingWorkflow.id },
        data: {
            rootAction: { connect: { id: onboardingActions[0].id } },
        },
    });

    for (let i = 0; i < onboardingActions.length - 1; i++) {
        await prisma.action.update({
            where: { id: onboardingActions[i].id },
            data: {
                nextAction: { connect: { id: onboardingActions[i + 1].id } },
            },
        });
    }

    /////////////////////////
    // End Onboarding Demo //
    /////////////////////////

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
