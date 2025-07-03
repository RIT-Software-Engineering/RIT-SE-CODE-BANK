const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { actionTypes, permissionTypes } = require('./consts.js') || [];

////////////////////////////
// Action CRUD operations //
////////////////////////////

async function createAction(userId, actionType = actionTypes[0], metadata = {}) {
    const action = await prisma.action.create({
        data: {
            action_type: actionType,
            metadata: {
                create: Object.entries(metadata).map(([key, value]) => ({
                    key: key,
                    value: value.toString(), // Ensure value is string
                    metadata_type: typeof value // TODO: Figure out how to check this against consts.metadataTypes (if necessary)
                }))
            },
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

    return action;
}

async function getActions(queryParams = {}) {
    const actions = await prisma.action.findMany({
        where: queryParams,
        include: {
            metadata: true
        }
    });

    return actions;
}

async function updateAction(actionId, actionType = undefined, metadata = {}) {
    // Use a transaction for atomicity and performance
    await prisma.$transaction(async () => {
        if (actionType) {
            await prisma.action.update({
                where: { id: actionId },
                data: { action_type: actionType }
            });
        }

        await prisma.metadata.deleteMany({
            where: { action_id: actionId }
        });

        await prisma.metadata.createMany({
            data: Object.entries(metadata).map(([key, value]) => ({
                action_id: actionId,
                key: key,
                value: value.toString(),
                metadata_type: typeof value
            })),
            skipDuplicates: true // Optional: skips inserting duplicates if any
        });
    }
    );
}

async function deleteAction(actionId) {
    await prisma.action.delete({
        where: { id: actionId }
    });
}



///////////////////////////////////////////////////////
// Operations for putting actions into a linked list //
///////////////////////////////////////////////////////

async function createActionChainLink(actionId, nextActionId) {
    // Ensure both actions exist
    const action = await prisma.action.findUnique({ where: { id: actionId } });
    const nextAction = await prisma.action.findUnique({ where: { id: nextActionId } });

    if (!action || !nextAction) {
        throw new Error('One or both actions do not exist.');
    }

    const actionChainLink = await prisma.actionChainLinks.create({
        data: {
            action: {
                connect: {id: actionId}
            },
            next_action: {
                connect: {id: nextActionId}
            }
        }
    })

    return actionChainLink;
}

async function getActionChainLinks(queryParams = {}) {
    const actionChainLink = await prisma.actionChainLinks.findMany({
        where: queryParams,
        include: {
            action: true,
            next_action: true
        }
    });

    return actionChainLink;
}

// Get all of the actions that are connected by chain links in order
async function getActionChain(rootActionId) {
    console.log("rootActionId", rootActionId);
    const actionChain = [];
    let currentActionId = rootActionId;

    await prisma.$transaction(async () => {
        while (currentActionId) {
            console.log("currentActionId", currentActionId);

            const action = await prisma.action.findUnique({
                where: { id: currentActionId },
                include: {
                    next_action: true
                }
            });

            if (!action) {
                break; // No more actions in the chain
            }

            actionChain.push(action);
            currentActionId = null;
            if (action.next_action) currentActionId = action.next_action.next_action_id; // Move to the next action in the chain
        }
    });

    console.log(actionChain);

    return actionChain;
}



// async function copyAction(actionId) {
//     // Get the action to copy
//     const action = await prisma.action.findUnique({
//         where: { id: actionId },
//         include: {
//             metadata: true,
//             reference_endpoints: true,
//             children: true,
//             parent: true,
//             next_action: true,
//             previous_action: true,
//             workflow_attributes: true,
//             workflow_action_relationships: true
//         }
//     });

//     console.log("Action to copy:", action);

//     if (!action) {
//         throw new Error(`Action with ID ${actionId} not found.`);
//     }

//     // const copy = await prisma.action.create({
//     //     data: {



//     // // Create a new action with the same type and metadata
//     // const newAction = await createAction(action.action_type, action.metadata.reduce((acc, meta) => {
//     //     acc[meta.key] = meta.value;
//     //     return acc;
//     // }, {}));

//     // return newAction;
// }
// async function testCopy() {
//     const newAction = await createAction('simple', { name: 'Sample Action', description: 'This is a sample action' })
//     await copyAction(newAction.id);
// }

// testCopy();

// async function testActionControllers() {
//     // Reset the actions table
//     async function resetActionsTable() {
//         await prisma.action.deleteMany({});
//         console.log('Actions table and related metadata reset.');
//     }

//     // Call the reset function before running tests
//     await resetActionsTable();

//     // Example usage of createAction function
//     await createAction('simple', { name: 'Sample Action 1', description: 'This is a simple action' });
//     await createAction('complex', { name: 'Sample Action 2', description: 'This is a complex action with more metadata' });
//     await createAction('branching', { name: 'Sample Action 3', description: 'This is a branching action', numberTest: 17, boolTest: true, dateTest: (new Date()).toISOString() });
//     await createAction('workflow', { name: 'Sample Action 4', description: 'This action is part of a workflow' });

//     console.log('Test actions created successfully.');

//     // Example usage of getActions function
//     const allActions = await getActions();
//     console.log("All actions:", allActions);
//     const simpleActions = await getActions({ action_type: 'simple' });
//     console.log("Simple actions:", simpleActions);
//     const specificActionId = allActions[0].id;
//     let specificActions = await getActions({ id: specificActionId });
//     console.log("Specific action:", specificActions);


//     // Examples of how to access metadata for an action
//     specificActions[0].metadata.forEach(meta => {
//         console.log(`Simple Action Metadata - ${meta.key}: ${meta.value} (${meta.metadata_type})`);
//     })

//     await updateAction(specificActionId, { name: 'Updated Sample Action 1', description: 'This is an updated simple action', numberTest: 42, boolTest: false, dateTest: (new Date()).toISOString() });
//     specificActions = await getActions({ id: specificActionId });
//     console.log("Updated specific action:", specificActions);
//     specificActions[0].metadata.forEach(meta => {
//         console.log(`Updated Simple Action Metadata - ${meta.key}: ${meta.value} (${meta.metadata_type})`);
//     });

//     await deleteAction(specificActionId);
//     console.log(`Action with ID ${specificActionId} deleted successfully.`);
//     specificActions = await getActions({ id: specificActionId });
//     if (specificActions.length === 0) {
//         console.log(`Action with ID ${specificActionId} no longer exists.`);
//     } else {
//         console.log("Action still exists:", specificActions);
//     }
//     console.log('All actions after deletion:', await getActions());
//     console.log('Test actions completed successfully.');
// }

// testActionControllers();

module.exports = {
    createAction,
    getActions,
    updateAction,
    deleteAction,
    createActionChainLink,
    getActionChainLinks,
    getActionChain
};