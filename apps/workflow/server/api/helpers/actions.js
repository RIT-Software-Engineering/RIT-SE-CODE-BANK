const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getFullActionTree(rootActionId) {
  const actions = [];
  let currentActionId = rootActionId;

  await prisma.$transaction(async () => {
    // Get the action specified by the id passed to the parameters
    while (currentActionId) {
      const action = await prisma.action.findUnique({
        where: { id: currentActionId },
        include: {
          metadata: true,
          previousAction: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!action) {
        break; // No more actions in the chain
      }

      switch (action.actionType) {
        case "workflow":
          // Get the root action for this workflow
          const workflow = await prisma.workflowAttributes.findUnique({
            where: { baseActionId: action.id },
            select: {
              rootActionId: true,
            },
          });

          // If the workflow is empty, break the switch
          if (!workflow.rootActionId) {
            break;
          }

          // Add the child actions as a list in the workflow's baseAction, following the same
          // convention as complex and branching actions.
          action.childActions = await getFullActionTree(workflow.rootActionId);
          break;

        case "complex":
        case "branching":
          // If the action is complex or branching, get the child actions directly
          const childActions = await prisma.action.findMany({
            where: { parentActionId: action.id },
            include: {
              metadata: true,
            },
            orderBy: {
              id: 'asc' // Order by creation to maintain consistent ordering
            }
          });

          action.childActions = childActions;
          break;

        case "simple":
          // Do nothing
          break;

        default:
          // this would happen if there is an action type that doesn't match the enums
          throw Error("Unexpected action type");
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
  metadata: action.metadata?.reduce(
    (acc, m) => ({ ...acc, [m.key]: m.value }),
    {}
  ) || {},
  childActions: action.childActions?.map(child => exportAction(child)) || [],
});

module.exports = {
  getFullActionTree,
  exportAction,
};
