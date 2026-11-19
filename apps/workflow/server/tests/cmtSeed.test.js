const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const test = require("node:test");
const { PrismaClient } = require("@prisma/client");
const { createWorkflow, createAction } = require("../prisma/cmtSeedUtils");
const { syncCmtWorkflows } = require("../prisma/syncCmtWorkflows");

const TAG = "WorkflonyFirstTheRestNowhere_CMT_Template";

test("duplicate seed keys are rejected before any database writes", async () => {
  const definition = { name: "Template", metadata: { code: "fixture" }, actions: [
    { name: "First", metadata: { code: "same" } },
    { name: "Second", metadata: { code: "same" } }
  ] };
  await assert.rejects(syncCmtWorkflows({}, [definition]), /Duplicate seed action key/);
});

test("template seeding adds actions without resetting existing workflows or progress", {
  skip: !process.argv.includes("--database")
}, async t => {
  const db = new PrismaClient();
  const userId = randomUUID();
  const prefix = randomUUID();
  const fixtureTag = `seed-fixture-${prefix}`;
  const fixtureCode = `seed-fixture-${prefix}`;
  const workflowIds = new Set();
  const actionIds = new Set();
  let state;

  async function rememberWorkflow(workflowId) {
    const workflow = await db.workflowAttributes.findUnique({ where: { id: workflowId } });
    if (!workflow || workflowIds.has(workflow.id)) return;
    workflowIds.add(workflow.id);
    actionIds.add(workflow.baseActionId);
    const pending = workflow.rootActionId ? [workflow.rootActionId] : [];
    const visited = new Set();
    while (pending.length) {
      const id = pending.pop();
      if (visited.has(id)) continue;
      visited.add(id);
      const action = await db.action.findUnique({ where: { id }, include: { childActions: true, baseActionOf: true } });
      actionIds.add(id);
      if (action.baseActionOf) await rememberWorkflow(action.baseActionOf.id);
      if (action.nextActionId) pending.push(action.nextActionId);
      pending.push(...action.childActions.map(child => child.id));
    }
  }

  async function sequence(workflowId) {
    const workflow = await db.workflowAttributes.findUnique({ where: { id: workflowId } });
    const actions = [];
    let id = workflow.rootActionId;
    while (id) {
      assert.ok(!actions.some(action => action.id === id), "action sequence contains a cycle");
      const action = await db.action.findUnique({ where: { id }, include: { metadata: true } });
      actions.push(action);
      id = action.nextActionId;
    }
    return actions;
  }

  const initial = { name: "Seed fixture", userId, tags: [TAG, fixtureTag], metadata: { code: fixtureCode }, actions: [
    { name: "Details", seedKey: "details", actionType: "workflow", actions: [
      { name: "First", metadata: { code: "FIRST", customSeedValue: "original" } },
      { name: "Second", metadata: { code: "SECOND" } }
    ] },
    { name: "Complex", actionType: "complex", metadata: { code: "COMPLEX" }, childActions: [
      { name: "Child", metadata: { code: "CHILD" } }
    ] }
  ] };

  try {
    // Exercise adoption of the old seed layout, which has no cmtSeedKey metadata.
    const legacy = await createWorkflow(initial);
    await rememberWorkflow(legacy.id);
    const clone = await db.$transaction(tx => createWorkflow({ ...initial, tags: [fixtureTag] }, tx));
    await rememberWorkflow(clone.id);
    const cloneBefore = await sequence(clone.id);
    state = await db.workflowState.create({ data: { workflow: { connect: { id: clone.id } }, userId,
      baseActionState: { create: { action: { connect: { id: clone.baseActionId } }, stateType: "inProgress", index: 0 } }
    } });
    const completed = await db.actionState.create({ data: { action: { connect: { id: cloneBefore[0].id } },
      parent: { connect: { id: state.baseActionStateId } }, stateType: "completed", index: 0,
      workflowStates: { connect: { id: state.id } }
    } });
    const submission = await db.actionStateSubmission.create({ data: { actionStateId: completed.id,
      workflowStateId: state.id, userId, completed: true, fileName: "fixture.txt", fileData: Buffer.from("fixture")
    } });
    const progressBefore = await db.actionState.findMany({ where: { id: { in: [state.baseActionStateId, completed.id] } }, orderBy: { id: "asc" } });

    let details;
    let first;
    let second;
    let custom;
    await t.test("legacy templates are adopted and rerunning creates no duplicates", async () => {
      const adopted = await syncCmtWorkflows(db, [initial]);
      assert.equal(adopted.created, 0);
      assert.ok(adopted.updated > 0);
      assert.deepEqual(await syncCmtWorkflows(db, [initial]), { created: 0, updated: 0 });
      const roots = await sequence(legacy.id);
      details = await db.workflowAttributes.findUnique({ where: { baseActionId: roots[0].id } });
      [first, second] = await sequence(details.id);
      custom = await db.$transaction(tx => createAction({ name: "Instructor custom action", userId }, tx));
      actionIds.add(custom.id);
      await db.action.update({ where: { id: first.id }, data: { nextActionId: custom.id } });
      await db.action.update({ where: { id: custom.id }, data: { nextActionId: second.id } });
      await db.metadata.create({ data: { actionId: first.id, key: "instructorSetting", value: JSON.stringify("keep") } });
    });

    const updated = structuredClone(initial);
    updated.name = "Updated template";
    updated.actions[0].name = "Renamed details";
    updated.actions[0].actions[0].name = "Renamed first";
    updated.actions[0].actions[0].metadata.customSeedValue = "updated";
    updated.actions[0].actions.splice(1, 0, { name: "New required activity", requiresSubmission: true, metadata: { code: "ADDED" } });
    updated.actions[1].childActions.push({ name: "New complex child", metadata: { code: "CHILD_ADDED" } });
    updated.actions.push({ name: "New nested workflow", seedKey: "new-workflow", actionType: "workflow", actions: [
      { name: "Nested activity", metadata: { code: "NESTED" } }
    ] });

    await t.test("missing nested actions are inserted and existing IDs, custom actions and permissions survive", async () => {
      const permissions = await db.permission.findMany({ where: { actionId: legacy.baseActionId }, orderBy: { id: "asc" } });
      const synced = await syncCmtWorkflows(db, [updated]);
      assert.equal(synced.created, 4);
      await rememberWorkflow(legacy.id);
      const actions = await sequence(details.id);
      assert.deepEqual(actions.map(action => action.name), ["Renamed first", "New required activity", "Instructor custom action", "Second"]);
      assert.equal(actions[0].id, first.id);
      assert.equal(actions[2].id, custom.id);
      assert.equal(actions[3].id, second.id);
      assert.equal(actions[1].requiresSubmission, true);
      assert.equal((await db.metadata.findUnique({ where: { key_actionId: { key: "instructorSetting", actionId: first.id } } })).value, JSON.stringify("keep"));
      assert.deepEqual(await db.permission.findMany({ where: { actionId: legacy.baseActionId }, orderBy: { id: "asc" } }), permissions);
      assert.deepEqual(await syncCmtWorkflows(db, [updated]), { created: 0, updated: 0 });
    });

    await t.test("course copies, action-state IDs, completion and submissions are preserved", async () => {
      assert.deepEqual(await sequence(clone.id), cloneBefore);
      assert.deepEqual(await db.actionState.findMany({ where: { id: { in: [state.baseActionStateId, completed.id] } }, orderBy: { id: "asc" } }), progressBefore);
      assert.deepEqual(await db.actionStateSubmission.findUnique({ where: { id: submission.id } }), submission);
    });

    await t.test("removed seed entries retain existing actions and failed updates roll back", async () => {
      const trimmed = structuredClone(updated);
      trimmed.actions[0].actions.pop();
      await syncCmtWorkflows(db, [trimmed]);
      assert.ok(await db.action.findUnique({ where: { id: second.id } }));
      const invalid = structuredClone(updated);
      invalid.name = "Must roll back";
      invalid.actions[1].actionType = "simple";
      await assert.rejects(syncCmtWorkflows(db, [invalid]), /changed type/);
      assert.equal((await db.action.findUnique({ where: { id: legacy.baseActionId } })).name, updated.name);
    });

    await t.test("concurrent seed runs create a new workflow exactly once", async () => {
      const definition = { name: "Concurrent fixture", userId, tags: [fixtureTag], metadata: { code: `${fixtureCode}-concurrent` }, actions: [
        { name: "Action", metadata: { code: "ONLY" } }
      ] };
      await Promise.all([syncCmtWorkflows(db, [definition]), syncCmtWorkflows(db, [definition])]);
      const created = await db.workflowAttributes.findMany({ where: { baseAction: { metadata: { some: {
        key: "code", value: JSON.stringify(definition.metadata.code)
      } } } } });
      assert.equal(created.length, 1);
      await rememberWorkflow(created[0].id);
      assert.equal((await sequence(created[0].id)).length, 1);
    });

    await t.test("new templates with invalid actions leave no partially seeded records", async () => {
      const definition = { name: "Failed fixture", userId, tags: [fixtureTag], metadata: { code: `${fixtureCode}-invalid` }, actions: [
        { name: "Invalid", form: { unsupported: true }, metadata: { code: "BAD" } }
      ] };
      await assert.rejects(syncCmtWorkflows(db, [definition]));
      assert.equal(await db.metadata.count({ where: { key: "code", value: JSON.stringify(definition.metadata.code) } }), 0);
    });
  } finally {
    const tagged = await db.workflowAttributes.findMany({ where: { tags: { some: { name: fixtureTag } } } });
    workflowIds.clear();
    for (const workflow of tagged) {
      // Refresh tracked trees to include additions even when an assertion failed.
      await rememberWorkflow(workflow.id);
    }
    if (state) {
      await db.actionStateSubmission.deleteMany({ where: { workflowStateId: state.id } });
      await db.workflowState.delete({ where: { id: state.id } });
      await db.actionState.deleteMany({ where: { actionId: { in: [...actionIds] } } });
    }
    await db.workflowAttributes.deleteMany({ where: { id: { in: [...workflowIds] } } });
    await db.metadata.deleteMany({ where: { actionId: { in: [...actionIds] } } });
    await db.permission.deleteMany({ where: { actionId: { in: [...actionIds] } } });
    await db.action.updateMany({ where: { id: { in: [...actionIds] } }, data: { nextActionId: null, parentActionId: null } });
    await db.action.deleteMany({ where: { id: { in: [...actionIds] } } });
    await db.tag.deleteMany({ where: { name: fixtureTag } });
    await db.$disconnect();
  }
});
