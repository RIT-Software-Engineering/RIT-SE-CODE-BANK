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
    const formData = req.body;
    let resumeData = null;
    let resumeFileName = null;
    let resumeFileType = null;

    // Convert base64 resume data if present
    if (formData.resumeFile) {
        const [header, base64Data] = formData.resumeFile.split(',');
        
        // Check file size (base64 string length * 0.75 gives approximate file size in bytes)
        const fileSizeInMB = (base64Data.length * 0.75) / (1024 * 1024);
        if (fileSizeInMB > 8) { // 8MB limit
            return res.status(413).json({
                message: "File is too large. Please upload a file smaller than 8MB.",
                error: "File size exceeded"
            });
        }

        resumeData = Buffer.from(base64Data, 'base64');
        
        // Extract file type from the header
        const mimeMatch = header.match(/data:(.*?);/);
        if (mimeMatch) {
            resumeFileType = mimeMatch[1];
            
            // Validate file type
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(resumeFileType)) {
                return res.status(415).json({
                    message: "Invalid file type. Please upload a PDF or Word document.",
                    error: "Invalid file type"
                });
            }
        }
        
        resumeFileName = formData.resumeFileName;
    }

    try {
        const saved = await prisma.application.create({
            data: {
                applicant_id: formData.applicant_id,
                lastName: formData.lastName,
                firstName: formData.firstName,
                ritEmail: formData.ritEmail,
                coopsCompleted: formData.coopsCompleted,
                startSemester: formData.startSemester,
                coursesTaken: formData.coursesTaken,
                coopSearchStartDate: formData.coopSearchStartDate,
                coopSearchPlatforms: formData.coopSearchPlatforms,
                pendingOffers: formData.pendingOffers,
                pendingOffersDetails: formData.pendingOffersDetails,
                rejectionLetters: formData.rejectionLetters,
                rejectionLettersDetails: formData.rejectionLettersDetails,
                SEcoopInterest: formData.SEcoopInterest,
                SEcoopAvailability: formData.SEcoopAvailability,
                remoteAbility: formData.remoteAbility,
                additionalComments: formData.additionalComments,
                resumeFile: resumeData,
                resumeFileName: resumeFileName,
                resumeFileType: resumeFileType,
                createdAt: formData.createdAt,
            },
        });
        // Notify via Slack

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
        
        // Transform the applications to handle binary data
        const transformedApplications = applications.map(app => ({
            ...app,
            hasResume: app.resumeFile ? true : false,
            resumeFileName: app.resumeFileName,
            resumeFileType: app.resumeFileType,
            // Don't send the actual file data
            resumeFile: undefined
        }));
        
        res.json(transformedApplications);
    } catch (error) {
        console.error("Error fetching applications:", error);
        res.status(500).json({ error: "Failed to fetch applications" });
    }
});

// Update application status
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    console.log("Updating application ID:", id, "to status:", status);
    // Validate status
    const validStatuses = ["UNPROCESSED", "ACCEPTED", "REJECTED"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
            error: "Invalid status. Must be one of: " + validStatuses.join(", ") 
        });
    }

    try {
        const updated = await prisma.application.update({
            where: { id: Number(id) },
            data: { status },
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: "Failed to update application status" });
    }
});

//Get applications by status
router.get("/status/:status", async (req, res) => {
  const { status } = req.params;
  
  // Validate status
  const validStatuses = ["UNPROCESSED", "ACCEPTED", "REJECTED", "ALL"];
  if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
          error: "Invalid status. Must be one of: " + validStatuses.join(", ") 
      });
  }

  try {
    const applications = await prisma.application.findMany({
      where: status === "ALL" ? {} : { status },
    });

    // Transform the applications to handle binary data
    const transformedApplications = applications.map(app => ({
      ...app,
      hasResume: app.resumeFile ? true : false,
      resumeFileName: app.resumeFileName,
      resumeFileType: app.resumeFileType,
      // Don't send the actual file data
      resumeFile: undefined
    }));

    res.json(transformedApplications);
  } catch (error) { 
    console.error("Error fetching applications:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
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

// Add endpoint to download resume file
router.get("/:id/resume", async (req, res) => {
  try {
    const { id } = req.params;
    const application = await prisma.application.findUnique({
      where: { id: Number(id) },
      select: {
        resumeFile: true,
        resumeFileName: true,
        resumeFileType: true
      }
    });

    if (!application?.resumeFile) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Set the appropriate headers for file download
    res.setHeader('Content-Type', application.resumeFileType);
    res.setHeader('Content-Disposition', `attachment; filename="${application.resumeFileName}"`);
    
    // Send the file
    res.send(application.resumeFile);
  } catch (error) {
    console.error("Error downloading resume:", error);
    res.status(500).json({ error: "Failed to download resume" });
  }
});

export default router;
