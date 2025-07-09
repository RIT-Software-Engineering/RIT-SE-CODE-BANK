const express = require('express');
const router = express.Router();
const { createAction, getActions, updateAction, deleteAction, getActionChain, createActionChainLink } = require('./../../controller/actions.js');
const { getWorkflows } = require('./../../controller/workflows.js');

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    const actions = await getActions({ id: id });

    return res.json(actions[0]);
})
// GET /actions
router.get('/', async (req, res) => {
    const { workflowId } = req.query;

    const params = {};

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
    const { name, description, form, actionType, metadata } = req.body;
    const { userId } = req.body; // TODO: make this work with req.user instead

    const action = await createAction(userId, name, description, form, actionType, metadata);

    res.json(action);
});

// PUT /actions/:actionId
router.put('/:actionId', async (req, res) => {
    console.log("in put");
    const { name, description, form, actionType, metadata, nextActionId } = req.body;
    const { actionId } = req.params;

    console.log(req.body);

    await updateAction(actionId, name, description, form, actionType, metadata, nextActionId);

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