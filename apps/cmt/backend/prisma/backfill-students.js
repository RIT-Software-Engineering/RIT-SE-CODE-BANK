import { PrismaClient } from "./generated/client/index.js";
import { backfillStudents } from "../utils/studentBackfill.js";

const prisma = new PrismaClient();
try {
    const report = await backfillStudents(prisma, {apply: process.argv.includes("--apply")});
    console.log(JSON.stringify(report, null, 2));
    console.log("Legacy university-ID values were retained for a separate reviewed cleanup. New roster imports do not collect them.");
} finally {
    await prisma.$disconnect();
}
