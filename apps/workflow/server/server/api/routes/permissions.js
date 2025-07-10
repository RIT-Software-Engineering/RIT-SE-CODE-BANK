const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { permissionTypes } = require('../consts.js') || [];

// Helper function
function validatePermissionType(permissionType) {
  if (!permissionTypes.includes(permissionType)) {
    throw new Error(`Invalid permission type: ${permissionType}. Valid types are: ${permissionTypes.join(', ')}`);
  }
}

// GET /permissions/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const permissions = await prisma.permissions.findUnique({
    where: {id: id},
  });

  res.json(permissions);
})

// GET /permissions
router.get('/', async (req, res) => {
  const { userId, actionId, permissionType } = req.query;

  const where = {};
  if (userId) { where.user_id = userId; }
  if (actionId) { where.action_id = actionId; }
  if (permissionType) {
    validatePermissionType(permissionType);
    where.permission_type = permissionType;
  };

  const permissions = await prisma.permissions.findMany({
    where: where,
  });

  res.json(permissions);
});

// POST /permissions
router.post('/', async (req, res) => {
  const { userId, actionId, permissionType } = req.body;

  const data = {};
  if (userId) { data.user_id = userId; }
  if (actionId) { data.action_id = actionId; }
  if (permissionType) {
    validatePermissionType(permissionType);
    data.permission_type = permissionType;
  };

  const permission = await prisma.permissions.create({
    data: data
  });

  res.json(permission);
});

// PUT /permissions/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { userId, actionId, permissionType } = req.body;

  const data = {};
  if (userId) { data.user_id = userId };
  if (actionId) { data.action_id = actionId };
  if (permissionType) {
    validatePermissionType(permissionType);
    data.permission_type = permissionType;
  };

  const updated = await prisma.permissions.update({
    where: { id: id },
    data: data
  });

  res.json(updated);
});

// DELETE /permissions/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  await prisma.permissions.delete({ where: { id: id } });

  res.json({ message: 'Permission deleted successfully' });
});

module.exports = router;