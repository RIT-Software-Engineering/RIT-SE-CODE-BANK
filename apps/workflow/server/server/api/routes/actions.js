const express = require('express');
const router = express.Router();
const { createAction, getActions, updateAction, deleteAction, getActionChain, createActionChainLink } = require('./../../controller/actions.js');
const { getWorkflows } = require('./../../controller/workflows.js');


// GET /actions
router.get('/', async (req, res) => {
    const { actionId, workflowId } = req.query;

    const params = {};
    if (actionId) params.id = actionId;

    const actions = await getActions(params);

    if (workflowId) {
        let actionsByWorkflow = [];
        const workflows = await getWorkflows({ id: workflowId });
        if (workflows.length > 0 && workflows[0].root_action) {
            actionsByWorkflow = await getActionChain(workflows[0].root_action.id);
        }

        // find the actions that appear in both lists
        const intersection = actionsByWorkflow.filter(action1 => actions.some(action2 => action1.id === action2.id));
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

router.post('/link', async (req, res) => {
    const { actionId, nextActionId } = req.body;

    const actionLink = await createActionChainLink(actionId, nextActionId);

    res.json(actionLink);
})

module.exports = router;