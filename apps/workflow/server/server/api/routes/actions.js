const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { getActionChain } = require('../helpers/actions.js');
const prisma = new PrismaClient();
const { permissionTypes } = require('../consts.js') || [];

// GET /actions/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    const action = await prisma.action.findUnique({
        where: { id: id },
        include: {
            metadata: true,
            previous_action: true,
        }
    });

    return res.json(action);
})
// GET /actions
router.get('/', async (req, res) => {
    const { workflowId } = req.query;

    const where = {};
    // Add other filters

    const actions = await prisma.action.findMany({
        where: where,
        include: {
            metadata: true,
            previous_action: true,
        }
    });

    if (workflowId) { // Find and return the intersection between actions that are in the workflow, and actions that are filtered above
        let actionsByWorkflow = [];
        const workflow = await prisma.workflowAttributes.findUnique({
            where: { id: workflowId },
            include: {
                root_action: true
            }
        });

        // The intersection later on is used, because if we use the where clause here, then later actions in 
        // the workflow that do not match the where clause, would cause this loop not to check actions in 
        // the workflow beyond the first one that failed.
        if (workflow?.root_action) {
            actionsByWorkflow = await getActionChain(workflow.root_action.id);
        }

        // find the actions that appear in both lists (filtered by workflows, and filtered by where clause)
        const intersection = actionsByWorkflow.filter(action1 => actions.some(action2 => action1.id === action2.id));
        return res.json(intersection);
    }

    return res.json(actions);
});

// POST /actions
router.post('/', async (req, res) => {
    const { name, description, form, actionType, metadata } = req.body;
    const { userId } = req.body; // TODO: make this work with req.user instead

    const data = {}
    if (name) { data.name = name };
    if (description) { data.description = description };
    if (form) { data.form = form };
    if (actionType) { data.action_type = actionType };

    const action = await prisma.action.create({
        data: {
            ...data,
            permissions: { // Default the creator to have all permissionTypes
                createMany: {
                    data: permissionTypes.map(permissionType => ({
                        user_id: userId,
                        permission_type: permissionType
                    }))
                }
            },
        }
    });

    res.json(action);
});

// PUT /actions/:id
router.put('/:id', async (req, res) => {
    const { name, description, form, actionType, metadata, nextActionId } = req.body;
    const { id } = req.params;

    const data = {}
    if (name) { data.name = name };
    if (description) { data.description = description };
    if (form) { data.form = form };
    if (actionType) { data.action_type = actionType };
    if (nextActionId) { data.next_action = { connect: { id: nextActionId } } };
    // TODO: Add a way to handle metadata

    await prisma.action.update({
        where: { id: id },
        data: data // Note: I believe this approach only overwrites fields of a record if the data is defined in the data object.
    });

    res.json({ message: 'Updated' });
});

// DELETE /actions/:id
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    await prisma.action.delete({
        where: { id: id }
    });

    res.json({ message: 'Deleted' });
});

module.exports = router;