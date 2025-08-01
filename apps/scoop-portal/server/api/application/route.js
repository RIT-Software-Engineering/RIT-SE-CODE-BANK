import { Router } from "express";
const router = Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Post route to save an application
 * @param {Object} req - The request object containing application data
 * @param {Object} res - The response object to send back the saved application or an error
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
        createdAt,
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
                createdAt,
            },
        });
        res.status(200).json({
            message: "Application saved",
            application: saved,
        });
    } catch (error) {
        console.error("Error saving application:", error);
        return res.status(500).json({
            message: "Error saving application",
            error: error.message,
        });
    }
});

/**
 * GET all applications
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object that sends back all applications or an error
 */
router.get("/", async (req, res) => {
    try {
        const applications = await prisma.application.findMany();
        res.json(applications);
    } catch (error) {
        console.error("Error fetching applications:", error);
        res.status(500).json({ error: "Failed to fetch applications" });
    }
});

// Update application accepted status
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { accepted } = req.body;
    try {
        const updated = await prisma.application.update({
            where: { id: Number(id) },
            data: { accepted },
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: "Failed to update application status" });
    }
});

//Get all accepted applications
router.get("/accepted", async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      where: { accepted: true },
    });
    res.json(applications);
  } catch (error) { 
    console.error("Error fetching accepted applications:", error);
    res.status(500).json({ error: "Failed to fetch accepted applications" });
  }
});

// PUT route to update application accepted status
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { accepted} = req.body;

  try { 
    const updated = await prisma.application.update({
      where: { id: Number(id) },
      data: { accepted },
    });
    res.status(200).json({ message: "Application updated", application: updated });
  } catch (error) {
    console.error("Error updating application:", error);
    return res.status(500).json({ message: "Error updating application", error: error.message });
  } 
});
export default router;
