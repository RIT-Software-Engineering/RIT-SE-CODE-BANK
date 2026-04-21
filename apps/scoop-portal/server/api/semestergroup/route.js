import { Router } from "express";
const router = Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Get all semester groups
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
router.get("/", async (req, res) => {
  try {
    const semesters = await prisma.semesterGroup.findMany();
    res.status(200).json(semesters);
  } catch (error) {
    console.error("Error fetching semester groups: ", error);
    res.status(500).json({
      message: "Error fetching semester groups.",
      error: error.message,
    });
  }
});

/**
 * Create a new semester group
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
router.post("/", async (req, res) => {
  const { name, dept, start_date, end_date } = req.body;
  try {
    const newSemester = await prisma.semesterGroup.create({
      data: { name, dept, start_date, end_date },
    });
    res.status(200).json({
      message: "New semester group created.",
      semesterGroup: newSemester,
    });
  } catch (error) {
    console.error("Error creating semester group: ", error);
    res.status(500).json({ message: "Error creating semester group", error: error.message });
  }
});

/**
 * Get a specific semester group
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const semester = await prisma.semesterGroup.findUnique({
      where: { id: Number(id) },
    });
    res.status(200).json(semester);
  } catch (error) {
    console.error("Error getting specified semester group: ", error);
    res.status(500).json({
      message: "Error getting specified semester group",
      error: error.message,
    });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, dept, start_date, end_date } = req.body;
  try {
    const updatedSemester = await prisma.semesterGroup.update({
      where: { id: Number(id) },
      data: {
        name,
        dept,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
      },
    });
    res.status(200).json({
      message: "Semester group updated.",
      semesterGroup: updatedSemester,
    });
  } catch (error) {
    console.error("Error updating semester group: ", error);
    res.status(500).json({ message: "Error updating semester group", error: error.message });
  }
});

/**
 * Delete a specific semester group
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.semesterGroup.delete({
      where: { id: Number(id) },
    });
    res.status(200).json({ message: "Semester group deleted." });
  } catch (error) {
    console.error("Error deleting semester group: ", error);
    res.status(500).json({ message: "Error deleting semester group", error: error.message });
  }
});

export default router;