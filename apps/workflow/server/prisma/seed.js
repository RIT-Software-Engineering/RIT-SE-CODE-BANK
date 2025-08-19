const { permissionTypes } = require("../api/consts");
const { PrismaClient, StateType } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up existing seed data...");

  await prisma.actionState.deleteMany({});
  await prisma.workflowState.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.metadata.deleteMany({});
  await prisma.referenceEndpoint.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.workflowAttributes.deleteMany({});
  await prisma.action.deleteMany({});

  console.log("Existing seed data deleted.");

  const users = Array.from({ length: 10 }, (_, i) => ({ id: (i + 1).toString() }));

  // Onboarding Demo Workflow
  const onboardingWorkflowData = {
    name: "Onboarding Workflow",
    description: "Proof of concept demo for an admin walking through an onboarding process",
    metadata: [{ key: "tag", value: "demo" }],
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

  // New Scooployee Demo Workflow
  const newScooployeeData = {
    name: "New Scooployee Workflow",
    description: "Proof of concept demo for a new scooployee walking through an onboarding process",
    metadata: [{ key: "tag", value: "demo" }],
    userId: "2",
  };

  const newScooployeeWorkflow = await prisma.workflowAttributes.create({
    data: {
      baseAction: {
        create: {
          name: newScooployeeData.name,
          description: newScooployeeData.description,
          metadata: {
            create: newScooployeeData.metadata,
          },
          permissions: {
            createMany: {
              data: permissionTypes.map((permissionType) => ({
                userId: newScooployeeData.userId,
                permissionType: permissionType,
              })),
            },
          },
        },
      },
    },
  });

  const newScooployeeActionsData = [
    {
      name: "Report Your CO-OP",
      description: "Submit the details of your co-op before getting started.",
      metadata: [],
      userId: "2",
    },
    {
      name: "Join The Slack",
      description: "Join the RIT SCOOP slack to get communications from your team members.",
      metadata: [],
      userId: "2",
    },
    {
      name: "Join The GitHub",
      description: "Join the RIT shared apps GitHub to start contributing.",
      metadata: [],
      userId: "2",
    },
    {
      name: "Submit Your CO-OP Work Report",
      description: "At the end of the term, fill out your report of your co-op experience.",
      metadata: [],
      userId: "2",
    },
  ];

  const newScooployeeActions = await Promise.all(
    newScooployeeActionsData.map((action) =>
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
                userId: "2",
                permissionType: permissionType,
              })),
            },
          },
        },
      })
    )
  );

  const newScooployeeWorkflowState = await prisma.workflowState.create({
    data: {
      userId: "2",
      workflowId: newScooployeeWorkflow.id,
    },
  });

  await Promise.all(
    newScooployeeActions.map((action, index) =>
      prisma.actionState.create({
        data: {
          workflowStateId: newScooployeeWorkflowState.id,
          actionId: action.id,
          stateType: StateType.notStarted,
          index,
        },
      })
    )
  );

  await prisma.workflowAttributes.update({
    where: { id: newScooployeeWorkflow.id },
    data: {
      rootAction: { connect: { id: newScooployeeActions[0].id } },
    },
  });

  for (let i = 0; i < newScooployeeActions.length - 1; i++) {
    await prisma.action.update({
      where: { id: newScooployeeActions[i].id },
      data: {
        nextAction: { connect: { id: newScooployeeActions[i + 1].id } },
      },
    });
  }

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
