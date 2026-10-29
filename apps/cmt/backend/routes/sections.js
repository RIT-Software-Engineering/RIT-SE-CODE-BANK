import express from "express";
import { createCourseSection } from "../utils/courseSections.js";
import { ownedSection, sectionError } from "../utils/sectionContent.js";
import { refreshSectionSync } from "../utils/sectionSync.js";

const router = express.Router();
export default router;

router.get("/:courseId/sections", async (req, res) => {
    const course = await ownedSection(req.prisma, req.params.courseId, req.user?.uid);
    const sections = course.offeringId ? await req.prisma.course.findMany({
        where: {offeringId: course.offeringId, professorId: req.user.uid, active: true, isTemplate: false},
        select: {id: true, section: true, days: true, startDate: true}, orderBy: {id: "asc"}
    }) : [{id: course.id, section: course.section, days: course.days, startDate: course.startDate}];
    res.json({sections});
});

router.post("/:courseId/sections", async (req, res) => {
    const course = await createCourseSection(req.prisma, req.user?.uid, req.params.courseId, req.body);
    res.status(201).json({course});
});

router.get("/:courseId/section-sync", async (req, res) => {
    await ownedSection(req.prisma, req.params.courseId, req.user?.uid);
    res.json(await refreshSectionSync(req.prisma, req.params.courseId));
});

router.post("/:courseId/section-sync/:issueId/dismiss", async (req, res) => {
    const course = await ownedSection(req.prisma, req.params.courseId, req.user?.uid);
    if (!course.offeringId) throw sectionError("This section has no related course", 404);
    await req.prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM CourseOffering WHERE id = ${course.offeringId} FOR UPDATE`;
        const warning = await tx.sectionSyncIssue.findFirst({where: {id: Number(req.params.issueId), offeringId: course.offeringId}});
        if (!warning) throw sectionError("Sync warning not found", 404);
        // A warning resolved or replaced by another request no longer needs acknowledgment.
        if (!warning.resolved && warning.occurrence === req.body.occurrence) {
            await tx.sectionSyncIssue.update({where: {id: warning.id}, data: {dismissedAt: new Date()}});
        }
    });
    res.json({success: true});
});

