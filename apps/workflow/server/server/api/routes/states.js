const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getActionChain } = require("../helpers/actions.js");

// GET /states/:id
router.get('/workflow/:id', async (req, res) => {
  const { id } = req.params;

  const state = await prisma.workflowStates.findUnique({
    where: { id: id },
    include: {
      action_states: {
        orderBy: {
          index: 'asc'
        }
      }
    }
  });

  res.json(state);
})

// GET /states/workflow
router.get('/workflow', async (req, res) => {
  const { userId, workflowId } = req.query;

  const where = {};
  if (userId) where.user_id = userId;
  if (workflowId) where.workflow_id = workflowId;

  const states = await prisma.workflowStates.findMany({
    where: where,
    include: {
      action_states: {
        orderBy: {
          index: 'asc'
        }
      }
    }
  });

  res.json(states);
});

// POST /states/workflow
router.post('/workflow', async (req, res) => {
  const { userId, workflowId } = req.body;

  let state;

  await prisma.$transaction(async () => {
    // Ensure the workflow exists before creating a state
    const workflow = await prisma.workflowAttributes.findUnique({
      where: { id: workflowId },
      include: {
        root_action: true,
      }
    });

    if (!workflow) {
      throw new Error(`Workflow with ID ${workflowId} does not exist.`);
    }

    if (!workflow.root_action) {
      throw new Error(`Workflow with ID ${workflowId} has no root action.`);
    }

    state = await prisma.workflowStates.create({
      data: {
        user_id: userId,
        workflow: { connect: { id: workflowId } },
      }
    });

    const actions = await getActionChain(workflow.root_action.id);
    for (let i = 0; i < actions.length; i++) {
      await prisma.actionStates.create({
        data: {
          state_type: 'not_started',
          workflow_state: { connect: { id: state.id } },
          action: { connect: { id: actions[i].id } },
          index: i
        }
      });
    }
  });

  res.json(state)
});

/**
 * PUT /states/workflow/:id
 * 
 * The primary function of this is updating the action_states based on changes to actions within a workflow.
 */
router.put('/workflow/:id', async (req, res) => {
  const { id } = req.params;

  await prisma.$transaction(async (tx) => {
    // Get the workflowState by id to get the workflow and actionStates
    const workflowState = await tx.workflowStates.findUnique({
      where: { id: id },
      include: {
        workflow: true,
        action_states: true,
      }
    });

    if (!workflowState) {
      throw new Error('Workflow state not found');
    }

    // Get all of the actions from the workflow, in order.
    const actions = await getActionChain(workflowState.workflow.root_action_id);

    // Build maps for easier lookup
    const actionIdSet = new Set(actions.map(a => a.id));
    const actionStateMap = new Map(workflowState.action_states.map(as => [as.action_id, as]));

    // Delete actionStates for actions that have been removed from the workflow
    for (const actionState of workflowState.action_states) {
      if (!actionIdSet.has(actionState.action_id)) {
        await tx.actionStates.delete({
          where: { id: actionState.id }
        });
      }
    }

    // Upsert actions that are still in or have been added to the workflow
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const existingActionState = actionStateMap.get(action.id);

      if (existingActionState) {
        // Update index if needed, preserve state_type and other fields
        await tx.actionStates.update({
          where: { id: existingActionState.id },
          data: { index: i }
        });
      } else {
        // Create new actionState for new action
        await tx.actionStates.create({
          data: {
            workflow_state_id: id,
            action_id: action.id,
            state_type: 'not_started',
            index: i
          }
        });
      }
    }

    // Fetch the updated workflowState with action_states in order
    updatedState = await tx.workflowStates.findUnique({
      where: { id: id },
      include: {
        action_states: {
          orderBy: { index: 'asc' }
        }
      }
    });
  });

  res.json({ message: 'Updated' });
});

// DELETE /states/workflow/:id
router.delete('/workflow/:id', async (req, res) => {
  const { id } = req.params;

  await prisma.workflowStates.delete({ where: { id: id } });

  res.json({ message: 'Deleted' });
});

// GET /states/action/:id
router.get('/action/:id', async (req, res) => {
  const { id } = req.params;

  const state = await prisma.actionStates.findUnique({
    where: { id: id },
    include: {
      action: true
    }
  });

  res.json(state);
})

// GET /states/action
router.get('/action', async (req, res) => {
  const { userId, workflowStateId, actionId, stateType } = req.query;

  const where = {};
  if (userId) where.user_id = userId;
  if (workflowStateId) where.workflow_state_id = workflowStateId;
  if (actionId) where.action_id = actionId;
  if (stateType) where.state_type = stateType;

  const states = await prisma.actionStates.findMany({
    where: where,
    include: {
      action: true
    },
    orderBy: {
      index: 'asc'
    }
  });

  res.json(states);
});

// PUT /states/action/:id
router.put('/action/:id', async (req, res) => {
  const { id } = req.params;
  const { stateType } = req.body;

  const data = {};
  if (stateType) { data.state_type = stateType };

  await prisma.actionStates.update({
    where: { id: id },
    data: data
  });

  res.json({ message: 'Updated' });
})

// TODO: Add endpoints for /state/action to delete if necessary

router.get('/workflow/:workflowStateId/findStep', async (req, res) => {
  const { workflowStateId} = req.params;

  // TODO: ActionStates aren't ordered, and aren't a linked list like Actions, so how do we know which one is first. (right now it's randomized...)
  const states = await prisma.actionStates.findFirst({
    where: {
      workflow_state_id: workflowStateId,
      state_type: 'not_started',
    },
    include: {
      action: true
    },
    orderBy: {
      index: 'asc'
    }
  });

  res.json(states);
})

router.post('/handleSubmit', async (req, res) => {
  const { actionStateId } = req.body;

  const validated = true; // TODO: Check to make sure the data is valid and has been transferred back to the client app.

  // If the data was transferred and validated properly, mark the action as complete.
  if (validated) {
    await prisma.actionStates.update({
      where: { id: actionStateId },
      data: {
        state_type: "completed"
      }
    });

    res.status(200).json({ message: "Completed" });
  }

  res.status(500).json({ message: "Something failed" }); // TODO: Provided a better error message.
})

module.exports = router;