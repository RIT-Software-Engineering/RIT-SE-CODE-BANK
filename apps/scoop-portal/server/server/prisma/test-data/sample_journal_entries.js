/*
Because the id for the users table is generated with uuid(),
it's difficult to hard-code users for the sample journal entries.

Journal entries will have to be created by running `npx prisma studio`
and clicking the button for creating a new record when viewing the table.
*/
// import { PrismaClient } from "../../src/generated/prisma/index.js"

// const prisma = new PrismaClient;

// async function getIdByName(fname, lname) {
//   try {} catch (error) {}
// }

export const sampleJournalEntries = [
  {
    id: 1,
    date: new Date("2025-06-13T12:00:00Z"), // in UTC
    notes: "Vicki Leigh applied for SCOOP",
    visibility_level: 1,
    privacy_level: "PUBLIC",
    entry_type: "AUTOMATED",
    recipient_ids: [],
    sender_id: "vcl123",
    topic_id: "vcl123",
    semester_GroupId: 8,
  },
  {
    id: 2,
    previous_entryid: 1,
    date: new Date("2025-06-13T12:00:00Z"), // in UTC
    notes: "I think Vicki would be a good candidate for SCOOP",
    visibility_level: 2,
    privacy_level: "PERSONAL",
    entry_type: "MANUAL",
    recipient_ids: [],
    sender_id: "coachC",
    topic_id: "vcl123",
    semester_GroupId: 8,
  },
  {
    id: 3,
    date: new Date("2025-06-20T12:00:00Z"), // in UTC
    notes: "Vicki Leigh has been accepted into SCOOP",
    visibility_level: 1,
    privacy_level: "PUBLIC",
    entry_type: "AUTOMATED",
    recipient_ids: [],
    sender_id: "adminA",
    topic_id: "vcl123",
    semester_GroupId: 8,
  },
];
