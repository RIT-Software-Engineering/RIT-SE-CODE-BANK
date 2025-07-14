"use client";

import React, { useEffect, useState } from "react";
import Header from "@components/Header";
import {
    Box,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from "@mui/material";
import EditNoteIcon from "@mui/icons-material/EditNote";

export default function Journal() {
    const [journalEntries, setJournalEntries] = useState([]);
    const [editingEntry, setEditingEntry] = useState(null);
    const [editValue, setEditValue] = useState("");

    useEffect(() => {
        console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
        const fetchEntries = async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/journal`
                );
                const data = await res.json();
                setJournalEntries(data);
            } catch (err) {
                console.error("Failed to fetch journal entries:", err);
            }
        };

        fetchEntries();
    }, []);

    const handleEditClick = (entry) => {
        setEditingEntry(entry);
        setEditValue(entry.notes);
    };

    const handleCancel = () => {
        setEditingEntry(null);
    };

    const handleSave = async (entry) => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/journal/${entry.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ notes: editValue }),
                }
            );
            setJournalEntries((prev) =>
                prev.map((e) =>
                    e.id === entry.id ? { ...e, notes: editValue } : e
                )
            );
        } catch (error) {
            console.error("Failed to save entry:", error);
        }
        setEditingEntry(null);
    };

    return (
        <>
            <Header />
            <Container maxWidth="lg" sx={{ paddingBlock: "1em" }}>
                <Typography
                    variant="h1"
                    sx={{
                        fontSize: "2rem",
                        fontWeight: 900,
                        color: "#fff",
                        mb: 4,
                    }}
                >
                    Journal
                </Typography>
                <>
                    {journalEntries
                        .slice()
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((entry) => (
                            <Container
                                key={entry.id}
                                sx={{
                                    fontFamily:
                                        '"Helvetica Neue", Helvetica, Roboto, Arial, sans-serif',
                                    backgroundColor: "#212121",
                                    paddingBlock: "1em",
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <Typography
                                        variant="h2"
                                        sx={{
                                            fontSize: "1.5rem",
                                            lineHeight: "2rem",
                                            fontWeight: 500,
                                        }}
                                    >
                                        {entry.date
                                            ? new Date(
                                                  entry.date
                                              ).toLocaleDateString("en-US", {
                                                  year: "numeric",
                                                  month: "long",
                                                  day: "numeric",
                                                  hour: "numeric",
                                                  minute: "numeric",
                                              })
                                            : ""}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        sx={{
                                            backgroundColor: "#F76902",
                                            "&:hover": {
                                                backgroundColor: "#000000",
                                            },
                                            borderRadius: "0px",
                                        }}
                                        onClick={() => handleEditClick(entry)}
                                    >
                                        <EditNoteIcon />
                                        Edit Notes
                                    </Button>
                                </Box>
                                <Typography
                                    variant="h3"
                                    sx={{
                                        fontSize: "1.25rem",
                                        lineHeight: "1.75rem",
                                        fontWeight: 300,
                                    }}
                                >
                                    {entry.contactee}
                                </Typography>
                                <Typography variant="body1">Notes:</Typography>
                                <Box
                                    sx={{
                                        border: "1px solid black",
                                        padding: "1em",
                                        marginTop: "1em",
                                    }}
                                >
                                    <pre
                                        style={{
                                            margin: 0,
                                            fontFamily: "inherit",
                                            background: "none",
                                            border: "none",
                                        }}
                                    >
                                        {entry.notes}
                                    </pre>
                                </Box>
                            </Container>
                        ))}
                </>
            </Container>
            <Dialog
                open={!!editingEntry}
                onClose={handleSave}
                maxWidth="sm"
                fullWidth
            >
                {editingEntry && (
                    <>
                        <DialogTitle>
                            Journal Entry for{" "}
                            {new Date(editingEntry.date).toLocaleDateString(
                                "en-US",
                                {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "numeric",
                                }
                            )}
                            <br />
                            with {editingEntry.contactee}
                        </DialogTitle>
                        <DialogContent>
                            <Box>
                                <textarea
                                    value={editValue}
                                    onChange={(e) =>
                                        setEditValue(e.target.value)
                                    }
                                    style={{
                                        resize: "none",
                                        width: "95%",
                                        height: "200px",
                                        padding: "10px",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                        fontFamily:
                                            '"Helvetica Neue", Helvetica, Roboto, Arial, sans-serif',
                                        fontSize: "1rem",
                                    }}
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={handleCancel}
                                sx={{
                                    border: "1px solid #F76902",
                                    color: "#F76902",
                                    backgroundColor: "#FFFFFF",
                                    "&:hover": {
                                        backgroundColor: "#F76902",
                                        color: "#FFFFFF",
                                    },
                                    borderRadius: "0px",
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleSave(editingEntry)}
                                sx={{
                                    border: "1px solid #F76902",
                                    color: "#F76902",
                                    backgroundColor: "#FFFFFF",
                                    "&:hover": {
                                        backgroundColor: "#F76902",
                                        color: "#FFFFFF",
                                    },
                                    borderRadius: "0px",
                                }}
                            >
                                Save
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </>
    );
}
