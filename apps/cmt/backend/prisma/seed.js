// prisma/seed.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from './generated/client/index.js';
import { readFile } from 'node:fs/promises';
import { seedDevelopmentUsers } from '../utils/seedUsers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  // Load .env from the project root (one level up from prisma/)
  path: path.join(__dirname, '..', '.env'),
});


const prisma = new PrismaClient();

async function main() {
  const testUsers = JSON.parse(await readFile(new URL('../dev-users.json', import.meta.url), 'utf8'));
  const counts = await seedDevelopmentUsers(prisma, testUsers);
  console.log(`Development profiles ready: ${counts.professors} instructors and ${counts.students} students/TAs.`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
