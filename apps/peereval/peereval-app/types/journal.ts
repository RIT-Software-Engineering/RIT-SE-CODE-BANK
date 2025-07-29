export type Journal = {
    entries: JournalEntry[];
};

export type JournalEntry = {
    id: string;
    re: string;
    content: string;
    tags: JournalEntryTag[];
    date: string;
};

export type JournalEntryTag = {
    name: string;
};
