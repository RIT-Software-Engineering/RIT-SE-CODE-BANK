const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { mapMetadataImport } = require("../helpers/metadata");
const prisma = new PrismaClient();

// GET /metadata/:id
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    const metadata = await prisma.metadata.findUnique({
        where: { id: id },
    });

    res.json(metadata);
});

// GET /metadata
router.get("/", async (req, res) => {
    const { id, actionId, key, value } = req.query;

    const where = {};
    if (id) {
        where.id = id;
    }
    if (actionId) {
        where.action_id = actionId;
    }
    if (key) {
        where.key = key;
    }
    if (value) {
        where.value = value;
    }

    const metadata = await prisma.metadata.findMany({
        where: where,
    });

    res.json(metadata);
});

// DELETE /metadata/:id
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    await prisma.metadata.delete({ where: { id: id } });

    res.json({ message: "Metadata deleted successfully" });
});

module.exports = router;
