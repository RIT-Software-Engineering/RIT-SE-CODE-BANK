// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userData = [
    { name: "Alice", email: "alice@rit.edu" },
    { name: "Bob", email: "bob@rit.edu" },
    { name: "Charlie", email: "charlie@rit.edu" },
    { name: "Diana", email: "diana@rit.edu" },
    { name: "Ethan", email: "ethan@rit.edu" },
    { name: "Fiona", email: "fiona@rit.edu" },
    { name: "George", email: "george@rit.edu" },
    { name: "Hannah", email: "hannah@rit.edu" },
    { name: "Ivan", email: "ivan@rit.edu" },
    { name: "Julia", email: "julia@rit.edu" },
    { name: "Zebra", email: "zebra@rit.edu" },
  ];

  const users = await Promise.all(
    userData.map((u) => prisma.user.create({ data: u }))
  );

  await prisma.project.create({
    data: {
      name: "SWEN-262",
      description: "NutriApp semester project for SWEN-261",
      overseer: {
        connect: {
          id: users[10].id,
        },
      },
      peers: {
        connect: [
          { id: users[0].id },
          { id: users[1].id },
          { id: users[7].id },
        ],
      },
    },
  });

  await prisma.project.create({
    data: {
      name: "SWEN-444",
      description: "UI/UX semester project for SWEN-444",
      overseer: {
        connect: {
          id: users[userData.length - 1].id,
        },
      },
      peers: {
        connect: [
          { id: users[0].id },
          { id: users[2].id },
          { id: users[8].id },
        ],
      },
    },
  });
}

main()
  .then(() => {
    console.log("🌱  Database seeded");
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
