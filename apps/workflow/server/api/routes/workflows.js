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
      baseAction: {
        include: {
          metadata: true,
          permissions: true,
        },
      },
      rootAction: true,
    },
  });

  res.json(exportWorkflow(workflow));
});

router.get("/action/:id", async (req, res) => {
  const {id} = req.params;
  const workflow = await prisma.workflowAttributes.findUnique({
    where: {baseActionId: id},
    include: {
      tags: true,
      baseAction: {
        include: {
          metadata: true,
          permissions: true,
        },
      },
      rootAction: {
        include: {
          metadata: true
        }
      },
    },
  });

  res.json(exportWorkflow(workflow));
})

// GET /workflows
router.get("/", async (req, res) => {
  const { userId, tags } = req.query;

  const where = {};

  if (userId) {
  } // TODO: Add handling for userId
  if (tags) {
    where.OR = tags.split(",").map((name) => ({
      tags: { some: { name } },
    }));
  }

  const workflows = await prisma.workflowAttributes.findMany({
    where,
    include: {
      tags: true,
      baseAction: {
        include: {
          metadata: true,
          permissions: true,
        },
      },
      rootAction: true,
    },
  });

  res.json(workflows.map((w) => exportWorkflow(w)));
});

// POST /workflows
router.post("/", async (req, res) => {
  const { userId, name, description, tags, metadata, rootActionId } = req.body;

  const workflowData = {};
  if (rootActionId) {
    workflowData.rootAction = { connect: { id: rootActionId } };
  }

  const baseActionData = {};
  if (description) {
    baseActionData.description = description;
  }
  if (metadata) {
    baseActionData.metadata = {
      create: importMetadata(metadata),
    };
  }

  await prisma.$transaction(async () => {
    const workflow = await prisma.workflowAttributes.create({
      data: {
        ...workflowData,
        baseAction: {
          create: {
            ...baseActionData,
            name: name || "New Workflow",
            actionType: "workflow",
            permissions: {
              // Default the creator to have all permissionTypes
              createMany: {
                data: permissionTypes.map((permissionType) => ({
                  userId: userId,
                  permissionType: permissionType,
                })),
              },
            },
          },
        },
      },
    });

    // Tag time
    if (tags) {
      tags.map(
        async (name) =>
          await prisma.tag.upsert({
            where: { name },
            update: {
              workflowAttributes: { connect: { id: workflow.id } },
            },
            create: {
              name,
              workflowAttributes: { connect: { id: workflow.id } },
            },
          })
      );
    }

    // No export because it doesn't include metadata
    // As of now, tags are not included
    res.json(workflow);
  });
});

// PUT /workflows/action/:id
router.put("/action/:id", async (req, res) => {
  const { name, description, metadata, tags, rootActionId } = req.body;
  const { id } = req.params;

  const workflowData = {};
  if (rootActionId) {
    workflowData.rootAction = { connect: { id: rootActionId } };
  }

  const baseActionData = {};
  if (name) {
    baseActionData.name = name;
  }
  if (description) {
    baseActionData.description = description;
  }
  if (tags) {
    workflowData.tags = {
      // Clear existing connections
      set: [],

      // Add/re-add them
      connectOrCreate: tags.map((name) => ({
        where: { name },
        create: { name },
      })),
    };
  }

  await prisma.$transaction(async () => {
    if (metadata) {
      // Delete old metadata
      const actionMd = (
        await prisma.workflowAttributes.findUnique({
          where: {baseActionId: id},
          select: { baseAction: { select: { metadata: true } } },
        })
      ).baseAction.metadata;
      await prisma.metadata.deleteMany({
        where: { id: { in: actionMd.map((m) => m.id) } },
      });

      // Update with new metadata
      baseActionData.metadata = { create: importMetadata(metadata) };
    }

    const workflow = await prisma.workflowAttributes.update({
      where: {baseActionId: id},
      data: {
        ...workflowData,
        baseAction: {
          update: {
            ...baseActionData,
          },
        },
      },
    });

    return res.json(workflow);
  });
});

// PUT /workflows/:id
router.put("/:id", async (req, res) => {
  const { name, description, metadata, tags, rootActionId } = req.body;
  const { id } = req.params;

  const workflowData = {};
  if (rootActionId) {
    workflowData.rootAction = { connect: { id: rootActionId } };
  }

  const baseActionData = {};
  if (name) {
    baseActionData.name = name;
  }
  if (description) {
    baseActionData.description = description;
  }
  if (tags) {
    workflowData.tags = {
      // Clear existing connections
      set: [],

      // Add/re-add them
      connectOrCreate: tags.map((name) => ({
        where: { name },
        create: { name },
      })),
    };
  }

  await prisma.$transaction(async () => {
    if (metadata) {
      // Delete old metadata
      const actionMd = (
        await prisma.workflowAttributes.findUnique({
          where: { id },
          select: { baseAction: { select: { metadata: true } } },
        })
      ).baseAction.metadata;
      await prisma.metadata.deleteMany({
        where: { id: { in: actionMd.map((m) => m.id) } },
      });

      // Update with new metadata
      baseActionData.metadata = { create: importMetadata(metadata) };
    }

    const workflow = await prisma.workflowAttributes.update({
      where: { id: id },
      data: {
        ...workflowData,
        baseAction: {
          update: {
            ...baseActionData,
          },
        },
      },
    });

    return res.json(workflow);
  });
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

    // Delete the base action for this workflow. Also cascades and deletes the WorkflowAttributes.
    await prisma.action.delete({
      where: { id: workflow.baseActionId },
    });
  });

  res.json({ message: "Deleted" });
});

module.exports = router;
