import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding user preferences...');

  const samples = [
    {
      appId: 'ta-portal',
      userEmail: 'alice@rit.edu',
      userId: 'alice',
      notifyEmail: true,
      notifySlack: false,
    },
    {
      appId: 'ta-portal',
      userEmail: 'bob@rit.edu',
      userId: 'bob',
      notifyEmail: false,
      notifySlack: true,
    },
    {
      appId: 'scoop-portal',
      userEmail: 'carol@rit.edu',
      userId: 'carol',
      notifyEmail: true,
      notifySlack: true,
    },
    {
      appId: 'ta-portal',
      userEmail: 'bgg6007@rit.edu',
      userId: 'bgg6007',
      notifyEmail: false,
      notifySlack: true,
    },
    {
      appId: 'ta-portal',
      userEmail: 'yvk1136@rit.edu',
      userId: 'yvk1136',
      notifyEmail: true,
      notifySlack: true,
    },
  ];

  for (const s of samples) {
    console.log('Upserting', s.appId, s.userId);s
    await prisma.userPreference.upsert({
      where: { appId_userId: { appId: s.appId, userId: s.userId } },
      update: {
        userEmail: s.userEmail,
        notifyEmail: s.notifyEmail,
        notifySlack: s.notifySlack,
      },
      create: {
        appId: s.appId,
        userId: s.userId,
        userEmail: s.userEmail,
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
