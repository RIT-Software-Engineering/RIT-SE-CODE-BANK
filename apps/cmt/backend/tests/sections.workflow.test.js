import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PrismaClient } from "../prisma/generated/client/index.js";
import { workflowsFetch } from "@se-code-bank/cmt-shared-utilities";
import { objectToNewWorkflow } from "../utils/workflows/api.js";
import { createCourseSection } from "../utils/courseSections.js";

test("section creation against the live Workflows API preserves setup and independently copies progress", {
    skip: !process.argv.includes("--live-workflows")
}, async () => {
    const prisma = new PrismaClient();
    const professorId = randomUUID();
    const workflowIds = new Set();
    try {
        await prisma.professor.create({data: {id: professorId, fname: "Workflow", lname: "Fixture", email: `${professorId}@example.invalid`}});
        const workflow = await objectToNewWorkflow({name: "CMT section verification fixture", childActions: [
            {name: "Section setup", actionType: "simple", form: "test form", metadata: {code: "COURSE_SECTION"}},
            {name: "Session 1", actionType: "simple", metadata: {code: "SESSION_0"}}
        ]}, professorId);
        workflowIds.add(workflow.id);
        const state = await workflowsFetch("POST", "states/workflow", {userId: professorId, workflowId: workflow.id});
        const tree = await workflowsFetch("GET", `states/workflow/${state.id}`);
        for (const child of tree.baseActionState.children)
            await workflowsFetch("PUT", `states/action/${child.id}`, {stateType: "completed"});
        const source = await prisma.course.create({data: {
            professorId, name: "Live workflow fixture", classId: "TEST", color: "#0484c9", section: "01",
            workflowId: workflow.id, workflowStateId: state.id,
            sessions: {create: {sessionNum: 1, blocks: {create: {name: "Workshop", status: "COMPLETED"}}}}
        }});
        const fresh = await createCourseSection(prisma, professorId, source.id, {section: "02", progress: "reset"});
        workflowIds.add(fresh.workflowId);
        const freshState = await workflowsFetch("GET", `states/workflow/${fresh.workflowStateId}`);
        const statuses = new Map(freshState.baseActionState.children.map(child => [child.action.name, child.stateType]));
        assert.equal(statuses.get("Section setup"), "completed");
        assert.equal(statuses.get("Session 1"), "notStarted");
        assert.equal(freshState.baseActionState.stateType, "inProgress");
        assert.equal(await prisma.sessionBlock.count({where: {session: {courseId: fresh.id}, status: "NOT_STARTED"}}), 1);
        const definition = await workflowsFetch("GET", `actions?workflowId=${fresh.workflowId}`);
        assert.equal(definition.find(action => action.name === "Section setup").form, "test form");

        const copied = await createCourseSection(prisma, professorId, source.id, {section: "03", progress: "copy"});
        workflowIds.add(copied.workflowId);
        const copiedState = await workflowsFetch("GET", `states/workflow/${copied.workflowStateId}`);
        assert.ok(copiedState.baseActionState.children.every(child => child.stateType === "completed"));
        assert.equal(await prisma.sessionBlock.count({where: {session: {courseId: copied.id}, status: "COMPLETED"}}), 1);
    } finally {
        const courses = await prisma.course.findMany({where: {professorId}});
        courses.forEach(course => workflowIds.add(course.workflowId));
        const ids = courses.map(course => course.id);
        await prisma.sessionBlock.deleteMany({where: {session: {courseId: {in: ids}}}});
        await prisma.session.deleteMany({where: {courseId: {in: ids}}});
        await prisma.sectionSyncIssue.deleteMany({where: {offering: {professorId}}});
        await prisma.course.deleteMany({where: {professorId}});
        await prisma.courseOffering.deleteMany({where: {professorId}});
        await prisma.professor.deleteMany({where: {id: professorId}});
        await prisma.$disconnect();
        for (const id of workflowIds) {
            const actions = await workflowsFetch("GET", `actions?workflowId=${id}`);
            await workflowsFetch("DELETE", `workflows/${id}`);
            for (const action of actions) await workflowsFetch("DELETE", `actions/${action.id}`);
        }
    }
});
