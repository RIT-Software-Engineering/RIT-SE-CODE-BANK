import { handleResponse } from "./utils";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006";

export async function getJournalByUser(id: string) {
    const res = await fetch(`${BASE_URL}/journals/${id}`);

    return handleResponse(res, "Couldn't find journal for user " + id);
}

export async function createJournalEntry(journalEntry: {
    userId: string;
    re: string;
    content: string;
    tags: string[];
}) {
    const res = await fetch(`${BASE_URL}/journals`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(journalEntry),
    });

    return handleResponse(res, "Failed to add journal entry");
}

export async function editJournalEntry(
    id: string,
    journalEntry: {
        userId: string;
        re: string;
        content: string;
        tags: string[];
    }
) {
    const res = await fetch(`${BASE_URL}/journals/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(journalEntry),
    });

    return handleResponse(res, "Failed to edit journal entry " + id);
}

export async function deleteJournalEntry(id: string) {
    const res = await fetch(`${BASE_URL}/journals/${id}`, {
        method: "DELETE",
        credentials: "include",
    });

    return handleResponse(res, "Failed to delete journal entry " + id, false);
}
