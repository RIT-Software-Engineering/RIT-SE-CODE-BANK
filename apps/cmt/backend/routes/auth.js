import express from "express";
import { isStudentUser, studentForUser } from "../utils/students.js";
import { instructorSectionFilter, resolveSectionIdentity } from "../utils/sectionPermissions.js";

const applicationRoles = new Set(["instructor", "professor", "student", "ta"]);

export default function makeAuthRouter(prisma) {
    const router = express.Router();
    router.use((_req, res, next) => {
        res.set("Cache-Control", "private, no-store");
        next();
    });
    router.get("/me", async (req, res) => {
        if (!req.user || typeof req.user.email !== "string" || !req.user.email.trim())
            return res.status(401).json({error: "Not authenticated"});
        const roles = [...new Set((Array.isArray(req.user.roles) ? req.user.roles : [])
            .filter(role => applicationRoles.has(role)))];
        if (!roles.length) return res.status(403).json({error: "No CMT role assigned"});
        try {
            const student = isStudentUser(req.user) ? await studentForUser(prisma, req.user) : null;
            const identity = await resolveSectionIdentity(prisma, req.user);
            const hasInstructorAccess = Boolean(identity.canOwn || (identity.professorId && await prisma.sectionInstructor.findFirst({
                where: {professorId: identity.professorId, course: {active: true, isTemplate: false}}, select: {id: true}
            })));
            const hasTeachingAccess = Boolean(await prisma.course.findFirst({where: {
                active: true, isTemplate: false, OR: [instructorSectionFilter(identity),
                    ...(identity.studentId ? [{teachingAssistants: {some: {studentProfileId: identity.studentId}}}] : [])]
            }, select: {id: true}}));
            const hasEnrollment = Boolean(identity.studentId && await prisma.tBEnrollment.findFirst({
                where: {studentProfileId: identity.studentId, course: {active: true, isTemplate: false}}, select: {id: true}
            }));
            const name = typeof req.user.name === "string" ? req.user.name :
                [req.user.givenName, req.user.sn].filter(value => typeof value === "string").join(" ");
            res.json({user: {
                name, email: req.user.email, roles, hasTeachingAccess, hasInstructorAccess, hasEnrollment,
                ...(student && {studentProfileId: student.id}),
                expiresInMs: typeof req.user.exp === "number" ? Math.max(0, req.user.exp * 1000 - Date.now()) : null
            }});
        } catch (error) {
            console.error("Session lookup failed:", error.code || error.status || "unexpected error");
            const status = error.status || 500;
            res.status(status).json({error: status < 500 ? error.userFacingMessage : "Unable to verify session"});
        }
    });
    return router;
}
