import express from "express";
import { accessError, instructorSectionFilter, requireIdentity, resolveSectionIdentity, sectionAccess } from "../utils/sectionPermissions.js";
import { normalizeStudentEmail } from "../utils/students.js";
import { refreshSectionSync } from "../utils/sectionSync.js";

export default function makeTeachingRouter(prisma) {
    const router = express.Router();
    router.use((req, res, next) => {
        res.set("Cache-Control", "private, no-store");
        try { requireIdentity(req.user); next(); } catch (error) { next(error); }
    });

    router.get("/sections", async (req, res) => {
        const identity = await resolveSectionIdentity(prisma, req.user);
        const courses = await prisma.course.findMany({
            where: {active: true, isTemplate: false, OR: [
                instructorSectionFilter(identity),
                ...(identity.studentId ? [{teachingAssistants: {some: {studentProfileId: identity.studentId}}}] : [])
            ]}, orderBy: {id: "desc"}
        });
        const sections = await Promise.all(courses.map(async course => {
            const access = await sectionAccess(prisma, req.user, course.id);
            return {id: course.id, name: course.name, classId: course.classId, section: course.section,
                season: course.season, year: course.year, role: access.role, capabilities: access.capabilities};
        }));
        res.json({sections});
    });

    router.get("/sections/:courseId", async (req, res) => {
        const access = await sectionAccess(prisma, req.user, req.params.courseId);
        const sessions = await prisma.session.findMany({
            where: {courseId: access.course.id}, orderBy: {sessionNum: "asc"},
            select: {id: true, sessionNum: true, date: true, canceled: true,
                blocks: {orderBy: [{position: "asc"}, {id: "asc"}], select: {id: true, name: true, status: true}},
                material: {where: {active: true, type: {not: "Personal Notes"}},
                    select: {id: true, blockId: true, type: true, label: true, body: true}}}
        });
        const {id, name, classId, section, season, year} = access.course;
        res.json({course: {id, name, classId, section, season, year}, sessions,
            role: access.role, capabilities: access.capabilities});
    });

    router.patch("/sections/:courseId/blocks/:blockId/status", async (req, res) => {
        // Recheck the assignment inside the transaction used for the update.
        const courseId = Number(req.params.courseId);
        const block = await prisma.$transaction(async tx => {
            await sectionAccess(tx, req.user, courseId, "updateProgress");
            if (Object.keys(req.body || {}).some(key => key !== "status") ||
                !["NOT_STARTED", "IN_PROGRESS", "COMPLETED"].includes(req.body?.status))
                throw accessError("Supply a valid block status", 400);
            const existing = await tx.sessionBlock.findFirst({where: {id: Number(req.params.blockId), session: {courseId}}});
            if (!existing) throw accessError("Block not found in this section", 404);
            return tx.sessionBlock.update({where: {id: existing.id}, data: {status: req.body.status}});
        });
        await refreshSectionSync(prisma, courseId);
        res.json({block});
    });

    router.get("/sections/:courseId/staff", async (req, res) => {
        const {course} = await sectionAccess(prisma, req.user, req.params.courseId, "manageStaff");
        const profile = {select: {id: true, fname: true, lname: true, email: true}};
        const [owner, instructors, assistants] = await Promise.all([
            prisma.professor.findUnique({where: {id: course.professorId}, ...profile}),
            prisma.sectionInstructor.findMany({where: {courseId: course.id}, include: {professor: profile}}),
            prisma.sectionTA.findMany({where: {courseId: course.id}, include: {student: profile}})
        ]);
        res.json({staff: [
            {role: "OWNER", profile: owner},
            ...instructors.map(row => ({id: row.id, role: "INSTRUCTOR", profile: row.professor})),
            ...assistants.map(row => ({id: row.id, role: "TA", profile: row.student}))
        ]});
    });

    router.post("/sections/:courseId/staff", async (req, res) => {
        const email = normalizeStudentEmail(req.body?.email);
        const {role} = req.body || {};
        if (!["INSTRUCTOR", "TA"].includes(role)) throw accessError("Choose Instructor or TA", 400);
        await prisma.$transaction(async tx => {
            const {course, identity} = await sectionAccess(tx, req.user, req.params.courseId, "manageStaff");
            if (course.isTemplate || !course.active) throw accessError("Choose an active course section", 400);
            if (role === "INSTRUCTOR") {
                const candidates = await tx.professor.findMany({where: {email}, select: {id: true}});
                if (candidates.length !== 1) throw accessError("A unique existing instructor profile is required", 409);
                const professorId = candidates[0].id;
                if (professorId === course.professorId) throw accessError("This instructor already owns the section", 409);
                await tx.sectionInstructor.createMany({
                    data: [{courseId: course.id, professorId, assignedByProfessorId: identity.professorId}], skipDuplicates: true
                });
            } else {
                const student = await tx.student.findUnique({where: {email}, select: {id: true}});
                if (!student) throw accessError("An existing student profile is required", 404);
                await tx.sectionTA.createMany({
                    data: [{courseId: course.id, studentProfileId: student.id, assignedByProfessorId: identity.professorId}], skipDuplicates: true
                });
            }
        });
        res.json({success: true});
    });

    router.delete("/sections/:courseId/staff/:role/:id", async (req, res) => {
        const {role} = req.params;
        if (!["INSTRUCTOR", "TA"].includes(role)) throw accessError("Invalid staff role", 400);
        await prisma.$transaction(async tx => {
            const {course} = await sectionAccess(tx, req.user, req.params.courseId, "manageStaff");
            const model = role === "INSTRUCTOR" ? tx.sectionInstructor : tx.sectionTA;
            const result = await model.deleteMany({where: {id: Number(req.params.id), courseId: course.id}});
            if (!result.count) throw accessError("Assignment not found in this section", 404);
        });
        res.json({success: true});
    });

    router.use((error, _req, res, next) => {
        if (res.headersSent) return next(error);
        res.status(error.status || 500).json({error: error.userFacingMessage || "Unable to load teaching information"});
    });
    return router;
}
