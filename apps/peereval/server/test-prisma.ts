import "dotenv/config";
import prisma from "./prisma";

async function test() {
    console.log(
        "DATABASE_URL:",
        process.env.DATABASE_URL ? "LOADED" : "MISSING"
    );

    const users = await prisma.user.findMany();

    console.log("USERS FOUND:", users.length);

    await prisma.$disconnect();
}

test().catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
});
