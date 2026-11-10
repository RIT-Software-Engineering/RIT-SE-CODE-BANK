import { PrismaClient } from "@prisma/client";

let prisma = null;

export function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function ensurePrisma() {
  const p = getPrisma();
  // Attempt to connect; let errors propagate so callers can handle them.
  await p.$connect();
  return p;
}
