const { permissionTypes } = require("../api/consts");
const { importMetadata } = require("../api/helpers/metadata");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Create a workflow with the workflowData provided.
 *
 * @param {Object} workflowData
 * @returns An Object representing the workflow created
 */
async function createWorkflow(workflowData) {
  const baseActionData = {};

  // required
  baseActionData.name = workflowData.name;

  // optional
  if (workflowData.description)
    baseActionData.description = workflowData.description;
  if (workflowData.isFrozen) data.isFrozen = workflowData.isFrozen;
  if (workflowData.metadata) {
    baseActionData.metadata = {
      create: importMetadata(workflowData.metadata),
    };
  }
  if (workflowData.previousActionId) {
    baseActionData.previousAction = {
      connect: { id: workflowData.previousActionId },
    };
  }
  if (workflowData.parentActionId) {
    baseActionData.parentAction = {
      connect: { id: workflowData.parentActionId },
    };
  }

  let workflow;

  await prisma.$transaction(async () => {
    // Create the workflow
    workflow = await prisma.workflowAttributes.create({
      data: {
        baseAction: {
          create: {
            ...baseActionData,
            actionType: "workflow",
            permissions: {
              createMany: {
                data: permissionTypes.map((permissionType) => ({
                  userId: workflowData.userId,
                  permissionType: permissionType,
                })),
              },
            },
          },
        },
      },
    });

    // Create any actions in this workflow
    if (workflowData.actions?.length > 0) {
      let lastActionId = null;

      for (let i = 0; i < workflowData.actions.length; i++) {
        const actionData = workflowData.actions[i];

        lastActionId
          ? (actionData.previousActionId = lastActionId)
          : (actionData.rootActionOfId = workflow.id);

        const action = await createAction(actionData);
        lastActionId = action.id;
      }
    }
  });

  return workflow;
}

/**
 * Create an action with the actionData provided.
 *
 * @param {Object} actionData
 * @returns An Object representing the action created
 */
async function createAction(actionData) {
  // For workflow base actions
  if (actionData.actionType && actionData.actionType === "workflow") {
    // Create a workflow and return the base action as the newly create action
    const workflow = await createWorkflow(actionData);
    // throw Error(actionData.previousActionId);
    return await prisma.action.findUnique({
      where: { id: workflow.baseActionId },
    });
  }

  // Get the data used to create the action
  const data = {};

  // required data
  data.name = actionData.name;

  // optional data
  if (actionData.description) data.description = actionData.description;
  if (actionData.form) data.form = actionData.form;
  if (actionData.actionType) data.actionType = actionData.actionType;
  if (actionData.isFrozen) data.isFrozen = actionData.isFrozen;
  if (actionData.metadata) {
    data.metadata = {
      create: importMetadata(actionData.metadata),
    };
  }
  // actions directly in complex/branching actions only
  if (actionData.parentActionId) {
    data.parentAction = { connect: { id: actionData.parentActionId } };
  }
  // actions directly in workflows only
  if (actionData.previousActionId) {
    data.previousAction = { connect: { id: actionData.previousActionId } };
  }
  if (actionData.rootActionOfId) {
    data.rootActionOf = { connect: { id: actionData.rootActionOfId } };
  }

  let action;

  await prisma.$transaction(async () => {
    // Create the data on the database using prisma
    action = await prisma.action.create({
      data: data,
    });

    // Create any child actions for this action
    if (actionData.childActions?.length > 0) {
      for (let i = 0; i < actionData.childActions.length; i++) {
        const childAction = actionData.childActions[i];
        childAction.parentActionId = action.id;

        await createAction(childAction);
      }
    }
  });

  return action;
}

async function main() {

  if (process.env.NODE_ENV === "production") {
    throw Error(
      "This action should only be used in development for populating the database with test data."
    );
  }

  ///////////
  // Users //
  ///////////

  const users = Array.from({ length: 10 }, (_, i) => ({
    id: `user${(i + 1).toString()}`,
  }));

  ///////////////
  // Workflows //
  ///////////////

  const workflowData = [
    {
      name: "Empty Workflow",
      description: "This is a workflow with no root action.",
      userId: users[0].id,
    },
    {
      name: "Workflow with three actions",
      description:
        "A workflow that points to a root action, which is then connected to 2 other actions in sequence.",
      userId: users[0].id,
      actions: [
        {
          name: "Action 1",
          description: "This is the first action in this workflow.",
          metadata: {
            key: "value",
          },
        },
        {
          name: "Action 2",
          description: "This is the second action in this workflow.",
          metadata: {
            key1: "value1",
            key2: "value2",
            number: 1,
          },
        },
        {
          name: "Action 3",
          description: "This is the third action in this workflow.",
        },
      ],
    },
    {
      name: "User2's Workflow",
      description:
        "This workflow was created to show the difference between workflows being owned by different people",
      userId: users[1].id,
    },
    {
      name: "Workflow with all action types",
      description:
        "A workflow that points to a root action, which is then connected to 3 other actions each with a different actionType.",
      userId: users[0].id,
      actions: [
        {
          name: "Simple action",
          description: "This is the simple action in this workflow.",
          actionType: "simple",
        },
        {
          name: "Complex action",
          description: "This is the complex action in this workflow.",
          actionType: "complex",
          childActions: [
            {
              name: "Complex Action 1",
              description: "This is the first action in this complex action.",
            },
            {
              name: "Complex Action 2",
              description: "This is the second action in this complex action.",
            },
            {
              name: "Complex Action 3",
              description: "This is the third action in this complex action.",
            },
          ],
        },
        {
          name: "Branching action",
          description: "This is the branching action in this workflow.",
          actionType: "branching",
          childActions: [
            {
              name: "Branching Action 1",
              description: "This is the first action in this branching action.",
            },
            {
              name: "Branching Action 2",
              description:
                "This is the second action in this branching action.",
            },
            {
              name: "Branching Action 3",
              description: "This is the third action in this branching action.",
            },
          ],
        },
        {
          name: "Workflow action",
          description: "This is the workflow action in this workflow.",
          actionType: "workflow",
          userId: users[0].id,
          actions: [
            {
              name: "Action 1",
              description: "This is the first action in this workflow.",
            },
            {
              name: "Action 2",
              description: "This is the second action in this workflow.",
            },
            {
              name: "Action 3",
              description: "This is the third action in this workflow.",
            },
          ],
        },
      ],
    },
    {
      name: "Workflow with deep nesting complex actions",
      description:
        "A workflow that contains complex actions where some contain further complex actions.",
      userId: users[0].id,
      actions: [
        {
          name: "Complex action 1",
          description: "This is the simple action in this workflow.",
          actionType: "complex",
          childActions: [
            {
              name: "Complex Action 1",
              description: "This is the first action in this complex action.",
            },
            {
              name: "Complex Action 2",
              description: "This is the second action in this complex action.",
            },
            {
              name: "Complex Action 3",
              description: "This is the third action in this complex action.",
            },
          ],
        },
        {
          name: "Complex action 2",
          description: "This is the complex action in this workflow.",
          actionType: "complex",
          childActions: [
            {
              name: "Complex action 1",
              description: "This is the complex action in this workflow.",
              actionType: "complex",
              childActions: [
                {
                  name: "Complex Action 1.1",
                  description:
                    "This is the first action in this complex action.",
                },
                {
                  name: "Complex Action 1.2",
                  description:
                    "This is the second action in this complex action.",
                },
                {
                  name: "Complex Action 1.3",
                  description:
                    "This is the third action in this complex action.",
                },
              ],
            },
            {
              name: "Complex action 2",
              description: "This is the complex action in this workflow.",
              actionType: "complex",
              childActions: [
                {
                  name: "Complex Action 2.1",
                  description:
                    "This is the first action in this complex action.",
                },
                {
                  name: "Complex Action 2.2",
                  description:
                    "This is the second action in this complex action.",
                },
                {
                  name: "Complex Action 2.3",
                  description:
                    "This is the third action in this complex action.",
                },
              ],
            },
            {
              name: "Complex action 3",
              description: "This is the complex action in this workflow.",
              actionType: "complex",
              childActions: [
                {
                  name: "Complex Action 3.1",
                  description:
                    "This is the first action in this complex action.",
                },
                {
                  name: "Complex Action 3.2",
                  description:
                    "This is the second action in this complex action.",
                },
                {
                  name: "Complex Action 3.3",
                  description:
                    "This is the third action in this complex action.",
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  // Create all workflows from workflowData
  await Promise.all(
    workflowData.map(async (w) => {
      // Create the workflow
      await createWorkflow(w);
    })
  );


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
