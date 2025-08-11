const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getFullActionTree } = require("../helpers/actions.js");

// I'm sorry for the chaos that this file is. I tried to leave enough inline comments that you could follow my madness. I'm very short on time.

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

  // Get the workflowState
  const state = await prisma.workflowState.findUnique({
    where: { id: id },
    include: {
      baseActionState: true,
    },
  });

  // Add any actionStates stemming from the baseActionState as it's children
  const children = await getChildren(
    { parentId: state.baseActionStateId },
    { action: true }
  );
  if (children?.length > 0) {
    state.baseActionState.children = children;
  }

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
      baseActionState: true,
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
      parentId: true,
      stateType: true,
      children: {
        select: {
          stateType: true,
        },
      },
      action: {
        select: {
          actionType: true,
        },
      },
    },
  });

  // Updated stateType
  let newStateType = "notStarted";

  // State machine for determining the new stateType
  currentStateType: switch (actionState.action.actionType) {
    // For workflow and complex actionTypes
    case "workflow":
    case "complex":
      for (let i = 0; i < actionState.children.length; i++) {
        const child = actionState.children[i];

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
      for (let i = 0; i < actionState.children.length; i++) {
        const child = actionState.children[i];

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
 * Recursive function used to create state for all of the actions and sub actions in a list of actions.
 *
 * @param {Array<Object>} actions
 * @param {String} parentActionStateId
 * @param {() => void} [dataModifier=() => {}] A function reference for modifying the data object that is passed to the function.
 */
async function createActionStates(
  actions,
  parentActionStateId = null,
  dataModifier = () => {}
) {
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    const data = {
      stateType: "notStarted",
      action: { connect: { id: action.id } },
      index: i,
    };
    if (parentActionStateId) {
      data.parent = { connect: { id: parentActionStateId } };
    }

    dataModifier(data);

    const actionState = await prisma.actionState.create({
      data: data,
    });

    if (action.childActions?.length > 0) {
      await createActionStates(
        action.childActions,
        actionState.id,
        dataModifier
      ); // Recursively create child actions of the current action
    }
  }
  await updateStateByChildren(parentActionStateId);
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

    // Create the workflowState
    state = await prisma.workflowState.create({
      data: {
        userId: userId,
        workflow: { connect: { id: workflowId } },
        baseActionState: {
          create: {
            stateType: "notStarted",
            action: { connect: { id: workflow.baseActionId } },
            index: 0,
          },
        },
      },
    });

    // Get all of the actions in the workflow and create ActionStates for them
    const actions = await getFullActionTree(workflow.rootActionId);
    await createActionStates(actions, state.baseActionStateId);
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

  // TODO: Figure out how to make sure that the state of actions with children are adjusted accordingly.

  await prisma.$transaction(async () => {
    // Get the workflowState by id to get the workflow and actionStates
    const workflowState = await prisma.workflowState.findUnique({
      where: { id: id },
      include: {
        workflow: true,
        baseActionState: true,
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
    // Flatten the list of all actionStates in the workflowState
    const actionStateList = await flattenActionStates({
      parentId: workflowState.baseActionStateId,
    });

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
      where: { parentId: workflowState.baseActionStateId },
    });

    // Build the workflowState back out using specific data (id, stateType) from the map of actions to action states when available
    await createActionStates(
      actions,
      workflowState.baseActionStateId,
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
        baseActionState: true,
      },
    });

    // Add any actionStates stemming from the baseActionState as it's children
    const children = await getChildren(
      { parentId: updated.baseActionStateId },
      { action: true }
    );
    if (children?.length > 0) {
      updated.baseActionState.children = children;
    }

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

    await prisma.actionState.delete({
      where: { id: workflowState.baseActionStateId },
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

  const step = await findFirstSimpleIncomplete(workflowState.baseActionStateId);

  console.log(step);

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
  if (actionState.action.actionType !== "simple") {
    return res.status(400).json({
      message: "This action will only be completed by completing sub actions.",
    });
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
