const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

// GET /permissions
router.get('/', async (req, res) => {
  const { permissionId, userId, workflowId, permissionType } = req.query;

  if (permissionId) {
    return res.json(await prisma.permission.findUnique({ where: { id: permissionId } }));
  }

  const permissions = await prisma.permission.findMany({
    where: {
      userId: userId || undefined,
      workflowId: workflowId || undefined,
      permissionType: permissionType || undefined
    }
  });

  res.json(permissions);
});

// POST /permissions
router.post('/', async (req, res) => {
  const { userId, workflowId, permissionType } = req.body;

  const permission = await prisma.permission.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      workflowId,
      permissionType
    }
  });

  res.json(permission);
});

// PUT /permissions/:permissionId
router.put('/:permissionId', async (req, res) => {
  const { permissionId } = req.params;
  const { userId, workflowId, permissionType } = req.body;

  const updated = await prisma.permission.update({
    where: { id: permissionId },
    data: { userId, workflowId, permissionType }
  });

  res.json(updated);
});

// DELETE /permissions/:permissionId
router.delete('/:permissionId', async (req, res) => {
  const { permissionId } = req.params;
  await prisma.permission.delete({ where: { id: permissionId } });
  res.status(204).send();
});

module.exports = router;