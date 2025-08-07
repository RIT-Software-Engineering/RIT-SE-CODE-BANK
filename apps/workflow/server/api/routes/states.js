const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getFullActionTree } = require("../helpers/actions.js");

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

    // Add any actionStates stemming from the baseActionState as it's children
    const children = await getChildren(
      { parentId: workflowState.baseActionStateId },
      { action: true }
    );
    if (children?.length > 0) {
      workflowState.baseActionState.children = children;
    }

    res.json(workflowState);
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

// TODO: Add endpoints for /state/action to delete if necessary

router.get("/workflow/:workflowStateId/findStep", async (req, res) => {
  const { workflowStateId } = req.params;

  // TODO: ActionStates aren't ordered, and aren't a linked list like Actions, so how do we know which one is first. (right now it's randomized...)
  const states = await prisma.actionState.findFirst({
    where: {
      workflowStateId: workflowStateId,
      stateType: "notStarted",
    },
    include: {
      action: true,
    },
    orderBy: {
      index: "asc",
    },
  });

  res.json(states);
});

function cascadeSubmission(actionState) {
  console.log(actionState);
}

router.post("/handleSubmit", async (req, res) => {
  const { actionStateId } = req.body;

  const validated = true; // TODO: Check to make sure the data is valid and has been transferred back to the client app.

  // If the data was transferred and validated properly, mark the action as complete.
  if (validated) {
    const actionState = await prisma.actionState.update({
      where: { id: actionStateId },
      data: {
        stateType: "completed",
      },
      include: {
        action: true,
      },
    });

    cascadeSubmission(actionState);

    res.status(200).json({ message: "Completed" });
  }

  res.status(500).json({ message: "Something failed" }); // TODO: Provide a better error message.
});

module.exports = router;
