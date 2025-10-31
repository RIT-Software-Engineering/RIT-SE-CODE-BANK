import { PrismaClient } from "@prisma/client";
import { sampleUsers } from "./test-data/sample_users.js";
import { sampleJournalEntries } from "./test-data/sample_journal_entries.js";
import { sampleSemesterGroups } from "./test-data/sample_semester_groups.js";
import { sampleProjects } from "./test-data/sample_projects.js";
import { sampleApplications } from "./test-data/sample_applications.js";
const prisma = new PrismaClient();
// Use prisma.<model> to interact with your database

async function main() {
  console.log("Clearing data");

  await prisma.teams.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.project.deleteMany();
  await prisma.users.deleteMany();
  await prisma.application.deleteMany();
  await prisma.semesterGroup.deleteMany();
  await prisma.fruit.deleteMany();

  console.log("Seeding data");

  await prisma.fruit.create({
    data: { name: "Apple", color: "Red", size: "Medium" },
  });

  await prisma.semesterGroup.createMany({
    data: sampleSemesterGroups,
  });

  await prisma.project.createMany({
    data: sampleProjects.map(({ id, title, display_name, description }) => ({
      id,
      title,
      display_name,
      description,
    })),
  });

  await prisma.users.createMany({
    data: sampleUsers,
  });

  await prisma.application.createMany({
    data: sampleApplications,
  });

  await Promise.all(
    sampleJournalEntries.map(journalEntry =>
      prisma.journalEntry.create({
        data:{
          id: journalEntry.id,
          previous_entryid: journalEntry.previous_entryid,
          notes : journalEntry.notes,
          date: journalEntry.date,
          sender_id: journalEntry.sender_id,
          recipients: { connect: journalEntry.recipient_ids.map(id => ({ id })) },
          topic_id: journalEntry.topic_id,
          semester_GroupId: journalEntry.semester_GroupId,
        }
      })
    )
  );

  const vicki = await prisma.users.findUnique({ where: { email: "vcl123@rit.edu" } });
  const jimmy = await prisma.users.findUnique({ where: { email: "jlp123@rit.edu" } });
  const dudeBro = await prisma.users.findUnique({ where: { email: "def123@rit.edu" } });

  await prisma.teams.create({
    data: {
      name: "Alpha",
      projectId: 1,
      members: {
        connect: [{ id: vicki.id }, { id: jimmy.id }, { id: dudeBro.id }],
      },
    },
  });

  const galgirl = await prisma.users.findUnique({ where: { email: "klm123@rit.edu" } });
  const edison = await prisma.users.findUnique({ where: { email: "emh123@rit.edu" } });

  await prisma.teams.create({
    data: {
      name: "Omega",
      projectId: 2,
      members: {
        connect: [{ id: galgirl.id }, { id: edison.id }],
      },
    },
  });

  console.log("Seed finished.");
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