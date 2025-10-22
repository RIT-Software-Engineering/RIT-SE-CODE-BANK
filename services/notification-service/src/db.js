import { PrismaClient } from "@prisma/client";

let prisma = null;

export function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function ensurePrisma() {
  try {
    const p = getPrisma();
    await p.$connect();
    return p;
  } catch (e) {
    console.warn("Prisma not configured or cannot connect; preferences endpoints will fail until DATABASE_URL is set.", e.message);
    throw e;
  }
}
