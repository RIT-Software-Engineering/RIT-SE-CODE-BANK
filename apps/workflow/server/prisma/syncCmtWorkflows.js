const { createAction, createWorkflow } = require("./cmtSeedUtils");

const TEMPLATE_TAG = "WorkflonyFirstTheRestNowhere_CMT_Template";
const SEED_KEY = "cmtSeedKey";
const ACTION_FIELDS = ["name", "description", "form", "isFrozen", "requireAllParticipants", "requiresSubmission", "submissionMimeTypes"];

function keyFor(definition) {
  return definition.seedKey || definition.metadata?.code || definition.name;
}

/**
 * Returns a copy of a definition tree that is ready to be written to the database.
 * 
 * @param {Object} definition A node from cmtSeed.js
 * @param {string} [userId] The parent's userId that is inherited when the node has none (undefined for the top level)
 * @returns {Object} The prepared copy of the definition
 */
function prepare(definition, userId) {
  const result = { ...definition, userId: definition.userId || userId,
    metadata: { ...definition.metadata, [SEED_KEY]: keyFor(definition) } };
  
  if (definition.actions) result.actions = definition.actions.map(child => prepare(child, result.userId));
  
  if (definition.childActions) result.childActions = definition.childActions.map(child => prepare(child, result.userId));
  return result;
}

/**
 * Checks a list of sibling definitions before anything is written to the database.
 *
 * @param {Object[]} definitions sibling definitions (eg, all actions inside one workflow)
 * @throws {Error}
 */
function validate(definitions) {
  const keys = new Set();
  for (const definition of definitions) {
    const key = keyFor(definition);
    if (typeof definition.name !== "string" || !definition.name.trim() || typeof key !== "string" || !key.trim())
      throw new Error("Every seeded action needs a name and a stable code or seedKey.");
    if (keys.has(key)) throw new Error(`Duplicate seed action key in the same container: ${key}`);
    keys.add(key);
    validate(definition.actions || definition.childActions || []);
  }
}

/**
 * Decides whether a database action is the one a seed definition describes.
 *
 * @param {Object} action A database action
 * @param {Object} definition A node
 * @returns {boolean} True if they are the same logical action
 */
function matches(action, definition) {
  const metadata = new Map(action.metadata.map(entry => [entry.key, entry.value]));
  
  if (metadata.has(SEED_KEY)) return metadata.get(SEED_KEY) === JSON.stringify(keyFor(definition));
  
  if (definition.metadata?.code !== undefined)
    return metadata.get("code") === JSON.stringify(definition.metadata.code);
  
  return action.name === definition.name && action.actionType === (definition.actionType || "simple");
}

/**
 * Loads a workflow's actions in their current order.
 *
 * @param {Object} tx Prisma transaction client
 * @param {Object} workflow A WorkflowAttributes row (needs id and rootActionId)
 * @returns {Promise<Object[]>} The actions in order
 * @throws {Error} 
 */
async function sequence(tx, workflow) {
  const actions = [];
  const visited = new Set();
  let id = workflow.rootActionId;

  while (id) {
    if (visited.has(id)) throw new Error(`Cycle in seed workflow ${workflow.id}`);
  
    visited.add(id);
    const action = await tx.action.findUnique({ where: { id }, include: { metadata: true } });
  
    if (!action) throw new Error(`Missing action in seed workflow ${workflow.id}`);
  
    actions.push(action);
    id = action.nextActionId;
  }
  return actions;
}

/**
 * Makes one existing database action match its seed definition.
 *
 * @param {Object} tx Prisma transaction client
 * @param {Object} action The database action
 * @param {Object} definition The prepared seed definition it matched
 * @param {{created: number, updated: number}} counts The total actions added or updated
 * @throws {Error} 
 */
async function updateAction(tx, action, definition, counts) {
  const type = definition.actionType || "simple";
  if (action.actionType !== type)
    throw new Error(`Seed action "${definition.name}" changed type. Give the replacement a new seedKey.`);
  const data = {};
  for (const field of ACTION_FIELDS) {
    if (definition[field] !== undefined && definition[field] !== action[field]) data[field] = definition[field];
  }
  let changed = Object.keys(data).length > 0;
  if (changed) await tx.action.update({ where: { id: action.id }, data });
  const existing = new Map(action.metadata.map(entry => [entry.key, entry.value]));
  for (const [key, value] of Object.entries(definition.metadata || {})) {
    if (value === undefined || existing.get(key) === JSON.stringify(value)) continue;
    changed = true;
    await tx.metadata.upsert({
      where: { key_actionId: { key, actionId: action.id } },
      create: { actionId: action.id, key, value: JSON.stringify(value) },
      update: { value: JSON.stringify(value) }
    });
  }
  if (changed) counts.updated++;
}

/**
 * Syncs the children of one container: the core of the whole sync.
 *
 * @param {Object} tx Prisma transaction client
 * @param {Object} container The database action that holds the children
 * @param {Object[]} definitions The seed definitions for the container's children
 * @param {{created: number, updated: number}} counts The total actions created and updated
 * @param {Object} [workflow] The container's WorkflowAttributes row. it being omitted means it's a complex/branching action
 * @throws {Error}
 */
async function syncChildren(tx, container, definitions, counts, workflow) {
  const existing = workflow ? await sequence(tx, workflow) : await tx.action.findMany({
    where: { parentActionId: container.id }, include: { metadata: true }, orderBy: { id: "asc" }
  });

  const order = existing.map(action => action.id);
  const used = new Set();
  let previousId;

  for (let index = 0; index < definitions.length; index++) {
    const definition = definitions[index];
    const candidates = existing.filter(action => !used.has(action.id) && matches(action, definition));
    
    if (candidates.length > 1) 
      throw new Error(`Multiple actions match seed key "${keyFor(definition)}" in "${container.name}".`);
    
    let action = candidates[0];
    if (action) {
      await updateAction(tx, action, definition, counts);
      await syncActionChildren(tx, action, definition, counts);
    } else {
      action = await createAction({ ...definition, ...(workflow ? {} : { parentActionId: container.id }) }, tx);
      counts.created += countActions(definition);
      
      const next = definitions.slice(index + 1).map(nextDefinition =>
        existing.find(item => !used.has(item.id) && matches(item, nextDefinition))).find(Boolean);
      
      const position = previousId ? order.indexOf(previousId) + 1 : next ? order.indexOf(next.id) : order.length;
      order.splice(position, 0, action.id);
    }
    used.add(action.id);
    previousId = action.id;
  }

  // keep the actions and their order. only add missing seed actions
  if (workflow && (order.length !== existing.length || order.some((id, index) => id !== existing[index]?.id))) {
    await tx.action.updateMany({ where: { id: { in: order } }, data: { nextActionId: null } });
    
    for (let index = 0; index < order.length - 1; index++)
      await tx.action.update({ where: { id: order[index] }, data: { nextActionId: order[index + 1] } });
    
    await tx.workflowAttributes.update({ where: { id: workflow.id }, data: { rootActionId: order[0] || null } });
  }
}

/**
 * Recurses into the children of an action that already exists and has just been matched.
 *
 * @param {Object} tx Prisma transaction client
 * @param {Object} action The matched database action
 * @param {Object} definition The seed definition
 * @param {{created: number, updated: number}} counts
 * @throws {Error}
 */
async function syncActionChildren(tx, action, definition, counts) {
  if (action.actionType === "workflow") {
    const workflow = await tx.workflowAttributes.findUnique({ where: { baseActionId: action.id } });
    
    if (!workflow) throw new Error(`Missing workflow attributes for "${action.name}".`);
    
    await addTags(tx, workflow, definition.tags || []);
    await syncChildren(tx, action, definition.actions || [], counts, workflow);
  } else if (["complex", "branching"].includes(action.actionType)) {
    await syncChildren(tx, action, definition.childActions || [], counts);
  }
}

async function addTags(tx, workflow, tags) {
  if (!tags.length) return;
  await tx.workflowAttributes.update({ where: { id: workflow.id }, data: { tags: {
    connectOrCreate: [...new Set(tags)].map(name => ({ where: { name }, create: { name } }))
  } } });
}

function countActions(definition) {
  return 1 + (definition.actions || definition.childActions || []).reduce((count, child) => count + countActions(child), 0);
}

/**
 * Brings the database's CMT blueprints in line with the definitions in cmtSeed.js.
 *
 * @param {Object} prisma
 * @param {Object[]} definitions The top-level workflow definitions
 * @returns {Promise<{created: number, updated: number}>} Totals of actions created and updated
 * @throws {Error}
 */
async function syncCmtWorkflows(prisma, definitions) {
  validate(definitions);
  for (const definition of definitions) {
    if (!definition.metadata?.code) throw new Error("A seeded workflow needs a metadata.code.");
  }
  const totals = { created: 0, updated: 0 };
  for (const input of definitions) {
    const definition = prepare({ ...input, actionType: "workflow", tags: [...new Set([...(input.tags || []), TEMPLATE_TAG])] });
    let result;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        result = await prisma.$transaction(async tx => {
          const counts = { created: 0, updated: 0 };
          const workflows = await tx.workflowAttributes.findMany({
            where: { tags: { some: { name: TEMPLATE_TAG } }, baseAction: { metadata: { some: {
              key: "code", value: JSON.stringify(input.metadata.code)
            } } } }, include: { baseAction: { include: { metadata: true } } }
          });
          if (!workflows.length) {
            await createWorkflow(definition, tx);
            counts.created += countActions(definition);
          } else {
            for (const workflow of workflows) {
              await updateAction(tx, workflow.baseAction, definition, counts);
              await addTags(tx, workflow, definition.tags);
              await syncChildren(tx, workflow.baseAction, definition.actions || [], counts, workflow);
            }
          }
          return counts;
        }, { isolationLevel: "Serializable", maxWait: 10000, timeout: 30000 });
        break;
      } catch (error) {
        if (!["P2034", "P2002"].includes(error.code) || attempt === 3) throw error;
      }
    }
    totals.created += result.created;
    totals.updated += result.updated;
  }
  return totals;
}

module.exports = { syncCmtWorkflows };
