import { Router } from "express";
const router = Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const entries = await prisma.journalEntry.findMany();
    res.status(200).json(entries);
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    res.status(500).json({ message: "Error fetching journal entries", error: error.message });
  }
});

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
        previous_entryid,
        entry_type,
        visibility_level,
        privacy_level,
      },
      include: {
        sender: true,
        recipients: true,
        topic: true,
        next_entries: {
          where: {
            OR: [
              { privacy_level: "PUBLIC" },
              { sender_id: sender_id }
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

    notifyStatus({ userId: "zim1902", context: { journalEntryId: newEntry.id, notes: newEntry.notes } })
      .then(summary => console.log('Notification sent:', summary))
      .catch(error => console.error('Error sending notification:', error));

    res.status(200).json({ message: "New journal entry created", entry: newEntry });
  } catch (error) {
    console.error("Error creating journal entry:", error);
    res.status(500).json({ message: "Error creating journal entry", error: error.message });
  }
});

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
    res.status(500).json({ message: "Error updating journal entry", error: error.message });
  }
});

router.get("/scoopdinator", async (req, res) => {
  const { semester_GroupId, contactee_fname, contactee_lname } = req.query;
  const whereClause = { journal_owner_type: "scoopdinator" };
  if (semester_GroupId) whereClause.semester_GroupId = Number(semester_GroupId);
  if (contactee_fname) whereClause.contactee_fname = contactee_fname;
  if (contactee_lname) whereClause.contactee_lname = contactee_lname;
  try {
    const scoopdinatorEntries = await prisma.journalEntry.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
    });
    res.status(200).json(scoopdinatorEntries);
  } catch (error) {
    console.error("Error fetching the scoopdinator journal entries: ", error);
    res.status(500).json({ message: "Error fetching scoopdinator journal entries", error: error.message });
  }
});

router.get("/scoopervisor", async (req, res) => {
  try {
    const scoopervisorEntries = await prisma.journalEntry.findMany({
      where: { journal_owner_type: "scoopervisor" },
    });
    res.status(200).json(scoopervisorEntries);
  } catch (error) {
    console.error("Error fetching the scoopervisor journal entries: ", error);
    res.status(500).json({ message: "Error fetching scoopervisor journal entries", error: error.message });
  }
});

router.get("/scooployee", async (req, res) => {
  try {
    const scooployeeEntries = await prisma.journalEntry.findMany({
      where: { journal_owner_type: "scooployee" },
    });
    res.status(200).json(scooployeeEntries);
  } catch (error) {
    console.error("Error fetching the scooployee journal entries: ", error);
    res.status(500).json({ message: "Error fetching scooployee journal entries", error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.users.findUnique({ where: { id } });
    let entries = [];

    if (user.type == "scooployee") {
      // Direct recipients always see the entry regardless of visibility_level —
      // they were explicitly named on it. Visibility only gates general access.
      const recipientEntries = await prisma.journalEntry.findMany({
        where: {
          recipients: { some: { id } },
          privacy_level: "PUBLIC",
        },
        include: {
          sender: true,
          recipients: true,
          topic: true,
          next_entries: {
            where: {
              OR: [{ privacy_level: "PUBLIC" }, { sender_id: id }],
            },
            include: { sender: true, recipients: true, topic: true },
          },
        },
      });

      const generalEntries = await prisma.journalEntry.findMany({
        where: {
          OR: [
            { sender_id: id },
            { topic_id: id },
          ],
          privacy_level: "PUBLIC",
          visibility_level: { lt: 2 },
        },
        include: {
          sender: true,
          recipients: true,
          topic: true,
          next_entries: {
            where: {
              OR: [{ privacy_level: "PUBLIC" }, { sender_id: id }],
              visibility_level: { lt: 2 },
            },
            include: { sender: true, recipients: true, topic: true },
          },
        },
      });

      entries = entries.concat(recipientEntries, generalEntries);

    } else if (user.type == "scoopdinator") {
      const dinatorEntries = await prisma.journalEntry.findMany({
        where: {
          privacy_level: "PUBLIC",
          visibility_level: { lt: 5 },
        },
        include: {
          sender: true,
          recipients: true,
          topic: true,
          next_entries: {
            where: {
              OR: [{ privacy_level: "PUBLIC" }, { sender_id: id }],
              visibility_level: { lt: 5 },
            },
            include: { sender: true, recipients: true, topic: true },
          },
        },
      });
      entries = entries.concat(dinatorEntries);

    } else if (user.type == "scoopervisor") {
      // Direct recipient entries — always visible regardless of visibility_level
      const recipientEntries = await prisma.journalEntry.findMany({
        where: {
          recipients: { some: { id } },
          privacy_level: "PUBLIC",
        },
        include: {
          sender: true,
          recipients: true,
          topic: true,
          next_entries: {
            where: {
              OR: [{ privacy_level: "PUBLIC" }, { sender_id: id }],
            },
            include: { sender: true, recipients: true, topic: true },
          },
        },
      });

      const scoopervisorTeams = await prisma.teams.findMany({
        where: { scoopervisorId: user.id },
        include: { members: true },
      });

      const memberSet = new Set();
      for (const team of scoopervisorTeams) {
        for (const member of team.members) {
          memberSet.add(member.id);
        }
      }
      const memberArray = Array.from(memberSet);

      const teamEntries = await prisma.journalEntry.findMany({
        where: {
          OR: memberArray.flatMap(memberId => [
            { sender_id: memberId },
            { recipients: { some: { id: memberId } } },
            { topic_id: memberId },
          ]),
          privacy_level: "PUBLIC",
          visibility_level: { lt: 4 },
        },
        include: {
          sender: true,
          recipients: true,
          topic: true,
          next_entries: {
            where: {
              OR: [{ privacy_level: "PUBLIC" }, { sender_id: id }],
              visibility_level: { lt: 4 },
            },
            include: { sender: true, recipients: true, topic: true },
          },
        },
      });
      entries = entries.concat(recipientEntries, teamEntries);

    } else if (user.type == "advisor") {
      const recipientEntries = await prisma.journalEntry.findMany({
        where: {
          recipients: { some: { id } },
          privacy_level: "PUBLIC",
        },
        include: {
          sender: true,
          recipients: true,
          topic: true,
          next_entries: {
            where: {
              OR: [{ privacy_level: "PUBLIC" }, { sender_id: id }],
            },
            include: { sender: true, recipients: true, topic: true },
          },
        },
      });

      const advisorEntries = await prisma.journalEntry.findMany({
        where: {
          privacy_level: "PUBLIC",
          visibility_level: { lt: 3 },
        },
        include: {
          sender: true,
          recipients: true,
          topic: true,
          next_entries: {
            where: {
              OR: [{ privacy_level: "PUBLIC" }, { sender_id: id }],
              visibility_level: { lt: 3 },
            },
            include: { sender: true, recipients: true, topic: true },
          },
        },
      });
      entries = entries.concat(recipientEntries, advisorEntries);
    }

    const privateEntries = await prisma.journalEntry.findMany({
      where: {
        privacy_level: "PERSONAL",
        sender_id: id,
      },
      include: {
        sender: true,
        recipients: true,
        topic: true,
        next_entries: {
          where: {
            OR: [{ privacy_level: "PUBLIC" }, { sender_id: id }],
          },
          include: { sender: true, recipients: true, topic: true },
        },
      },
    });
    entries = entries.concat(privateEntries);

    const seen = new Set();
    const deduped = entries.filter(entry => {
      if (seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    });

    res.status(200).json(deduped);
  } catch (error) {
    console.error("Error fetching the users journal entries: ", error);
    res.status(500).json({ message: "Error fetching users journal entries", error: error.message });
  }
});

const NOTIFY_BASE = process.env.NOTIFY_BASE || 'http://localhost:4000/api/notifications';
const APP_ID = process.env.APP_ID || 'scoop';

export async function notifyStatus({ userId, context }) {
  const res = await fetch(`${NOTIFY_BASE}/dispatch/${APP_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      subject: "New Journal Entry Created",
      message: context.notes || "A new journal entry has been created.",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Dispatch failed: ${res.status} ${JSON.stringify(data)}`);
  return data.summary;
}

export default router;