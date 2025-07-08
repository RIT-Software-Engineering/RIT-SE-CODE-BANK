import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// Get all projects
// /projects
router.get("/", async (req, res) => {
    const projects = await prisma.project.findMany({
        orderBy: {
            name: "asc",
        },
    });

    res.json(projects);
});

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

    if (projects.length == 0) {
        res.sendStatus(404);
    } else res.json(projects[0].projectsAsPeers);
});

// Get project as overseer
// /projects/asOverseer/:userId
router.get("/asOverseer/:userId", async (req, res) => {
    const userId = req.params.userId;

    const projects = await prisma.user.findMany({
        select: {
            projectsAsOverseer: {},
        },
        where: {
            id: userId,
        },
    });

    res.json(projects[0].projectsAsOverseer);
});

export default router;

// Get peers for a project
// /projects/getPeers/:id
router.get("/getPeers/:id", async (req, res) => {
    const id = req.params.id;

    const peers = await prisma.user.findMany({
        where: {
            projectsAsPeers: {
                some: {
                    id: id,
                },
            },
        },
    });

    res.json(peers);
});

// Get overseers for a project
// /projects/:id/overseers
router.get("/:id/overseers", async (req, res) => {
    const id = req.params.id;

    const peers = await prisma.user.findMany({
        where: {
            projectsAsOverseer: {
                some: {
                    id: id,
                },
            },
        },
    });

    res.json(peers);
});
