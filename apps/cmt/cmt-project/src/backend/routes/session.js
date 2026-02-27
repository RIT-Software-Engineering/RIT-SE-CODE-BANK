import express from "express";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const router = express.Router();
export default router


// GET /api/cmt/session/:courseId
router.get("/:courseId", async(req, res) => {
    try{
    const { courseId } = req.params;
    const sessions = await prisma.session.findMany({
        where: {courseId: parseInt(courseId)}
    });
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

// POST /api/cmt/session/
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

// POST /api/cmt/session/:sessionId
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