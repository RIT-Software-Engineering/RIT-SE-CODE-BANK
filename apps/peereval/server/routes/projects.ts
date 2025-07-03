import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// Get project as peer
// /projects/asPeer/:userId
router.get("/asPeer/:userId", async (req, res) => {
  const userId = req.params.userId;

  const projects = await prisma.user.findMany({
    select: {
      projectsAsPeers: {},
    },
    where: {
      id: userId,
    },
  });

  res.json(projects[0].projectsAsPeers);
});

export default router;
