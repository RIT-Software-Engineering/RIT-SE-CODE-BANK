const express = require('express');
const router = express.Router();
const { createWorkflow, getWorkflows, updateWorkflow, deleteWorkflow } = require('./../../controller/workflows.js');

/**
 * Get a specific workflow by id
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    const workflows = await getWorkflows({ id: id });

    res.json(workflows[0]);
})

// GET /workflows
router.get('/', async (req, res) => {
    const { userId, tags } = req.query;

    const tagsList = tags ? tags.split(',') : [];

    const params = {};
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
    const { userId, name, description, tags, metadata, rootActionId } = req.body;

    const workflow = await createWorkflow(userId, name, description, tags, metadata, rootActionId);

    // Optionally handle tags using a Tag table, permisions, or Metadata entries

    res.json(workflow);
});

// PUT /workflows/:workflowId
router.put('/:workflowId', async (req, res) => {
    const { name, description, metadata, rootActionId } = req.body;
    const { workflowId } = req.params;

    await updateWorkflow(workflowId, name, description, metadata, rootActionId);

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