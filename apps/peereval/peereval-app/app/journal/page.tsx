"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Journal } from "@/types/journal";
import { createJournalEntry, getJournalByUser } from "@/services/journal";
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
}: {
    open: boolean;
    onClose: () => void;
    onSubmit: (subject: string, content: string) => void;
}) {
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");

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
                    Add
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default function JournalPage() {
    const searchParams = useSearchParams();
    const tag = searchParams.get("tag") || "All";

    const [journal, setJournal] = useState<Journal>();
    const [showAddEntry, setShowAddEntry] = useState(false);
    const { currentUser } = useAuth();

    const fetchJournal = async () => {
        if (!currentUser) return;
        setJournal(await getJournalByUser(currentUser.id));
    };

    useEffect(() => {
        (async () => {
            // Get the journal
            await fetchJournal();
        })();
    }, [currentUser]);

    if (!journal) return <p>Loading...</p>;

    const submitEntryHandler = async (re: string, content: string) => {
        if (!currentUser) return;

        await createJournalEntry({
            userId: currentUser.id,
            re,
            content,
            tags: [],
        });

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
                    <span className="text-sm bg-gray-200 text-gray-700 px-2 py-1 rounded">
                        Viewing
                    </span>
                    <span className="text-sm font-medium text-blue-600">
                        {tag}
                    </span>
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
            <ul className="space-y-4">
                {journal.entries.length === 0 && (
                    <li className="text-center text-gray-500 py-8">
                        You have no journal entries yet. Try and create one!
                    </li>
                )}
                {journal.entries.map((entry) => (
                    <li
                        key={entry.id}
                        className="border rounded p-4 bg-white shadow"
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
                            <span className="text-xs text-gray-500">
                                {new Date(entry.date).toLocaleString("en-US", {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                })}
                            </span>
                        </div>
                        <p className="text-gray-700">{entry.content}</p>
                    </li>
                ))}
            </ul>
            <AddJournalEntryModal
                open={showAddEntry}
                onClose={() => setShowAddEntry(false)}
                onSubmit={(subject, content) => {
                    setShowAddEntry(false);
                    submitEntryHandler(subject, content);
                }}
            />
        </div>
    );
}
