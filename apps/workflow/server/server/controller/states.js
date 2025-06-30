const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getActionChain } = require('./actions.js');

async function createWorkflowState(userId, workflowId) {
    let state;

    await prisma.$transaction(async () => {
        // Ensure the workflow exists before creating a state
        const workflow = await prisma.workflowAttributes.findUnique({
            where: { id: workflowId },
            include: {
                root_action: true,
            }
        });

        if (!workflow) {
            throw new Error(`Workflow with ID ${workflowId} does not exist.`);
        }

        if (!workflow.root_action) {
            throw new Error(`Workflow with ID ${workflowId} has no root action.`);
        }

        state = await prisma.workflowStates.create({
            data: {
                user_id: userId,
                workflow_id: workflowId,
            }
        });

        const actions = await getActionChain(workflow.root_action.id);
        for (const action of actions) {
            await prisma.actionStates.create({
                data: {
                    state_type: 'not_started',
                    workflow_state: { connect: { id: state.id } },
                    action: { connect: { id: action.id } }
                }
            });
        }

    });

    return state;
}

async function getWorkflowStates(queryParams = {}) {
    const states = await prisma.workflowStates.findMany({
        where: queryParams,
        include: {
            action_states: true
        }
    });

    return states;
}

async function updateWorkflowState(stateId) {
    // remove action states that are no longer in the workflow
    // reorder action states if the order has changed
    // add new action states if the workflow has changed
}

async function deleteWorkflowState(stateId) {
    await prisma.workflowStates.delete({ where: { id: stateId } });
}

async function updateActionState(actionStateId, stateType) {
    const updatedState = await prisma.actionStates.update({
        where: { id: stateId },
        data: {
            state_type: stateType
        }
    });

    return updatedState;
}

module.exports = {
    createWorkflowState,
    getWorkflowStates,
    updateWorkflowState,
    deleteWorkflowState,
    updateActionState
};