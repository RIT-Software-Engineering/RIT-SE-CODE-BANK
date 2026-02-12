const { PrismaClient } = require("@prisma/client");
const { importMetadata } = require("../api/helpers/metadata");
const { permissionTypes } = require("../api/consts");
const prisma = new PrismaClient();

/**
 * Delete all the data in the workflows database
 */

async function deleteWorkflows() {
    await prisma.action.deleteMany({});
    await prisma.actionState.deleteMany({});
    await prisma.workflowState.deleteMany({});
    await prisma.metadata.deleteMany({});
    await prisma.permission.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.workflowStateParticipant.deleteMany({});
    await prisma.workflowAttributes.deleteMany({});
}

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


/**
 * Main function
 */
async function main() {
  await deleteWorkflows();

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
      name: "Create course",
      description:
        "A workflow that points to a complex action.",
      actionType: "workflow",
      userId: users[0].id,
      actions: [
        {
          name: "Complex",
          description: "This is the first action in this workflow.",
          actionType: "complex",
          childActions: [
            {
              name: "Course Initialization",
              description: "This is the first action in this complex action.",
              actionType: "workflow",
              userId: users[0].id,
              actions: [
                {
                  name: "Choose Template",
                  description: "The user needs to choose a template (or start from scratch)",
                  actionType: "simple",
                  metadata: {
                    key: "TEM", 
                  }
                },
                {
                  name: "Fill in Details",
                  description: "The user enters the details for the course",
                  actionType: "simple",
                  metadata: {
                    key: "DET"
                  }
                }
              ]
            },
            {
              name: "Upload Syllabus",
              description: "This is where the user uploads the syllabus.",
              metadata: {
                key: "SYL"
              }
            },
          ],
          metadata: {
            key: "value",
          },
        }
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

/**
 * Call main function
 */
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


