import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding notification preferences...');

  const samples = [
    {
      appId: 'ta-portal',
      userEmail: 'alice@example.com',
      username: 'alice',
      notifyEmail: true,
      notifySlack: false,
    },
    {
      appId: 'ta-portal',
      userEmail: 'bob@example.com',
      username: 'bob',
      notifyEmail: false,
      notifySlack: true,
    },
    {
      appId: 'scoop-portal',
      userEmail: 'carol@example.com',
      username: 'carol',
      notifyEmail: true,
      notifySlack: true,
    },
    {
      appId: 'ta-portal',
      userEmail: 'bgg6007@rit.edu',
      username: 'bgg6007',
      notifyEmail: false,
      notifySlack: true,
    },
  ];

  for (const s of samples) {
    console.log('Upserting', s.appId, s.userEmail);
    await prisma.notificationPreference.upsert({
      where: { appId_userEmail: { appId: s.appId, userEmail: s.userEmail } },
      update: {
        username: s.username,
        notifyEmail: s.notifyEmail,
        notifySlack: s.notifySlack,
      },
      create: {
        appId: s.appId,
        userEmail: s.userEmail,
        username: s.username,
        notifyEmail: s.notifyEmail,
        notifySlack: s.notifySlack,
      },
    });
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
