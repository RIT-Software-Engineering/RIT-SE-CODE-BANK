const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const { createWorkflowState, getWorkflowStates, updateWorkflowState, deleteWorkflowState, updateActionState } = require('../../controller/states.js');

// GET /state
router.get('/workflow', async (req, res) => {
  const { stateId, userId, workflowId } = req.query;

  const where = {};
  if (stateId) where.id = stateId;
  if (userId) where.user_id = userId;
  if (workflowId) where.workflow_id = workflowId;

  const states = await getWorkflowStates(where);

  res.json(states);
});

// POST /state
router.post('/workflow', async (req, res) => {
  const { userId, workflowId } = req.body;

  console.log("userId:", userId, "workflowId:", workflowId);

  const state = await createWorkflowState(userId, workflowId);
  
  res.json(state)
});

// PUT /state/:stateId
// router.put('/:stateId', async (req, res) => {
//   const { workflowId, positionIndex } = req.body;
//   const { stateId } = req.params;

//   const updated = await prisma.state.update({
//     where: { id: stateId },
//     data: { workflowId, positionIndex }
//   });

//   res.json(updated);
// });

// DELETE /state/:stateId
router.delete('/workflow/:stateId', async (req, res) => {
  const { stateId } = req.params;
  
  await deleteWorkflowState(stateId);

  res.json({ message: 'Deleted' });
});

module.exports = router;