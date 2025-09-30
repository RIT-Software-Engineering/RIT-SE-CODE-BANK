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
  const {
    date,
    contactee_fname,
    contactee_lname,
    notes,
    journal_owner_fname,
    journal_owner_lname,
    journal_owner_type,
    semester_GroupId,
  } = req.body;
  try {
    const newEntry = await prisma.journalEntry.create({
      data: {
        date: new Date(date),
        contactee_fname,
        contactee_lname,
        notes,
        journal_owner_fname,
        journal_owner_lname,
        journal_owner_type,
        semester_GroupId: semester_GroupId ? Number(semester_GroupId) : null,
      },
    });
    res
      .status(200)
      .json({ message: "New journal entry created", entry: newEntry });
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
router.get("/scoopdinator", async (req, res) => {
  // Get query parameters from URL
  const { semester_GroupId, contactee_fname, contactee_lname } = req.query;

  // Develop whereClause conditionally for fitlering
  const whereClause = { journal_owner_type: "scoopdinator" };
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
    const scoopdinatorEntries = await prisma.journalEntry.findMany({
      where: whereClause,
      orderBy: orderByClause,
    });
    res.status(200).json(scoopdinatorEntries);
  } catch (error) {
    console.error("Error fetching the scoopdinator journal entries: ", error);
    res.status(500).json({
      message: "Error fetching scoopdinator journal entries",
      error: error.message,
    });
  }
});

/**
 * GET journal entries for scoopervisor
 */
router.get("/scoopervisor", async (req, res) => {
  const whereClause = { journal_owner_type: "scoopervisor" };
  try {
    const scoopervisorEntries = await prisma.journalEntry.findMany({
      where: whereClause,
    });
    res.status(200).json(scoopervisorEntries);
  } catch (error) {
    console.error("Error fetching the scoopervisor journal entries: ", error);
    res.status(500).json({
      message: "Error fetching scoopervisor journal entries",
      error: error.message,
    });
  }
});

/**
 * GET journal entries for scooployee
 */
router.get("/scooployee", async (req, res) => {
  try {
    const scooployeeEntries = await prisma.journalEntry.findMany({
      where: { journal_owner_type: "scooployee" },
    });
    res.status(200).json(scooployeeEntries);
  } catch (error) {
    console.error("Error fetching the scooployee journal entries: ", error);
    res.status(500).json({
      message: "Error fetching scooployee journal entries",
      error: error.message,
    });
  }
});

/**
 * GET journal entries for user with id
 */
router.get("/:id", async (req, res) => {
  const {id} = req.params;
  try {
    const idEntries = await prisma.journalEntry.findMany({
      where: {
        OR: [
          {journal_owner_id:Number(id)},
          {contactee_id:Number(id)},
        ]
      }
    })
    res.status(200).json(idEntries);
  } catch (error) {
    console.error("Error fetching the users journal entries: ", error);
    res.status(500).json({
      message: "Error fetching users journal entries",
      error: error.message,
    });
  }
})

export default router;