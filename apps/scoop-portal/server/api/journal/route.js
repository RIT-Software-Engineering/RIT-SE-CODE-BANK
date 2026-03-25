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
    notes,
    recipient_ids,
    sender_id,
    topic_id,
    semester_GroupId,
    previous_entryid,
    entry_type,
    visibility_level,
    privacy_level,
  } = req.body;
  try {
    const newEntry = await prisma.journalEntry.create({
      data: {
        date: new Date(date),
        notes,
        recipients: { connect: recipient_ids.map(id => ({ id })) },
        sender_id,
        topic_id,
        semester_GroupId: semester_GroupId ? Number(semester_GroupId) : null,
        previous_entryid: previous_entryid,
        entry_type: entry_type,
        visibility_level: visibility_level,
        privacy_level: privacy_level,
      },
      include:{
        sender: true,
        recipients: true,
        topic: true,
              next_entries: {
                where:{
                  OR:[
                    { privacy_level: "PUBLIC" },
                    { sender_id: sender_id }
                  ],
                },
                include:{
                  sender: true,
                  recipients: true,
                  topic: true,
                },
              },
      },
    });

    notifyStatus({ userId: "zim1902", context: { journalEntryId: newEntry.id, notes: newEntry.notes } })
      .then(summary => {
        console.log('Notification sent:', summary)
      })
      .catch(error => {
        console.error('Error sending notification:', error);
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
    const user = await prisma.users.findUnique({
      where: { id: id },
    });

    let entries = [];

    if(user.type == "scooployee"){
      const scooployeeEntries = await prisma.journalEntry.findMany({
        where: {
          OR: [
            {sender_id: id},
            { recipients: {
                    some: {
                      id: id,
                },},},
            { topic_id: id },
          ],
          privacy_level: "PUBLIC",
          visibility_level: {
            lt: 2
          },
        },
        include: {
          sender: true,
          recipients: true,
          topic: true,
          next_entries: {
            where:{
              OR:[
                { privacy_level: "PUBLIC" },
                { sender_id: id }
              ],
              visibility_level: {
                lt: 2
              },
            },
            include:{
              sender: true,
              recipients: true,
              topic: true,
            },
          },
        },
        })
      //res.status(200).json(scooployeeEntries);
      entries = entries.concat(scooployeeEntries);
    }
    else if(user.type == "scoopdinator"){
      const dinatorEntries = await prisma.journalEntry.findMany({
        where:{
          privacy_level: "PUBLIC",
          visibility_level: {
            lt: 5
          },
        },
        include: {
          sender: true,
          recipients: true,
          topic: true,
          next_entries: {
            where:{
              OR:[
                { privacy_level: "PUBLIC" },
                { sender_id: id }
              ],
              visibility_level: {
                lt: 5
              },
            },
            include: {
              sender: true,
              recipients: true,
              topic: true,
            },
          },
        },
      });
      //res.status(200).json(dinatorEntries); 
      entries = entries.concat(dinatorEntries);
    }
    else if(user.type == "scoopervisor"){
      const scoopervisorTeams = await prisma.teams.findMany({
        where: {
          scoopervisorId: user.id,
        },
        include: { 
          members: true,
        } 
        });

        const memberSet = new Set();

        for (const team of scoopervisorTeams) {
          for (const member of team.members) {
              memberSet.add(member.id)
            }
          }
        const memberArray = Array.from(memberSet);
        //this currently allows Scoopervisors to see entries in which they are the topic 
        const scoopervisorEntries = await prisma.journalEntry.findMany({
            where: {
              OR: memberArray.flatMap(memberId => [
                { sender_id: memberId },
                { recipients: {
                    some: {
                      id: memberId,
                },},},
                { topic_id: memberId },
                ]),
              privacy_level: "PUBLIC",
              visibility_level: {
                  lt: 4
              },
              },
            include: {
              sender: true,
              recipients: true,
              topic: true,
              next_entries: {
                where:{
                  OR:[
                    { privacy_level: "PUBLIC" },
                    { sender_id: id }
                  ],
                  visibility_level: {
                    lt: 4
                  },
                },
                include:{
                  sender: true,
                  recipients: true,
                  topic: true,
                },
              },
            },
        });
        //res.status(200).json(visorEntries); 
        entries = entries.concat(scoopervisorEntries);      
      }
      else if(user.type == "advisor"){
        const advisorEntries = await prisma.journalEntry.findMany({
        where: {
          privacy_level: "PUBLIC",
          visibility_level: {
            lt: 3
          },
        },
        include: {
          sender: true,
          recipients: true,
          topic: true,
          next_entries: {
            where:{
              OR:[
                { privacy_level: "PUBLIC" },
                { sender_id: id }
              ],
              visibility_level: {
                lt: 3
              },
            },
            include:{
              sender: true,
              recipients: true,
              topic: true,
            },
          },
        },
        })
        entries = entries.concat(advisorEntries); 
      }
      const privateEntries = await prisma.journalEntry.findMany({
        where:{
          privacy_level: "PERSONAL",
          sender_id: id,
        },
        include: {
          sender: true,
          recipients: true,
          topic: true,
          next_entries: {
            where:{
              OR:[
                { privacy_level: "PUBLIC" },
                { sender_id: id }
              ],
            },
            include: {
              sender: true,
              recipients: true,
              topic: true,
            },
          },
        },
      });
      entries = entries.concat(privateEntries);
      res.status(200).json(entries);
  } catch (error) {
    console.error("Error fetching the users journal entries: ", error);
    res.status(500).json({
      message: "Error fetching users journal entries",
      error: error.message,
    });
  }
})

const NOTIFY_BASE = process.env.NOTIFY_BASE || 'http://apps-staging.se.rit.edu/api/notifications'
const APP_ID = process.env.APP_ID || 'scoop'
export async function notifyStatus({ userId, context }) {
  console.log(`Sending notification to: ${NOTIFY_BASE}/dispatch/${APP_ID} as ${userId}`)
  const res = await fetch(`${NOTIFY_BASE}/dispatch/${APP_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      subject: "New Journal Entry Created",
      message: context.notes || "A new journal entry has been created.",
      })
  })


  const data = await res.json()
  if (!res.ok) throw new Error(`Dispatch failed: ${res.status} ${JSON.stringify(data)}`)
  return data.summary
}


export default router;
