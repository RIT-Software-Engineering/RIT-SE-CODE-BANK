const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getActionChain } = require("../helpers/actions.js");

// GET /states/:id
router.get("/workflow/:id", async (req, res) => {
  const { id } = req.params;

  const state = await prisma.workflowState.findUnique({
    where: { id: id },
    include: {
      actionStates: {
        orderBy: {
          index: "asc",
        },
      },
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
        orderBy: {
          index: "asc",
        },
      },
    },
  });

  res.json(states);
});

/**
 * Recursive function used to create all of the actions and sub actions in a list of actions.
 * 
 * @param {Array<Object>} actions 
 * @param {String} parentActionStateId 
 */
async function createActionStates(actions, parentActionStateId = null) {
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

    const actionState = await prisma.actionState.create({
      data: data
    });

    if (action.childActions?.length > 0) {
      createActions(action.childActions, actionState.id); // Recursively create child actions of the current action
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
      where: { id: workflowId }
    });

    if (!workflow) {
      throw new Error(`Workflow with ID ${workflowId} does not exist.`);
    }

    if (!workflow.rootActionId) {
      throw new Error(`Workflow with ID ${workflowId} has no root action.`);
    }

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

    const actions = await getActionChain(workflow.rootActionId);
    await createActionStates(actions, state.baseActionStateId);
  });

  res.json(state);
});

/**
 * PUT /states/workflow/:id
 *
 * The primary function of this is updating the actionStates based on changes to actions within a workflow.
 */
router.put("/workflow/:id", async (req, res) => {
  const { id } = req.params;

  await prisma.$transaction(async (tx) => {
    // Get the workflowState by id to get the workflow and actionStates
    const workflowState = await tx.workflowState.findUnique({
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
    const actions = await getActionChain(workflowState.workflow.rootActionId);

    // Build maps for easier lookup
    const actionIdSet = new Set(actions.map((a) => a.id));
    const actionStateMap = new Map(
      workflowState.actionStates.map((as) => [as.actionId, as])
    );

    // Delete actionStates for actions that have been removed from the workflow
    for (const actionState of workflowState.actionStates) {
      if (!actionIdSet.has(actionState.actionId)) {
        await tx.actionState.delete({
          where: { id: actionState.id },
        });
      }
    }

    // Upsert actions that are still in or have been added to the workflow
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const existingActionState = actionStateMap.get(action.id);

      if (existingActionState) {
        // Update index if needed, preserve stateType and other fields
        await tx.actionState.update({
          where: { id: existingActionState.id },
          data: { index: i },
        });
      } else {
        // Create new actionState for new action
        await tx.actionState.create({
          data: {
            workflowStateId: id,
            actionId: action.id,
            stateType: "notStarted",
            index: i,
          },
        });
      }
    }

    // Fetch the updated workflowState with actionStates in order
    updatedState = await tx.workflowState.findUnique({
      where: { id: id },
      include: {
        actionStates: {
          orderBy: { index: "asc" },
        },
      },
    });
  });

  res.json(updatedState);
});

// DELETE /states/workflow/:id
router.delete("/workflow/:id", async (req, res) => {
  const { id } = req.params;

  await prisma.workflowState.delete({ where: { id: id } });

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

// GET /states/action
router.get("/action", async (req, res) => {
  const { userId, workflowStateId, actionId, stateType } = req.query;

  const where = {};
  if (userId) where.userId = userId;
  if (workflowStateId) where.workflowStateId = workflowStateId;
  if (actionId) where.actionId = actionId;
  if (stateType) where.stateType = stateType;

  const states = await prisma.actionState.findMany({
    where: where,
    include: {
      action: true,
    },
    orderBy: {
      index: "asc",
    },
  });

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
