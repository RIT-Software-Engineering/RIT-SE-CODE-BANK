const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { importMetadata } = require("../helpers/metadata.js");
const { exportWorkflow } = require("../helpers/workflows.js");
const prisma = new PrismaClient();
const { permissionTypes } = require("../consts.js") || [];

/**
 * Get a specific workflow by id
 */
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    const workflow = await prisma.workflowAttributes.findUnique({
        where: { id: id },
        include: {
            tags: true,
            base_action: {
                include: {
                    metadata: true,
                    permissions: true,
                },
            },
            root_action: true,
        },
    });

    res.json(exportWorkflow(workflow));
});

// GET /workflows
router.get("/", async (req, res) => {
    const { userId, tags } = req.query;

    const where = {};

    if (userId) {
    } // TODO: Add handling for userId
    if (tags) {
        where.AND = tags.split(",").map((name) => ({
            tags: { some: { name } },
        }));
    }

    const workflows = await prisma.workflowAttributes.findMany({
        where,
        include: {
            tags: true,
            base_action: {
                include: {
                    metadata: true,
                    permissions: true,
                },
            },
            root_action: true,
        },
    });

    res.json(workflows.map((w) => exportWorkflow(w)));
});

// POST /workflows
router.post("/", async (req, res) => {
    const { userId, name, description, tags, metadata, rootActionId } =
        req.body;

    const workflow_data = {};
    if (rootActionId) {
        workflow_data.root_action = { connect: { id: rootActionId } };
    }

    const base_action_data = {};
    if (name) {
        base_action_data.name = name;
    }
    if (description) {
        base_action_data.description = description;
    }
    if (metadata) {
        base_action_data.metadata = {
            create: importMetadata(metadata),
        };
    }

    await prisma.$transaction(async () => {
        const workflow = await prisma.workflowAttributes.create({
            data: {
                ...workflow_data,
                base_action: {
                    create: {
                        ...base_action_data,
                        permissions: {
                            // Default the creator to have all permissionTypes
                            createMany: {
                                data: permissionTypes.map((permissionType) => ({
                                    user_id: userId,
                                    permission_type: permissionType,
                                })),
                            },
                        },
                    },
                },
            },
        });

        // Tag time
        tags.map(
            async (name) =>
                await prisma.tags.upsert({
                    where: { name },
                    update: {
                        workflow_attributes: { connect: { id: workflow.id } },
                    },
                    create: {
                        name,
                        workflow_attributes: { connect: { id: workflow.id } },
                    },
                })
        );

        // No export because it doesn't include metadata
        // As of now, tags are not included
        res.json(workflow);
    });
});

// PUT /workflows/:id
router.put("/:id", async (req, res) => {
    const { name, description, metadata, tags, rootActionId } = req.body;
    const { id } = req.params;

    const workflow_data = {};
    if (rootActionId) {
        workflow_data.root_action = { connect: { id: rootActionId } };
    }

    const base_action_data = {};
    if (name) {
        base_action_data.name = name;
    }
    if (description) {
        base_action_data.description = description;
    }
    if (tags) {
        workflow_data.tags = {
            // Clear existing connections
            set: [],

            // Add/re-add them
            connectOrCreate: tags.map((name) => ({
                where: { name },
                create: { name },
            })),
        };
    }
    if (metadata) {
        // Delete old metadata
        const actionMd = (
            await prisma.workflowAttributes.findUnique({
                where: { id },
                select: { base_action: { select: { metadata: true } } },
            })
        ).base_action.metadata;
        await prisma.metadata.deleteMany({
            where: { id: { in: actionMd.map((m) => m.id) } },
        });

        // Update with new metadata
        base_action_data.metadata = { create: importMetadata(metadata) };
    }

    await prisma.workflowAttributes.update({
        where: { id: id },
        data: {
            ...workflow_data,
            base_action: {
                update: {
                    ...base_action_data,
                },
            },
        },
    });

    res.json({ message: "Updated" });
});

// DELETE /workflows/:id
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    // Delete the workflow and all related entities
    await prisma.$transaction(async () => {
        const workflow = await prisma.workflowAttributes.findUnique({
            where: { id: id },
        });

        if (!workflow) throw new Error("Workflow not found");

        await prisma.action.delete({
            where: { id: workflow.base_action_id },
        });

        await prisma.workflowAttributes.delete({
            where: { id },
        });
    });

    res.json({ message: "Deleted" });
});

module.exports = router;
