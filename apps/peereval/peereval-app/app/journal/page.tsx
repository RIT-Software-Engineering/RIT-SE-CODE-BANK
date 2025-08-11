"use client";

import React, { useEffect, useRef, useState } from "react";
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
    Chip,
} from "@mui/material";
import BackArrow from "@/components/BackArrow";

function AddJournalEntryModal({
    open,
    onClose,
    onSubmit,
    baseEntry,
    tag: initialTag,
}: {
    open: boolean;
    onClose: () => void;
    onSubmit: (subject: string, content: string, tag: string) => void;
    baseEntry?: JournalEntry;
    tag: string;
}) {
    const [subject, setSubject] = useState(baseEntry?.re ?? "");
    const [content, setContent] = useState(baseEntry?.content ?? "");
    const [tag, setTag] = useState(initialTag);

    useEffect(() => {
        setSubject(baseEntry?.re ?? "");
        setContent(baseEntry?.content ?? "");
        setTag(baseEntry ? baseEntry.tags[0].name : initialTag);
    }, [baseEntry, initialTag]);

    const handleSubmit = () => {
        onSubmit(subject, content, tag);
        setSubject("");
        setContent("");
        setTag(initialTag);
    };

    const handleClose = () => {
        setSubject("");
        setContent("");
        setTag(initialTag);
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
                <div className="flex justify-start mt-2">
                    <TextField
                        label="Tag"
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                        size="small"
                        style={{ minWidth: 120 }}
                    />
                </div>
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
    const [searching, setSearching] = useState(false);
    const [tagInput, setTagInput] = useState("");
    const goButtonRef = useRef<HTMLButtonElement>(null);

    const handleClick = () => {
        setSearching(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (tagInput.trim()) {
            const params = new URLSearchParams(window.location.search);
            params.set("fromProject", tagInput.trim());
            window.location.search = params.toString();
        }
    };

    if (searching) {
        return (
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Enter tag..."
                    className="text-sm px-2 py-1 border rounded"
                    autoFocus
                    onBlur={(e) => {
                        // Only close if blur isn't going to the "Go" button
                        if (e.relatedTarget !== goButtonRef.current) {
                            setSearching(false);
                        }
                    }}
                />
                <button
                    ref={goButtonRef}
                    type="submit"
                    className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
                >
                    Go
                </button>
            </form>
        );
    }

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
            Use Tag
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
        console.log(`the tag is ${tag}`);
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
            <BackArrow />
            <h1 className="text-3xl font-bold mb-2">Your Journal</h1>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {tag ? (
                        <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => {
                                const params = new URLSearchParams(
                                    window.location.search
                                );
                                params.delete("fromProject");
                                window.location.search = params.toString();
                            }}
                            endIcon={
                                <span>
                                    {/* MUI Close Icon */}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        style={{ verticalAlign: "middle" }}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </span>
                            }
                            sx={{
                                textTransform: "none",
                                bgcolor: "grey.100",
                                borderColor: "grey.300",
                            }}
                        >
                            {tag}
                        </Button>
                    ) : (
                        <TagSearchButton />
                    )}
                </div>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setShowAddEntry(true)}
                >
                    Add Journal Entry
                </Button>
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
                            <div className="flex items-center gap-2">
                                {entry.re ? (
                                    <h2 className="text-lg font-semibold">
                                        {entry.re}
                                    </h2>
                                ) : (
                                    <h2 className="text-gray-500 font-semibold italic">
                                        Unnamed Entry
                                    </h2>
                                )}
                                {entry.tags.map(
                                    ({ name }) =>
                                        name.length > 0 && (
                                            <span key={name}>
                                                <Chip
                                                    label={name}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ ml: 1 }}
                                                />
                                            </span>
                                        )
                                )}
                            </div>
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
                                <Button
                                    variant="outlined"
                                    color="warning"
                                    size="small"
                                    title="Edit entry"
                                    onClick={() => {
                                        setEditingEntry(true);
                                        setEntryUnderEdit(entry);
                                        setShowAddEntry(true);
                                    }}
                                    sx={{ minWidth: 0, px: 1 }}
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
                                </Button>
                                {/* Delete button */}
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
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
                                    sx={{ minWidth: 0, px: 1 }}
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
                                </Button>
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
                onSubmit={(subject, content, tag) => {
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
                tag={tag}
            />
        </div>
    );
}
