import { Router } from "express";
const router = Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// POST a new team
router.post("/", async (req, res) => {
    const { name, projectId, memberIds = [] } = req.body;

    try {
        const team = await prisma.teams.create({
            data: {
                name,
                ...(projectId ? { projectId: Number(projectId) } : {}),
                ...(memberIds.length > 0
                  ? { members: { connect: memberIds.map(id => ({ id })) } }
                  : {}),
            },
            include: {
                members: true,
                project: true,
            },
        });

        res.status(201).json({ message: "Team created", team });
    } catch (error) {
        console.error("Error creating team:", error);
        res.status(500).json({ message: "Failed to create team", error: error.message });
    }
});

// POST a new member to a team
router.post("/:teamId/members", async (req, res) => {
  const { teamId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "Missing or invalid userId in request body" });
  }

  if (isNaN(teamId)) {
  return res.status(400).json({ message: "Invalid teamId" });
}

  try {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedTeam = await prisma.teams.update({
      where: { id: parseInt(teamId) },
      data: {
        members: {
          connect: { id: userId },
        },
      },
      include: {
        members: true,
        project: true,
      },
    });

    res.status(200).json({ message: "Member added", team: updatedTeam });
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({ message: "Failed to add member", error: error.message });
  }
});

// GET all teams
router.get("/", async (req, res) => {
    try {
        const teams = await prisma.teams.findMany({
            include: {
                members: true,
                project: true,
            },
        });

        res.status(200).json(teams);
    } catch (error) {
        console.error("Error fetching teams:", error);
        res.status(500).json({ message: "Failed to fetch teams", error: error.message });
    }
});

// GET all teams a user belongs to
router.get("/:memberid", async (req, res) => {
    const { memberid }  = req.params;
    try {
        const teams = await prisma.teams.findMany({
        where: {
          members: {
            some: { id: parseInt(memberid) },
            },
        },
        include: { 
          members: true,
          project: true,
        } 
        });
        res.status(200).json(teams);
        
    } catch (error) {
        console.error("Error fetching teams:", error);
        res.status(500).json({ message: "Failed to fetch teams", error: error.message });
    }
}); 

// PUT a project on a team
router.put("/", async(req,res) => {
  const {teamId, projectId} = req.body;
  try {
    const team = await prisma.teams.update({
      where: {id: parseInt(teamId)},
      data: {
        projectId: parseInt(projectId)
      },
      include: {
        members: true,
        project: true
      }
    })
    res.status(200).json({ message: "Team project updated", team });
  } catch (error) {
    console.error("Error updating team project:", error);
    res.status(500).json({ message: "Failed to update team project", error: error.message });
  }
})

// REMOVE a member from a team
router.delete("/:teamId/members/:memberId", async (req, res) => {
  const { teamId, memberId } = req.params;

  try {
    const team = await prisma.teams.update({
      where: { id: parseInt(teamId) },
      data: {
        members: {
          disconnect: { id: memberId },
        },
      },
      include: {
        members: true,
        project: true,
      },
    });

    res.status(200).json({ message: "Member removed", team });
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({ message: "Failed to remove member", error: error.message });
  }
});

// REMOVE a team
router.delete("/:teamId", async (req, res) => {
  const { teamId } = req.params;

  if (isNaN(teamId)) {
    return res.status(400).json({ message: "Invalid teamId" });
  }

  try {
    const deletedTeam = await prisma.teams.delete({
      where: { id: parseInt(teamId) },
      include: {
        members: true,
        project: true,
      },
    });

    res.status(200).json({ message: "Team removed", team: deletedTeam });
  } catch (error) {
    console.error("Error removing team:", error);
    if (error.code === 'P2025') {
      res.status(404).json({ message: "Team not found" });
    } else {
      res.status(500).json({ message: "Failed to remove team", error: error.message });
    }
  }
});

export default router;