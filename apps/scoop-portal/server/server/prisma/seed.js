import { PrismaClient } from "../src/generated/prisma/index.js";
import {sampleUsers} from "./test-data/sample_users.js";
const prisma = new PrismaClient();

async function main() {
  //   const alice = await prisma.user.upsert({
  //     where: { email: 'alice@prisma.io' },
  //     update: {},
  //     create: {
  //       email: 'alice@prisma.io',
  //       name: 'Alice',
  //       posts: {
  //         create: {
  //           title: 'Check out Prisma with Next.js',
  //           content: 'https://www.prisma.io/nextjs',
  //           published: true,
  //         },
  //       },
  //     },
  //   })

  const apple = {
    data: {
      name: "Apple",
      color: "green",
      size: "Medium",
      rating: "5"
    },
  };

  await prisma.fruit.create(apple);
  await prisma.users.createMany({
    data: sampleUsers,
  });

  
  console.log({ apple });
  // console.log(sampleUsers);
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
