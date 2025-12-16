// prisma/seed.js
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

  // 1. Create Professors
  console.log('👨‍🏫 Creating professors...');
  const prof1 = await prisma.professor.create({
    data: {
      id: 1, // ✅ Explicitly set id to 1 for the first professor
      fname: 'John',
      lname: 'Smith',
      email: 'john.smith@rit.edu',
    },
  });

  const prof2 = await prisma.professor.create({
    data: {
      fname: 'Sarah',
      lname: 'Johnson',
      email: 'sarah.johnson@rit.edu',
    },
  });

  const prof3 = await prisma.professor.create({
    data: {
      fname: 'Michael',
      lname: 'Chen',
      email: 'michael.chen@rit.edu',
    },
  });

  console.log(`✅ Created ${3} professors (Professor 1: John Smith with id=1)`);

  // 2. Create Courses
  console.log('📚 Creating courses...');
  const swen101 = await prisma.course.create({
    data: {
      id: 'SWEN101',
      name: 'Software Engineering Fundamentals',
      semester: 'Fall 2024',
      color: '#4A90E2',
      students: 45,
      professorId: prof1.id,
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
      professorId: prof1.id,
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
      professorId: prof2.id,
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
      professorId: prof2.id,
      workflowId: null,
    },
  });

  const swen562 = await prisma.course.create({
    data: {
      id: 'SWEN562',
      name: 'Engineering Secure Software',
      semester: 'Fall 2024',
      color: '#F39C12',
      students: 24,
      professorId: prof3.id,
      workflowId: null,
    },
  });

  console.log(`✅ Created ${5} courses`);

  // 3. Create Events
  console.log('📅 Creating events...');
  const events = [];

  // SWEN101 Events
  events.push(
    await prisma.event.create({
      data: {
        title: 'Midterm Exam',
        courseId: swen101.id,
        type: 'exam',
        time: '10:00 AM',
        date: addDays(7), // 7 days from today
        location: 'GOL-2400',
        description: 'Covers chapters 1-5',
        importance: 'High',
      },
    })
  );

  events.push(
    await prisma.event.create({
      data: {
        title: 'Project Proposal Due',
        courseId: swen101.id,
        type: 'assignment',
        time: '11:59 PM',
        date: addDays(3), // 3 days from today
        location: 'Online',
        description: 'Submit via MyCourses',
        importance: 'High',
      },
    })
  );

  events.push(
    await prisma.event.create({
      data: {
        title: 'Software Testing Lab',
        courseId: swen101.id,
        type: 'lab',
        time: '2:00 PM',
        date: addDays(2), // 2 days from today
        location: 'GOL-2435',
        description: 'Bring your laptop',
        importance: 'Medium',
      },
    })
  );

  // SWEN261 Events
  events.push(
    await prisma.event.create({
      data: {
        title: 'Requirements Document Review',
        courseId: swen261.id,
        type: 'assignment',
        time: '11:59 PM',
        date: addDays(5), // 5 days from today
        location: 'Online',
        description: 'Peer review required',
        importance: 'High',
      },
    })
  );

  events.push(
    await prisma.event.create({
      data: {
        title: 'Office Hours',
        courseId: swen261.id,
        type: 'office_hours',
        time: '3:00 PM',
        date: addDays(1), // Tomorrow
        location: 'GOL-3100',
        description: 'Drop-in or by appointment',
        importance: 'Low',
      },
    })
  );

  // SWEN343 Events
  events.push(
    await prisma.event.create({
      data: {
        title: 'Design Patterns Lecture',
        courseId: swen343.id,
        type: 'lecture',
        time: '9:00 AM',
        date: addDays(1), // Tomorrow
        location: 'GOL-2690',
        description: 'Factory and Observer patterns',
        importance: 'Medium',
      },
    })
  );

  events.push(
    await prisma.event.create({
      data: {
        title: 'Final Project Presentation',
        courseId: swen343.id,
        type: 'assignment',
        time: '1:00 PM',
        date: addDays(14), // 2 weeks from today
        location: 'GOL-2400',
        description: '15 minute presentation + Q&A',
        importance: 'High',
      },
    })
  );

  console.log(`✅ Created ${events.length} events with dynamic dates`);

  // 4. Create Course Templates
  console.log('📋 Creating course templates...');
  
  const template1 = await prisma.courseTemplate.create({
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
            dueDate: addWeeks(1), // 1 week from today
            description: 'Getting started with the course',
          },
          {
            type: 'assignment',
            name: 'Assignment 2: Basic Concepts',
            dueDate: addWeeks(2), // 2 weeks from today
            description: 'Understanding fundamental principles',
          },
          {
            type: 'lab',
            name: 'Lab 1: Setup Environment',
            dueDate: addDays(5), // 5 days from today
            description: 'Configure development environment',
          },
          {
            type: 'lab',
            name: 'Lab 2: First Program',
            dueDate: addDays(10), // 10 days from today
            description: 'Write your first program',
          },
          {
            type: 'exam',
            name: 'Midterm Exam',
            dueDate: addWeeks(7), // 7 weeks from today
            description: 'Covers first half of semester',
          },
          {
            type: 'exam',
            name: 'Final Exam',
            dueDate: addWeeks(14), // 14 weeks from today
            description: 'Comprehensive final examination',
          },
          {
            type: 'project',
            name: 'Final Project',
            dueDate: addWeeks(13), // 13 weeks from today
            description: 'Team-based software project',
          },
        ],
      },
    },
  });

  const template2 = await prisma.courseTemplate.create({
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
            dueDate: addWeeks(6), // 6 weeks from today
            description: 'Build a full-stack web app',
          },
          {
            type: 'project',
            name: 'Project 2: Mobile App',
            dueDate: addWeeks(12), // 12 weeks from today
            description: 'Create a mobile application',
          },
          {
            type: 'assignment',
            name: 'Assignment 1: Requirements Document',
            dueDate: addWeeks(2), // 2 weeks from today
            description: 'Define project requirements',
          },
          {
            type: 'assignment',
            name: 'Assignment 2: Design Document',
            dueDate: addWeeks(4), // 4 weeks from today
            description: 'Create system design',
          },
          {
            type: 'lab',
            name: 'Lab 1: Version Control',
            dueDate: addDays(3), // 3 days from today
            description: 'Learn Git basics',
          },
          {
            type: 'exam',
            name: 'Final Exam',
            dueDate: addWeeks(15), // 15 weeks from today
            description: 'Comprehensive final examination',
          },
        ],
      },
    },
  });

  console.log(`✅ Created ${2} course templates with dynamic dates`);

  // 5. Create Team Builder Enrollments
  console.log('👥 Creating team builder enrollments...');
  const enrollments = [];

  // SWEN101 Students
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

  // SWEN343 Students
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

  console.log(`✅ Created ${2} team sets`);

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
      teamSetId: teamSet1.id,
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

  console.log(`✅ Created ${3} teams`);

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
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Database seeding completed successfully!');
  console.log('='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   • Professors:         ${3} (Prof 1: John Smith with id=1)`);
  console.log(`   • Courses:            ${5}`);
  console.log(`   • Events:             ${events.length}`);
  console.log(`   • Course Templates:   ${2}`);
  console.log(`   • Enrollments:        ${enrollments.length}`);
  console.log(`   • Team Sets:          ${2}`);
  console.log(`   • Teams:              ${3}`);
  console.log(`   • Team Members:       ${members.length}`);
  console.log('='.repeat(60));
  console.log('\n✨ You can now use the application with test data!');
  console.log('\n💡 Note: Professor John Smith has id=1 for easy testing');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });