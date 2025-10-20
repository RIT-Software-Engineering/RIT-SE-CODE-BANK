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
    notes: "Edit this note for testing.",
    recipient_id: "vcl123",
    sender_id: "kjs123",
    topic_id: "vcl123",
    semester_GroupId: 8,
  },
];
