const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getActionChain } = require("../helpers/actions.js");

// Note: These endpoints are untested and incomplete (we will need to fix these up later).

// GET /states/:id
router.get('/workflow/:id', async (req, res) => {
  const { id } = req.params;

  const state = await prisma.workflowStates.findUnique({
    where: { id: id },
    include: {
      action_states: true
    }
  });

  res.json(state);
})

// GET /states/workflow
router.get('/workflow', async (req, res) => {
  const { id, userId, workflowId } = req.query;

  const where = {};
  if (id) where.id = id;
  if (userId) where.user_id = userId;
  if (workflowId) where.workflow_id = workflowId;

  const states = await prisma.workflowStates.findMany({
    where: where,
    include: {
      action_states: true
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
    for (const action of actions) {
      await prisma.actionStates.create({
        data: {
          state_type: 'not_started',
          workflow_state: { connect: { id: state.id } },
          action: { connect: { id: action.id } }
        }
      });
    }

  });

  res.json(state)
});

// TODO: Figure out this implementation
// PUT /states/workflow/:id
// router.put('workflow/:id', async (req, res) => {
//   const { workflowId, positionIndex } = req.body;
//   const { id } = req.params;

// remove action states that are no longer in the workflow
// reorder action states if the order has changed
// add new action states if the workflow has changed

//   const updated = await prisma.state.update({
//     where: { id: id },
//     data: { workflowId, positionIndex }
//   });

//   res.json(updated);
// });

// DELETE /states/workflow/:id
router.delete('/workflow/:id', async (req, res) => {
  const { id } = req.params;

  await prisma.workflowStates.delete({ where: { id: id } });

  res.json({ message: 'Deleted' });
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

// TODO: Add endpoints for /state/action to have read, create, and delete if necessary

module.exports = router;