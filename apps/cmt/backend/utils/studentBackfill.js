import { ensureStudentProfile, namesConflict, normalizeStudentEmail, studentName } from "./students.js";

export async function backfillStudents(prisma, {apply = false, enrollmentIds} = {}) {
    const enrollments = await prisma.tBEnrollment.findMany({
        where: enrollmentIds ? {id: {in: enrollmentIds}} : {},
        include: {studentProfile: true}, orderBy: {id: "asc"}
    });
    const groups = new Map();
    const legacyEmails = new Map();
    const report = {apply, linked: 0, alreadyLinked: 0, profilesCreated: 0, wouldLink: 0, wouldCreate: 0, issues: []};
    for (const enrollment of enrollments) {
        try {
            const email = normalizeStudentEmail(enrollment.email);
            const row = {...enrollment, email, fname: studentName(enrollment.firstName), lname: studentName(enrollment.lastName)};
            if (!groups.has(email)) groups.set(email, []);
            groups.get(email).push(row);
            if (enrollment.studentId) {
                if (!legacyEmails.has(enrollment.studentId)) legacyEmails.set(enrollment.studentId, new Set());
                legacyEmails.get(enrollment.studentId).add(email);
            }
        } catch {
            report.issues.push({enrollmentIds: [enrollment.id], reason: "Missing/invalid institutional email or invalid name"});
        }
    }
    for (const [email, rows] of groups) {
        const profile = await prisma.student.findUnique({where: {email}});
        const name = {fname: null, lname: null};
        let conflict = false;
        for (const row of rows) {
            if (namesConflict(name, row)) conflict = true;
            name.fname ||= row.fname;
            name.lname ||= row.lname;
        }
        const profileIds = new Set(rows.map(row => row.studentProfileId).filter(Boolean));
        const duplicateCourses = new Set(rows.map(row => row.courseId)).size !== rows.length;
        const ambiguousLegacyIdentity = rows.some(row => row.studentId && legacyEmails.get(row.studentId)?.size > 1);
        const wrongProfile = rows.some(row => row.studentProfile &&
            (row.studentProfile.id !== profile?.id || row.studentProfile.email !== email));
        if (conflict || duplicateCourses || ambiguousLegacyIdentity || wrongProfile || profileIds.size > 1 || (profile && namesConflict(profile, name))) {
            report.issues.push({enrollmentIds: rows.map(row => row.id), reason: "Conflicting identity, name, or duplicate section enrollment; review required"});
            continue;
        }
        const unlinked = rows.filter(row => !row.studentProfileId);
        report.alreadyLinked += rows.length - unlinked.length;
        if (!unlinked.length) continue;
        report.wouldLink += unlinked.length;
        if (!profile) report.wouldCreate++;
        if (apply) {
            const linked = await prisma.$transaction(async tx => {
                const student = await ensureStudentProfile(tx, {email, ...name});
                return tx.tBEnrollment.updateMany({
                    where: {id: {in: unlinked.map(row => row.id)}, studentProfileId: null},
                    data: {studentProfileId: student.id}
                });
            });
            report.linked += linked.count;
            if (!profile) report.profilesCreated++;
        }
    }
    return report;
}
