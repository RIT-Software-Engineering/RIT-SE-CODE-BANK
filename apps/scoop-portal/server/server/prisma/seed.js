import { PrismaClient } from "../src/generated/prisma/index.js";
import {sampleUsers} from "./test-data/sample_users.js";
const prisma = new PrismaClient();

async function main() {

  console.log("Clearing data");
  await prisma.users.deleteMany();
  await prisma.fruit.deleteMany();

  console.log("Seeding data");
  await prisma.users.createMany({
    data: sampleUsers,
  });
  console.log("Drop and create finished.");
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
