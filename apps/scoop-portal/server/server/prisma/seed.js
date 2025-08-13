import { PrismaClient } from "@prisma/client";
import { sampleApplications } from "./test-data/sample_applications.js";
import { sampleJournalEntries } from "./test-data/sample_journal_entries.js";
import { sampleProjects } from "./test-data/sample_projects.js";
import { sampleSemesterGroups } from "./test-data/sample_semester_groups.js";
import { sampleUsers } from "./test-data/sample_users.js";

const prisma = new PrismaClient();
// Use prisma.<model> to interact with your database

const models = [
  "fruit",
  "SemesterGroup",
  "Project",
  "users",
  "JournalEntry",
  "Application",
  "Teams",
];

const sampleDataFiles = {
  fruit: [{ name: "Apple", color: "Red", size: "Medium" }],
  SemesterGroup: sampleSemesterGroups,
  Project: sampleProjects,
  users: sampleUsers,
  JournalEntry: sampleJournalEntries,
  Application: sampleApplications,
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

  const vicki = await prisma.users.findUnique({
    where: { email: "vcl123@rit.edu" },
  });
  const jimmy = await prisma.users.findUnique({
    where: { email: "jlp123@rit.edu" },
  });
  const dudeBro = await prisma.users.findUnique({
    where: { email: "def123@rit.edu" },
  });

  await prisma.teams.create({
    data: {
      name: "Alpha",
      projectId: 1,
      members: {
        connect: [{ id: vicki.id }, { id: jimmy.id }, { id: dudeBro.id }],
      },
    },
  });

  const galgirl = await prisma.users.findUnique({
    where: { email: "klm123@rit.edu" },
  });
  const edison = await prisma.users.findUnique({
    where: { email: "emh123@rit.edu" },
  });
  await prisma.teams.create({
    data: {
      name: "Omega",
      projectId: 2,
      members: {
        connect: [{ id: galgirl.id }, { id: edison.id }],
      },
    },
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
