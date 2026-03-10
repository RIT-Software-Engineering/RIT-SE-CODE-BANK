// prisma/seed.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  // Load .env from the project root (one level up from prisma/)
  path: path.join(__dirname, '..', '.env'),
});

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Helper functions to create dates relative to today (used throughout seeding)
  const addDays = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  };
  
  const addWeeks = (weeks) => {
    const date = new Date();
    date.setDate(date.getDate() + (weeks * 7));
    return date;
  };

  // Clear existing data (in reverse order of dependencies)
  // console.log('🗑️  Clearing existing data...');
  // await prisma.event.deleteMany({});
  // await prisma.tBMember.deleteMany({});
  // await prisma.tBTeam.deleteMany({});
  // await prisma.tBTeamSet.deleteMany({});
  // await prisma.tBEnrollment.deleteMany({});
  // await prisma.templateItem.deleteMany({});
  // await prisma.courseTemplate.deleteMany({});
  // await prisma.course.deleteMany({});
  // await prisma.professor.deleteMany({});

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

  // course-related
  await prisma.event.deleteMany({});

  // templates
  await prisma.templateItem.deleteMany({});
  await prisma.courseTemplate.deleteMany({});

  // parent tables
  await prisma.course.deleteMany({});
  await prisma.professor.deleteMany({});

  // 1. Create Professors with specific IDs
  console.log('👨‍🏫 Creating professors...');
  const prof1 = await prisma.professor.create({
    data: {
      id: "pao1234",
      fname: 'John',
      lname: 'Smith',
      email: 'prof1@rit.edu',
    },
  });

  const prof2 = await prisma.professor.create({
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

  // 4. Create Course Templates
  console.log('📋 Creating course templates...');
  
  //Template 1
  await prisma.courseTemplate.create({
    data: {
      name: 'Standard Software Engineering Course',
      season: 'Fall',
      year: 2020,
      weeks: 14,
      assignments: 8,
      exams: 2,
      labs: 10,
      projects: 1,
      professorId: prof1.id,
      templateItems: {
        create: [
          {
            type: 'assignment',
            name: 'Assignment 1: Introduction',
            dueDate: addWeeks(1),
            description: 'Getting started with the course',
          },
          {
            type: 'assignment',
            name: 'Assignment 2: Basic Concepts',
            dueDate: addWeeks(2),
            description: 'Understanding fundamental principles',
          },
          {
            type: 'lab',
            name: 'Lab 1: Setup Environment',
            dueDate: addDays(5),
            description: 'Configure development environment',
          },
          {
            type: 'lab',
            name: 'Lab 2: First Program',
            dueDate: addDays(10),
            description: 'Write your first program',
          },
          {
            type: 'exam',
            name: 'Midterm Exam',
            dueDate: addWeeks(7),
            description: 'Covers first half of semester',
          },
          {
            type: 'exam',
            name: 'Final Exam',
            dueDate: addWeeks(14),
            description: 'Comprehensive final examination',
          },
          {
            type: 'project',
            name: 'Final Project',
            dueDate: addWeeks(13),
            description: 'Team-based software project',
          },
        ],
      },
    },
  });

  //Template 2
  await prisma.courseTemplate.create({
    data: {
      name: 'Project-Based Course Template',
      season: 'Fall',
      year: 2020,
      weeks: 15,
      assignments: 5,
      exams: 1,
      labs: 12,
      projects: 2,
      professorId: prof2.id,
      templateItems: {
        create: [
          {
            type: 'project',
            name: 'Project 1: Web Application',
            dueDate: addWeeks(6),
            description: 'Build a full-stack web app',
          },
          {
            type: 'project',
            name: 'Project 2: Mobile App',
            dueDate: addWeeks(12),
            description: 'Create a mobile application',
          },
          {
            type: 'assignment',
            name: 'Assignment 1: Requirements Document',
            dueDate: addWeeks(2),
            description: 'Define project requirements',
          },
          {
            type: 'assignment',
            name: 'Assignment 2: Design Document',
            dueDate: addWeeks(4),
            description: 'Create system design',
          },
          {
            type: 'lab',
            name: 'Lab 1: Version Control',
            dueDate: addDays(3),
            description: 'Learn Git basics',
          },
          {
            type: 'exam',
            name: 'Final Exam',
            dueDate: addWeeks(15),
            description: 'Comprehensive final examination',
          },
        ],
      },
    },
  });

  // Template 3
  await prisma.courseTemplate.create({
    data: {
      name: 'Advanced Topics Template',
      season: 'Fall',
      year: 2020,
      weeks: 14,
      assignments: 6,
      exams: 2,
      labs: 8,
      projects: 1,
      professorId: prof1.id,
      templateItems: {
        create: [
          {
            type: 'assignment',
            name: 'Research Paper',
            dueDate: addWeeks(8),
            description: 'Write a research paper on advanced topic',
          },
          {
            type: 'project',
            name: 'Capstone Project',
            dueDate: addWeeks(13),
            description: 'Final capstone project',
          },
          {
            type: 'exam',
            name: 'Midterm',
            dueDate: addWeeks(7),
            description: 'Midterm examination',
          },
          {
            type: 'exam',
            name: 'Final',
            dueDate: addWeeks(14),
            description: 'Final examination',
          },
        ],
      },
    },
  });

  console.log(`✅ Created 3 course templates:`);
  console.log(`   • Professor 1 templates: 2`);
  console.log(`   • Professor 2 templates: 1`);

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('🎉 Database seeding completed successfully!');
  console.log('='.repeat(70));
  console.log(`📊 Summary:`);
  console.log(`   • Professors:         2`);
  console.log(`     - Professor 1 (id="pao1234"): John Smith (prof1@rit.edu)`);
  console.log(`     - Professor 2 (id="pao1245"): Sarah Johnson (prof2@rit.edu)`);
  console.log(`   • Course Templates:   3 (Prof 1: 2, Prof 2: 1)`);
  console.log('='.repeat(70));
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