import { prisma } from "../prismaClient";
import bcrypt from "bcrypt";

export default async function signup(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.login.create({
      data: { email, password: hashedPassword }
    });
    res.status(201).json({ message: "Account created", user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(400).json({ error: "Email already exists" });
  }
}
