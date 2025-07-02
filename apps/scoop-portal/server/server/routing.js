import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export default async (NextApiRequest, NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const testData = JSON.parse(req.body);

  res.json({ message: "hello world" });
};

//dont use this redo with the singleton  
