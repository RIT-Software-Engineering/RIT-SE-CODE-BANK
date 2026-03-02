import express from "express";

import { PrismaClient } from "@prisma/client";

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
            where: {sessionId: Number(session.id)}
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
        const material = await prisma.sessionMaterial.create({
            data: {
                type: req.body.itemType,
                label: req.body.itemLabel,
                body: req.body.itemBody,
                sessionId: parseInt(sessionId),
                sessionNum: req.body.sessionNum,
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