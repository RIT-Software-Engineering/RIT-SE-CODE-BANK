import { CMTError } from "@se-code-bank/cmt-shared-utilities";

export function studentError(message, status = 400) {
    return Object.assign(new CMTError({userFacingMessage: message}), {status});
}

export function normalizeStudentEmail(value) {
    if (typeof value !== "string") throw studentError("RIT email is required");
    const email = value.trim().toLowerCase();
    const match = email.match(/^([^\s@]+)@([^\s@]+)$/);
    const domains = (process.env.CMT_STUDENT_EMAIL_DOMAINS || "rit.edu").split(",").map(domain => domain.trim().toLowerCase()).filter(Boolean);
    if (!match || match[1].length > 64 || email.length > 254 || !domains.includes(match[2]) ||
        match[1].startsWith(".") || match[1].endsWith(".") || match[1].includes(".."))
        throw studentError("A valid institutional RIT email is required");
    return email;
}

export function studentName(value) {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value !== "string" || value.trim().length > 191)
        throw studentError("Student names must be text of at most 191 characters");
    return value.trim() || null;
}

export function namesConflict(a, b) {
    const normalize = value => value?.trim().replace(/\s+/g, " ").normalize("NFKC").toLowerCase();
    return ["fname", "lname"].some(field => a[field] && b[field] && normalize(a[field]) !== normalize(b[field]));
}

export function isStudentUser(user) {
    return Array.isArray(user?.roles) && user.roles.some(role => ["student", "ta"].includes(role));
}

export async function ensureStudentProfile(tx, input, {trusted = false} = {}) {
    const email = normalizeStudentEmail(input.email);
    const fname = studentName(input.fname);
    const lname = studentName(input.lname);
    const existing = await tx.student.findUnique({where: {email}});
    if (!trusted && existing && namesConflict(existing, {fname, lname}))
        throw studentError("The roster name conflicts with an existing student profile. Review the email and name before importing.", 409);
    return tx.student.upsert({
        where: {email}, create: {email, fname, lname},
        // Only verified authentication may replace another course's canonical profile information.
        update: trusted ? {...(fname && {fname}), ...(lname && {lname})} : {}
    });
}

export async function studentForUser(prisma, user) {
    if (!user) throw studentError("Not authenticated", 401);
    if (!isStudentUser(user)) throw studentError("Student or TA access required", 403);
    // The caller must pass the server-verified identity, never request-body profile fields.
    return ensureStudentProfile(prisma, {
        email: user.email, fname: user.givenName, lname: user.sn
    }, {trusted: true});
}

export function prepareStudentRoster(rows) {
    const students = new Map();
    for (const [index, row] of rows.entries()) {
        try {
            const entry = {email: normalizeStudentEmail(row.email), fname: studentName(row.firstName), lname: studentName(row.lastName)};
            const previous = students.get(entry.email);
            if (previous && namesConflict(previous, entry)) throw studentError("Conflicting duplicate email in this CSV", 409);
            students.set(entry.email, previous ? {email: entry.email, fname: previous.fname || entry.fname, lname: previous.lname || entry.lname} : entry);
        } catch (error) {
            throw studentError(`CSV row ${index + 2}: ${error.userFacingMessage || "Invalid student details"}`, error.status || 400);
        }
    }
    return [...students.values()];
}

export async function importStudentRoster(prisma, courseId, rows) {
    const entries = prepareStudentRoster(rows);
    await prisma.$transaction(async tx => {
        for (const [index, entry] of entries.entries()) {
            const profile = await ensureStudentProfile(tx, entry);
            const matches = await tx.tBEnrollment.findMany({
                where: {courseId, OR: [{email: entry.email}, {studentProfileId: profile.id}]}
            });
            if (matches.length > 1 || matches.some(enrollment => enrollment.studentProfileId && enrollment.studentProfileId !== profile.id))
                throw studentError(`Roster entry ${index + 1} conflicts with existing enrollments. Review the roster before importing.`, 409);
            const data = {
                email: entry.email, studentProfileId: profile.id,
                ...(entry.fname && {firstName: entry.fname}), ...(entry.lname && {lastName: entry.lname})
            };
            if (matches[0]) await tx.tBEnrollment.update({where: {id: matches[0].id}, data});
            else await tx.tBEnrollment.create({data: {courseId, ...data}});
        }
    }, {timeout: 20000});
    return prisma.tBEnrollment.findMany({where: {courseId}, orderBy: {id: "asc"}});
}
