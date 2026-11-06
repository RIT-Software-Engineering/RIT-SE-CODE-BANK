import express from "express";
import { studentForUser } from "../utils/students.js";

export default function makeStudentRouter(prisma) {
    const router = express.Router();
    router.use(async (req, _res, next) => {
        try {
            req.studentProfile = await studentForUser(prisma, req.user);
            next();
        } catch (error) { next(error); }
    });

    router.get("/me", (req, res) => res.json({student: req.studentProfile}));

    router.get("/me/courses", async (req, res) => {
        const enrollments = await prisma.tBEnrollment.findMany({
            where: {studentProfileId: req.studentProfile.id, course: {active: true, isTemplate: false}},
            select: {id: true, course: {select: {
                id: true, name: true, classId: true, section: true, season: true, year: true, offeringId: true
            }}}, orderBy: {id: "asc"}
        });
        res.json({enrollments});
    });

    router.get("/me/teams", async (req, res) => {
        const memberships = await prisma.tBMember.findMany({
            where: {
                enrollment: {studentProfileId: req.studentProfile.id, course: {active: true, isTemplate: false}},
                tbteam: {teamSet: {status: "PUBLISHED", course: {active: true, isTemplate: false}}}
            },
            select: {
                id: true, role: true, enrollment: {select: {id: true, courseId: true}},
                tbteam: {select: {id: true, name: true, teamSet: {select: {id: true, name: true, courseId: true}}}}
            }, orderBy: {id: "asc"}
        });
        res.json({memberships: memberships.filter(item => item.enrollment.courseId === item.tbteam.teamSet.courseId)});
    });

    router.use((error, _req, res, next) => {
        if (res.headersSent) return next(error);
        console.error("Student request failed:", error.code || error.status || "unexpected error");
        const status = error.status || 500;
        res.status(status).json({error: status < 500 ? error.userFacingMessage : "Unable to load student information"});
    });
    return router;
}
