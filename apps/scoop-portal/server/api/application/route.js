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
  const {
     lastName,
     firstName,
     ritEmail,
     coopsCompleted,
     startSemester,
     coursesTaken,
     coopSearchStartDate,
     coopSearchPlatforms,
     pendingOffers,
     pendingOffersDetails,
     rejectionLetters,
     rejectionLettersDetails,
     SEcoopInterest,
     SEcoopAvailability,
     remoteAbility,
     additionalComments,
     resumeFile,
     createdAt
  } = req.body;

  try {
    const saved = await prisma.application.create({
      data: {
        lastName,
     firstName,
     ritEmail,
     coopsCompleted,
     startSemester,
     coursesTaken,
     coopSearchStartDate,
     coopSearchPlatforms,
     pendingOffers,
     pendingOffersDetails,
     rejectionLetters,
     rejectionLettersDetails,
     SEcoopInterest,
     SEcoopAvailability,
     remoteAbility,
     additionalComments,
     resumeFile,
     createdAt
      }
    });
    res.status(200).json({ message: "Application saved", application: saved });

  } catch (error) {
    console.error("Error saving application:", error);
    return res.status(500).json({ message: "Error saving application", error: error.message });
  }
  
})

// GET all applications
router.get("/", async (req, res) => {
  try {
    const applications = await prisma.application.findMany();
    res.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

export default router;
