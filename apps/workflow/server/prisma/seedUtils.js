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
  if (workflowData.rootActionOfId)
    baseActionData.rootActionOf = { connect: { id: workflowData.rootActionOfId } };
  if (workflowData.isFrozen) data.isFrozen = workflowData.isFrozen;
  if (workflowData.metadata) {
    let safeMetadata = {}
    Object.entries(workflowData.metadata).forEach(([key, value]) => {
      safeMetadata[key] = JSON.stringify(value)
    })
    baseActionData.metadata = {
      create: importMetadata(safeMetadata),
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
  let tags;
  if (workflowData.tags) {
    tags = {
      // Add/re-add them
      connectOrCreate: workflowData.tags.map((name) => ({
        where: { name },
        create: { name },
      })),
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
        tags: tags
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
        const workflow = await createWorkflow({ ...actionData, rootActionOfId: actionData.rootActionOfId });
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
        let safeMetadata = {}
        Object.entries(actionData.metadata).forEach(([key, value]) => {
          safeMetadata[key] = JSON.stringify(value)
        })
        data.metadata = {
          create: importMetadata(safeMetadata),
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

module.exports = {
    createWorkflow
}