const { permissionTypes } = require("../api/consts");
const { importMetadata } = require("../api/helpers/metadata");
const { PrismaClient } = require("@prisma/client");
const { connect } = require("../api/routes/workflows");
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
  if (workflowData.metadata) {
    baseActionData.metadata = {
      create: importMetadata(workflowData.metadata),
    };
  }

  // Create the workflow
  return await prisma.workflowAttributes.create({
    data: {
      baseAction: {
        create: {
          ...baseActionData,
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
}

/**
 * Create an action with the actionData provided.
 *
 * @param {Object} actionData
 * @returns An Object representing the action created
 */
async function createAction(actionData) {
  // Get the data used to create the action
  const data = {};

  // required data
  data.name = actionData.name;

  // optional data
  if (actionData.description) data.description = actionData.description;
  if (actionData.form) data.form = actionData.form;
  if (actionData.actionType) data.actionType = actionData.actionType;
  if (actionData.isFrozen) data.isFrozen = actionData.isFrozen;
  if (actionData.previousActionId) {
    data.previousAction = { connect: { id: actionData.previousActionId } };
  }
  if (actionData.workflowId) {
    data.rootActionOf = { connect: { id: actionData.workflowId } };
  }
  if (actionData.metadata) {
    data.metadata = {
      create: importMetadata(actionData.metadata),
    };
  }

  // Create the data on the database using prisma
  return await prisma.action.create({
    data: data,
  });
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
      workflowStates: [{ userId: users[1].id }],
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
      workflowStates: [
        {
          userId: users[1].id, // User2
          actionStates: [
            { stateType: "notStarted" },
            { stateType: "notStarted" },
            { stateType: "notStarted" },
          ],
        },
        {
          userId: users[2].id, // User3
          actionStates: [
            { stateType: "completed" },
            { stateType: "notStarted" },
            { stateType: "notStarted" },
          ],
        },
        {
          userId: users[3].id, // User4
          actionStates: [
            { stateType: "completed" },
            { stateType: "completed" },
            { stateType: "completed" },
          ],
        },
      ],
    },
    {
      name: "User2's Workflow",
      description:
        "This workflow was created to show the difference between workflows being owned by different people",
      userId: users[1].id,
    },
  ];

  // Create all workflows from workflowData
  await Promise.all(
    workflowData.map(async (w) => {
      // Create the workflow
      const workflow = await createWorkflow(w);

      // Store the actions for linking actions and referencing for states
      const actionIds = [];

      // Create all of the actions in the workflow
      if (w.actions?.length > 0) {
        for (let i = 0; i < w.actions.length; i++) {
          const actionData = { ...w.actions[i] }; // copy data from the list of actions

          // Determine how to connect the action to the workflow based on it's possition
          if (actionIds.length > 0) {
            actionData.previousActionId = actionIds.at(-1); // last action
          } else {
            actionData.workflowId = workflow.id;
          }

          // Create the action
          const action = await createAction(actionData);

          // Update previous action
          actionIds.push(action.id);
        }

        // Create all of the state for the workflow
        if (w.workflowStates?.length > 0) {
          await Promise.all(
            w.workflowStates.map(async (ws) => {
              // Create workflow state
              const workflowState = await prisma.workflowState.create({
                data: {
                  workflowId: workflow.id,
                  userId: ws.userId,
                },
              });

              // Create all action states for this workflow state
              for (let i = 0; i < ws.actionStates.length; i++) {
                const as = ws.actionStates[i];

                await prisma.actionState.create({
                  data: {
                    workflowState: { connect: { id: workflowState.id } },
                    action: { connect: { id: actionIds[i] } },
                    stateType: as.stateType,
                    index: i,
                  },
                });
              }
            })
          );
        }
      }
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
