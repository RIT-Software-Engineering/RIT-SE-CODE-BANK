const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

// GET /state
router.get('/', async (req, res) => {
  const { stateId, userId, workflowId, tags } = req.query;

  if (stateId) {
    return res.json(await prisma.state.findUnique({ where: { id: stateId } }));
  }

  const states = await prisma.state.findMany({
    where: {
      userId: userId || undefined,
      workflowId: workflowId || undefined,
      // Implement tag logic if tags stored in metadata
    }
  });

  res.json(states);
});

// POST /state
router.post('/', async (req, res) => {
  const { workflowId, positionIndex } = req.body;

  const state = await prisma.state.create({
    data: {
      id: crypto.randomUUID(),
      workflowId,
      positionIndex
    }
  });

  res.json({ stateId: state.id });
});

// PUT /state/:stateId
router.put('/:stateId', async (req, res) => {
  const { workflowId, positionIndex } = req.body;
  const { stateId } = req.params;

  const updated = await prisma.state.update({
    where: { id: stateId },
    data: { workflowId, positionIndex }
  });

  res.json(updated);
});

// DELETE /state/:stateId
router.delete('/:stateId', async (req, res) => {
  const { stateId } = req.params;
  await prisma.state.delete({ where: { id: stateId } });
  res.status(204).send();
});

module.exports = router;