import express from "express";
import { createCourseSection } from "../utils/courseSections.js";
import { ownedSection, sectionError } from "../utils/sectionContent.js";
import { refreshSectionSync } from "../utils/sectionSync.js";
import { authorizeSection, instructorSectionFilter } from "../utils/sectionPermissions.js";

const router = express.Router();
export default router;

router.get("/:courseId/sections", authorizeSection(null, "editMaterials", "courseId"), async (req, res) => {
    const course = await ownedSection(req.prisma, req.params.courseId, req.user?.uid);
    const sections = course.offeringId ? await req.prisma.course.findMany({
        where: {offeringId: course.offeringId, ...instructorSectionFilter(req.sectionAccess.identity), active: true, isTemplate: false},
        select: {id: true, section: true, days: true, startDate: true}, orderBy: {id: "asc"}
    }) : [{id: course.id, section: course.section, days: course.days, startDate: course.startDate}];
    res.json({sections});
});

router.post("/:courseId/sections", authorizeSection(null, "manageOffering", "courseId"), async (req, res) => {
    const course = await createCourseSection(req.prisma, req.user?.uid, req.params.courseId, req.body);
    res.status(201).json({course});
});

router.get("/:courseId/section-sync", authorizeSection(null, "editMaterials", "courseId"), async (req, res) => {
    await ownedSection(req.prisma, req.params.courseId, req.user?.uid);
    const sync = await refreshSectionSync(req.prisma, req.params.courseId);
    const courses = await req.prisma.course.findMany({where: instructorSectionFilter(req.sectionAccess.identity), select: {id: true}});
    const visible = new Set(courses.map(course => course.id));
    const acknowledgments = await req.prisma.sectionSyncAcknowledgment.findMany({where: {professorId: req.user.uid}});
    const issues = sync.issues.filter(issue => issue.details.sections.some(section => visible.has(section.courseId))).map(issue => {
        const sections = issue.details.sections.filter(section => visible.has(section.courseId));
        const restricted = sections.length !== issue.details.sections.length;
        const review = sections.find(section => section.courseId === issue.details.reviewCourseId) || sections[0];
        const acknowledgment = acknowledgments.find(item => item.issueId === issue.id && item.occurrence === issue.occurrence);
        return {...issue, dismissedAt: acknowledgment?.dismissedAt || null, details: {...issue.details,
            ...(restricted && {label: "Section progression", message: "This section differs from another section in the course."}),
            sections, reviewCourseId: review.courseId, reviewSessionNum: review.sessionNum}};
    });
    res.json({...sync, hasRelatedSections: sync.sections.length > 1,
        sections: sync.sections.filter(section => visible.has(section.id)), issues, inSync: issues.length === 0});
});

router.post("/:courseId/section-sync/:issueId/dismiss", authorizeSection(null, "editMaterials", "courseId"), async (req, res) => {
    const course = await ownedSection(req.prisma, req.params.courseId, req.user?.uid);
    if (!course.offeringId) throw sectionError("This section has no related course", 404);
    await req.prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM CourseOffering WHERE id = ${course.offeringId} FOR UPDATE`;
        const warning = await tx.sectionSyncIssue.findFirst({where: {id: Number(req.params.issueId), offeringId: course.offeringId}});
        if (!warning) throw sectionError("Sync warning not found", 404);
        const visibleCourses = await tx.course.findMany({where: instructorSectionFilter(req.sectionAccess.identity), select: {id: true}});
        if (!warning.details.sections.some(section => visibleCourses.some(item => item.id === section.courseId)))
            throw sectionError("Sync warning not found", 404);
        // A warning resolved or replaced by another request no longer needs acknowledgment.
        if (!warning.resolved && warning.occurrence === req.body.occurrence) {
            await tx.sectionSyncAcknowledgment.upsert({
                where: {issueId_professorId: {issueId: warning.id, professorId: req.user.uid}},
                create: {issueId: warning.id, professorId: req.user.uid, occurrence: warning.occurrence},
                update: {occurrence: warning.occurrence, dismissedAt: new Date()}
            });
        }
    });
    res.json({success: true});
});

