const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { permissionTypes } = require('../consts.js') || [];
const { authorizeAccessLevel } = require('../helpers/auth.js');
// Helper function
function validatePermissionType(permissionType) {
  if (!permissionTypes.includes(permissionType)) {
    throw new Error(`Invalid permission type: ${permissionType}. Valid types are: ${permissionTypes.join(', ')}`);
  }
}

// GET /permissions/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const permissions = await prisma.permission.findUnique({
    where: {id: id},
  });

  res.json(permissions);
})

// GET /permissions
router.get('/', async (req, res) => {
  const { userId, actionId, permissionType } = req.query;

  const where = {};
  if (userId) { where.userId = userId; }
  if (actionId) { where.actionId = actionId; }
  if (permissionType) {
    validatePermissionType(permissionType);
    where.permissionType = permissionType;
  };

  const permissions = await prisma.permission.findMany({
    where: where,
  });

  res.json(permissions);
});

// POST /permissions
router.post('/', async (req, res) => {
  //acting user is the person making the request
  //newUser is the person that you are making the permission for
  const { actingUserId, newUserId, actionId, permissionType} = req.body; 
  if (!await authorizeAccessLevel(actingUserId, actionId, 'creator')) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const data = {};
  if (newUserId) { data.userId = newUserId; }
  if (actionId) { data.actionId = actionId; }
  if (permissionType) {
    validatePermissionType(permissionType);
    data.permissionType = permissionType;
  };

  const permission = await prisma.permission.create({
    data: data
  });

  res.json(permission);
});

// PUT /permissions/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { actingUserId, permissionType } = req.body;
  const actionId = (await prisma.permission.findUnique({
    where: { id: id },
    select: { actionId: true }
  })).actionId;
  if (!await authorizeAccessLevel(actingUserId, actionId, 'creator')) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const data = {};
  if (permissionType) {
    validatePermissionType(permissionType);
    data.permissionType = permissionType;
  };

  const updated = await prisma.permission.update({
    where: { id: id },
    data: data
  });

  res.json(updated);
});

// DELETE /permissions/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { actingUserId } = req.body;
  const actionId = (await prisma.permission.findUnique({
    where: { id: id },
    select: { actionId: true }
  })).actionId;

  if (!await authorizeAccessLevel(actingUserId, actionId, 'creator')) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  await prisma.permission.delete({ where: { id: id } });

  res.json({ message: 'Permission deleted successfully' });
});

module.exports = router;