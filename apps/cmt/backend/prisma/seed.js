// prisma/seed.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from './generated/client/index.js';
import testUsers from '../dev-users.json' with { type: "json" }

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  // Load .env from the project root (one level up from prisma/)
  path: path.join(__dirname, '..', '.env'),
});


const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  console.log('🗑️  Clearing existing data...');

  // deepest dependencies
  await prisma.sessionMaterial.deleteMany({});
  await prisma.tBMember.deleteMany({});

  // next level
  await prisma.session.deleteMany({});
  await prisma.tBTeam.deleteMany({});

  // next
  await prisma.tBEnrollment.deleteMany({});
  await prisma.tBTeamSet.deleteMany({});

  // delete resources
  await prisma.resource.deleteMany({});

  // parent tables
  await prisma.course.deleteMany({});
  await prisma.professor.deleteMany({});

  // 1. Create Professors with specific IDs
  console.log('👨‍🏫 Creating professors...');
  async function seedProfessors(prisma, users) {
    for (const user of users) {
      await prisma.professor.create({
        data: {
          id: user.uid,
          fname: user.givenName,
          lname: user.sn,
          email: user.email,
        },
      });
    }
  }

  await seedProfessors(prisma, testUsers);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });