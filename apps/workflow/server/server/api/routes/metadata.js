const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { metadataTypes } = require('../consts.js') || [];

// Helper function
function validateMetadataType(metadataType) {
    if (!metadataTypes.includes(metadataType)) {
        throw new Error(`Invalid metadata type: ${metadataType}. Valid types are: ${metadataTypes.join(', ')}`);
    }
}

// GET /metadata/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    const metadata = await prisma.metadata.findUnique({
        where: { id: id },
    });

    res.json(metadata);
})

// GET /metadata
router.get('/', async (req, res) => {
    const { id, actionId, key, value, metadataType } = req.query;

    const where = {};
    if (id) { where.id = id };
    if (actionId) { where.action_id = actionId };
    if (key) { where.key = key };
    if (value) { where.value = value };
    if (metadataType) {
        validateMetadataType(metadataType);
        where.metadata_type = metadataType;
    }

    const metadata = await prisma.metadata.findMany({
        where: where,
    });

    res.json(metadata);
});

// POST /metadata
router.post('/', async (req, res) => {
    const { actionId, key, value, metadataType } = req.body;

    const data = {};
    if (actionId) { data.action_id = actionId };
    if (key) { data.key = key };
    if (value) { data.value = value };
    if (metadataType) {
        validateMetadataType(metadataType);
        data.metadata_type = metadataType;
    }

    const metadata = await prisma.metadata.create({
        data: data
    });


    res.json(metadata);
});

// PUT /metadata/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { actionId, key, value, metadataType } = req.body;

    const data = {};
    if (actionId) { data.action_id = actionId };
    if (key) { data.key = key };
    if (value) { data.value = value };
    if (metadataType) {
        validateMetadataType(metadataType);
        data.metadata_type = metadataType;
    }

    const updated = await prisma.metadata.update({
        where: { id: id },
        data: data
    });

    res.json(updated);
});

// DELETE /metadata/:id
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    await prisma.metadata.delete({ where: { id: id } });

    res.json({ message: 'Metadata deleted successfully' });
});

module.exports = router;