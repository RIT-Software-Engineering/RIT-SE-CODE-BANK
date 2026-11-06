import { isInstructor } from "../middleware/requireInstructor.js";
import { ensureStudentProfile, isStudentUser } from "./students.js";

export async function seedDevelopmentUsers(prisma, users) {
    let professors = 0;
    let students = 0;
    for (const user of users) {
        if (isInstructor(user)) {
            const data = {fname: user.givenName, lname: user.sn, email: user.email};
            await prisma.professor.upsert({where: {id: user.uid}, create: {id: user.uid, ...data}, update: data});
            professors++;
        }
        if (isStudentUser(user)) {
            await ensureStudentProfile(prisma, {email: user.email, fname: user.givenName, lname: user.sn}, {trusted: true});
            students++;
        }
    }
    return {professors, students};
}
