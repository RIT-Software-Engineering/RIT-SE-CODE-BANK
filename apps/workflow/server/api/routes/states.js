const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getFullActionTree } = require("../helpers/actions.js");

// I'm sorry for the chaos that this file is. I tried to leave enough inline comments that you could follow my madness. I'm very short on time.

// TODOs: 
// - Come up with a standard approach to calling all of these recursive methods
// - Figure out what needs to be awaited and what can remain asyncronous
// - Set this up to avoid too much recursion depth causing stack overflow errors (haven't run into one, but should have preventative measures)
// - Optimize
// - Improve readability and organization

/**
 * Recurisve function for collecting all action states branching from a a specific action.
 *
 * @param {*} where
 * @param {*} include
 * @param {*} select
 * @returns
 */
async function getChildren(where, include = null, select = null) {
  // Get the children for the action whose ID matches parentActionId.
  const children = await prisma.actionState.findMany({
    where: where,
    include: include,
    select: select,
    orderBy: {
      index: "asc",
    },
  });

  // Recursively call this function for all of the children
  // and add all found children to their respective parent.
  for (let i = 0; i < children.length; i++) {
    const grandChildren = await getChildren(
      { ...where, parentId: children[i].id },
      include,
      select
    );
    if (grandChildren?.length > 0) {
      children[i].children = grandChildren;
    }
  }

  return children;
}

// GET /states/:id
router.get("/workflow/:id", async (req, res) => {
  const { id } = req.params;

  // Get the workflowState with all action states
  const state = await prisma.workflowState.findUnique({
    where: { id: id },
    include: {
      actionStates: {
        include: { action: true },
        orderBy: { index: 'asc' }
      },
      workflow: true,
    },
  });

  res.json(state);
});

// GET /states/workflow
router.get("/workflow", async (req, res) => {
  const { userId, workflowId } = req.query;

  const where = {};
  if (userId) where.userId = userId;
  if (workflowId) where.workflowId = workflowId;

  const states = await prisma.workflowState.findMany({
    where: where,
    include: {
      actionStates: {
        include: { action: true },
        orderBy: { index: 'asc' }
      },
      workflow: true,
    },
  });

  res.json(states);
});

/**
 * Function for updating an actionState its children's stateTypes.
 *
 * @param {*} actionStateId
 * @returns The ActionState that was updated.
 */
async function updateStateByChildren(actionStateId) {
  // Get the current stateType, actionType, and all child actionState stateTypes.
  const actionState = await prisma.actionState.findUnique({
    where: { id: actionStateId },
    select: {
      stateType: true,
      action: {
        select: {
          actionType: true,
        },
      },
    },
  });
  
  // TODO: After migration, get children using the new parent-child relations
  const children = []; // Temporarily empty until migration is complete

  // Updated stateType
  let newStateType = "notStarted";

  // State machine for determining the new stateType
  currentStateType: switch (actionState.action.actionType) {
    // For workflow and complex actionTypes
    case "workflow":
    case "complex":
      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        // Update the newActionState based on what it currently is, and the stateTypes of it's children
        switch (child.stateType) {
          // newStateType will be completed if all visible children are completed,
          // or inProgress of any of the visible children aren't completed.
          case "completed":
            if (newStateType === "completed" || i === 0) {
              newStateType = "completed";
            } else if (newStateType === "notStarted") {
              newStateType = "inProgress";
              break currentStateType;
            }
            break;

          // newStateType will be inProgress
          case "inProgress":
            newStateType = "inProgress";
            break currentStateType;

          // newStateType will be notStarted if all children were notStarted.
          // Otherwise, newStateType will be inProgress.
          case "notStarted":
            if (newStateType === "completed") {
              newStateType = "inProgress";
              break currentStateType;
            }
            break;

          // Hidden actionStates don't effect parent actionState.
          case "hidden":
            break;

          // If the actionState isn't one of our defined ones.
          default:
            throw Error("Unexpected state type encountered");
        }
      }
      break;

    // For branching actions
    case "branching":
      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        // Update the newActionState based on what it currently is, and the stateTypes of it's children
        switch (child.stateType) {
          // newStateType is completed if any child is completed.
          case "completed":
            newStateType = "completed";
            break currentStateType;

          // newStateType is unless there is another child that is completed.
          case "inProgress":
            newStateType = "inProgress";
            break;

          // newStateType is not affected by a child with these stateTypes.
          case "notStarted":
          case "hidden":
            break;

          // If the actionState isn't one of our defined ones.
          default:
            throw Error("Unexpected state type encountered");
        }
      }
      break;
  }

  // Update the state to what it needs to be
  if (actionState.stateType !== newStateType) {
    await prisma.actionState.update({
      where: { id: actionStateId },
      data: { stateType: newStateType },
    });
  }

  return actionState;
}

/**
 * Creates ActionStates for each action in the given actions array (flattened structure).
 *
 * @param {Array<Object>} actions
 * @param {String} workflowStateId
 * @param {() => void} [dataModifier=() => {}] A function reference for modifying the data object that is passed to the function.
 */
async function createActionStates(
  actions,
  workflowStateId,
  dataModifier = () => {}
) {
  // Flatten the action tree and create ActionStates for all actions
  const flatActions = [];
  
  function flattenActions(actionList, currentIndex = 0) {
    for (const action of actionList) {
      flatActions.push({ ...action, index: currentIndex++ });
      if (action.childActions?.length > 0) {
        currentIndex = flattenActions(action.childActions, currentIndex);
      }
    }
    return currentIndex;
  }
  
  flattenActions(actions);

  for (const action of flatActions) {
    const data = {
      stateType: "notStarted",
      action: { connect: { id: action.id } },
      workflowStates: { connect: [{ id: workflowStateId }] },
      index: action.index,
    };

    dataModifier(data);

    await prisma.actionState.create({
      data: data,
    });
  }
}

// POST /states/workflow
router.post("/workflow", async (req, res) => {
  const { userId, workflowId } = req.body;

  let state;

  await prisma.$transaction(async () => {
    // Ensure the workflow exists before creating a state
    const workflow = await prisma.workflowAttributes.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new Error(`Workflow with ID ${workflowId} does not exist.`);
    }

    if (!workflow.rootActionId) {
      throw new Error(`Workflow with ID ${workflowId} has no root action.`);
    }

    // Create the workflowState first
    state = await prisma.workflowState.create({
      data: {
        userId: userId,
        workflow: { connect: { id: workflowId } },
      },
    });

    // Create ActionState for the base action (workflow action) and connect to WorkflowState
    const baseActionState = await prisma.actionState.create({
      data: {
        stateType: "notStarted",
        action: { connect: { id: workflow.baseActionId } },
        workflowStates: { connect: [{ id: state.id }] },
        index: 0,
      },
    });

    // Update the workflowState to set the baseActionStateId using raw SQL
    // (Prisma doesn't expose scalar fields when they're used in a relation with fields: [...])
    await prisma.$executeRaw`
      UPDATE WorkflowState 
      SET baseActionStateId = ${baseActionState.id} 
      WHERE id = ${state.id}
    `;

    // Get all of the actions in the workflow and create ActionStates for them
    const actions = await getFullActionTree(workflow.rootActionId);
    await createActionStates(actions, state.id);

    // Fetch the complete state with actionStates
    state = await prisma.workflowState.findUnique({
      where: { id: state.id },
      include: {
        actionStates: {
          include: {
            action: true
          }
        }
      }
    });
  });

  res.json(state);
});

/**
 * Helper function used to reorganize a action in a tree into a flat list.
 *
 * @param {*} actions
 * @returns A list of actions
 */
function flattenActions(actions) {
  const actionSet = new Set();
  function recurse(actionList) {
    for (const action of actionList) {
      if (action.childActions && action.childActions.length > 0) {
        const childActions = action.childActions;
        const childActionIds = [];
        for (let i = 0; i < childActions.length; i++) {
          childActionIds.push(childActions[i].id);
        }
        action.childActions = childActionIds;
        actionSet.add(action);
        recurse(childActions);
      } else {
        actionSet.add(action);
      }
    }
  }
  recurse(actions);
  return [...actionSet];
}

/**
 * Helper function used to collect all action states in a tree stemming from one action state
 * and save them in a flat list.
 *
 * @param {*} where
 * @param {*} include
 * @param {*} select
 * @returns A list of actionStates
 */
async function flattenActionStates(where, include = null, select = null) {
  let actionStateList = [];
  // Get the children for the action whose ID matches parentActionId.
  const children = await prisma.actionState.findMany({
    where: where,
    include: include,
    select: select,
    orderBy: {
      index: "asc",
    },
  });

  actionStateList.push(...children);

  // Recursively call this function for all of the children
  // and add all found children to their respective parent.
  for (let i = 0; i < children.length; i++) {
    const grandChildren = await flattenActionStates(
      { ...where, parentId: children[i].id },
      include,
      select
    );
    if (grandChildren?.length > 0) {
      actionStateList.push(...grandChildren);
    }
  }

  return actionStateList;
}

/**
 * PUT /states/workflow/:id
 *
 * The primary function of this is updating the actionStates based on changes to actions within a workflow.
 */
router.put("/workflow/:id", async (req, res) => {
  const { id } = req.params;

  await prisma.$transaction(async () => {
    // Get the workflowState by id to get the workflow and actionStates
    const workflowState = await prisma.workflowState.findUnique({
      where: { id: id },
      include: {
        workflow: true,
        actionStates: true,
      },
    });

    if (!workflowState) {
      throw new Error("Workflow state not found");
    }

    // Get all of the actions from the workflow, in order.
    const actions = await getFullActionTree(
      workflowState.workflow.rootActionId
    );

    // Flatten the list of all actions in the workflow.
    const actionList = flattenActions(structuredClone(actions));

    // Collect a list of all actionSates in the workflowState with all data
    // Get the flat list of all actionStates in the workflowState
    const actionStateList = workflowState.actionStates;

    // Filter out the actionStates that no longer have an associated action
    const actionIds = new Set(actionList.map((a) => a.id));
    const filteredActionStateList = actionStateList.filter((as) =>
      actionIds.has(as.actionId)
    );

    // Map the action ids to the existing action states
    const actionIdToStateMap = new Map(
      filteredActionStateList.map((as) => [as.actionId, as])
    );

    // Delete all of the actionStates in that WorkflowState
    await prisma.actionState.deleteMany({
      where: { workflowStateId: workflowState.id },
    });

    // Build the workflowState back out using specific data (id, stateType) from the map of actions to action states when available
    await createActionStates(
      actions,
      workflowState.id,
      (data) => {
        const map = actionIdToStateMap;

        const actionState = map.get(data.action.connect.id);
        if (actionState) {
          data.id = actionState.id;
          data.stateType = actionState.stateType;
        }
      }
    );

    // Return the updated workflowState
    const updated = await prisma.workflowState.findUnique({
      where: { id: id },
      include: {
        workflow: true,
        actionStates: {
          include: {
            action: true
          }
        },
      },
    });

    res.json(updated);
  });
});

// DELETE /states/workflow/:id
router.delete("/workflow/:id", async (req, res) => {
  const { id } = req.params;

  await prisma.$transaction(async () => {
    const workflowState = await prisma.workflowState.findUnique({
      where: { id: id },
    });

    // Delete all action states for this workflow state
    await prisma.actionState.deleteMany({
      where: { workflowStateId: workflowState.id },
    });
    
    // Delete the workflow state itself
    await prisma.workflowState.delete({
      where: { id: id },
    });
  });

  res.json({ message: "Deleted" });
});

// May not need this
// GET /states/action/:id
router.get("/action/:id", async (req, res) => {
  const { id } = req.params;

  const state = await prisma.actionState.findUnique({
    where: { id: id },
    include: {
      action: true,
      workflowStates: true,
    },
  });

  res.json(state);
});

// What do I really want from this function?
// Should the child actionStates be nested, or should this just be a flat list?
// How do I manage the UserId search and the workflowStateId search
// May not even need this
// GET /states/action
router.get("/action", async (req, res) => {
  const { userId, workflowStateId, actionId, stateType } = req.query;

  const where = {};
  if (userId) where.userId = userId;
  if (actionId) where.actionId = actionId;
  if (stateType) where.stateType = stateType;

  let states;
  if (workflowStateId) {
    // states = await prisma.actionState.findUnique({
    //   where: { ...where, workflowStateId: workflowStateId },
    // });
  } else {
    states = await prisma.actionState.findMany({
      where: where,
      include: {
        action: true,
      },
      orderBy: {
        index: "asc",
      },
    });
  }

  res.json(states);
});

// This may not be necessary
// PUT /states/action/:id
router.put("/action/:id", async (req, res) => {
  const { id } = req.params;
  const { stateType } = req.body;

  const data = {};
  if (stateType) {
    data.stateType = stateType;
  }

  const actionState = await prisma.actionState.update({
    where: { id: id },
    data: data,
  });

  res.json(actionState);
});

async function findFirstSimpleIncomplete(actionStateId) {
  const actionState = await prisma.actionState.findUnique({
    where: {
      id: actionStateId,
    },
    include: {
      action: true,
    },
  });

  if (
    actionState.stateType === "completed" ||
    actionState.stateType === "hidden"
  ) {
    return null;
  } else {
    if (actionState.action.actionType === "simple") {
      return actionState;
    } else {
      const firstIncompleteChild = await prisma.actionState.findFirst({
        select: { id: true },
        where: {
          parentId: actionStateId,
          stateType: { notIn: ["completed", "hidden"] },
        },
        orderBy: { index: "asc" },
      });
      if (!firstIncompleteChild) return null;
      return await findFirstSimpleIncomplete(firstIncompleteChild.id);
    }
  }
}

/**
 * An endpoint that takes you to the first step in the workflow that isn't completed or hidden.
 * If this is a complex action or a branching action, it stops at that level.
 */
router.get("/workflow/:workflowStateId/findStep", async (req, res) => {
  const { workflowStateId } = req.params;

  const workflowState = await prisma.workflowState.findUnique({
    where: { id: workflowStateId },
  });

  // Find the first incomplete simple action in the workflow state
  const step = await prisma.actionState.findFirst({
    where: {
      workflowStateId: workflowStateId,
      stateType: { notIn: ["completed", "hidden"] },
    },
    include: {
      action: true,
    },
    orderBy: { index: "asc" },
  });

  res.json(step);
});

/**
 * Calls updateStateByChildren recursively for the ActionState associated
 * with the passed actionStateId, and all of the parenting ActionStates.
 *
 * @param {*} actionStateId
 */
async function cascadeSubmission(actionStateId) {
  await prisma.$transaction(async () => {
    const actionState = await updateStateByChildren(actionStateId);

    // Cascade status updates upward
    if (actionState.parentId) await cascadeSubmission(actionState.parentId);
  });
}

/**
 * Update the state of actions to start progress.
 */
router.post("/handleStart", async (req, res) => {
  const { actionStateId } = req.body;

  // Find the action state and check if it can be started
  const actionState = await prisma.actionState.findUnique({
    where: { id: actionStateId },
    include: {
      action: true,
    },
  });

  if (!actionState) {
    return res.status(404).json({
      message: "Action state not found.",
    });
  }

  if (actionState.stateType !== "notStarted") {
    return res.status(400).json({
      message: "Action can only be started from notStarted state.",
    });
  }

  // Update the action state to inProgress
  await prisma.$transaction(async () => {
    await prisma.actionState.update({
      where: { id: actionStateId },
      data: {
        stateType: "inProgress",
      },
    });

    // For complex actions, we might want to cascade the status upward as well
    if (actionState.parentId) {
      await cascadeSubmission(actionState.parentId);
    }

    res.status(200).json({ message: "Started" });
  });
});

/**
 * Update the state of actions to track progress.
 */
router.post("/handleSubmit", async (req, res) => {
  const { actionStateId } = req.body;

  // Find the type of the action, and determine whether or not it can be completed this way.
  const actionState = await prisma.actionState.findUnique({
    where: { id: actionStateId },
    select: {
      action: {
        select: {
          actionType: true,
        },
      },
    },
  });
  
  // For now, allow complex actions to be completed manually
  // TODO: After migration, add proper child checking logic
  if (actionState.action.actionType === "complex") {
    // Allow complex actions to be completed for now
    // Will be enhanced after migration adds parent-child relationships
  }

  // If the action can be completed, complete the action and cascade the status updates
  await prisma.$transaction(async () => {
    const actionState = await prisma.actionState.update({
      where: { id: actionStateId },
      data: {
        stateType: "completed",
      },
      include: {
        action: true,
      },
    });

    // Cascade status updates upward
    if (actionState.parentId) await cascadeSubmission(actionState.parentId);

    res.status(200).json({ message: "Completed" });
  });
});

module.exports = router;
