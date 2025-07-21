const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getActionChain(rootActionId) {
    const actions = [];
    let currentActionId = rootActionId;

    await prisma.$transaction(async () => {
        while (currentActionId) {
            const action = await prisma.action.findUnique({
                where: { id: currentActionId },
                include: { 
                    metadata: true,
                    previousAction: true, 
                }
            });

            if (!action) {
                break; // No more actions in the chain
            }

            actions.push(action);
            currentActionId = null;
            if (action.nextActionId) currentActionId = action.nextActionId; // Move to the next action in the chain
        }
    });

    return actions;
}

const exportAction = (action) => ({
    ...action,
    metadata: action.metadata.reduce(
        (acc, m) => ({ ...acc, [m.key]: m.value }),
        {}
    ),
});

module.exports = {
    getActionChain,
    exportAction,
};
