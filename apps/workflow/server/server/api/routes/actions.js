const express = require('express');
const router = express.Router();
const { createAction, getActions, updateAction, deleteAction, getActionChain } = require('./../../controller/actions.js');
const { getWorkflows } = require('./../../controller/workflows.js');


// GET /actions
router.get('/', async (req, res) => {
    const { actionId, workflowId } = req.query;

    const params = {};
    if (actionId) params.id = actionId;

    actions = await getActions(params);

    if (workflowId) {
        let actionsByWorkflow = [];
        const workflows = await getWorkflows({ id: workflowId });
        if (workflows.length > 0 && workflows[0].root_action) {
            actionsByWorkflow = await getActionChain(workflows[0].root_action.id);
        }

        console.log("actions", actions);
        console.log("actionsByWorkflow", actionsByWorkflow);

        // find the actions that appear in both lists
        const intersection = actions.filter(action1 => actionsByWorkflow.some(action2 => action1.id === action2.id));
        return res.json(intersection);
    }

    return res.json(actions);
});

// POST /actions
router.post('/', async (req, res) => {
    const { actionType, metadata } = req.body;
    const { userId } = req.body; // TODO: make this work with req.user instead

    const action = await createAction(userId, actionType, metadata);

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