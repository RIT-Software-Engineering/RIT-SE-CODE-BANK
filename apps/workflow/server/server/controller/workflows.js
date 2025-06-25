const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { actionTypes, permissionTypes } = require('./consts.js') || [];
const { createAction, deleteAction } = require('./actions.js');

async function createWorkflow(userId, tags = [], metadata = {}) { // TODO: Add permissions stuff
    let workflow;

    await prisma.$transaction(async () => {

        const action = await createAction(actionTypes[1], metadata);
        const actionId = action.id;

        workflow = await prisma.workflowAttributes.create({
            data: {
                base_action_id: actionId,
                permissions: {
                    createMany: {
                        data: permissionTypes.map(permissionType => ({
                            user_id: userId,
                            permission_type: permissionType
                        }))
                    }
                },
            }
        });

        tags.forEach(tag => {
            const newTag = prisma.tags.upsert({
                where: { name: tag },
                create: { name: tag },
                update: {}
            })
            prisma.tagWorkflowRelationships.create({
                data: {
                    workflow_id: workflow.id,
                    tag_id: newTag.id
                }
            });
        });
    });

    return workflow;
}

async function getWorkflows(queryParams = {}) {
    const workflows = await prisma.workflowAttributes.findMany({
        where: queryParams,
        include: {
            tag_workflow_relationships: {
                include: {tag: true}
            },
            permissions: true,
            base_action: {
                include: {
                    metadata: true
                }
            }
        }
    });

    return workflows;
}

async function updateWorkflow(workflowId, metadata = {}) {
    // Use a transaction for atomicity and performance
    let workflow = await prisma.workflowAttributes.findUnique({
        where: { id: workflowId }
    });
    await prisma.$transaction([
        prisma.metadata.deleteMany({
            where: { action_id: workflow.base_action_id }
        }),
        prisma.metadata.createMany({
            data: Object.entries(metadata).map(([key, value]) => ({
                action_id: workflow.base_action_id,
                key: key,
                value: value.toString(),
                metadata_type: typeof value
            })),
            skipDuplicates: true // Optional: skips inserting duplicates if any
        })
    ]);
}

async function deleteWorkflow(workflowId) {
    await prisma.$transaction(async () => {
        const workflow = await prisma.workflowAttributes.findUnique({
            where: { id: workflowId }
        });

        if (!workflow) throw new Error('Workflow not found');

        await deleteAction(workflow.base_action_id);
    });
}

// async function testWorkflowControllers() {
//     // Reset the workflows table
//     async function resetWorkflowsTable() {
//         await prisma.workflowAttributes.deleteMany({});
//         await prisma.action.deleteMany({});
//     }

//     // Example usage
//     await resetWorkflowsTable();
//     const workflow = await createWorkflow('user1', ['tag1', 'tag2'], { name: 'Test Workflow' });
//     const workflowId = workflow.id;
//     console.log('Created Workflow ID:', workflowId);

//     const workflows = await getWorkflows();
//     console.log('All Workflows:', workflows);

//     await updateWorkflow(workflowId, { name: 'Updated Workflow' });
//     console.log('Updated Workflow ID:', workflowId);

//     await deleteWorkflow(workflowId);
//     console.log('Deleted Workflow ID:', workflowId);
// }

// testWorkflowControllers();

module.exports = {
    createWorkflow,
    getWorkflows,
    updateWorkflow,
    deleteWorkflow,
};