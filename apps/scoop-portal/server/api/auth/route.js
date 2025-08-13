import { Router } from "express";
const router = Router();
// import { PrismaClient } from "@prisma/client";
import { signup, login } from "../../controllers/authController.js";

// const prisma = new PrismaClient();
router.post("/signup", signup);
router.post("/login", login);


// router.post("/login", async (req, res) => {
//     const users = await prisma.users.findMany();
//   const { username, password } = req.body;
//   const user = await authenticateUser(username, password);
//   if (!user) return res.status(401).json({ error: "Invalid credentials" });
// res.json(user);   
// });

// router.post("/reset-password", async (req, res) => {
//   const { username, newPassword } = req.body;
//   await resetPassword(username, newPassword);
//   res.json({ success: true });
// });
export default router;