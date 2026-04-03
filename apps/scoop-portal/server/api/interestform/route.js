import { Router } from "express";
const router = Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
    const formData = req.body;

    try {
        const saved = await prisma.interestForm.create({
            data: {
                applicant_id: formData.applicant_id,
                firstName: formData.firstName,
                lastName: formData.lastName,
                ritEmail: formData.ritEmail,
                userID: formData.userID,
                academicAdvisor: formData.academicAdvisor,
                creditsRemaining: formData.creditsRemaining,
                cumulativeGPA: formData.cumulativeGPA,
                coursesTaken: formData.coursesTaken,
            },
        });
        res.status(200).json({ message: "Interest form saved", interestForm: saved });
    } catch (error) {
        console.error("Error saving interest form:", error);
        res.status(500).json({ message: "Error saving interest form", error: error.message });
    }
});

router.get("/", async (req, res) => {
    try {
        const forms = await prisma.interestForm.findMany();
        res.json(forms);
    } catch (error) {
        console.error("Error fetching interest forms:", error);
        res.status(500).json({ error: "Failed to fetch interest forms" });
    }
});

router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const form = await prisma.interestForm.findUnique({ where: { id: Number(id) } });
        if (!form) return res.status(404).json({ error: "Interest form not found" });
        res.json(form);
    } catch (error) {
        console.error("Error fetching interest form:", error);
        res.status(500).json({ error: "Failed to fetch interest form" });
    }
});

router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["PENDING", "ACCEPTED", "REJECTED"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be one of: " + validStatuses.join(", ") });
    }

    try {
        const updated = await prisma.interestForm.update({
            where: { id: Number(id) },
            data: { status },
        });
        res.json(updated);
    } catch (error) {
        console.error("Error updating interest form:", error);
        res.status(500).json({ error: "Failed to update interest form status" });
    }
});

export default router;