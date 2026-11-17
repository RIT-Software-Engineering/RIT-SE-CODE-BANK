import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import test from "node:test";
import express from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../prisma/generated/client/index.js";
import authMiddleware from "../authMiddleware.js";
import requireTeachingInstructor from "../middleware/requireTeachingInstructor.js";
import makeTeachingRouter from "../routes/teaching.js";
import makeStudentRouter from "../routes/students.js";
import makeAuthRouter from "../routes/auth.js";
import makeTeamBuilderRouter from "../routes/teamBuilder.js";
import courseRouter from "../routes/course.js";
import sectionsRouter from "../routes/sections.js";
import sessionRouter from "../routes/session.js";
import resourcesRouter from "../routes/resources.js";
import workflowRouter from "../routes/workflows.js";
import { createSectionBlock } from "../utils/sectionContent.js";

test("section-specific roles protect teaching, resources, teams, workflows and revocation", {
    skip: !process.argv.includes("--database")
}, async t => {
    const prisma = new PrismaClient();
    const prefix = randomUUID();
    const owner = {uid: `external-${prefix}`, email: `owner-${prefix}@rit.edu`, roles: ["instructor"]};
    const other = {uid: randomUUID(), email: `other-${prefix}@rit.edu`, roles: ["instructor"]};
    const colleague = {uid: randomUUID(), email: `colleague-${prefix}@rit.edu`, roles: ["instructor"]};
    const learner = {uid: randomUUID(), email: `student-${prefix}@rit.edu`, roles: ["student"]};
    const ownerId = randomUUID();
    const professorIds = [ownerId, other.uid, colleague.uid, learner.uid];
    const courseIds = [];
    let offering;
    let profile;
    let server;
    const realFetch = globalThis.fetch;
    const workflowOrigin = new URL(process.env.WORKFLOWS_API_URL || "http://localhost:3001").origin;
    const workflowCalls = [];
    const workflowStates = new Map();
    const actionWorkflows = new Map();
    t.mock.method(globalThis, "fetch", async (url, options = {}) => {
        const parsed = new URL(url);
        if (parsed.origin !== workflowOrigin) return realFetch(url, options);
        workflowCalls.push({path: parsed.pathname, method: options.method});
        let result = {};
        if (parsed.pathname.includes("/states/workflow/")) result = {
            baseActionState: {id: "root", children: [{id: workflowStates.get(parsed.pathname.split("/").at(-1)), action: {name: "Session"}, stateType: "notStarted"}]}
        };
        else if (parsed.pathname.endsWith("/actions") || parsed.pathname.endsWith("/permissions")) result = [];
        else if (parsed.pathname.includes("/actions/")) result = {id: parsed.pathname.split("/").at(-1), actionType: "simple",
            rootActionOf: actionWorkflows.has(parsed.pathname.split("/").at(-1)) ? [{id: actionWorkflows.get(parsed.pathname.split("/").at(-1))}] : []};
        else if (parsed.pathname.includes("/workflows/")) result = {baseAction: {name: "Fixture", permissions: []}, tags: []};
        return new Response(JSON.stringify(result), {status: 200, headers: {"Content-Type": "application/json"}});
    });

    try {
        for (const [id, user] of [[ownerId, owner], [other.uid, other], [colleague.uid, colleague], [learner.uid, learner]])
            await prisma.professor.create({data: {id, email: user.email, fname: "Role", lname: "Fixture"}});
        profile = await prisma.student.create({data: {email: learner.email}});
        offering = await prisma.courseOffering.create({data: {name: "Roles fixture", classId: "TEST", professorId: ownerId}});
        const createCourse = async (name, professorId, grouped = false) => {
            const workflowId = `${prefix}-${name}`;
            const course = await prisma.course.create({data: {name, professorId, classId: "TEST", color: "#888888",
                section: name, workflowId, workflowStateId: `${workflowId}-state`, ...(grouped && {offeringId: offering.id})}});
            courseIds.push(course.id);
            workflowStates.set(course.workflowStateId, `${workflowId}-action`);
            actionWorkflows.set(`${workflowId}-definition`, workflowId);
            return course;
        }
        const a = await createCourse("A", ownerId);
        const b = await createCourse("B", ownerId, true);
        const c = await createCourse("C", other.uid, true);
        const enrollment = await prisma.tBEnrollment.create({data: {courseId: a.id, email: learner.email, studentProfileId: profile.id}});
        const session = await prisma.session.create({data: {courseId: b.id, sessionNum: 1}});
        const otherSession = await prisma.session.create({data: {courseId: c.id, sessionNum: 1}});
        const sharedKey = randomUUID();
        const block = await prisma.sessionBlock.create({data: {sessionId: session.id, name: "Lecture", sharedKey}});
        await prisma.sessionBlock.create({data: {sessionId: otherSession.id, name: "Private sibling label", sharedKey}});
        await prisma.sessionMaterial.createMany({data: [
            {sessionId: session.id, sessionNum: 0, blockId: block.id, type: "Topic/Lecture", label: "Shared lecture"},
            {sessionId: session.id, sessionNum: 0, type: "Personal Notes", label: "PRIVATE NOTE"}
        ]});
        const syllabus = async course => prisma.resource.create({data: {courseId: course.id, name: "Syllabus",
            filename: "fixture.pdf", mimeType: "application/pdf", filePath: `missing-${prefix}-${course.id}`, isSyllabus: true}});
        const [resource, otherResource] = await Promise.all([syllabus(b), syllabus(c)]);

        const app = express();
        app.use(express.json());
        app.use(authMiddleware);
        app.use((req, _res, next) => {req.prisma = prisma; next();});
        app.use("/auth", makeAuthRouter(prisma));
        app.use("/students", makeStudentRouter(prisma));
        app.use("/teaching", makeTeachingRouter(prisma));
        app.use("/course", requireTeachingInstructor, sectionsRouter, courseRouter);
        app.use("/session", requireTeachingInstructor, sessionRouter);
        app.use("/resources", resourcesRouter);
        app.use("/teams", requireTeachingInstructor, makeTeamBuilderRouter(prisma));
        app.use("/workflow", requireTeachingInstructor, workflowRouter);
        app.use((error, _req, res, next) => {
            if (res.headersSent) return next(error);
            res.status(error.status || 500).json({error: error.userFacingMessage || error.message});
        });
        server = app.listen(0, "127.0.0.1");
        await new Promise(resolve => server.once("listening", resolve));
        const request = (path, user = owner, method = "GET", body) => {
            const headers = user ? {cookie: `cmt_id=${jwt.sign(user, process.env.JWT_SECRET || "dev-secret", {expiresIn: "1h"})}`} : {};
            if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
            return realFetch(`http://127.0.0.1:${server.address().port}${path}`, {method, headers,
                body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined});
        };
        const assign = (role, email, course = b) => request(`/teaching/sections/${course.id}/staff`, owner, "POST", {role, email});

        await t.test("only the owner assigns staff and repeated concurrent requests keep one assignment", async () => {
            assert.equal((await request(`/teaching/sections/${b.id}/staff`, other)).status, 403);
            assert.equal((await request(`/teaching/sections/${b.id}/staff`, learner, "POST", {role: "TA", email: learner.email})).status, 403);
            const results = await Promise.all(Array.from({length: 4}, () => assign("TA", learner.email)));
            assert.ok(results.every(response => response.status === 200));
            assert.equal(await prisma.sectionTA.count({where: {courseId: b.id, studentProfileId: profile.id}}), 1);
            assert.equal((await assign("INSTRUCTOR", colleague.email)).status, 200);
            assert.equal((await request(`/teaching/sections/${b.id}/staff`, colleague, "POST", {role: "TA", email: learner.email})).status, 403);
        });

        await t.test("one identity is a student in A and a TA in B with no automatic enrollment", async () => {
            const courses = await (await request("/students/me/courses", learner)).json();
            assert.deepEqual(courses.enrollments.map(row => row.course.id), [a.id]);
            const teaching = await (await request("/teaching/sections", learner)).json();
            assert.deepEqual(teaching.sections.map(row => [row.id, row.role]), [[b.id, "TA"]]);
            const auth = await (await request("/auth/me", learner)).json();
            assert.equal(auth.user.hasTeachingAccess, true);
            assert.equal(auth.user.hasInstructorAccess, false);
            assert.equal(auth.user.hasEnrollment, true);
            const detail = await (await request(`/teaching/sections/${b.id}`, learner)).json();
            assert.ok(!JSON.stringify(detail).includes("PRIVATE NOTE"));
            assert.ok(!JSON.stringify(detail).includes("filePath"));
            assert.equal((await request(`/teaching/sections/${a.id}`, learner)).status, 403);
            assert.equal((await request(`/course/${a.id}`, learner)).status, 403);
            assert.equal(await prisma.tBEnrollment.count({where: {studentProfileId: profile.id}}), 1);
        });

        await t.test("TA progress is scoped to B and accepts only status changes", async () => {
            const path = `/teaching/sections/${b.id}/blocks/${block.id}/status`;
            assert.equal((await request(path, learner, "PATCH", {status: "COMPLETED"})).status, 200);
            assert.equal((await request(path, learner, "PATCH", {status: "IN_PROGRESS", name: "Changed"})).status, 400);
            assert.equal((await request(`/teaching/sections/${a.id}/blocks/${block.id}/status`, learner, "PATCH", {status: "COMPLETED"})).status, 403);
            assert.equal((await request(`/session/${session.id}/cancellation`, learner, "PATCH", {canceled: true})).status, 403);
            assert.equal((await request(`/session/blocks/${block.id}`, learner, "PATCH", {status: "NOT_STARTED"})).status, 403);
        });

        await t.test("assigned instructors edit B while owner administration and sibling C stay protected", async () => {
            assert.equal((await request(`/course/${b.id}`, colleague)).status, 200);
            assert.equal((await request(`/session/blocks/${block.id}`, colleague, "PATCH", {name: "Updated lecture"})).status, 200);
            assert.equal((await request(`/session/${session.id}/cancellation`, colleague, "PATCH", {canceled: true})).status, 200);
            assert.equal((await request(`/course/${b.id}`, colleague, "DELETE")).status, 403);
            assert.equal((await request(`/course/${b.id}`, colleague, "PUT", {active: false})).status, 403);
            assert.equal((await request(`/course/${b.id}`, colleague, "PUT", {courseName: "Shared change"})).status, 403);
            assert.equal((await request(`/session/${c.id}`, colleague)).status, 403);
            assert.equal((await request("/session", other, "POST", {id: b.id, sessionCount: 1})).status, 403);
            assert.equal((await request(`/session/${session.id}/cancellation`, other, "PATCH", {canceled: false})).status, 403);
            assert.equal((await request(`/session/blocks/${block.id}/move`, colleague, "PATCH", {targetSessionId: otherSession.id})).status, 404);
        });

        await t.test("sharing blocks across sections checks every destination before writing", async () => {
            const count = await prisma.sessionBlock.count({where: {session: {courseId: {in: [b.id, c.id]}}}});
            await assert.rejects(createSectionBlock(prisma, colleague.uid, {sessionId: session.id, name: "No partial writes", applyToAll: true}));
            assert.equal(await prisma.sessionBlock.count({where: {session: {courseId: {in: [b.id, c.id]}}}}), count);
        });

        await t.test("resource access and uploads are section-scoped and syllabus replacement leaves C intact", async () => {
            for (const [path, method, body] of [[`/resources/${resource.id}`, "PUT", {name: "Wrong"}],
                [`/resources/${resource.id}`, "DELETE"], [`/resources/id/${resource.id}`, "GET"],
                [`/resources/download/${resource.id}`, "GET"], [`/resources/${b.id}`, "GET"]])
                assert.equal((await request(path, other, method, body)).status, 403);
            assert.equal((await request(`/resources/id/${resource.id}`, learner)).status, 200);
            const form = () => {
                const value = new FormData();
                value.append("file", new Blob(["fixture document"], {type: "application/pdf"}), `${prefix}.pdf`);
                return value;
            };
            assert.equal((await request(`/resources/${b.id}`, other, "POST", form())).status, 403);
            assert.equal((await request(`/resources/syllabus/${b.id}`, colleague, "POST", form())).status, 200);
            assert.equal((await prisma.resource.findUnique({where: {id: otherResource.id}})).filePath, otherResource.filePath);
            assert.equal((await request(`/resources/download/${resource.id}`, learner)).status, 200);
        });

        await t.test("sync warnings redact unauthorized siblings and acknowledge separately per instructor", async () => {
            const path = `/course/${b.id}/section-sync`;
            const sync = await (await request(path, colleague)).json();
            assert.deepEqual(sync.sections.map(course => course.id), [b.id]);
            assert.ok(!JSON.stringify(sync).includes("Private sibling label"));
            assert.ok(sync.issues.every(issue => issue.details.reviewCourseId === b.id));
            const warning = sync.issues[0];
            assert.equal((await request(`${path}/${warning.id}/dismiss`, colleague, "POST", {occurrence: warning.occurrence})).status, 200);
            assert.ok((await (await request(path, colleague)).json()).issues.find(issue => issue.id === warning.id).dismissedAt);
            assert.equal((await (await request(path, owner)).json()).issues.find(issue => issue.id === warning.id).dismissedAt, null);
        });

        await t.test("co-instructors manage section team sets and cannot import another section's enrollment", async () => {
            const set = await prisma.tBTeamSet.create({data: {courseId: b.id, name: "Shared teaching fixture", createdByProfessorId: ownerId}});
            const team = await prisma.tBTeam.create({data: {teamSetId: set.id, name: "Fixture team"}});
            const rows = await (await request(`/teams/courses/${b.id}/teamsets`, colleague)).json();
            assert.equal(rows[0].id, set.id);
            assert.equal((await request(`/teams/teamsets/${set.id}/publish`, colleague, "PATCH")).status, 200);
            assert.equal((await request(`/teams/teamsets/${set.id}/move`, colleague, "POST", {enrollmentId: enrollment.id, toTeamId: team.id})).status, 400);
            assert.equal((await request(`/teams/courses/${b.id}/teamsets`, other)).status, 403);
        });

        await t.test("workflow state IDs are checked before forwarding mutations", async () => {
            const before = workflowCalls.filter(call => call.method !== "GET").length;
            const state = workflowStates.get(b.workflowStateId);
            assert.equal((await request(`/workflow/editCheckmarkAction?courseId=${c.id}&asid=${state}`, colleague, "PUT", {checked: true})).status, 404);
            assert.equal((await request(`/workflow/editCheckmarkAction?courseId=${b.id}&asid=${state}`, other, "PUT", {checked: true})).status, 404);
            assert.equal(workflowCalls.filter(call => call.method !== "GET").length, before);
            assert.equal((await request(`/workflow/editCheckmarkAction?courseId=${b.id}&asid=${state}`, colleague, "PUT", {checked: true})).status, 200);
            const definitionPath = `/workflow/actionTemplate/action/${b.workflowId}-definition`;
            assert.equal((await request(definitionPath, other, "PUT", {name: "Wrong"})).status, 403);
            assert.equal((await request(definitionPath, colleague, "PUT", {name: "Teaching edit"})).status, 200);
            assert.equal((await request(`/workflow/actionTemplate/workflow/${b.workflowId}`, colleague)).status, 200);
            assert.equal((await request(definitionPath, other, "DELETE")).status, 403);
            const beforeSyllabus = await prisma.resource.findUnique({where: {id: resource.id}});
            const invalidForm = new FormData();
            invalidForm.append("file", new Blob(["not authorized"], {type: "application/pdf"}), `${prefix}-invalid.pdf`);
            assert.equal((await request(`/resources/syllabus/${b.id}?asid=unrelated-state`, colleague, "POST", invalidForm)).status, 404);
            assert.equal((await prisma.resource.findUnique({where: {id: resource.id}})).filePath, beforeSyllabus.filePath);
        });

        await t.test("removing assignments revokes the existing session and preserves enrollment", async () => {
            const members = (await (await request(`/teaching/sections/${b.id}/staff`)).json()).staff;
            for (const member of members.filter(member => member.role !== "OWNER"))
                assert.equal((await request(`/teaching/sections/${b.id}/staff/${member.role}/${member.id}`, owner, "DELETE")).status, 200);
            assert.equal((await request(`/teaching/sections/${b.id}`, learner)).status, 403);
            assert.equal((await request(`/course/${b.id}`, colleague)).status, 403);
            assert.equal((await request(`/teaching/sections/${b.id}/blocks/${block.id}/status`, learner, "PATCH", {status: "COMPLETED"})).status, 403);
            assert.ok(await prisma.tBEnrollment.findUnique({where: {id: enrollment.id}}));
            assert.equal((await request(`/teaching/sections/${b.id}`, null)).status, 401);
        });
    } finally {
        if (server) await new Promise(resolve => server.close(resolve));
        const files = await prisma.resource.findMany({where: {courseId: {in: courseIds}}, select: {filePath: true}});
        for (const {filePath} of files.filter(row => row.filePath.includes(prefix) && !row.filePath.startsWith("missing-")))
            await unlink(filePath).catch(() => {});
        await prisma.sectionInstructor.deleteMany({where: {courseId: {in: courseIds}}});
        await prisma.sectionTA.deleteMany({where: {courseId: {in: courseIds}}});
        await prisma.tBMember.deleteMany({where: {tbteam: {teamSet: {courseId: {in: courseIds}}}}});
        await prisma.tBTeam.deleteMany({where: {teamSet: {courseId: {in: courseIds}}}});
        await prisma.tBTeamSet.deleteMany({where: {courseId: {in: courseIds}}});
        await prisma.tBEnrollment.deleteMany({where: {courseId: {in: courseIds}}});
        await prisma.sessionMaterial.deleteMany({where: {session: {courseId: {in: courseIds}}}});
        await prisma.sessionBlock.deleteMany({where: {session: {courseId: {in: courseIds}}}});
        await prisma.session.deleteMany({where: {courseId: {in: courseIds}}});
        await prisma.resource.deleteMany({where: {courseId: {in: courseIds}}});
        await prisma.course.deleteMany({where: {id: {in: courseIds}}});
        if (offering) {
            await prisma.sectionSyncIssue.deleteMany({where: {offeringId: offering.id}});
            await prisma.courseOffering.delete({where: {id: offering.id}});
        }
        await prisma.professor.deleteMany({where: {id: {in: professorIds}}});
        if (profile) await prisma.student.delete({where: {id: profile.id}});
        await prisma.$disconnect();
    }
});
