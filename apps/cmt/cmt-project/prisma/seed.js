// prisma/seed.js
const path = require('path');
require('dotenv').config({
  // Load .env from the cmt-project root (two levels up from prisma/)
  path: path.join(__dirname, '..', '.env'),
});

const { PrismaClient } = require('@prisma/client');
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
  console.log('🗑️  Clearing existing data...');
  await prisma.event.deleteMany({});
  await prisma.tBMember.deleteMany({});
  await prisma.tBTeam.deleteMany({});
  await prisma.tBTeamSet.deleteMany({});
  await prisma.tBEnrollment.deleteMany({});
  await prisma.templateItem.deleteMany({});
  await prisma.courseTemplate.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.professor.deleteMany({});

  // 1. Create Professors with specific IDs
  console.log('👨‍🏫 Creating professors...');
  const prof1 = await prisma.professor.create({
    data: {
      id: 1,
      fname: 'John',
      lname: 'Smith',
      email: 'prof1@rit.edu',
    },
  });

  const prof2 = await prisma.professor.create({
    data: {
      id: 2,
      fname: 'Sarah',
      lname: 'Johnson',
      email: 'prof2@rit.edu',
    },
  });

  console.log(`✅ Created 2 professors:`);
  console.log(`   • Professor 1 (id=1): John Smith - prof1@rit.edu`);
  console.log(`   • Professor 2 (id=2): Sarah Johnson - prof2@rit.edu`);

  // 2. Create Courses
  console.log('📚 Creating courses...');
  const swen101 = await prisma.course.create({
    data: {
      id: 'SWEN101',
      name: 'Software Engineering Fundamentals',
      semester: 'Fall 2024',
      color: '#4A90E2',
      students: 45,
      professorId: prof1.id, // Professor 1
      workflowId: null,
    },
  });

  const swen261 = await prisma.course.create({
    data: {
      id: 'SWEN261',
      name: 'Intro to Software Engineering',
      semester: 'Fall 2024',
      color: '#E94B3C',
      students: 38,
      professorId: prof1.id, // Professor 1
      workflowId: null,
    },
  });

  const swen343 = await prisma.course.create({
    data: {
      id: 'SWEN343',
      name: 'Software Design',
      semester: 'Fall 2024',
      color: '#50C878',
      students: 32,
      professorId: prof2.id, // Professor 2
      workflowId: null,
    },
  });

  const swen440 = await prisma.course.create({
    data: {
      id: 'SWEN440',
      name: 'Software Architecture',
      semester: 'Fall 2024',
      color: '#9B59B6',
      students: 28,
      professorId: prof2.id, // Professor 2
      workflowId: null,
    },
  });

  await prisma.course.create({ // SWEN 562
    data: {
      id: 'SWEN562',
      name: 'Engineering Secure Software',
      semester: 'Spring 2025',
      color: '#F39C12',
      students: 24,
      professorId: prof1.id, // Professor 1
      workflowId: null,
    },
  });

  console.log(`✅ Created 5 courses:`);
  console.log(`   • Professor 1 courses: SWEN101, SWEN261, SWEN562`);
  console.log(`   • Professor 2 courses: SWEN343, SWEN440`);

  // 3. Create Events (scoped to professors)
  console.log('📅 Creating events...');
  const events = [];

  // SWEN101 Events (Professor 1)
  events.push(
    await prisma.event.create({
      data: {
        title: 'Midterm Exam',
        course: {
          connect: { id: swen101.id }
        },
        professor: {
          connect: { id: prof1.id }
        },
        type: 'exam',
        time: '10:00 AM',
        date: addDays(7),
        location: 'GOL-2400',
        description: 'Covers chapters 1-5',
        importance: 'High',
        ownerEmail: prof1.email,
        ownerUid: 'jxs1234',
      },
    })
  );

  events.push(
    await prisma.event.create({
      data: {
        title: 'Project Proposal Due',
        course: {
          connect: { id: swen101.id }
        },
        professor: {
          connect: { id: prof1.id }
        },
        type: 'assignment',
        time: '11:59 PM',
        date: addDays(3),
        location: 'Online',
        description: 'Submit via MyCourses',
        importance: 'High',
        ownerEmail: prof1.email,
        ownerUid: 'jxs1234',
      },
    })
  );

  events.push(
    await prisma.event.create({
      data: {
        title: 'Software Testing Lab',
        course: {
          connect: { id: swen101.id }
        },
        professor: {
          connect: { id: prof1.id }
        },
        type: 'lab',
        time: '2:00 PM',
        date: addDays(2),
        location: 'GOL-2435',
        description: 'Bring your laptop',
        importance: 'Medium',
        ownerEmail: prof1.email,
        ownerUid: 'jxs1234',
      },
    })
  );

  // SWEN261 Events (Professor 1)
  events.push(
    await prisma.event.create({
      data: {
        title: 'Requirements Document Review',
        course: {
          connect: { id: swen261.id }
        },
        professor: {
          connect: { id: prof1.id }
        },
        type: 'assignment',
        time: '11:59 PM',
        date: addDays(5),
        location: 'Online',
        description: 'Peer review required',
        importance: 'High',
        ownerEmail: prof1.email,
        ownerUid: 'jxs1234',
      },
    })
  );

  events.push(
    await prisma.event.create({
      data: {
        title: 'Office Hours',
        course: {
          connect: { id: swen261.id }
        },
        professor: {
          connect: { id: prof1.id }
        },
        type: 'office_hours',
        time: '3:00 PM',
        date: addDays(1),
        location: 'GOL-3100',
        description: 'Drop-in or by appointment',
        importance: 'Low',
        ownerEmail: prof1.email,
        ownerUid: 'jxs1234',
      },
    })
  );

  // SWEN343 Events (Professor 2)
  events.push(
    await prisma.event.create({
      data: {
        title: 'Design Patterns Lecture',
        course: {
          connect: { id: swen343.id }
        },
        professor: {
          connect: { id: prof2.id }
        },
        type: 'lecture',
        time: '9:00 AM',
        date: addDays(1),
        location: 'GOL-2690',
        description: 'Factory and Observer patterns',
        importance: 'Medium',
        ownerEmail: prof2.email,
        ownerUid: 'sxj5678',
      },
    })
  );

  events.push(
    await prisma.event.create({
      data: {
        title: 'Final Project Presentation',
        course: {
          connect: { id: swen343.id }
        },
        professor: {
          connect: { id: prof2.id }
        },
        type: 'assignment',
        time: '1:00 PM',
        date: addDays(14),
        location: 'GOL-2400',
        description: '15 minute presentation + Q&A',
        importance: 'High',
        ownerEmail: prof2.email,
        ownerUid: 'sxj5678',
      },
    })
  );

  // SWEN440 Events (Professor 2)
  events.push(
    await prisma.event.create({
      data: {
        title: 'Architecture Review',
        course: {
          connect: { id: swen440.id }
        },
        professor: {
          connect: { id: prof2.id }
        },
        type: 'assignment',
        time: '11:59 PM',
        date: addDays(10),
        location: 'Online',
        description: 'Submit architecture diagrams',
        importance: 'High',
        ownerEmail: prof2.email,
        ownerUid: 'sxj5678',
      },
    })
  );

  console.log(`✅ Created ${events.length} events with professor scoping`);

  // 4. Create Course Templates
  console.log('📋 Creating course templates...');
  
  //Template 1
  await prisma.courseTemplate.create({
    data: {
      name: 'Standard Software Engineering Course',
      semester: 'Fall',
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
      semester: 'Spring',
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
      semester: 'Fall',
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

  // 5. Create Team Builder Enrollments
  console.log('👥 Creating team builder enrollments...');
  const enrollments = [];

  // SWEN101 Students (Professor 1)
  for (let i = 1; i <= 12; i++) {
    enrollments.push(
      await prisma.tBEnrollment.create({
        data: {
          courseId: swen101.id,
          studentId: `S${String(i).padStart(4, '0')}`,
          email: `student${i}@rit.edu`,
          firstName: `Student${i}`,
          lastName: `Test${i}`,
        },
      })
    );
  }

  // SWEN343 Students (Professor 2)
  for (let i = 13; i <= 24; i++) {
    enrollments.push(
      await prisma.tBEnrollment.create({
        data: {
          courseId: swen343.id,
          studentId: `S${String(i).padStart(4, '0')}`,
          email: `student${i}@rit.edu`,
          firstName: `Student${i}`,
          lastName: `Test${i}`,
        },
      })
    );
  }

  console.log(`✅ Created ${enrollments.length} enrollments`);

  // 6. Create Team Sets
  console.log('🔧 Creating team sets...');
  const teamSet1 = await prisma.tBTeamSet.create({
    data: {
      courseId: swen101.id,
      name: 'Project 1 Teams',
      status: 'PUBLISHED',
      teamSize: 4,
      constraints: JSON.stringify({
        minSize: 3,
        maxSize: 5,
        allowSelfSelection: true,
      }),
      publishedAt: new Date(),
      createdByProfessorId: prof1.id,
    },
  });

  const teamSet2 = await prisma.tBTeamSet.create({
    data: {
      courseId: swen343.id,
      name: 'Final Project Teams',
      status: 'DRAFT',
      teamSize: 3,
      constraints: JSON.stringify({
        minSize: 2,
        maxSize: 4,
        allowSelfSelection: false,
      }),
      createdByProfessorId: prof2.id,
    },
  });

  console.log(`✅ Created 2 team sets`);

  // 7. Create Teams
  console.log('🏆 Creating teams...');
  const team1 = await prisma.tBTeam.create({
    data: {
      teamSetId: teamSet1.id,
      name: 'Code Warriors',
      maxSize: 4,
    },
  });

  const team2 = await prisma.tBTeam.create({
    data: {
      teamSetId: teamSet2.id,
      name: 'Bug Hunters',
      maxSize: 4,
    },
  });

  const team3 = await prisma.tBTeam.create({
    data: {
      teamSetId: teamSet1.id,
      name: 'Dev Ninjas',
      maxSize: 4,
    },
  });

  console.log(`✅ Created 3 teams`);

  // 8. Assign Members to Teams
  console.log('👤 Assigning team members...');
  const members = [];

  // Team 1: First 4 students from SWEN101
  for (let i = 0; i < 4; i++) {
    members.push(
      await prisma.tBMember.create({
        data: {
          teamId: team1.id,
          enrollmentId: enrollments[i].id,
          role: i === 0 ? 'Team Leader' : 'Member',
        },
      })
    );
  }

  // Team 2: Next 4 students from SWEN101
  for (let i = 4; i < 8; i++) {
    members.push(
      await prisma.tBMember.create({
        data: {
          teamId: team2.id,
          enrollmentId: enrollments[i].id,
          role: i === 4 ? 'Team Leader' : 'Member',
        },
      })
    );
  }

  // Team 3: Next 4 students from SWEN101
  for (let i = 8; i < 12; i++) {
    members.push(
      await prisma.tBMember.create({
        data: {
          teamId: team3.id,
          enrollmentId: enrollments[i].id,
          role: i === 8 ? 'Team Leader' : 'Member',
        },
      })
    );
  }

  console.log(`✅ Created ${members.length} team member assignments`);

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('🎉 Database seeding completed successfully!');
  console.log('='.repeat(70));
  console.log(`📊 Summary:`);
  console.log(`   • Professors:         2`);
  console.log(`     - Professor 1 (id=1): John Smith (prof1@rit.edu)`);
  console.log(`     - Professor 2 (id=2): Sarah Johnson (prof2@rit.edu)`);
  console.log(`   • Courses:            5 (Prof 1: 3, Prof 2: 2)`);
  console.log(`   • Events:             ${events.length} (all scoped to professors)`);
  console.log(`   • Course Templates:   3 (Prof 1: 2, Prof 2: 1)`);
  console.log(`   • Enrollments:        ${enrollments.length}`);
  console.log(`   • Team Sets:          2`);
  console.log(`   • Teams:              3`);
  console.log(`   • Team Members:       ${members.length}`);
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