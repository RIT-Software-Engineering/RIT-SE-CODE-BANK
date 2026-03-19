const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { getFullActionTree, exportAction } = require("../helpers/actions.js");
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
            previousAction: true,
            childActions: true,
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
        });

        // The intersection later on is used, because if we use the where clause here, then later actions in
        // the workflow that do not match the where clause, would cause this loop not to check actions in
        // the workflow beyond the first one that failed.
        if (workflow?.rootActionId) {
            actionsByWorkflow = await getFullActionTree(workflow.rootActionId);
        }

        const intersection = await prisma.action.findMany({
            where: { ...where, id: { in: actionsByWorkflow.map((a) => a.id) } },
            include: {
                metadata: true,
                previousAction: true,
                actionStates: true,
            },
        });
        const intersectionIds = intersection.map(action => action.id);
        const toReturn = actionsByWorkflow.filter(action => intersectionIds.includes(action.id));

        return res.json(toReturn.map((action) => {return action}));
    }

    const actions = await prisma.action.findMany({
        where,
        include: {
            metadata: true,
            previousAction: true,
            actionStates: true,
        },
    });
    return res.json(actions.map((a) => exportAction(a)));
});

// POST /actions
router.post("/", async (req, res) => {
    const { name, description, form, actionType, metadata, parentActionId } =
        req.body;
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
        data.actionType = actionType;
    }
    if (parentActionId) {
        data.parentAction = { connect: { id: parentActionId } };
    }

    const action = await prisma.action.create({
        data: {
            ...data,
            permissions: {
                // Default the creator to have all permissionTypes
                createMany: {
                    data: permissionTypes.map((permissionType) => ({
                        userId: userId,
                        permissionType: permissionType,
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
    const {
        name,
        description,
        form,
        actionType,
        metadata,
        nextActionId,
        parentActionId,
    } = req.body;
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
        data.actionType = actionType;
    }
    if (nextActionId) {
        data.nextAction = { connect: { id: nextActionId } };
    }
    if (parentActionId) {
        data.parentAction = { connect: { id: parentActionId } };
    }

    // If the update to this action would create a loop, don't accept the update and return an error message.
    const actionChainIds = (await getFullActionTree(nextActionId)).map((a) => (a.id)); // adding the child actions into this list may be important.
    if (actionChainIds.includes(id)){
        return res.status(500).json({message: "You can not link actions in such a way that it would create a loop."});
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

    const action = await prisma.action.update({
        where: { id: id },
        data: data, // Only overwrites fields of a record if the data is defined in the data object.
    });

    return res.json(action);
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
