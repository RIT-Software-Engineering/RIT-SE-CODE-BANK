import { Router } from "express";
const router = Router();
import { PrismaClient as _PrismaClient } from "../../server/src/generated/prisma/index.js";
const prisma = new _PrismaClient();

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
  try {
    const users = await prisma.users.findMany();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET all employees 
router.get("/employees", async (req, res) => {
    try {
        const employees = await prisma.users.findMany({ 
            where: {
                type: "student", //(temp using "students" type from old code)
            },
        });
        res.json(employees);
    } catch (error) {
        console.error("Error fetching employees:", error);
        res.status(500).json({ error: "Failed to fetch employees" });
    }
});

export default router;