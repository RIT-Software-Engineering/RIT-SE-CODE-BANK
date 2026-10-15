import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { createReadStream } from "fs";
import { dispatchTemplated } from "../utils/notifications";

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

    // Find the peers up front so we can both validate them and use their user IDs for notifications.
    const peers = await prisma.user.findMany({
        where: {
            email: {
                in: peerEmails,
            },
        },
    });

    if (peers.length !== peerEmails.length) {
        res.status(400).json({
            message: `One or more peers not found: ${peerEmails.filter(
                (e) => peers.map((p) => e != p.email)
            )}`,
        });
        return;
    }

    const project = await prisma.project.create({
        data: {
            name,
            description,
            overseer: {
                connect: { id: uid },
            },
            peers: {
                connect: peerEmails.map((e) => ({ email: e })),
            },
        },
    });

    // Notify the peers that were added.
    for (const peer of peers) {
        try {
            await dispatchTemplated(peer.id, {
                event: "peer_added",
                role: "peer",
                userEmail: peer.email,
                subject: "You have been added to a PeerEval project",
                context: {
                    recipient: {
                        name: peer.name,
                        email: peer.email,
                    },
                    item: {
                        id: project.id,
                        title: project.name,
                        description: project.description,
                    },
                    appName: "PeerEval",
                },
            });

            console.log(
                `[notifications] Sent peer_added notification to ${peer.email}`
            );
        } catch (err) {
            // Notification failure should not undo a successfully created project.
            console.error(
                `[notifications] Failed to notify ${peer.email}:`,
                err
            );
        }
    }

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
    } else {
        res.json(projects[0].projectsAsPeers);
    }
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

    let peer;

    try {
        // Make sure peer exists and keep their user record
        peer = await prisma.user.findFirstOrThrow({
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
        const project =await prisma.project.findFirstOrThrow({
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

        try {
            await dispatchTemplated(peer.id, {
                event: "peer_added",
                role: "peer",
                userEmail: peer.email,
                subject: "You have been added to a PeerEval project",
                context: {
                    recipient: {
                        name: peer.name,
                        email: peer.email,
                    },
                    item: {
                        id: project.id,
                        title: project.name,
                        description: project.description,
                    },
                    appName: "PeerEval",
                },
            });

            console.log(
                `[notifications] Sent peer_added notification to ${peer.email}`
            );
        } catch (err) {
            // Notification failure should not undo a successfully added peer.
            console.error(
                `[notifications] Failed to notify ${peer.email}:`,
                err
            );
        }

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

    const peer = await prisma.user.findUnique({
        where: { email: peerEmail },
    });

    if (!peer) {
        res.status(404).json({
            message: "Couldn't find peer with email " + peerEmail,
        });
        return;
    }

    const project = await prisma.project.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            description: true,
        },
    });

    if (!project) {
        res.status(404).json({
            message: "Couldn't find project with id " + id,
        });
        return;
    }

    const membership = await prisma.user.findFirst({
        where: {
            id: peer.id,
            projectsAsPeers: {
                some: { id },
            },
        },
        select: { id: true },
    });

    if (!membership) {
        res.status(404).json({
            message:
                "Couldn't find peer with email " + peerEmail + " in project with id " + id,
        });
        return;
    }

    try {
        await prisma.project.update({
            where: { id },
            data: {
                peers: {
                    disconnect: { id: peer.id },
                },
            },
        });
    } catch (err) {
        console.error(
            `[projects] Failed to remove peer ${peerEmail} from project ${id}:`,
            err
        );
        res.status(500).json({
            message: "Failed to remove peer from project.",
        });
        return;
    }

    try {
        await dispatchTemplated(peer.id, {
            event: "peer_removed",
            role: "peer",
            userEmail: peer.email,
            subject: "You have been removed from PeerEval project: ${project.name}",
            context: {
                recipient: {
                    name: peer.name,
                    email: peer.email,
                },
                item: {
                    id: project.id,
                    title: project.name,
                    description: project.description,
                },
                appName: "PeerEval",
            },
        });

        console.log(
            `[notifications] Sent peer_removed notification to ${peer.email}`
        );
    } catch (err) {
        // Notification failure should not undo a successfully removed peer.
        console.error(
            `[notifications] Failed to notify ${peer.email} about removal:`,
            err
        );
    }

    res.status(200).json({
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

    // Get the project so notification context can include info about the project containing the assessment.
    const project = await prisma.project.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            description: true,
        },
    });

    if (!project) {
        res.status(404).json({
            message: "Couldn't find project with id " + id,
        });
        return;
    }

    // Get responder users so notifcations can use their user IDs
    const responderUsers = await prisma.user.findMany({
        where: {
            email: {
                in: responders,
            },
        },
    });

    const assessment = await prisma.$transaction(async (tx) => {
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
                    connect: { id: createdAssessment.id },
                },
            },
        });

        return createdAssessment;
    });

    // Notify responders that they have been assigned an assessment
    for (const responder of responderUsers) {
        try {
            await dispatchTemplated(responder.id, {
                event: "assessment_assigned",
                role: "responder",
                userEmail: responder.email,
                subject: `New Peer Evaluation Assigned: ${assessment.name}`,
                context: {
                    recipient: {
                        name: responder.name,
                        email: responder.email,
                    },
                    item: {
                        id: assessment.id,
                        title: assessment.name,
                        description: assessment.description,
                        projectId: project.id,
                        projectName: project.name,
                        dueDate: assessment.dueDate,
                    },
                    appName: "PeerEval",
                },
            });

            console.log(
                `[notifications] Sent assessment_assigned notification to ${responder.email}`
            );
        } catch (err) {
            // Notification failure should not undo a successfully created assessment.
            console.error(
                `[notifications] Failed to notify ${responder.email}:`,
                err
            );
        }
    }

    res.status(201).json(assessment);
});

export default router;
