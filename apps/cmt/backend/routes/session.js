import express from "express";

import { PrismaClient } from '../prisma/generated/client/index.js'

const prisma = new PrismaClient();

const router = express.Router();
export default router


/** GET /api/cmt/session/:courseId
 * Gets all the sessions for one class id, including the class material
 * When successful, returns both sessions and the session materials
 */
router.get("/:courseId", async(req, res) => {
    try{
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
    
    res.json({
        success: true,
        sessions: sessions,
        sessionMaterials: sessionMaterials
    })
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
        })
    }
});

/** POST /api/cmt/session/
 * Makes a new session in the DB and returns it so we can use its id
 */
router.post("/", async (req, res) => {
    try{
        const session = await prisma.session.create({
            data: {
                sessionNum: req.body.sessionCount+1,
                course: {connect: {id: Number(req.body.id)}}
            }
        });

        res.json({
        success: true,
        message: "Successfully created new session",
        session: session,
    });
    }
    catch (error) {
        res.json({
            success: false,
            error: error.message
        })
    }
});

/** POST /api/cmt/session/:sessionId
 * Creates session material. Upon success returns the session material, but it doesn't do anything with it
 */ 
router.post("/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;
        const item = req.body;
        const material = await prisma.sessionMaterial.create({
            data: {
                type: item.itemType,
                label:item.itemLabel,
                body: item.itemBody,
                sessionId: parseInt(sessionId),
                sessionNum: item.sessionNum,
            }
        });

        res.json({
            success: true,
            material: material
        })
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        })
    }
})

/** PUT /api/cmt/session/material/:materialId
 * Updates session material. Upon success returns the session material.
 * Will always update the label and body even if no changes are actually made to them upon submission.
 */ 
router.put("/material/:materialId", async (req, res) => {
    try {
        const {materialId} = req.params;
        const {itemLabel, itemBody, itemType, sessionNum, sessionId} = req.body;
        
        const material = await prisma.sessionMaterial.update({
            where: {id: Number(materialId)},
            data: {
                label: itemLabel,
                body:  itemBody,
                type: itemType,
                sessionNum: parseInt(sessionNum),
                sessionId: parseInt(sessionId),
            }
        })

        res.json({
            success: true,
            message: "Successfully updated material",
            material: material,
        })
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
        })
    }
})

/** PUT /api/cmt/session/:sessionId
 * Updates session material. Upon success returns the session material.
 * Will always update the label and body even if no changes are actually made to them upon submission.
 */ 
router.put("/:sessionId", async (req, res) => {
    try {
        const {sessionId} = req.params;
        const {completed, date} = req.body;
        
        await prisma.session.update({
            where: {id: Number(sessionId)},
            data: {
                completed: Boolean(completed),
                date
            }
        })

        res.json({
            success: true,
        })
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
        })
    }
})

/** DELETE /api/cmt/session/material/:materialId
 * Sets a specific session material to inactive. Upon success returns the session material to be updated
 * Not a true delete, but users cannot see inactive items so basically functions like one
 */ 
router.delete('/material/:materialId', async (req, res) => {
    try {
        const {materialId} = req.params;
        const material = await prisma.sessionMaterial.update({
            where: {id: parseInt(materialId)},
            data: {active: false},
        });
        res.json({
            success: true,
            material: material,
        })
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
        })
    }
})

/** DELETE /api/cmt/session/:courseId/:sessionNum
 * Sets material for one session to inactive. Upon success returns the session materials to be updated
 * Not a true delete, but users cannot see inactive items so basically functions like one
 */ 
router.delete("/:courseId/:sessionNum", async (req, res) => {
    try {
        const {courseId, sessionNum} = req.params;
        const session  = await prisma.session.findFirstOrThrow({
        where: {courseId: parseInt(courseId), sessionNum: parseInt(sessionNum)}
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
        res.json({
            success: true,
            materials: deletedMaterials,
            message: `Successfully deleted materials all materials for session ID ${sessionId}`,
        })
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        })
    }
});