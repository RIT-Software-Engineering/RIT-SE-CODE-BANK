import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env from project root
dotenv.config({
  path: path.join(__dirname, '..', '..', '.env'),
});

import { PrismaClient } from './generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (in reverse order of dependencies)
  console.log('🗑️  Clearing existing data...');
  await prisma.tBMember.deleteMany({});
  await prisma.tBTeam.deleteMany({});
  await prisma.tBTeamSet.deleteMany({});
  await prisma.tBEnrollment.deleteMany({});
  await prisma.resource.deleteMany({});
  await prisma.sessionMaterial.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.professor.deleteMany({});

  // 1. Create Professors with specific IDs
  console.log('👨‍🏫 Creating professors...');
  await prisma.professor.create({
    data: {
      id: "pao1234",
      fname: 'John',
      lname: 'Smith',
      email: 'prof1@rit.edu',
    },
  });

  await prisma.professor.create({
    data: {
      id: "pao1235",
      fname: 'Sarah',
      lname: 'Johnson',
      email: 'prof2@rit.edu',
    },
  });

  console.log(`✅ Created 2 professors:`);
  console.log(`   • Professor 1 (id="pao1234"): John Smith - prof1@rit.edu`);
  console.log(`   • Professor 2 (id="pao1235"): Sarah Johnson - prof2@rit.edu`);

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('🎉 Database seeding completed successfully!');
  console.log('\n✨ You can now use the application with test data!');
  console.log('\n💡 Login credentials:');
  console.log('   • Professor 1: prof1@rit.edu / test123');
  console.log('   • Professor 2: prof2@rit.edu / test123');
  console.log('   • Student:     student1@rit.edu / test123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });