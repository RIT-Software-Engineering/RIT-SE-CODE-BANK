import { PrismaClient } from "@prisma/client";
import { sampleUsers } from "./test-data/sample_users.js";
import { sampleJournalEntries } from "./test-data/sample_journal_entries.js";
import { sampleSemesterGroups } from "./test-data/sample_semester_groups.js";
import { sampleProjects } from "./test-data/sample_projects.js";
import { sampleApplications } from "./test-data/sample_applications.js";
import crypto from "crypto";
const prisma = new PrismaClient();
// Use prisma.<model> to interact with your database

async function main() {
  console.log("Clearing data");

  // Delete dependent tables first (before users)
  await prisma.teams.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.projectProposal.deleteMany();
  await prisma.application.deleteMany();
  
  // Then delete users (no more FK constraints)
  await prisma.users.deleteMany();
  
  // Then delete remaining tables
  await prisma.project.deleteMany();
  await prisma.login.deleteMany();
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
    data: sampleProjects.map(({ id, title, display_name, description, semester_GroupId }) => ({
      id,
      title,
      display_name,
      description,
      semesterGroupId: semester_GroupId
    })),
  });

  await prisma.users.createMany({
    data: sampleUsers,
  });

  await prisma.application.createMany({
    data: sampleApplications,
  });

  // Journal entries in sampleJournalEntries must be in order to ensure previous_entryid references work
  for (const journalEntry of sampleJournalEntries) {
    await prisma.journalEntry.create({
          data:{
          id: journalEntry.id,
          previous_entryid: journalEntry.previous_entryid,
          notes : journalEntry.notes,
          privacy_level: journalEntry.privacy_level,
          visibility_level: journalEntry.visibility_level,
          entry_type: journalEntry.entry_type,
          date: journalEntry.date,
          sender_id: journalEntry.sender_id,
          recipients: { connect: journalEntry.recipient_ids.map(id => ({ id })) },
          topic_id: journalEntry.topic_id,
          semester_GroupId: journalEntry.semester_GroupId,
        }
    });
  }


  const vicki = await prisma.users.findUnique({ where: { email: "vcl123@rit.edu" } });
  const jimmy = await prisma.users.findUnique({ where: { email: "jlp123@rit.edu" } });
  const dudeBro = await prisma.users.findUnique({ where: { email: "def123@rit.edu" } });

  await prisma.teams.create({
    data: {
      name: "Alpha",
      projectId: 1,
      scoopervisorId: "cds123",
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
      scoopervisorId: "coachB",
      members: {
        connect: [{ id: galgirl.id }, { id: edison.id }],
      },
    },
  }); 

  console.log("Seeding logins...");

  function hashPassword(password){
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  for(const user of sampleUsers){
    const login = await prisma.login.create({
      data: {
        email: user.email,
        password: hashPassword(user.fname)
      }
    });

    await prisma.users.update({
      where: {email: user.email},
      data: {loginId: login.id}
    });
  }

  console.log("Logins seeded.");

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