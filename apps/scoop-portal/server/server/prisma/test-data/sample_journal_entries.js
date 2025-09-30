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
    contactee_id: 26,
    notes: "Edit this note for testing.",
    journal_owner_fname: "Samuel",
    journal_owner_lname: "Sangsong",
    journal_owner_type: "scoopdinator",
    journal_owner_id: 11,
    semester_GroupId: 8,
  },
  {
    id: 2,
    date: new Date("2025-06-20T10:30:00Z"), // in UTC
    contactee_fname: "Brennan",
    contactee_lname: "Reed",
    contactee_id: 27,
    notes: "",
    journal_owner_fname: "Samuel",
    journal_owner_lname: "Sangsong",
    journal_owner_type: "scoopdinator",
    journal_owner_id: 11,
    semester_GroupId: 8,
  },
  {
    id: 3,
    date: new Date("2025-07-02T12:45:00Z"), // in UTC
    contactee_fname: "Brennan",
    contactee_lname: "Reed",
    contactee_id: 27,
    notes: "",
    journal_owner_fname: "Samuel",
    journal_owner_lname: "Sangsong",
    journal_owner_type: "scoopdinator",
    journal_owner_id: 11,
    semester_GroupId: 8,
  },
  {
    id: 4,
    date: new Date("2025-07-02T12:45:00Z"), // in UTC
    contactee_fname: "John",
    contactee_lname: "Smith",
    contactee_id: 1,
    notes: "",
    journal_owner_fname: "2019Spring",
    journal_owner_lname: "Coach",
    journal_owner_type: "scoopdinator",
    journal_owner_id: 2,
    semester_GroupId: 8,
  },
  {
    id: 5,
    date: new Date("2025-07-02T12:45:00Z"), // in UTC
    contactee_fname: "SUPER DUPER",
    contactee_lname: "ADMIN",
    contactee_id: 3,
    notes: "",
    journal_owner_fname: "2019Spring",
    journal_owner_lname: "Coach",
    journal_owner_type: "scoopdinator",
    journal_owner_id: 2,
    semester_GroupId: 8,
  },
  {
    id: 6,
    date: new Date("2025-07-02T12:45:00Z"), // in UTC
    contactee_fname: "Dude",
    contactee_lname: "Bro",
    contactee_id: 4,
    notes: "",
    journal_owner_fname: "2019Spring",
    journal_owner_lname: "Coach",
    journal_owner_type: "scoopdinator",
    journal_owner_id: 2,
    semester_GroupId: 8,
  },
];
