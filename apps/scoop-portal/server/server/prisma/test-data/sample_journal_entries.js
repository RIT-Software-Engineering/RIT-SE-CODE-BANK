/*

Test data for journal entries

Entries must be listed in order to ensure previous_entryid references work

*/

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
    date: new Date("2025-06-17T12:00:00Z"), // in UTC
    notes: "I think Vicki would be a good candidate for SCOOP, this is a private note",
    visibility_level: 2,
    privacy_level: "PERSONAL",
    entry_type: "MANUAL",
    recipient_ids: [],
    sender_id: "adminA",
    topic_id: "vcl123",
    semester_GroupId: 8,
  },
    {
    id: 3,
    date: new Date("2025-06-18T12:00:00Z"), // in UTC
    notes: "Vicki Leigh can see this entry",
    visibility_level: 1,
    privacy_level: "PUBLIC",
    entry_type: "MANUAL",
    recipient_ids: [],
    sender_id: "adminA",
    topic_id: "vcl123",
    semester_GroupId: 8,
  },
  {
    id: 4,
    date: new Date("2025-06-19T12:00:00Z"), // in UTC
    notes: "Vicki Leigh can't see this entry",
    visibility_level: 3,
    privacy_level: "PUBLIC",
    entry_type: "MANUAL",
    recipient_ids: [],
    sender_id: "adminA",
    topic_id: "vcl123",
    semester_GroupId: 8,
  },
  {
    id: 5,
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
