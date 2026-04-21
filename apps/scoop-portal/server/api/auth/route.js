import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();
const router = Router();

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// create login record
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  try {
    const existing = await prisma.login.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = hashPassword(password);

    const newLogin = await prisma.login.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: "Account created", login: newLogin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// verify credentials
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const loginRecord = await prisma.login.findUnique({ where: { email } });
    if (!loginRecord) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const hashedPassword = hashPassword(password);
    if (hashedPassword !== loginRecord.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    //  find related user record
    const userRecord = await prisma.users.findUnique({ where: { email } });

    res.status(200).json({
      message: "Login successful",
      user: userRecord || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", async (req, res) =>{
    try {
        const loginCreds = await prisma.login.findMany();
        res.json(loginCreds);
    } catch (error) {
        console.error("Error fetching logins:", error);
        res.status(500).json({ error: "Failed to fetch login credentials" });
    }
});

export default router;
