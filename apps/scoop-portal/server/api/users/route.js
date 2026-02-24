import { Router } from "express";
const router = Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  const {
    id,
    lname,
    fname,
    email,
    type,
    semester_group,
    project,
    active,
    last_login,
    prev_login,
  } = req.body;

  try {
    const saved = await prisma.users.create({
      data: {
        id,
        lname,
        fname,
        email,
        type,
        semester_group,
        project,
        active,
        last_login,
        prev_login,
      },
    });
    res.status(200).json({ message: "User saved", user: saved });
  } catch (error) {
    console.error("Error saving user:", error);
    return res
      .status(500)
      .json({ message: "Error saving user", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;
  try{
    const updatedUser = await prisma.users.update({
      where: { id },
      data: { type },
    });
    return res.status(200).json({ message: "User updated", user: updatedUser });

  }catch(error){
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Error updating user", error: error.message });
  }
});

// GET all users
router.get("/", async (req, res) => {
  const { fname, lname } = req.query;
  const whereClause = {};
  if (fname) {
    whereClause.fname = fname;
  }
  if (lname) {
    whereClause.lname = lname;
  }
  try {
    let users;
    if (fname || lname) {
      users = await prisma.users.findMany({ where: whereClause });
    } else {
      users = await prisma.users.findMany();
    }
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET employees with optional search by firstName or lastName
router.get("/employees", async (req, res) => {
  const search = req.query.search || "";

  try {
    const whereCondition = {
      type: "scooployee",
      ...(search.trim() !== "" && {
        OR: [{ fname: { contains: search } }, { lname: { contains: search } }],
      }),
    };

    const employees = await prisma.users.findMany({
      where: whereCondition,
      include: {
        teams: true,
      },
      take: 30, // Limiting to 30 for demo purposes, in case we mass populate db.
    });

    res.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// GET supervisors
router.get("/supervisors", async (req, res) => {
  try {
    const whereCondition = {
      type: "scoopervisor",
    };

    const supervisors = await prisma.users.findMany({
      where: whereCondition,
      include: {
        teams: true,
      },
      take: 30, // Limiting to 30 for demo purposes, in case we mass populate db.
    });

    res.json(supervisors);
  } catch (error) {
    console.error("Error fetching supervisors:", error);
    res.status(500).json({ error: "Failed to fetch supervisors" });
  }
});

// GET user by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.users.findUnique({
      where: { id: id },
    });
    if (!user) {
      console.error("User not found:", id);
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user: ", error);
    res.status(500).json({
      message: "Failed to fetch user",
      error: error.message,
    });
  }
});

// DELETE user by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Remove user from journal entries where they are a recipient (many-to-many)
    await prisma.journalEntry.updateMany({
      where: { recipients: { some: { id } } },
      data: {},
    });
    // Disconnect recipient relation explicitly
    await prisma.users.update({
      where: { id },
      data: {
        receivedEntries: { set: [] },
      },
    });

    // Delete journal entries where user is the sender or topic
    await prisma.journalEntry.deleteMany({
      where: { OR: [{ sender_id: id }, { topic_id: id }] },
    });

    // Disconnect user from teams they are a member of
    await prisma.users.update({
      where: { id },
      data: {
        teams: { set: [] },
      },
    });

    // Nullify scoopervisor references on teams they supervise
    await prisma.teams.updateMany({
      where: { scoopervisorId: id },
      data: { scoopervisorId: null },
    });

    // Delete associated login if exists
    await prisma.login.deleteMany({ where: { user: { id } } });

    // Finally delete the user
    await prisma.users.delete({ where: { id } });

    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
});

export default router;
