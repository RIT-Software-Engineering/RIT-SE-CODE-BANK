import express from "express";

import { PrismaClient } from '../prisma/generated/client/index.js'
import { createSectionBlock, saveSectionMaterial, shareSectionBlock, removeSectionBlock, ownedSession } from '../utils/sectionContent.js';
import { refreshSectionSync } from '../utils/sectionSync.js';

const prisma = new PrismaClient();

const router = express.Router();
export default router


/** GET /api/cmt/session/:courseId
 * Gets all the sessions for one class id, including the class material
 * When successful, returns both sessions and the session materials
 */
router.get("/:courseId", async(req, res) => {
    const { courseId } = req.params;
    const sessions = await prisma.session.findMany({
        where: {courseId: parseInt(courseId)}
    });

    // We do a Promise.all for all materials from each session, though can return empty array if no material.
    var sessionMaterials = await Promise.all(
        sessions.map(async (session) => {
        const material = await prisma.sessionMaterial.findMany({
            where: {sessionId: Number(session.id), active: true}
        });
       return {material}
    })
    )
    const sessionBlocks = await Promise.all(
        sessions.map(async (session) => ({
            blocks: await prisma.sessionBlock.findMany({
                where: {sessionId: Number(session.id)},
                orderBy: [{position: "asc"}, {id: "asc"}]
            })
        }))
    );
    
    res.json({
        sessions: sessions,
        sessionMaterials: sessionMaterials,
        sessionBlocks
    })
});

/** POST /api/cmt/session/
 * Makes a new session in the DB and returns it so we can use its id
 */
router.post("/", async (req, res) => {
    const session = await prisma.session.create({
        data: {
            sessionNum: req.body.sessionCount+1,
            course: {connect: {id: Number(req.body.id)}}
        }
    });

    res.json({ session })
});

/** POST /api/cmt/session/blocks
 * Creates an optional organizational block within a session.
 */
router.post("/blocks", async (req, res) => {
    const {block, courseId} = await createSectionBlock(prisma, req.user?.uid, req.body);
    await refreshSectionSync(prisma, courseId);
    res.json({block});
});

router.post("/blocks/:blockId/share", async (req, res) => {
    const courseId = await shareSectionBlock(prisma, req.user?.uid, req.params.blockId);
    await refreshSectionSync(prisma, courseId);
    res.json({success: true});
});

router.delete("/blocks/:blockId", async (req, res) => {
    const courseId = await removeSectionBlock(prisma, req.user?.uid, req.params.blockId);
    await refreshSectionSync(prisma, courseId);
    res.json({success: true});
});

/** POST /api/cmt/session/:sessionId
 * Creates session material. Upon success returns the session material, but it doesn't do anything with it
 */ 
router.post("/:sessionId", async (req, res) => {
    const {material, courseId} = await saveSectionMaterial(prisma, req.user?.uid, req.params.sessionId, req.body);
    await refreshSectionSync(prisma, courseId);
    res.json({ material })
})

/** PUT /api/cmt/session/material/:materialId
 * Updates session material. Upon success returns the session material.
 * Will always update the label and body even if no changes are actually made to them upon submission.
 */ 
router.put("/material/:materialId", async (req, res) => {
    const {material, courseId} = await saveSectionMaterial(prisma, req.user?.uid, req.body.sessionId, req.body, req.params.materialId);
    await refreshSectionSync(prisma, courseId);
    res.json({ material })
})

/** PATCH /api/cmt/session/blocks/:blockId
 * Updates a block's name or progression status.
 */
router.patch("/blocks/:blockId", async (req, res) => {
    const {blockId} = req.params;
    const {name, status} = req.body;
    if (!req.user) return res.status(401).json({error: "Not authenticated"});

    const existingBlock = await prisma.sessionBlock.findFirst({
        where: {id: Number(blockId), session: {course: {professorId: req.user.uid}}}
    });
    if (!existingBlock) return res.status(404).json({error: "Block not found for this instructor"});

    const allowedStatuses = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];
    if (status !== undefined && !allowedStatuses.includes(status))
        return res.status(400).json({error: "Invalid block status"});
    if (name !== undefined && !name.trim())
        return res.status(400).json({error: "Block name is required"});

    const block = await prisma.sessionBlock.update({
        where: {id: Number(blockId)},
        data: {
            ...(name !== undefined && {name: name.trim()}),
            ...(status !== undefined && {status})
        }
    });
    const session = await prisma.session.findUnique({where: {id: block.sessionId}});
    await refreshSectionSync(prisma, session.courseId);
    res.json({block});
});

/** PATCH /api/cmt/session/blocks/:blockId/move
 * Reorders a block or moves it to another session in the same course.
 */
router.patch("/blocks/:blockId/move", async (req, res) => {
    const {blockId} = req.params;
    const {targetSessionId, targetPosition} = req.body;
    if (!req.user) return res.status(401).json({error: "Not authenticated"});

    const block = await prisma.sessionBlock.findFirst({
        where: {id: Number(blockId), session: {course: {professorId: req.user.uid}}},
        include: {session: true}
    });
    const targetSession = await prisma.session.findFirst({
        where: {
            id: Number(targetSessionId),
            courseId: block?.session.courseId,
            course: {professorId: req.user.uid}
        }
    });
    if (!block || !targetSession) return res.status(404).json({error: "Block or target session not found"});

    const sourceBlocks = await prisma.sessionBlock.findMany({
        where: {sessionId: block.sessionId, id: {not: block.id}},
        orderBy: [{position: "asc"}, {id: "asc"}]
    });
    const targetBlocks = block.sessionId === targetSession.id
        ? sourceBlocks
        : await prisma.sessionBlock.findMany({
            where: {sessionId: targetSession.id},
            orderBy: [{position: "asc"}, {id: "asc"}]
        });
    const position = Math.max(0, Math.min(Number(targetPosition ?? targetBlocks.length), targetBlocks.length));
    targetBlocks.splice(position, 0, block);

    await prisma.$transaction(async (tx) => {
        if (block.sessionId !== targetSession.id) {
            await Promise.all(sourceBlocks.map((sourceBlock, index) =>
                tx.sessionBlock.update({where: {id: sourceBlock.id}, data: {position: index}})
            ));
        }
        await Promise.all(targetBlocks.map((targetBlock, index) =>
            tx.sessionBlock.update({
                where: {id: targetBlock.id},
                data: {sessionId: targetSession.id, position: index}
            })
        ));
        await tx.sessionMaterial.updateMany({
            where: {blockId: block.id},
            data: {sessionId: targetSession.id, sessionNum: targetSession.sessionNum - 1}
        });
    });

    await refreshSectionSync(prisma, targetSession.courseId);
    res.json({success: true});
});

/** PUT /api/cmt/session/:sessionId
 * Updates session material. Upon success returns the session material.
 * Will always update the label and body even if no changes are actually made to them upon submission.
 */ 
router.put("/:sessionId", async (req, res) => {
    const {sessionId} = req.params;
    const {completed, date} = req.body;
    const owned = await ownedSession(prisma, sessionId, req.user?.uid);
    
    await prisma.session.update({
        where: {id: Number(sessionId)},
        data: {
            completed: Boolean(completed),
            date
        }
    })

    await refreshSectionSync(prisma, owned.courseId);
    res.sendStatus(200)
})

/** PATCH /api/cmt/session/:sessionId/cancellation
 * Marks a session as canceled or restores it without changing its date,
 * completion state, or materials.
 */
router.patch("/:sessionId/cancellation", async (req, res) => {
    const {sessionId} = req.params;
    const {canceled} = req.body;

    if (!req.user) return res.status(401).json({error: "Not authenticated"});
    if (typeof canceled !== "boolean") return res.status(400).json({error: "canceled must be a boolean"});

    const existingSession = await prisma.session.findFirst({
        where: {
            id: Number(sessionId),
            course: {professorId: req.user.uid}
        }
    });
    if (!existingSession) return res.status(404).json({error: "Session not found for this instructor"});

    const session = await prisma.session.update({
        where: {id: Number(sessionId)},
        data: {
            canceled,
            canceledAt: canceled ? new Date() : null
        }
    });

    await refreshSectionSync(prisma, session.courseId);
    res.json({session})
})

/** DELETE /api/cmt/session/material/:materialId
 * Sets a specific session material to inactive. Upon success returns the session material to be updated
 * Not a true delete, but users cannot see inactive items so basically functions like one
 */ 
router.delete('/material/:materialId', async (req, res) => {
    const {materialId} = req.params;
    const existing = await prisma.sessionMaterial.findFirst({
        where: {id: Number(materialId), session: {course: {professorId: req.user?.uid || ""}}}, include: {session: true}
    });
    if (!existing) return res.status(404).json({error: "Material not found for this instructor"});
    const material = await prisma.sessionMaterial.update({
        where: {id: parseInt(materialId)},
        data: {active: false},
    });
    await refreshSectionSync(prisma, existing.session.courseId);
    res.json({ material })
})

/** DELETE /api/cmt/session/:courseId/:sessionNum
 * Sets material for one session to inactive. Upon success returns the session materials to be updated
 * Not a true delete, but users cannot see inactive items so basically functions like one
 */ 
router.delete("/:courseId/:sessionNum", async (req, res) => {
    const {courseId, sessionNum} = req.params;
    const session  = await prisma.session.findFirstOrThrow({
    where: {courseId: parseInt(courseId), sessionNum: parseInt(sessionNum), course: {professorId: req.user?.uid || ""}}
    });
    let sessionId = session.id; 
    await prisma.sessionMaterial.updateMany({
        where: {sessionId: sessionId },
        data: {active: false}
    });
    // Have to get it in a second findmany because prisma is a hater like that
    const deletedMaterials = await prisma.sessionMaterial.findMany({
        where: {sessionId: sessionId, active: false}
    })
    await refreshSectionSync(prisma, Number(courseId));
    res.json({ materials: deletedMaterials })
});
