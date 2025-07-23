import { PrismaClient } from "../src/generated/prisma/index.js";
import { sampleUsers } from "./test-data/sample_users.js";
import { sampleJournalEntries } from "./test-data/sample_journal_entries.js";
const prisma = new PrismaClient();
// Use prisma.<model> to interact with your database

async function main() {
    console.log("Clearing data");
    await prisma.journal_Entry.deleteMany();
    await prisma.user.deleteMany();
    await prisma.fruit.deleteMany();
    await prisma.application.deleteMany();

    console.log("Seeding data");
    //example data
    await prisma.fruit.create({
        data: { name: "Apple", color: "Red", size: "Medium" },
    });
    await prisma.journal_Entry.createMany({
        data: sampleJournalEntries,
    });
    await prisma.user.createMany({
        data: sampleUsers,
    });
    console.log("Drop and create finished.");
}
main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
