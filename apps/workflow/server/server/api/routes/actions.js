const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { getActionChain, exportAction } = require("../helpers/actions.js");
const { importMetadata } = require("../helpers/metadata.js");
const prisma = new PrismaClient();
const { permissionTypes } = require("../consts.js") || [];

// GET /actions/:id
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    const action = await prisma.action.findUnique({
        where: { id: id },
        include: {
            metadata: true,
            previous_action: true,
        },
    });

    return res.json(exportAction(action));
});
// GET /actions
router.get("/", async (req, res) => {
    const { workflowId } = req.query;

    const where = {};
    // Add other filters

    if (workflowId) {
        // Find and return the intersection between actions that are in the workflow, and actions that are filtered above
        let actionsByWorkflow = [];
        const workflow = await prisma.workflowAttributes.findUnique({
            where: { id: workflowId },
            include: {
                root_action: true,
            },
        });

        // The intersection later on is used, because if we use the where clause here, then later actions in
        // the workflow that do not match the where clause, would cause this loop not to check actions in
        // the workflow beyond the first one that failed.
        if (workflow?.root_action) {
            actionsByWorkflow = await getActionChain(workflow.root_action.id);
        }

        // // find the actions that appear in both lists (filtered by workflows, and filtered by where clause)
        // const intersection = actionsByWorkflow.filter((action1) =>
        //     actions.some((action2) => action1.id === action2.id)
        // );

        const intersection = await prisma.action.findMany({
            where: { ...where, id: { in: actionsByWorkflow.map((a) => a.id) } },
            include: {
                metadata: true,
                previous_action: true,
            },
        });

        return res.json(intersection.map((action) => exportAction(action)));
    }

    const actions = await prisma.action.findMany({
        where,
        include: {
            metadata: true,
            previous_action: true,
        },
    });
    return res.json(actions.map((a) => exportAction(a)));
});

// POST /actions
router.post("/", async (req, res) => {
    const { name, description, form, actionType, metadata } = req.body;
    const { userId } = req.body; // TODO: make this work with req.user instead

    const data = {};
    if (name) {
        data.name = name;
    }
    if (description) {
        data.description = description;
    }
    if (form) {
        data.form = form;
    }
    if (actionType) {
        data.action_type = actionType;
    }

    const action = await prisma.action.create({
        data: {
            ...data,
            permissions: {
                // Default the creator to have all permissionTypes
                createMany: {
                    data: permissionTypes.map((permissionType) => ({
                        user_id: userId,
                        permission_type: permissionType,
                    })),
                },
            },
            metadata: {
                create: importMetadata(metadata),
            },
        },
    });

    res.json(action);
});

// PUT /actions/:id
router.put("/:id", async (req, res) => {
    const { name, description, form, actionType, metadata, nextActionId } =
        req.body;
    const { id } = req.params;

    const data = {};
    if (name) {
        data.name = name;
    }
    if (description) {
        data.description = description;
    }
    if (form) {
        data.form = form;
    }
    if (actionType) {
        data.action_type = actionType;
    }
    if (nextActionId) {
        data.next_action = { connect: { id: nextActionId } };
    }
    if (metadata) {
        // Delete old metadata
        const actionMd = (
            await prisma.action.findUnique({
                where: { id },
                select: { metadata: true },
            })
        ).metadata;
        await prisma.metadata.deleteMany({
            where: { id: { in: actionMd.map((m) => m.id) } },
        });

        // Update with new metadata
        data.metadata = { create: importMetadata(metadata) };
    }

    await prisma.action.update({
        where: { id: id },
        data: data, // Note: I believe this approach only overwrites fields of a record if the data is defined in the data object.
    });

    res.json({ message: "Updated" });
});

// DELETE /actions/:id
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    await prisma.action.delete({
        where: { id: id },
    });

    res.json({ message: "Deleted" });
});

module.exports = router;
