import { Router } from "express";
const router = Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
    const formData = req.body;
    let resumeData = null;
    let resumeFileName = null;
    let resumeFileType = null;

    if (formData.resumeFile) {
        const [header, base64Data] = formData.resumeFile.split(',');
        
        const fileSizeInMB = (base64Data.length * 0.75) / (1024 * 1024);
        if (fileSizeInMB > 8) {
            return res.status(413).json({
                message: "File is too large. Please upload a file smaller than 8MB.",
                error: "File size exceeded"
            });
        }

        resumeData = Buffer.from(base64Data, 'base64');
        
        const mimeMatch = header.match(/data:(.*?);/);
        if (mimeMatch) {
            resumeFileType = mimeMatch[1];
            
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
                userID: formData.userID,
                academicAdvisor: formData.academicAdvisor,
                creditsRemaining: formData.creditsRemaining,
                cumulativeGPA: formData.cumulativeGPA,
                coopsCompleted: formData.coopsCompleted,
                startSemester: formData.startSemester,
                SEcoopReferral: formData.SEcoopReferral,
                SEcoopReferralDetails: formData.SEcoopReferralDetails,
                coursesTaken: formData.coursesTaken,
                coopSearchStartDate: formData.coopSearchStartDate,
                coopSearchPlatforms: formData.coopSearchPlatforms,
                pendingOffers: formData.pendingOffers,
                pendingOffersDetails: formData.pendingOffersDetails,
                rejectionLetters: formData.rejectionLetters,
                rejectionLettersDetails: formData.rejectionLettersDetails,
                jobSearchAcknowledgment: formData.jobSearchAcknowledgment,
                jobSearchAcknowledgmentDetails: formData.jobSearchAcknowledgmentDetails,
                additionalComments: formData.additionalComments,
                resumeFile: resumeData,
                resumeFileName: resumeFileName,
                resumeFileType: resumeFileType,
                createdAt: formData.createdAt,
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

router.get("/", async (req, res) => {
    try {
        const applications = await prisma.application.findMany();
        
        const transformedApplications = applications.map(app => ({
            ...app,
            hasResume: app.resumeFile ? true : false,
            resumeFileName: app.resumeFileName,
            resumeFileType: app.resumeFileType,
            resumeFile: undefined
        }));
        
        res.json(transformedApplications);
    } catch (error) {
        console.error("Error fetching applications:", error);
        res.status(500).json({ error: "Failed to fetch applications" });
    }
});

router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
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

router.get("/status/:status", async (req, res) => {
    const { status } = req.params;
    
    const validStatuses = ["PENDING", "APPROVED", "REJECTED", "ALL"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
            error: "Invalid status. Must be one of: " + validStatuses.join(", ") 
        });
    }

    try {
        const applications = await prisma.application.findMany({
            where: status === "ALL" ? {} : { status },
        });

        const transformedApplications = applications.map(app => ({
            ...app,
            hasResume: app.resumeFile ? true : false,
            resumeFileName: app.resumeFileName,
            resumeFileType: app.resumeFileType,
            resumeFile: undefined
        }));

        res.json(transformedApplications);
    } catch (error) {
        console.error("Error fetching applications:", error);
        res.status(500).json({ error: "Failed to fetch applications" });
    }
});

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

        res.setHeader('Content-Type', application.resumeFileType);
        res.setHeader('Content-Disposition', `attachment; filename="${application.resumeFileName}"`);
        
        res.send(application.resumeFile);
    } catch (error) {
        console.error("Error downloading resume:", error);
        res.status(500).json({ error: "Failed to download resume" });
    }
});

router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const application = await prisma.application.findUnique({
            where: { id: Number(id) },
        });

        if (!application) {
            return res.status(404).json({ error: "Application not found" });
        }

        const transformedApplication = {
            ...application,
            hasResume: application.resumeFile ? true : false,
            resumeFileName: application.resumeFileName,
            resumeFileType: application.resumeFileType,
            resumeFile: undefined,
        };

        res.json(transformedApplication);
    } catch (error) {
        console.error("Error fetching application:", error);
        res.status(500).json({ error: "Failed to fetch application" });
    }
});

export default router;