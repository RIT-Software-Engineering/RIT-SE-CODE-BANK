"use client";
import { useAuth } from "@/context/AuthContext";
import { createProject } from "@/services/project";
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
        <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
            <h1 className="text-2xl font-bold mb-4">Create a New Project</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-medium mb-1">
                        Project Name<span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        className="w-full border rounded px-3 py-2"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1">
                        Description<span className="text-red-500">*</span>
                    </label>
                    <textarea
                        className="w-full border rounded px-3 py-2"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1">
                        Invite Peers (optional)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            className="flex-1 border rounded px-3 py-2"
                            placeholder="Enter peer email"
                            value={peerEmail}
                            onChange={(e) => setPeerEmail(e.target.value)}
                        />
                        <button
                            type="button"
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                            onClick={handleAddPeer}
                        >
                            Add
                        </button>
                    </div>
                    {peerEmails.length > 0 && (
                        <ul className="mt-2">
                            {peerEmails.map((email, idx) => (
                                <li
                                    key={email}
                                    className="flex items-center gap-2"
                                >
                                    <span>{email}</span>
                                    <button
                                        type="button"
                                        className="text-red-500 text-sm"
                                        onClick={() => handleRemovePeer(email)}
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {error && <div className="text-red-600">{error}</div>}
                {success && <div className="text-green-600">{success}</div>}
                <button
                    type="submit"
                    className="bg-green-600 text-white px-6 py-2 rounded font-semibold"
                >
                    Create Project
                </button>
            </form>
        </div>
    );
}
