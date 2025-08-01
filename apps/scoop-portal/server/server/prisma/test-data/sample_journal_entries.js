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
    contactee_fname: "Alexis",
    contactee_lname: "Endicott",
    notes: "Edit this note for testing.",
    journal_owner_fname: "Samuel",
    journal_owner_lname: "Sangsong",
    journal_owner_type: "admin",
    semester_GroupId: 8,
  },
  {
    id: 2,
    date: new Date("2025-06-20T10:30:00Z"), // in UTC
    contactee_fname: "Brennan",
    contactee_lname: "Reed",
    notes: "",
    journal_owner_fname: "Samuel",
    journal_owner_lname: "Sangsong",
    journal_owner_type: "admin",
    semester_GroupId: 8,
  },
  {
    id: 3,
    date: new Date("2025-07-02T12:45:00Z"), // in UTC
    contactee_fname: "Brennan",
    contactee_lname: "Reed",
    notes: "",
    journal_owner_fname: "Samuel",
    journal_owner_lname: "Sangsong",
    journal_owner_type: "admin",
    semester_GroupId: 8,
  },
];
