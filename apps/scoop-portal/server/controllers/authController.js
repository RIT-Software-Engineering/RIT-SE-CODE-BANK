import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

export const signup = async (req, res) => {
  const { email, password, fname, lname, type } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const loginRecord = await prisma.login.create({
      data: { email, password: hashedPassword }
    });

    const userRecord = await prisma.users.create({
      data: {
        email,
        fname,
        lname,
        type,
        semester_group: "",
        project: "",
        active: "yes",
        last_login: new Date().toISOString(),
        prev_login: "",
        loginId: loginRecord.id
      }
    });

    res.status(201).json({ message: "User created", user: userRecord });
  } catch (err) {
    res.status(400).json({ error: "Error creating account" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const loginRecord = await prisma.login.findUnique({ where: { email } });
    if (!loginRecord) return res.status(401).json({ error: "Invalid credentials" });

    const isValid = await bcrypt.compare(password, loginRecord.password);
    if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

    const userRecord = await prisma.users.findUnique({
      where: { email },
    });

    res.status(200).json({ message: "Login successful", user: userRecord });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

