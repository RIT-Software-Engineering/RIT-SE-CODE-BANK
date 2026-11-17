import { isInstructor } from "../middleware/requireInstructor.js";

export function accessError(message, status = 403) {
    return Object.assign(new Error(message), {status, userFacingMessage: message});
}

export function requireIdentity(user) {
    if (!user || typeof user.email !== "string" || !user.email.trim())
        throw accessError("Not authenticated", 401);
    if (!Array.isArray(user.roles) || !user.roles.some(role => ["student", "ta", "instructor", "professor"].includes(role)))
        throw accessError("No CMT role assigned");
}

export async function resolveSectionIdentity(prisma, user) {
    requireIdentity(user);
    const email = user.email.trim().toLowerCase();
    const [professors, student] = await Promise.all([
        prisma.professor.findMany({where: {email}, select: {id: true}}),
        prisma.student.findUnique({where: {email}, select: {id: true}})
    ]);
    if (professors.length > 1) throw accessError("Instructor identity needs administrative review", 409);
    return {professorId: professors[0]?.id, studentId: student?.id, canOwn: isInstructor(user)};
}

export function instructorSectionFilter(identity) {
    if (!identity.professorId) return {id: -1};
    return {OR: [
        ...(identity.canOwn ? [{professorId: identity.professorId}] : []),
        {isTemplate: false, instructors: {some: {professorId: identity.professorId}}}
    ]};
}

export async function sectionAccess(prisma, user, courseId, capability = "viewTeaching") {
    const id = Number(courseId);
    if (!Number.isSafeInteger(id) || id < 1) throw accessError("Invalid section ID", 400);
    const identity = await resolveSectionIdentity(prisma, user);
    const course = await prisma.course.findUnique({where: {id}});
    if (!course) throw accessError("Section not found", 404);
    const owner = identity.canOwn && course.professorId === identity.professorId;
    const instructor = Boolean(!course.isTemplate && identity.professorId && await prisma.sectionInstructor.findUnique({
        where: {courseId_professorId: {courseId: id, professorId: identity.professorId}}
    }));
    const ta = Boolean(course.active && !course.isTemplate && identity.studentId && await prisma.sectionTA.findUnique({
        where: {courseId_studentProfileId: {courseId: id, studentProfileId: identity.studentId}}
    }));
    const student = Boolean(course.active && !course.isTemplate && identity.studentId && await prisma.tBEnrollment.findUnique({
        where: {courseId_studentProfileId: {courseId: id, studentProfileId: identity.studentId}}
    }));
    const teaches = owner || instructor;
    const capabilities = {
        viewTeaching: teaches || ta,
        editMaterials: teaches,
        updateProgress: course.active && (teaches || ta),
        manageTeams: teaches,
        manageStaff: owner,
        archiveSection: owner,
        manageOffering: owner && (!course.offeringId || Boolean(await prisma.courseOffering.findFirst({
            where: {id: course.offeringId, professorId: identity.professorId}
        }))),
        viewEnrollment: student
    };
    if (!capabilities[capability]) throw accessError("You do not have permission for this section");
    return {course, identity, capabilities, role: owner ? "Owner" : instructor ? "Instructor" : ta ? "TA" : "Student"};
}

export function authorizeSection(prisma, capability, findCourseId) {
    return async (req, _res, next) => {
        try {
            requireIdentity(req.user);
            const courseId = typeof findCourseId === "function" ? await findCourseId(req) : req.params[findCourseId];
            if (!courseId) throw accessError("Section content not found", 404);
            req.sectionAccess = await sectionAccess(prisma || req.prisma, req.user, courseId, capability);
            if (req.sectionAccess.identity.professorId)
                req.user = {...req.user, uid: req.sectionAccess.identity.professorId};
            next();
        } catch (error) { next(error); }
    };
}

export async function authorizeActionState(prisma, user, actionStateId, courseId, fetchWorkflow) {
    if (typeof actionStateId !== "string" || !actionStateId) throw accessError("Invalid workflow state", 400);
    const identity = await resolveSectionIdentity(prisma, user);
    const courses = await prisma.course.findMany({where: {
        ...instructorSectionFilter(identity), ...(courseId && {id: Number(courseId)})
    }});
    for (const course of courses) {
        const state = await fetchWorkflow("GET", `states/workflow/${course.workflowStateId}`);
        const contains = node => node && (node.id === actionStateId ||
            (node.children || []).some(contains));
        if (contains(state.baseActionState)) return course;
    }
    throw accessError("Workflow state not found for your sections", 404);
}
