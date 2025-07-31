import { Router } from "express";
import { PrismaClient } from "../../server/src/generated/prisma/index.js";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET all journal entries
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object to send all jurnal entries or an error
 */
router.get("/", async (req, res) => {
  try {
    const entries = await prisma.journal_Entry.findMany();
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
    const newEntry = await prisma.journal_Entry.create({
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
    const updatedEntry = await prisma.journal_Entry.update({
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
  // Get search/filter parameters from url
  const { searchParams } = req.nextUrl;
  const semester_groupId = searchParams.get("semester_groupId");

  // Develop whereClause for fitlering
  const whereClause = { journal_owner_type: "admin" };
  if (semester_groupId) {
    whereClause.semester_groupId = semester_groupId;
  }

  // Develop orderByClause for ordering
  const orderByClause = { date: "desc" };

  // Fetch journal entries based on the two clauses
  try {
    const adminEntries = await prisma.journal_Entry.findMany({
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
    const coachEntries = await prisma.journal_Entry.findMany({
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
    const studentEntries = await prisma.journal_Entry.findMany({
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
