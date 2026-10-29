import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import express from "express";
import { PrismaClient } from "../prisma/generated/client/index.js";
import sectionsRouter from "../routes/sections.js";
import courseRouter from "../routes/course.js";
import sessionRouter from "../routes/session.js";
import { createCourseSection, ensureCourseOffering } from "../utils/courseSections.js";
import { createSectionBlock, saveSectionMaterial, shareSectionBlock, removeSectionBlock } from "../utils/sectionContent.js";
import { refreshSectionSync } from "../utils/sectionSync.js";

test("section persistence, shared content, notifications, cloning and ownership", {
    skip: process.env.CMT_SECTION_DB_TESTS !== "1" && !process.argv.includes("--database")
}, async t => {
    const prisma = new PrismaClient();
    const professorId = randomUUID();
    const realFetch = globalThis.fetch;
    const workflowOrigin = new URL(process.env.WORKFLOWS_API_URL || "http://localhost:3001").origin;
    const sourceWorkflow = `section-test-${randomUUID()}`;
    const sourceState = `section-state-${randomUUID()}`;
    const workflowCalls = [];
    const action = (code, name) => ({name, actionType: "simple", metadata: {code: JSON.stringify(code)}});
    t.mock.method(globalThis, "fetch", async (url, options = {}) => {
        const parsed = new URL(url);
        if (parsed.origin !== workflowOrigin) return realFetch(url, options);
        const body = options.body ? JSON.parse(options.body) : {};
        workflowCalls.push({path: parsed.pathname, method: options.method, body});
        let result;
        if (parsed.pathname.endsWith(`/workflows/${sourceWorkflow}`)) result = {baseAction: {name: "Test course"}};
        else if (parsed.pathname.endsWith("/actions") && options.method === "GET") result = [action("COURSE_SECTION", "Section"), action("SESSION_0", "Session 1")];
        else if (parsed.pathname.includes("/states/workflow/") && options.method === "GET") {
            const source = parsed.pathname.endsWith(sourceState);
            result = {baseActionState: {children: ["COURSE_SECTION", "SESSION_0"].map(code => ({
                id: `${source ? "old" : "new"}-${code}`, stateType: source ? "completed" : "notStarted",
                action: {...action(code, code), metadata: [{key: "code", value: JSON.stringify(code)}]}
            }))}};
        } else result = {id: randomUUID()};
        return new Response(JSON.stringify(result), {status: 200, headers: {"Content-Type": "application/json"}});
    });
    let server;
    try {
        await prisma.professor.create({data: {id: professorId, fname: "Section", lname: "Test", email: `${professorId}@example.invalid`}});
        const source = await prisma.course.create({data: {
            professorId, name: "Section sync integration fixture", classId: "TEST", color: "#0484c9", section: "01",
            days: "Mo, We", startDate: "2026-10-12", workflowId: sourceWorkflow, workflowStateId: sourceState
        }});
        const session = await prisma.session.create({data: {courseId: source.id, sessionNum: 1, date: "2026-10-12"}});
        const resource = await prisma.resource.create({data: {
            courseId: source.id, name: "Worksheet", filename: "worksheet.pdf", mimeType: "application/pdf", filePath: "fixture-only.pdf"
        }});
        const {block} = await createSectionBlock(prisma, professorId, {sessionId: session.id, name: "Workshop"});
        const {material} = await saveSectionMaterial(prisma, professorId, session.id, {
            itemType: "Class Activity", itemLabel: `<p><a href="/api/cmt/resources/download/${resource.id}">Worksheet</a></p>`, blockId: block.id
        });
        await saveSectionMaterial(prisma, professorId, session.id, {itemType: "Personal Notes", itemLabel: "Private"});

        const first = await ensureCourseOffering(prisma, source.id, professorId);
        assert.equal((await ensureCourseOffering(prisma, source.id, professorId)).offeringId, first.offeringId);
        const second = await createCourseSection(prisma, professorId, source.id, {section: "02", progress: "reset"});
        assert.equal(first.offeringId, second.offeringId);
        assert.notEqual(source.workflowId, second.workflowId);
        const copiedSession = await prisma.session.findFirst({where: {courseId: second.id}, include: {blocks: true, material: true}});
        assert.equal(copiedSession.blocks[0].sharedKey, block.sharedKey);
        assert.notEqual(copiedSession.blocks[0].id, block.id);
        assert.equal(copiedSession.material.length, 1);
        assert.equal(copiedSession.material[0].sharedKey, material.sharedKey);
        assert.equal((await refreshSectionSync(prisma, source.id)).inSync, true);
        assert.ok(workflowCalls.some(call => call.body.stateType === "completed" && call.path.endsWith("new-COURSE_SECTION")));
        assert.ok(!workflowCalls.some(call => call.path.endsWith("new-SESSION_0")));

        await t.test("completion warning persists, dismisses, resolves and reappears on recurrence", async () => {
            await prisma.sessionBlock.update({where: {id: block.id}, data: {status: "COMPLETED"}});
            let sync = await refreshSectionSync(prisma, source.id);
            const warning = sync.issues.find(issue => issue.details.kind === "completion");
            assert.ok(warning);
            await prisma.sectionSyncIssue.update({where: {id: warning.id}, data: {dismissedAt: new Date()}});
            assert.ok((await refreshSectionSync(prisma, source.id)).issues[0].dismissedAt);
            await prisma.sessionBlock.update({where: {id: copiedSession.blocks[0].id}, data: {status: "COMPLETED"}});
            assert.equal((await refreshSectionSync(prisma, source.id)).inSync, true);
            await prisma.sessionBlock.update({where: {id: copiedSession.blocks[0].id}, data: {status: "IN_PROGRESS"}});
            sync = await refreshSectionSync(prisma, source.id);
            assert.equal(sync.issues[0].dismissedAt, null);
            assert.equal(sync.issues[0].occurrence, 2);
            await prisma.sessionBlock.updateMany({where: {sharedKey: block.sharedKey}, data: {status: "NOT_STARTED"}});
        });

        await t.test("shared block/material creation and edits preserve per-section progress", async () => {
            const shared = await createSectionBlock(prisma, professorId, {sessionId: session.id, name: "Shared lecture", applyToAll: true});
            assert.equal(await prisma.sessionBlock.count({where: {sharedKey: shared.block.sharedKey}}), 2);
            await saveSectionMaterial(prisma, professorId, session.id, {
                itemType: "Topic/Lecture", itemLabel: "New shared material", blockId: shared.block.id, applyToAll: true
            });
            assert.equal((await refreshSectionSync(prisma, source.id)).inSync, true);
            await saveSectionMaterial(prisma, professorId, session.id, {
                itemType: "Class Activity", itemLabel: "Edited locally", blockId: block.id
            }, material.id);
            assert.equal((await refreshSectionSync(prisma, source.id)).inSync, false);
            await saveSectionMaterial(prisma, professorId, session.id, {
                itemType: "Class Activity", itemLabel: "Edited everywhere", blockId: block.id, applyToAll: true
            }, material.id);
            assert.equal((await refreshSectionSync(prisma, source.id)).inSync, true);
        });

        await t.test("cancellation and archive checks exclude inactive sections", async () => {
            await prisma.session.update({where: {id: session.id}, data: {canceled: true}});
            assert.ok((await refreshSectionSync(prisma, source.id)).issues.some(issue => issue.details.kind === "cancellation"));
            await prisma.course.update({where: {id: second.id}, data: {active: false}});
            assert.equal((await refreshSectionSync(prisma, source.id)).inSync, true);
            await prisma.course.update({where: {id: second.id}, data: {active: true}});
            await prisma.session.update({where: {id: session.id}, data: {canceled: false}});
        });

        await t.test("a section-only block can be shared later without overwriting completion", async () => {
            const local = await createSectionBlock(prisma, professorId, {sessionId: session.id, name: "Initially local"});
            await saveSectionMaterial(prisma, professorId, session.id, {
                itemType: "Topic/Lecture", itemLabel: "Local lecture", blockId: local.block.id
            });
            assert.equal((await refreshSectionSync(prisma, source.id)).inSync, false);
            await shareSectionBlock(prisma, professorId, local.block.id);
            assert.equal((await refreshSectionSync(prisma, source.id)).inSync, true);
            const counterpart = await prisma.sessionBlock.findFirst({where: {sharedKey: local.block.sharedKey, session: {courseId: second.id}}});
            await prisma.sessionBlock.update({where: {id: counterpart.id}, data: {status: "COMPLETED"}});
            await shareSectionBlock(prisma, professorId, local.block.id);
            assert.equal((await prisma.sessionBlock.findUnique({where: {id: counterpart.id}})).status, "COMPLETED");
            await prisma.sessionBlock.update({where: {id: counterpart.id}, data: {status: "NOT_STARTED"}});
        });

        await t.test("duplicate sections and another instructor's content are rejected", async () => {
            await assert.rejects(createCourseSection(prisma, professorId, source.id, {section: "02"}), /already has/);
            await assert.rejects(createSectionBlock(prisma, randomUUID(), {sessionId: session.id, name: "Unauthorized"}));
            await assert.rejects(saveSectionMaterial(prisma, randomUUID(), session.id, {itemType: "Class Activity", itemLabel: "Unauthorized"}));
        });

        await t.test("removing a block preserves materials, compacts order and leaves related sections intact", async () => {
            const firstBlock = await createSectionBlock(prisma, professorId, {sessionId: session.id, name: "Before removal"});
            const removed = await createSectionBlock(prisma, professorId, {sessionId: session.id, name: "Remove this", applyToAll: true});
            const lastBlock = await createSectionBlock(prisma, professorId, {sessionId: session.id, name: "After removal"});
            const attached = await saveSectionMaterial(prisma, professorId, session.id, {
                itemType: "Class Activity", itemLabel: "Keep this material", blockId: removed.block.id
            });
            const inactive = await saveSectionMaterial(prisma, professorId, session.id, {
                itemType: "Class Activity", itemLabel: "Keep inactive material", blockId: removed.block.id
            });
            await prisma.sessionMaterial.update({where: {id: inactive.material.id}, data: {active: false}});
            await assert.rejects(removeSectionBlock(prisma, null, removed.block.id), error => error.status === 401);
            await assert.rejects(removeSectionBlock(prisma, randomUUID(), removed.block.id), error => error.status === 404);
            await assert.rejects(removeSectionBlock(prisma, professorId, "invalid"), error => error.status === 400);
            assert.equal(await removeSectionBlock(prisma, professorId, removed.block.id), source.id);
            assert.equal(await prisma.sessionBlock.findUnique({where: {id: removed.block.id}}), null);
            const retained = await prisma.sessionMaterial.findUnique({where: {id: attached.material.id}});
            assert.equal(retained.blockId, null);
            assert.equal(retained.sessionId, session.id);
            assert.equal(retained.label, "Keep this material");
            const retainedInactive = await prisma.sessionMaterial.findUnique({where: {id: inactive.material.id}});
            assert.equal(retainedInactive.blockId, null);
            assert.equal(retainedInactive.active, false);
            const ordered = await prisma.sessionBlock.findMany({where: {sessionId: session.id}, orderBy: {position: "asc"}});
            assert.deepEqual(ordered.map(block => block.position), ordered.map((_, index) => index));
            const counterpart = await prisma.sessionBlock.findFirst({where: {sharedKey: removed.block.sharedKey, session: {courseId: second.id}}});
            assert.ok(counterpart);
            assert.ok((await refreshSectionSync(prisma, source.id)).issues.some(issue => issue.issueKey === `block-plan:${removed.block.sharedKey}`));
            await removeSectionBlock(prisma, professorId, firstBlock.block.id);
            await removeSectionBlock(prisma, professorId, lastBlock.block.id);
            await removeSectionBlock(prisma, professorId, counterpart.id);
            await prisma.sessionMaterial.deleteMany({where: {id: {in: [attached.material.id, inactive.material.id]}}});
        });

        await t.test("section routes enforce ownership and persist notification acknowledgment", async () => {
            const app = express();
            app.use(express.json());
            app.use((req, _res, next) => {req.prisma = prisma; req.user = {uid: req.headers["x-fixture-user"] || professorId}; next();});
            app.use("/course", sectionsRouter);
            app.use("/course", courseRouter);
            app.use("/session", sessionRouter);
            app.use((err, _req, res, next) => {void next; res.status(err.status || 500).json({error: err.message});});
            server = app.listen(0, "127.0.0.1");
            await new Promise(resolve => server.once("listening", resolve));
            const base = `http://127.0.0.1:${server.address().port}/course/${source.id}`;
            assert.equal((await realFetch(`${base}/sections`)).status, 200);
            assert.equal((await realFetch(`${base}/section-sync`, {headers: {"x-fixture-user": randomUUID()}})).status, 404);
            await prisma.sessionBlock.update({where: {id: block.id}, data: {status: "COMPLETED"}});
            const sync = await (await realFetch(`${base}/section-sync`)).json();
            const warning = sync.issues[0];
            const dismissed = await realFetch(`${base}/section-sync/${warning.id}/dismiss`, {
                method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({occurrence: warning.occurrence})
            });
            assert.equal(dismissed.status, 200);
            assert.ok((await prisma.sectionSyncIssue.findUnique({where: {id: warning.id}})).dismissedAt);

            const removable = await createSectionBlock(prisma, professorId, {sessionId: session.id, name: "Route removal"});
            const blockUrl = `http://127.0.0.1:${server.address().port}/session/blocks/${removable.block.id}`;
            assert.equal((await realFetch(blockUrl, {method: "DELETE", headers: {"x-fixture-user": randomUUID()}})).status, 404);
            assert.ok(await prisma.sessionBlock.findUnique({where: {id: removable.block.id}}));
            const removalResponse = await realFetch(blockUrl, {method: "DELETE"});
            assert.equal(removalResponse.status, 200);
            assert.deepEqual(await removalResponse.json(), {success: true});
            assert.equal(await prisma.sessionBlock.findUnique({where: {id: removable.block.id}}), null);
            assert.equal((await realFetch(blockUrl, {method: "DELETE"})).status, 404);

            const otherBase = `http://127.0.0.1:${server.address().port}/course/${second.id}`;
            const unauthorized = await realFetch(otherBase, {method: "DELETE", headers: {"x-fixture-user": randomUUID()}});
            assert.notEqual(unauthorized.status, 200);
            assert.equal((await prisma.course.findUnique({where: {id: second.id}})).active, true);
            assert.equal((await realFetch(otherBase, {method: "DELETE"})).status, 200);
            assert.equal((await prisma.course.findUnique({where: {id: second.id}})).active, false);
            assert.equal((await prisma.course.findUnique({where: {id: source.id}})).active, true);
            assert.ok(await prisma.sessionMaterial.count({where: {session: {courseId: second.id}}}) > 0);
            const remaining = await (await realFetch(`${otherBase}/sections`)).json();
            assert.deepEqual(remaining.sections.map(section => section.id), [source.id]);
            assert.equal((await (await realFetch(`${base}/section-sync`)).json()).inSync, true);
            assert.equal((await realFetch(base, {method: "DELETE"})).status, 200);
            assert.deepEqual((await (await realFetch(`${base}/sections`)).json()).sections, []);
        });
    } finally {
        if (server) await new Promise(resolve => server.close(resolve));
        const courses = await prisma.course.findMany({where: {professorId}, select: {id: true, offeringId: true}});
        const courseIds = courses.map(course => course.id);
        const offeringIds = [...new Set(courses.map(course => course.offeringId).filter(Boolean))];
        await prisma.sessionMaterial.deleteMany({where: {session: {courseId: {in: courseIds}}}});
        await prisma.sessionBlock.deleteMany({where: {session: {courseId: {in: courseIds}}}});
        await prisma.session.deleteMany({where: {courseId: {in: courseIds}}});
        await prisma.resource.deleteMany({where: {courseId: {in: courseIds}}});
        await prisma.course.deleteMany({where: {professorId}});
        await prisma.sectionSyncIssue.deleteMany({where: {offeringId: {in: offeringIds}}});
        await prisma.courseOffering.deleteMany({where: {professorId}});
        await prisma.professor.deleteMany({where: {id: professorId}});
        await prisma.$disconnect();
    }
});
