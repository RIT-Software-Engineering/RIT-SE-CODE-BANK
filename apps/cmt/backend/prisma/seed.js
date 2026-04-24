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
  
  // Since there is never(?) a reason to duplicate seed data, don't run this seed file if its already been ran.
  // This is to allow start scripts to remain idempotent.
  // If you are looking to delete existing data, use prisma commands like "npx prisma migrate reset"
  const doesSeedDataExist = await prisma.professor.findFirst({ where: { id: "pao1234" } }) 
  if (doesSeedDataExist) {
    console.log("WARNING: Skipping seeding as professor with id '1' already exists");
    return
  }
  
  console.log('🌱 Starting database seeding...');

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