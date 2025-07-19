import { Router } from "express";
import { PrismaClient } from "../../server/src/generated/prisma/index.js";

const router = Router();
const prisma = new PrismaClient();

/**
 * Get all semester groups
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
router.get("/", async (req, res) => {
    try {
        const semesters = await prisma.semester_Group.findMany();
        res.status(200).json(semesters);
    } catch (error) {
        console.error("Error fetching semester groups: ", error);
        res.status(500).json({ message: "Error fetching semester groups." });
    }
});

/**
 * Create a new semseter group
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
router.post("/", async (req, res) => {
    const { name, dept, start_date, end_date } = req.body;
    try {
        const newSemester = await prisma.semester_Group.create({
            data: { name, dept, start_date, end_date },
        });
        res.status(200).json({
            message: "New semester group created.",
            semesterGroup: newSemester,
        });
    } catch (error) {
        console.error("Error creating semsester group: ", error);
        res.status(500).json({ message: "Error creating semester group" });
    }
});

// TODO: put method for semester group

export default router;
