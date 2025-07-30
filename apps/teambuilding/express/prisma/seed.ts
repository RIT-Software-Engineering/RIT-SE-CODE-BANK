import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {

  const admin1 = await prisma.user.create({
    data: {
      username: 'admin1',
      firstName: 'John',
      lastName: 'Admin',
      email: 'john.admin@example.com',
      role: 'ADMIN',
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      username: 'admin2',
      firstName: 'Jane',
      lastName: 'Admin',
      email: 'jane.admin@example.com',
      role: 'ADMIN',
    },
  });

  

  const manager1 = await prisma.user.create({
    data: {
      username: 'manager1',
      firstName: 'Alice',
      lastName: 'Manager',
      email: 'alice.manager@example.com',
      role: 'MANAGER',
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      username: 'manager2',
      firstName: 'Bob',
      lastName: 'Manager',
      email: 'bob.manager@example.com',
      role: 'MANAGER',
    },
  });

  const manager3 = await prisma.user.create({
    data: {
      username: 'manager3',
      firstName: 'Carol',
      lastName: 'Manager',
      email: 'carol.manager@example.com',
      role: 'MANAGER',
    },
  });

  console.log('✅ Created 3 managers');

  const users = [];
  const userNames = [
    { username: 'student1', firstName: 'David', lastName: 'Smith', email: 'david.smith@example.com' },
    { username: 'student2', firstName: 'Emily', lastName: 'Johnson', email: 'emily.johnson@example.com' },
    { username: 'student3', firstName: 'Michael', lastName: 'Brown', email: 'michael.brown@example.com' },
    { username: 'student4', firstName: 'Sarah', lastName: 'Davis', email: 'sarah.davis@example.com' },
    { username: 'student5', firstName: 'James', lastName: 'Wilson'  },
    { username: 'student6', firstName: 'Lisa', lastName: 'Moore', email: 'lisa.moore@example.com' },
    { username: 'student7', firstName: 'Robert',  email: 'robert.taylor@example.com' },
    { username: 'student8', firstName: 'Jessica', lastName: 'Anderson', email: 'jessica.anderson@example.com' },
    { username: 'student9',  lastName: 'Thomas', email: 'christopher.thomas@example.com' },
    { username: 'student10'},
  ];

  for (const userData of userNames) {
    const user = await prisma.user.create({
      data: {
        ...userData,
        role: 'USER',
      },
    });
    users.push(user);
  }

  console.log('✅ Created 10 users');

  // Create a sample community managed by manager1
  const community1 = await prisma.community.create({
    data: {
      name: 'Software Engineering Course',
      managerId: manager1.id,
    },
  });

  // Add some users to the community
  await prisma.community.update({
    where: { id: community1.id },
    data: {
      users: {
        connect: [
          { id: users[0].id },
          { id: users[1].id },
          { id: users[2].id },
          { id: users[3].id },
          { id: users[4].id },
          { id: users[5].id },
        ],
      },
    },
  });

  // Create sample teams
  const team1 = await prisma.team.create({
    data: {
      name: 'Team Alpha',
      maxSize: 3,
      communityId: community1.id,
    },
  });

  const team2 = await prisma.team.create({
    data: {
      name: 'Team Beta',
      maxSize: 3,
      communityId: community1.id,
    },
  });

  // Add users to teams
  await prisma.team.update({
    where: { id: team1.id },
    data: {
      users: {
        connect: [
          { id: users[0].id },
          { id: users[1].id },
          { id: users[2].id },
        ],
      },
    },
  });

  await prisma.team.update({
    where: { id: team2.id },
    data: {
      users: {
        connect: [
          { id: users[3].id },
          { id: users[4].id },
          { id: users[5].id },
        ],
      },
    },
  });


  // Create another community managed by manager2
  const community2 = await prisma.community.create({
    data: {
      name: 'Data Science Course',
      managerId: manager2.id,
    },
  });

  // Add remaining users to the second community
  await prisma.community.update({
    where: { id: community2.id },
    data: {
      users: {
        connect: [
          { id: users[6].id },
          { id: users[7].id },
          { id: users[8].id },
          { id: users[9].id },
        ],
      },
    },
  });


}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });