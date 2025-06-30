const express = require('express');
const router = express.Router();
const { createWorkflow, getWorkflows, updateWorkflow, deleteWorkflow } = require('./../../controller/workflows.js');

// GET /workflows
router.get('/', async (req, res) => {
    const { workflowId, userId, tags } = req.query;

    const tagsList = tags ? tags.split(',') : [];

    const params = {};
    if (workflowId) params.id = workflowId;
    if (userId) params.userId = userId;
    if (tagsList.length > 0) params.tag_workflow_relationships = { // TODO: fix this so tag filtering only returns workflows with all of the specified tags
        some: {
            tag: {
                name: {
                    in: tagsList
                }
            }
        }
    };
    
    const workflows = await getWorkflows(params);

    res.json(workflows);
});

// POST /workflows
router.post('/', async (req, res) => {
    const { userId, tags, metadata, rootActionId } = req.body;

    const workflow = await createWorkflow(userId, tags, metadata, rootActionId);

    // Optionally handle tags using a Tag table, permisions, or Metadata entries

    res.json(workflow);
});

// PUT /workflows/:workflowId
router.put('/:workflowId', async (req, res) => {
    const { metadata, rootActionId } = req.body;
    const { workflowId } = req.params;

    await updateWorkflow(workflowId, metadata, rootActionId);

    res.json({ message: 'Updated' });
});

// DELETE /workflows/:workflowId
router.delete('/:workflowId', async (req, res) => {
    const { workflowId } = req.params;

    console.log(`Deleting workflow with ID: ${workflowId}`);
    // Delete the workflow and all related entities
    await deleteWorkflow(workflowId);

    res.json({ message: 'Deleted' });
});

module.exports = router;