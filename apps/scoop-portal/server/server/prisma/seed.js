import { PrismaClient } from "../src/generated/prisma/index.js";
import { sampleUsers } from "./test-data/sample_users.js";
import { sampleJournalEntries } from "./test-data/sample_journal_entries.js";
import { sampleSemesterGroups } from "./test-data/sample_semester_groups.js";
import { sampleProjects } from "./test-data/sample_projects.js";

const prisma = new PrismaClient();
// Use prisma.<model> to interact with your database

const models = [
  "semester_Group",
  "users",
  "project",
  "journal_Entry",
  "fruit",
  "application",
];

const sampleDataFiles = {
  semester_Group: sampleSemesterGroups,
  users: sampleUsers,
  project: sampleProjects,
  journal_Entry: sampleJournalEntries,
  fruit: [{ name: "Apple", color: "Red", size: "Medium" }],
};

async function main() {
  console.log("Clearing data");
  for (const model of models) {
    try {
      if (prisma[model]) {
        await prisma[model].deleteMany();
      }
    } catch (error) {
      console.error(`Error clearing ${model}: `, error.message);
    }
  }

  console.log("Seeding data");

  //example data
  for (const model of models) {
    try {
      const data = sampleDataFiles[model];
      if (data && data.length > 0) {
        await prisma[model].createMany({ data: data });
      } else {
        console.log(`No data to seed for ${model}`);
      }
    } catch (error) {
      console.error(`Error seeding ${model}:`, error.message);
    }
  }

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
