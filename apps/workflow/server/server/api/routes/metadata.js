const express = require('express');
const router = express.Router();
const { getMetadata, createMetadata, updateMetadata, deleteMetadata } = require('./../../controller/metadata.js');

// GET /metadatas
router.get('/', async (req, res) => {
    const { metadataId, actionId, key, value, metadataType } = req.query;

    const params = {};
    if (metadataId) params.id = metadataId;
    if (actionId) params.action_id = actionId;
    if (key) params.key = key;
    if (value) params.value = value;
    if (metadataType) params.metadata_type = metadataType;

    const metadatas = await getMetadata(params);

    res.json(metadatas);
});

// POST /metadatas
router.post('/', async (req, res) => {
    const { actionId, key, value, metadataType } = req.body;

    const metadata = await createMetadata(actionId, key, value, metadataType);

    res.json(metadata);
});

// PUT /metadatas/:metadataId
router.put('/:metadataId', async (req, res) => {
    const { metadataId } = req.params;
    const { actionId, key, value, metadataType } = req.body;

    const updated = await updateMetadata(metadataId, actionId, key, value, metadataType);

    res.json(updated);
});

// DELETE /metadatas/:metadataId
router.delete('/:metadataId', async (req, res) => {
    const { metadataId } = req.params;

    await deleteMetadata(metadataId);

    res.json({ message: 'Metadata deleted successfully' });
});

module.exports = router;