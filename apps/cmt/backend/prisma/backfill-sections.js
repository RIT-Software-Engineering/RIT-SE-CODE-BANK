import { PrismaClient } from "./generated/client/index.js";
import { ensureCourseOffering } from "../utils/courseSections.js";

const prisma = new PrismaClient();
try {
    if (process.argv.includes("--check")) {
        const columns = await prisma.$queryRaw`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Course' AND COLUMN_NAME = 'offeringId'`;
        if (columns.length) {
            const duplicates = await prisma.$queryRaw`SELECT offeringId, section, COUNT(*) AS total FROM Course WHERE offeringId IS NOT NULL AND section IS NOT NULL GROUP BY offeringId, section HAVING COUNT(*) > 1`;
            console.log(`Duplicate section numbers within an offering: ${duplicates.length}`);
            if (duplicates.length) process.exitCode = 1;
        } else {
            console.log("offeringId is a new nullable column; all existing rows will initially have no offering, so the new unique constraint cannot conflict.");
        }
    } else {
        const courses = await prisma.course.findMany({where: {isTemplate: false}});
        for (const course of courses) await ensureCourseOffering(prisma, course.id, course.professorId);
        console.log(`Initialized section relationships for ${courses.length} courses. Existing courses were not merged.`);
    }
} finally {
    await prisma.$disconnect();
}
