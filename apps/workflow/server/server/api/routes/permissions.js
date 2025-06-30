const express = require('express');
const router = express.Router();
const { getPermissions, createPermission, updatePermission, deletePermission } = require('./../../controller/permissions.js');

// GET /permissions
router.get('/', async (req, res) => {
  const { permissionId, userId, actionId, permissionType } = req.query;

  const params = {};
  if (permissionId) params.id = permissionId;
  if (userId) params.user_id = userId;
  if (actionId) params.action_id = actionId;
  if (permissionType) params.permission_type = permissionType;

  const permissions = await getPermissions(params);

  res.json(permissions);
});

// POST /permissions
router.post('/', async (req, res) => {
  const { userId, actionId, permissionType } = req.body;

  const permission = await createPermission(userId, actionId, permissionType);

  res.json(permission);
});

// PUT /permissions/:permissionId
router.put('/:permissionId', async (req, res) => {
  const { permissionId } = req.params;
  const { userId, workflowId, permissionType } = req.body;

  const updated = await updatePermission(permissionId, userId, workflowId, permissionType);

  res.json(updated);
});

// DELETE /permissions/:permissionId
router.delete('/:permissionId', async (req, res) => {
  const { permissionId } = req.params;
  
  await deletePermission(permissionId);

  res.json({ message: 'Permission deleted successfully' });
});

module.exports = router;