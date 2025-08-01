import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { createReadStream } from "fs";

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

// Get project by ID
// /projects/:id
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
        where: { id },
    });

    if (!project) {
        res.sendStatus(404);
        return;
    }

    res.json(project);
});

// Create project
// /projects
router.post("/", async (req, res) => {
    const { name, description, peerEmails } = req.body as {
        name: string;
        description: string;
        peerEmails: string[];
    };
    const uid = req.header("x-user-id");

    // First check if the peers exist wth the emails if provided
    if (peerEmails) {
        const peers = await prisma.user.findMany({
            where: {
                email: {
                    in: peerEmails,
                },
            },
        });

        if (peers.length != peerEmails.length) {
            res.status(404).json({
                message: `One or more users not found: ${peerEmails.filter(
                    (e) => peers.map((p) => e != p.email)
                )}`,
            });
            return;
        }
    }

    const project = await prisma.project.create({
        data: {
            name,
            description,
            overseer: {
                connect: {
                    id: uid,
                },
            },
            peers: {
                connect: peerEmails.map((e) => ({
                    email: e,
                })),
            },
        },
    });

    res.status(201).json(project);
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

// Add peer to project
// /projects/:id/addPeer/:peerEmail
router.post("/:id/addPeer/:peerEmail", async (req, res) => {
    const id = req.params.id;
    const peerEmail = req.params.peerEmail;

    try {
        // Make sure peer exists
        await prisma.user.findFirstOrThrow({
            where: { email: peerEmail },
        });
    } catch (err) {
        res.status(404).json({
            message: "Couldn't find peer with email " + peerEmail,
        });
        return;
    }
    try {
        // Make sure project exists as well
        await prisma.project.findFirstOrThrow({
            where: { id },
        });

        await prisma.project.update({
            where: { id },
            data: {
                peers: {
                    connect: { email: peerEmail },
                },
            },
        });

        res.status(201).json({
            message: "Peer added to project successfully.",
        });
    } catch (err) {
        res.status(404).json({
            message: "Coudln't find project with id " + id,
        });
    }
});

// Remove peer from project
// /projects/:id/removePeer/:peerEmail
router.delete("/:id/removePeer/:peerEmail", async (req, res) => {
    const id = req.params.id;
    const peerEmail = req.params.peerEmail;

    try {
        // Make sure peer exists
        await prisma.user.findFirstOrThrow({
            where: { email: peerEmail },
        });
    } catch (err) {
        res.status(404).json({
            message: "Couldn't find peer with email " + peerEmail,
        });
        return;
    }
    try {
        // Make sure project exists as well
        await prisma.project.findFirstOrThrow({
            where: { id },
        });
    } catch (err) {
        res.status(404).json({
            message: "Coudln't find project with id " + id,
        });
        return;
    }

    try {
        // Make sure the peer is in the project
        await prisma.user.findFirstOrThrow({
            where: {
                projectsAsPeers: {
                    some: { id },
                },
            },
        });
    } catch (err) {
        res.status(404).json({
            message:
                "Coudln't find peer with email " +
                peerEmail +
                " in project " +
                id,
        });
        return;
    }

    await prisma.project.update({
        where: { id },
        data: {
            peers: {
                disconnect: { email: peerEmail },
            },
        },
    });

    res.status(201).json({
        message: "Peer removed from project successfully.",
    });
});

// Assign assessment to peers
// /projects/:id/assignAssessment
router.post("/:id/assignAssessment", async (req, res) => {
    const { id } = req.params;
    const {
        formId,
        name,
        description,
        receivers,
        responders,
        startDate,
        dueDate,
    } = req.body as {
        formId: string;
        name: string;
        description: string;
        receivers: string[];
        responders: string[];
        startDate: string;
        dueDate: string;
    };

    const a = await prisma.$transaction(async (tx) => {
        const createdAssessment = await tx.assessment.create({
            data: {
                project: {
                    connect: { id },
                },
                name,
                description,
                receivers: {
                    connect: receivers.map((email) => ({ email })),
                },
                responders: {
                    connect: responders.map((email) => ({ email })),
                },
                feedbackForm: {
                    connect: { id: formId },
                },
                startDate,
                dueDate,
            },
        });

        await tx.project.update({
            where: { id },
            data: {
                assessments: {
                    connect: {
                        id: createdAssessment.id,
                    },
                },
            },
        });
        return createdAssessment;
    });

    res.status(201).json(a);
});

export default router;
