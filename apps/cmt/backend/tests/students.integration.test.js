import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import express from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../prisma/generated/client/index.js";
import authMiddleware from "../authMiddleware.js";
import requireInstructor from "../middleware/requireInstructor.js";
import makeStudentRouter from "../routes/students.js";
import makeTeamBuilderRouter from "../routes/teamBuilder.js";
import { backfillStudents } from "../utils/studentBackfill.js";
import { seedDevelopmentUsers } from "../utils/seedUsers.js";

test("minimal student profiles, roster compatibility, authenticated access and backfill", {
    skip: !process.argv.includes("--database")
}, async t => {
    const prisma = new PrismaClient();
    const uid = randomUUID();
    const otherUid = randomUUID();
    const email = `student-${uid}@rit.edu`;
    const otherEmail = `other-${uid}@rit.edu`;
    const taEmail = `ta-${uid}@rit.edu`;
    const partialEmail = `partial-${uid}@rit.edu`;
    const backfillEmail = `backfill-${uid}@rit.edu`;
    const conflictEmail = `conflict-${uid}@rit.edu`;
    const legacyEmailA = `legacy-a-${uid}@rit.edu`;
    const legacyEmailB = `legacy-b-${uid}@rit.edu`;
    const studentEmails = [email, otherEmail, taEmail, partialEmail, backfillEmail, conflictEmail, legacyEmailA, legacyEmailB];
    let server;
    const cookie = user => `cmt_id=${jwt.sign(user, process.env.JWT_SECRET || "dev-secret")}`;
    const instructor = {uid, email: `prof-${uid}@rit.edu`, roles: ["instructor"]};
    const student = {uid: `student-${uid}`, email, givenName: "Student", sn: "Fixture", roles: ["student"]};
    try {
        for (const user of [instructor, {uid: otherUid, email: `prof-${otherUid}@rit.edu`}]) {
            await prisma.professor.create({data: {id: user.uid, email: user.email, fname: "Instructor", lname: "Fixture"}});
        }
        const courses = [];
        for (let index = 0; index < 5; index++) courses.push(await prisma.course.create({data: {
            professorId: index === 4 ? otherUid : uid, name: "Student integration fixture", classId: "TEST", color: "#0484c9",
            section: String(index + 1), workflowId: randomUUID(), workflowStateId: randomUUID()
        }}));
        const [courseA, courseB, courseC, courseD, otherCourse] = courses;
        const legacy = await prisma.tBEnrollment.create({data: {
            courseId: courseA.id, studentId: "legacy-fixture-id", email: email.toUpperCase(), firstName: "Student", lastName: "Fixture"
        }});
        const published = await prisma.tBTeamSet.create({data: {
            name: "Published fixture", courseId: courseA.id, createdByProfessorId: uid, status: "PUBLISHED",
            teams: {create: {name: "Team 1", members: {create: {enrollmentId: legacy.id, role: "Member"}}}}
        }});
        const membership = await prisma.tBMember.findFirst({where: {enrollmentId: legacy.id}});
        const app = express();
        app.use(express.json());
        app.use(authMiddleware);
        app.use("/api/cmt/students", makeStudentRouter(prisma));
        app.use("/api/cmt/team-builder", requireInstructor, makeTeamBuilderRouter(prisma));
        for (const route of ["course", "session", "resources", "workflow"])
            app.use(`/api/cmt/${route}`, requireInstructor, (_req, res) => res.json({instructorOnly: true}));
        app.use((error, _req, res, next) => {void next; res.status(error.status || 500).json({error: error.userFacingMessage || "Request failed"});});
        server = app.listen(0, "127.0.0.1");
        await new Promise(resolve => server.once("listening", resolve));
        const base = `http://127.0.0.1:${server.address().port}/api/cmt`;
        const request = (url, user = student, options = {}) => fetch(`${base}${url}`, {
            ...options, headers: {...options.headers, ...(user && {cookie: cookie(user)})}
        });
        const upload = (courseId, csv, user = instructor) => {
            const body = new FormData();
            body.append("file", new Blob([csv], {type: "text/csv"}), "roster.csv");
            return request(`/team-builder/courses/${courseId}/roster`, user, {method: "POST", body});
        };

        await t.test("email-based imports preserve legacy enrollment/team IDs and do not collect new university IDs", async () => {
            const csv = `\uFEFFemail,firstName,lastName,studentId\n${email.toUpperCase()},Student,Fixture,DO-NOT-STORE`;
            for (let index = 0; index < 2; index++) {
                const response = await upload(courseA.id, csv);
                assert.equal(response.status, 200);
                assert.equal((await response.json()).roster[0].id, legacy.id);
            }
            assert.equal((await upload(courseB.id, csv)).status, 200);
            const profile = await prisma.student.findUnique({where: {email}});
            assert.deepEqual(Object.keys(profile).sort(), ["email", "fname", "id", "lname"]);
            assert.notEqual(profile.id, student.uid);
            const rows = await prisma.tBEnrollment.findMany({where: {studentProfileId: profile.id}});
            assert.equal(rows.length, 2);
            assert.equal(rows.find(row => row.courseId === courseA.id).studentId, "legacy-fixture-id");
            assert.equal(rows.find(row => row.courseId === courseB.id).studentId, null);
            assert.equal((await prisma.tBMember.findUnique({where: {id: membership.id}})).enrollmentId, legacy.id);
        });

        await t.test("existing team generation and publication work with email-only enrollments", async () => {
            const response = await request(`/team-builder/courses/${courseB.id}/teamsets`, instructor, {
                method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({name: "Email-only fixture", teamSize: 4})
            });
            assert.equal(response.status, 200);
            const teamSet = await response.json();
            assert.equal(teamSet.teams[0].members[0].enrollment.email, email);
            assert.equal(teamSet.teams[0].members[0].enrollment.studentId, null);
            assert.equal((await request(`/team-builder/teamsets/${teamSet.id}/publish`, instructor, {method: "PATCH"})).status, 200);
            assert.equal((await (await request("/students/me/teams")).json()).memberships.length, 2);
            assert.equal((await request(`/team-builder/teamsets/${teamSet.id}/unpublish`, instructor, {method: "PATCH"})).status, 200);
        });

        await t.test("invalid emails and conflicting names roll back the entire import", async () => {
            assert.equal((await upload(courseB.id, "studentId,firstName\nunused,Student")).status, 400);
            assert.equal((await upload(courseB.id, "email\nexternal@example.invalid")).status, 400);
            const conflict = await upload(courseB.id, `email,firstName\n${partialEmail},Temporary\n${email},Conflicting`);
            assert.equal(conflict.status, 409);
            assert.equal(await prisma.student.findUnique({where: {email: partialEmail}}), null);
            assert.equal((await upload(otherCourse.id, `email\n${email}`)).status, 404);
            assert.equal((await upload(courseA.id, `email\n${otherEmail}`, student)).status, 403);
        });

        await t.test("self endpoints expose only the signed-in student's enrolled sections and published teams", async () => {
            assert.equal((await request("/students/me", null)).status, 401);
            assert.equal((await request("/students/me", instructor)).status, 403);
            const self = await (await request(`/students/me?email=${otherEmail}`)).json();
            assert.equal(self.student.email, email);
            assert.deepEqual(Object.keys(self.student).sort(), ["email", "fname", "id", "lname"]);
            const enrolled = await (await request("/students/me/courses")).json();
            assert.deepEqual(enrolled.enrollments.map(row => row.course.id).sort((a, b) => a - b), [courseA.id, courseB.id]);
            assert.ok(enrolled.enrollments.every(row => !Object.hasOwn(row.course, "workflowStateId")));
            assert.equal((await (await request("/students/me/teams")).json()).memberships.length, 1);
            await prisma.tBTeamSet.update({where: {id: published.id}, data: {status: "DRAFT"}});
            assert.equal((await (await request("/students/me/teams")).json()).memberships.length, 0);
            await prisma.tBTeamSet.update({where: {id: published.id}, data: {status: "PUBLISHED"}});
            await prisma.course.update({where: {id: courseA.id}, data: {active: false}});
            assert.equal((await (await request("/students/me/teams")).json()).memberships.length, 0);
            assert.equal((await (await request("/students/me/courses")).json()).enrollments.length, 1);
            await prisma.course.update({where: {id: courseA.id}, data: {active: true}});
            const other = {...student, uid: otherUid, email: otherEmail};
            assert.deepEqual((await (await request("/students/me/courses", other)).json()).enrollments, []);
            assert.deepEqual((await (await request("/students/me/teams", other)).json()).memberships, []);
        });

        await t.test("student/TA sessions cannot reach instructor APIs even with a legacy Professor row", async () => {
            await prisma.professor.create({data: {id: student.uid, email, fname: "Old", lname: "Fixture"}});
            for (const url of ["/course", "/session", "/resources", "/workflow", "/team-builder"]) {
                assert.equal((await request(url)).status, 403);
                assert.equal((await request(url, null)).status, 401);
                assert.equal((await request(url, instructor)).status, 200);
            }
            const ta = {...student, uid: `ta-${uid}`, email: taEmail, roles: ["ta"]};
            assert.equal((await request("/students/me", ta)).status, 200);
            assert.equal((await request("/course", ta)).status, 403);
        });

        await t.test("backfill previews, preserves existing links, and reports conflicting records without identity data", async () => {
            const safe = [];
            for (const course of [courseC, courseD]) safe.push(await prisma.tBEnrollment.create({data: {
                courseId: course.id, email: backfillEmail, firstName: "Backfill", lastName: "Fixture"
            }}));
            for (const [index, course] of [courseC, courseD].entries()) await prisma.tBEnrollment.create({data: {
                courseId: course.id, email: conflictEmail, firstName: index ? "Different" : "Original"
            }});
            await prisma.tBEnrollment.create({data: {courseId: courseC.id, studentId: `missing-${uid}`}});
            for (const [index, course] of [courseC, courseD].entries()) await prisma.tBEnrollment.create({data: {
                courseId: course.id, email: index ? legacyEmailB : legacyEmailA, studentId: `ambiguous-${uid}`
            }});
            const enrollmentIds = (await prisma.tBEnrollment.findMany({
                where: {courseId: {in: courses.map(course => course.id)}}, select: {id: true}
            })).map(row => row.id);
            const before = await prisma.student.count();
            const preview = await backfillStudents(prisma, {enrollmentIds});
            assert.equal(await prisma.student.count(), before);
            assert.ok(preview.wouldLink >= 2);
            assert.ok(preview.issues.length >= 3);
            const report = await backfillStudents(prisma, {apply: true, enrollmentIds});
            assert.ok(report.linked >= 2);
            const linked = await prisma.tBEnrollment.findMany({where: {id: {in: safe.map(row => row.id)}}});
            assert.ok(linked.every(row => row.studentProfileId === linked[0].studentProfileId && row.studentProfileId));
            assert.equal(await prisma.student.findUnique({where: {email: conflictEmail}}), null);
            assert.equal(await prisma.student.findUnique({where: {email: legacyEmailA}}), null);
            const again = await backfillStudents(prisma, {apply: true, enrollmentIds});
            assert.equal(again.linked, 0);
            assert.ok(!JSON.stringify(report).includes(email));
            assert.ok(!JSON.stringify(report).includes(`ambiguous-${uid}`));
        });

        await t.test("role-aware seeding is repeatable and never adds student/TA Professor records", async () => {
            const users = [
                {...instructor, givenName: "Instructor", sn: "Fixture"},
                {...student, uid: `seed-student-${uid}`},
                {uid: `seed-ta-${uid}`, email: taEmail, givenName: "TA", sn: "Fixture", roles: ["ta"]}
            ];
            await seedDevelopmentUsers(prisma, users);
            await seedDevelopmentUsers(prisma, users);
            assert.equal(await prisma.professor.count({where: {id: {in: users.slice(1).map(user => user.uid)}}}), 0);
            assert.equal(await prisma.student.count({where: {email: {in: [email, taEmail]}}}), 2);
        });
    } finally {
        if (server) await new Promise(resolve => server.close(resolve));
        const fixtureIds = [uid, otherUid, `student-${uid}`];
        const courses = await prisma.course.findMany({where: {professorId: {in: fixtureIds}}, select: {id: true}});
        const ids = courses.map(row => row.id);
        await prisma.tBMember.deleteMany({where: {enrollment: {courseId: {in: ids}}}});
        await prisma.tBTeam.deleteMany({where: {teamSet: {courseId: {in: ids}}}});
        await prisma.tBTeamSet.deleteMany({where: {courseId: {in: ids}}});
        await prisma.tBEnrollment.deleteMany({where: {courseId: {in: ids}}});
        await prisma.course.deleteMany({where: {id: {in: ids}}});
        await prisma.professor.deleteMany({where: {id: {in: fixtureIds}}});
        await prisma.student.deleteMany({where: {email: {in: studentEmails}}});
        await prisma.$disconnect();
    }
});
