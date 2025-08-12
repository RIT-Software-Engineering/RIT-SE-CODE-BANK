"use client";
import BackArrow from "@/components/BackArrow";
import { useAuth } from "@/context/AuthContext";
import { createProject } from "@/services/project";
import {
    TextField,
    Button,
    List,
    ListItem,
    IconButton,
    ListItemText,
    Alert,
    Paper,
} from "@mui/material";
import React, { useState } from "react";

export default function CreateProjectPage() {
    const { currentUser } = useAuth();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [peerEmails, setPeerEmails] = useState<string[]>([]);
    const [peerEmail, setPeerEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleAddPeer = () => {
        if (!peerEmail.trim()) return;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(peerEmail)) {
            setError("Invalid email address");
            return;
        }
        if (peerEmails.some((p) => p === peerEmail)) {
            setError("Email already added");
            return;
        }
        setPeerEmails([...peerEmails, peerEmail]);
        setPeerEmail("");
        setError(null);
    };

    const handleRemovePeer = (email: string) => {
        setPeerEmails(peerEmails.filter((p) => p !== email));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!name.trim() || !description.trim()) {
            setError("Project name and description are required.");
            return;
        }

        try {
            await createProject(
                {
                    name,
                    description,
                    peerEmails,
                },
                currentUser!.id
            );

            setSuccess("Project created successfully!");
            setName("");
            setDescription("");
            setPeerEmails([]);
        } catch (err) {
            setError("Failed to create project: " + err);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-4 space-y-8">
            <BackArrow />
            <Paper
                className="max-w-xl mx-auto mt-10 p-6"
                elevation={3}
                sx={{
                    borderRadius: 2,
                    bgcolor: (theme) =>
                        theme.palette.mode === "dark"
                            ? theme.palette.background.paper
                            : "#f9f9f9",
                }}
            >
                <h1 className="text-2xl font-bold mb-4">
                    Create a New Project
                </h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block font-medium mb-1">
                            Project Name<span className="text-red-500">*</span>
                        </label>
                        <TextField
                            fullWidth
                            variant="outlined"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            size="small"
                            placeholder="Project Name"
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">
                            Description<span className="text-red-500">*</span>
                        </label>
                        <TextField
                            fullWidth
                            variant="outlined"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            size="small"
                            multiline
                            minRows={3}
                            placeholder="Project Description"
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">
                            Invite Peers (optional)
                        </label>
                        <div style={{ display: "flex", gap: 8 }}>
                            <TextField
                                type="email"
                                variant="outlined"
                                size="small"
                                fullWidth
                                placeholder="Enter peer email"
                                value={peerEmail}
                                onChange={(e) => setPeerEmail(e.target.value)}
                            />
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={handleAddPeer}
                                sx={{ minWidth: 80, maxHeight: "2.5rem" }} // Probably shouldn't hard code this...
                            >
                                Add
                            </Button>
                        </div>
                        {peerEmails.length > 0 && (
                            <List>
                                {peerEmails.map((email) => (
                                    <ListItem
                                        key={email}
                                        secondaryAction={
                                            <IconButton
                                                edge="end"
                                                color="error"
                                                size="small"
                                                onClick={() =>
                                                    handleRemovePeer(email)
                                                }
                                            >
                                                ×
                                            </IconButton>
                                        }
                                        disablePadding
                                        sx={{
                                            maxHeight: "2rem",
                                        }}
                                    >
                                        <ListItemText primary={email} />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </div>
                    {error && <Alert severity="error">{error}</Alert>}
                    {success && <Alert severity="success">{success}</Alert>}
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ fontWeight: "bold", py: 1.5 }}
                    >
                        Create Project
                    </Button>
                </form>
            </Paper>
        </div>
    );
}
