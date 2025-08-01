"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Journal, JournalEntry } from "@/types/journal";
import {
    createJournalEntry,
    deleteJournalEntry,
    editJournalEntry,
    getJournalByUser,
} from "@/services/journal";
import { useAuth } from "@/context/AuthContext";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
} from "@mui/material";

function AddJournalEntryModal({
    open,
    onClose,
    onSubmit,
    baseEntry,
}: {
    open: boolean;
    onClose: () => void;
    onSubmit: (subject: string, content: string) => void;
    baseEntry?: JournalEntry;
}) {
    const [subject, setSubject] = useState(baseEntry?.re ?? "");
    const [content, setContent] = useState(baseEntry?.content ?? "");

    useEffect(() => {
        setSubject(baseEntry?.re ?? "");
        setContent(baseEntry?.content ?? "");
    }, [baseEntry]);

    const handleSubmit = () => {
        onSubmit(subject, content);
        setSubject("");
        setContent("");
    };

    const handleClose = () => {
        setSubject("");
        setContent("");
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add Journal Entry</DialogTitle>
            <DialogContent>
                <TextField
                    label="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="Content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    fullWidth
                    margin="normal"
                    multiline
                    minRows={4}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={!content}
                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function TagSearchButton() {
    const handleClick = () => {
        alert("Tag search coming soon!");
    };

    return (
        <button
            className="flex items-center text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-300 hover:bg-gray-200 transition"
            onClick={handleClick}
            type="button"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="mr-1"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                />
            </svg>
            Search by Tag
        </button>
    );
}

export default function JournalPage() {
    const searchParams = useSearchParams();
    const tag = searchParams.get("fromProject") || "";

    const [journal, setJournal] = useState<Journal>();
    const [showAddEntry, setShowAddEntry] = useState(false);
    const [editingEntry, setEditingEntry] = useState(false);
    const [entryUnderEdit, setEntryUnderEdit] = useState<
        JournalEntry | undefined
    >(undefined);
    const { currentUser } = useAuth();

    const fetchJournal = async () => {
        if (!currentUser) return;
        setJournal(await getJournalByUser(currentUser.id, tag));
    };

    useEffect(() => {
        (async () => {
            // Get the journal
            await fetchJournal();
        })();
    }, [currentUser]);

    if (!journal) return <p>Loading...</p>;

    const submitEntryHandler = async (
        re: string,
        content: string,
        tag: string
    ) => {
        if (!currentUser) return;

        await createJournalEntry({
            userId: currentUser.id,
            re,
            content,
            tag,
        });

        await fetchJournal();
    };

    const editEntryHandler = async (
        id: string,
        re: string,
        content: string,
        tag: string
    ) => {
        if (!currentUser) return;

        await editJournalEntry(id, {
            userId: currentUser.id,
            re,
            content,
            tag,
        });

        await fetchJournal();
    };

    const deleteEntryHandler = async (id: string) => {
        if (!currentUser) return;

        await deleteJournalEntry(id);

        await fetchJournal();
    };

    const handleBack = () => {
        window.history.back();
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <button
                type="button"
                onClick={handleBack}
                className="mb-4 text-blue-600 underline"
            >
                &larr; Back
            </button>
            <h1 className="text-3xl font-bold mb-2">Your Journal</h1>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {tag ? (
                        <button
                            className="flex items-center text-sm font-medium text-blue-600 bg-gray-200 px-2 py-1 rounded border border-gray-300 hover:bg-gray-300 transition"
                            onClick={() => {
                                // Remove tag from URL
                                const params = new URLSearchParams(
                                    window.location.search
                                );
                                params.delete("fromProject");
                                window.location.search = params.toString();
                            }}
                        >
                            {tag}
                            <span className="ml-1 text-gray-500 hover:text-red-500 cursor-pointer">
                                &times;
                            </span>
                        </button>
                    ) : (
                        <TagSearchButton />
                    )}
                </div>
                <button
                    className="bg-blue-600 text-white py-1 px-4 rounded hover:bg-blue-700 transition cursor-pointer"
                    onClick={() => {
                        setShowAddEntry(true);
                    }}
                >
                    Add Journal Entry
                </button>
            </div>
            <hr className="mb-6" />
            <ul className="space-y-4 overflow-scroll max-h-110">
                {journal.entries.length === 0 && (
                    <li className="text-center text-gray-500 py-8">
                        {tag
                            ? `You have no journal entries for the tag "${tag}". Try and create one!`
                            : "You have no journal entries yet. Try and create one!"}
                    </li>
                )}
                {journal.entries.map((entry) => (
                    <li
                        key={entry.id}
                        className="border rounded p-4 bg-white shadow relative"
                    >
                        <div className="flex justify-between items-center mb-1">
                            {entry.re ? (
                                <h2 className="text-lg font-semibold">
                                    {entry.re}
                                </h2>
                            ) : (
                                <h2 className="text-gray-500 font-semibold italic">
                                    Unnamed Entry
                                </h2>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                    {new Date(entry.date).toLocaleString(
                                        "en-US",
                                        {
                                            year: "numeric",
                                            month: "2-digit",
                                            day: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true,
                                        }
                                    )}
                                </span>
                                {/* Edit button */}
                                <button
                                    className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 flex items-center"
                                    title="Edit entry"
                                    onClick={() => {
                                        setEditingEntry(true);
                                        setEntryUnderEdit(entry);
                                        setShowAddEntry(true);
                                    }}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        className="inline-block"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16.862 3.487a2.25 2.25 0 1 1 3.182 3.182l-11.25 11.25a2 2 0 0 1-.878.513l-4 1a.5.5 0 0 1-.606-.606l1-4a2 2 0 0 1 .513-.878l11.25-11.25z"
                                        />
                                    </svg>
                                </button>{" "}
                                {/* Delete (X) button in the top-right corner */}
                                <button
                                    className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 flex items-center"
                                    title="Delete entry"
                                    onClick={() => {
                                        if (
                                            window.confirm(
                                                "Are you sure you want to delete this entry?"
                                            )
                                        ) {
                                            deleteEntryHandler(entry.id);
                                        }
                                    }}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        className="inline-block"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <p className="text-gray-700">{entry.content}</p>
                    </li>
                ))}
            </ul>
            <hr className="mt-6" />
            <AddJournalEntryModal
                open={showAddEntry}
                onClose={() => {
                    setShowAddEntry(false);
                    setEditingEntry(false);
                    setEntryUnderEdit(undefined);
                }}
                onSubmit={(subject, content) => {
                    setShowAddEntry(false);
                    if (editingEntry) {
                        editEntryHandler(
                            entryUnderEdit?.id ?? "",
                            subject,
                            content,
                            tag
                        );
                        setEditingEntry(false);
                        setEntryUnderEdit(undefined);
                    } else submitEntryHandler(subject, content, tag);
                }}
                baseEntry={entryUnderEdit}
            />
        </div>
    );
}
