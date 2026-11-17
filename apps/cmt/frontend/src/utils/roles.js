export const INSTRUCTOR_ROLES = ["instructor", "professor"];
export const LEARNER_ROLES = ["student", "ta"];

export function hasAnyRole(user, roles) {
    return Array.isArray(user?.roles) && roles.some(role => user.roles.includes(role));
}

export function canTeach(user) {
    return hasAnyRole(user, INSTRUCTOR_ROLES) || user?.hasTeachingAccess === true;
}

export function canInstruct(user) {
    return hasAnyRole(user, INSTRUCTOR_ROLES) || user?.hasInstructorAccess === true;
}

export function canLearn(user) {
    return hasAnyRole(user, LEARNER_ROLES) || user?.hasEnrollment === true;
}

export function homeForUser(user) {
    if (hasAnyRole(user, INSTRUCTOR_ROLES)) return "/";
    if (user?.hasTeachingAccess) return "/teaching";
    if (hasAnyRole(user, LEARNER_ROLES)) return "/student/courses";
    return null;
}
