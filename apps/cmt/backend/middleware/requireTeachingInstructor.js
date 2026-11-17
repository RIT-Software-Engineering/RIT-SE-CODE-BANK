import { isInstructor } from "./requireInstructor.js";
import { accessError, resolveSectionIdentity } from "../utils/sectionPermissions.js";

export default async function requireTeachingInstructor(req, _res, next) {
    try {
        const identity = await resolveSectionIdentity(req.prisma, req.user);
        if (!identity.professorId) throw accessError("An instructor profile is required");
        if (!isInstructor(req.user) && !await req.prisma.sectionInstructor.findFirst({
            where: {professorId: identity.professorId, course: {active: true, isTemplate: false}}
        })) throw accessError("Instructor access required");
        req.user = {...req.user, uid: identity.professorId};
        req.sectionIdentity = identity;
        next();
    } catch (error) { next(error); }
}
