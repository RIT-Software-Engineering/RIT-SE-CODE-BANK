const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { permissionTypes } = require('../consts.js') || [];

/**
 * Get a specific workflow by id
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    const workflow = await prisma.workflowAttributes.findUnique({
        where: { id: id },
        include: {
            tags: true,
            base_action: {
                include: {
                    metadata: true,
                    permissions: true
                }
            },
            root_action: true
        }
    });

    res.json(workflow);
})

// GET /workflows
router.get('/', async (req, res) => {
    const { userId, tags } = req.query;

    const where = {}
    if (userId) { }; // TODO: Add handling for userId
    if (tags) { }; // TODO: Add handling for tags

    const workflows = await prisma.workflowAttributes.findMany({
        where: where,
        include: {
            tags: true,
            base_action: {
                include: {
                    metadata: true,
                    permissions: true
                }
            },
            root_action: true
        }
    });

    res.json(workflows);
});

// POST /workflows
router.post('/', async (req, res) => {
    const { userId, name, description, tags, metadata, rootActionId } = req.body;

    const workflow_data = {};
    if (rootActionId) { workflow_data.root_action = { connect: { id: rootActionId } } };
    // TODO: add tags

    const base_action_data = {}
    if (name) { base_action_data.name = name }
    if (description) { base_action_data.description = description };
    // TODO: add metadata

    const workflow = await prisma.workflowAttributes.create({
        data: {
            ...workflow_data,
            base_action: {
                create: {
                    ...base_action_data,
                    permissions: { // Default the creator to have all permissionTypes
                        createMany: {
                            data: permissionTypes.map(permissionType => ({
                                user_id: userId,
                                permission_type: permissionType
                            }))
                        }
                    },
                }
            },
        }
    });

    res.json(workflow);
});

// PUT /workflows/:id
router.put('/:id', async (req, res) => {
    const { name, description, metadata, rootActionId } = req.body;
    const { id } = req.params;

    const workflow_data = {};
    if (rootActionId) { workflow_data.root_action = { connect: { id: rootActionId } } };

    const base_action_data = {}
    if (name) { base_action_data.name = name }
    if (description) { base_action_data.description = description };
    // TODO: add metadata

    await prisma.workflowAttributes.update({
        where: { id: id },
        data: {
            ...workflow_data,
            base_action: {
                update: {
                    ...base_action_data
                }
            },
        }
    })

    res.json({ message: 'Updated' });
});

// DELETE /workflows/:id
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    // Delete the workflow and all related entities
    await prisma.$transaction(async () => {
        const workflow = await prisma.workflowAttributes.findUnique({
            where: { id: id }
        });

        if (!workflow) throw new Error('Workflow not found');

        await prisma.action.delete({
            where: { id: workflow.base_action_id }
        });
    });

    res.json({ message: 'Deleted' });
});

module.exports = router;