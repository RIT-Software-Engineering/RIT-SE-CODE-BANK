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

// Get user by email
// /users/byEmail/:email
router.get("/byEmail/:email", async (req, res) => {
    const email = req.params.email;

    const u = await prisma.user.findFirst({
        where: {
            email,
        },
    });
    res.json(u);
});

export default router;
