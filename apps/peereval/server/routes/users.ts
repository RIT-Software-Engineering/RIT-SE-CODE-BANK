import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// Get all users
// /users
router.get("/", async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: {
      name: "asc",
    },
  });
  res.json(users);
});

// Get user by ID
// /users/:id
router.get("/:id", async (req, res) => {
  const id = req.params.id;

  const users = await prisma.user.findFirst({
    where: {
      id: id,
    },
  });
  res.json(users);
});

export default router;
