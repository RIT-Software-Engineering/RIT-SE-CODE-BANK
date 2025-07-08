// import { NextResponse } from "next/server";
import { Router } from "express";
const router = Router();
import { PrismaClient as _PrismaClient } from "../../server/src/generated/prisma/index.js";
const prisma = new _PrismaClient();

/**
 * Post route to save an application
 * @param {Object} req - The request object containing application data
 */
router.post("/", async (req, res) => {
  const { name, email, phone, skills, academicStanding, semester, coopsCompleted, resumeUrl } = req.body;
  try {
    const saved = await prisma.application.create({
      data: {
        name,
        email,
        phone,
        skills,
        academicStanding,
        semester,
        coopsCompleted,
        resumeUrl
      }
    });
    res.status(200).json({ message: "Application saved", application: saved });

  } catch (error) {
    console.error("Error saving application:", error);
    return res.status(500).json({ message: "Error saving application", error: error.message });
  }
  
})

export default router;
