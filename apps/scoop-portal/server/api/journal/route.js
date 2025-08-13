import { Router } from "express";
const router = Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * GET all journal entries
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object to send all jurnal entries or an error
 */
router.get("/", async (req, res) => {
  try {
    const entries = await prisma.journalEntry.findMany();
    res.status(200).json(entries);
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    res.status(500).json({
      message: "Error fetching journal entries",
      error: error.message,
    });
  }
});

/**
 * POST (create) a new journal entry
 *
 * @param {Object} req - The request object containing the journal entry data
 * @param {Object} res - The response object to send back the created entry or an error
 */
router.post("/", async (req, res) => {
  const { date, contactee, notes } = req.body;
  try {
    const newEntry = await prisma.journalEntry.create({
      data: { date, contactee, notes },
    });
    res.status(200).json(newEntry);
  } catch (error) {
    console.error("Error creating journal entry:", error);
    res.status(500).json({
      message: "Error creating journal entry",
      error: error.message,
    });
  }
});

/**
 * PUT (update) an existing journal entry
 *
 * @param {Object} req - The request object containing the journal entry id and notes data
 * @param {Object} res - The response object to send back the updated journal entry or an error
 */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  try {
    const updatedEntry = await prisma.journalEntry.update({
      where: { id: Number(id) },
      data: { notes },
    });
    res.status(200).json(updatedEntry);
  } catch (error) {
    console.error("Error updating journal entry:", error);
    res.status(500).json({
      message: "Error updating journal entry",
      error: error.message,
    });
  }
});

// HACK: Temporary Routes
/**
 * GET journal entries for scoopdinator
 */
router.get("/admin", async (req, res) => {
  // Get query parameters from URL
  const { semester_GroupId, contactee_fname, contactee_lname } = req.query;

  // Develop whereClause conditionally for fitlering
  const whereClause = { journal_owner_type: "admin" };
  if (semester_GroupId) {
    whereClause.semester_GroupId = Number(semester_GroupId);
  }
  if (contactee_fname) {
    whereClause.contactee_fname = contactee_fname;
  }
  if (contactee_lname) {
    whereClause.contactee_lname = contactee_lname;
  }

  // Develop orderByClause for ordering
  const orderByClause = { date: "desc" };

  // Fetch journal entries based on the two clauses
  try {
    const adminEntries = await prisma.journalEntry.findMany({
      where: whereClause,
      orderBy: orderByClause,
    });
    res.status(200).json(adminEntries);
  } catch (error) {
    console.error("Error fetching the admin journal entries: ", error);
    res.status(500).json({
      message: "Error fetching admin journal entries",
      error: error.message,
    });
  }
});

/**
 * GET journal entries for scoopervisor
 */
router.get("/coach", async (req, res) => {
  const whereClause = { journal_owner_type: "coach" };
  try {
    const coachEntries = await prisma.journalEntry.findMany({
      where: whereClause,
    });
    res.status(200).json(coachEntries);
  } catch (error) {
    console.error("Error fetching the coach journal entries: ", error);
    res.status(500).json({
      message: "Error fetching coach journal entries",
      error: error.message,
    });
  }
});

/**
 * GET journal entries for scooployee
 */
router.get("/student", async (req, res) => {
  try {
    const studentEntries = await prisma.journalEntry.findMany({
      where: { journal_owner_type: "student" },
    });
    res.status(200).json(studentEntries);
  } catch (error) {
    console.error("Error fetching the student journal entries: ", error);
    res.status(500).json({
      message: "Error fetching student journal entries",
      error: error.message,
    });
  }
});

export default router;
