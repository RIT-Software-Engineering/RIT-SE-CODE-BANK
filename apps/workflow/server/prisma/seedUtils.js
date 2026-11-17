const { permissionTypes } = require("../api/consts");
const { importMetadata } = require("../api/helpers/metadata");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function actionData(definition) {
  const data = { name: definition.name };
  for (const field of ["description", "form", "actionType", "isFrozen", "requireAllParticipants", "requiresSubmission", "submissionMimeTypes"]) {
    if (definition[field] !== undefined) data[field] = definition[field];
  }
  if (definition.metadata) {
    const encoded = Object.fromEntries(Object.entries(definition.metadata)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, JSON.stringify(value)]));
    data.metadata = { create: importMetadata(encoded) };
  }
  if (definition.rootActionOfId) data.rootActionOf = { connect: { id: definition.rootActionOfId } };
  if (definition.previousActionId) data.previousAction = { connect: { id: definition.previousActionId } };
  if (definition.parentActionId) data.parentAction = { connect: { id: definition.parentActionId } };
  return data;
}

// Passing the transaction through recursion makes creation of a complete tree atomic.
async function createWorkflow(definition, tx) {
  if (!tx) return prisma.$transaction(client => createWorkflow(definition, client), { timeout: 30000 });
  const workflow = await tx.workflowAttributes.create({
    data: {
      baseAction: {
        create: {
          ...actionData(definition),
          actionType: "workflow",
          permissions: { createMany: { data: permissionTypes.map(permissionType => ({
            userId: definition.userId, permissionType
          })) } }
        }
      },
      ...(definition.tags && { tags: {
        connectOrCreate: [...new Set(definition.tags)].map(name => ({ where: { name }, create: { name } }))
      } })
    }
  });

  let previousActionId;
  for (const child of definition.actions || []) {
    const action = await createAction({
      ...child,
      userId: child.userId || definition.userId,
      ...(previousActionId ? { previousActionId } : { rootActionOfId: workflow.id })
    }, tx);
    previousActionId = action.id;
  }
  return workflow;
}

async function createAction(definition, tx) {
  if (!tx) return prisma.$transaction(client => createAction(definition, client), { timeout: 30000 });
  if (definition.actionType === "workflow") {
    const workflow = await createWorkflow(definition, tx);
    return tx.action.findUnique({ where: { id: workflow.baseActionId } });
  }

  const action = await tx.action.create({ data: actionData(definition) });
  for (const child of definition.childActions || []) {
    await createAction({ ...child, userId: child.userId || definition.userId, parentActionId: action.id }, tx);
  }
  return action;
}

module.exports = { createWorkflow, createAction };
