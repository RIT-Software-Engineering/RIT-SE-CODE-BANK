import { Router } from "express";
const router = Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  const {
    lname,
    fname,
    email,
    type,
    semester_group,
    project,
    active,
    last_login,
    prev_login,
    createdAt,
  } = req.body;

  try {
    const saved = await prisma.users.create({
      data: {
        lname,
        fname,
        email,
        type,
        semester_group,
        project,
        active,
        last_login,
        prev_login,
        createdAt,
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
      type: "student",
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

export default router;
