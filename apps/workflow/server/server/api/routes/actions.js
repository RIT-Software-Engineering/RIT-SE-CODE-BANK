const express = require('express');
const router = express.Router();
const { createAction, getActions, updateAction, deleteAction } = require('./../../controller/actions.js');


// GET /actions
router.get('/', async (req, res) => {
    const { actionId, workflowId } = req.query;

    // Add each condition that is defined in the query parameters
    // to the where clause of the Prisma query.
    const params = {};
    if (actionId) params.id = actionId;
    if (workflowId) params.workflow_action_relationships = {
        some: {
            workflow_id: workflowId
        }
    };

    // Query the database for actions based on the parameters
    const actions = await getActions(params);

    return res.json(actions);
});

// POST /actions
router.post('/', async (req, res) => {
    const { actionType, metadata } = req.body;

    const action = await createAction(actionType, metadata);

    res.json(action);
});

// PUT /actions/:actionId
router.put('/:actionId', async (req, res) => {
    const { actionType, metadata } = req.body;
    const { actionId } = req.params;

    await updateAction(actionId, actionType, metadata);

    res.json({ message: 'Updated' });
});

// DELETE /actions/:actionId
router.delete('/:actionId', async (req, res) => {
    const { actionId } = req.params;

    await deleteAction(actionId);

    res.json({ message: 'Deleted' });
});

module.exports = router;