import React, { useState } from "react";
import fs from 'fs';

// --- Types ---
type FreeResponseQuestion = {
    type: "free-response";
    id: string;
    question: string;
};

type RatingQuestion = {
    type: "rating";
    id: string;
    question: string;
    scale: number; // e.g., 5 for 1-5, 10 for 1-10
    labels?: [string, string]; // Optional: [leftLabel, rightLabel]
};

type RubricRow = {
    label: string;
    options: string[]; // e.g., ["Poor", "Average", "Excellent"]
};

type RubricQuestion = {
    type: "rubric";
    id: string;
    question: string;
    rows: RubricRow[];
};

type Question = FreeResponseQuestion | RatingQuestion | RubricQuestion;

// --- Example Questions ---
const questions: Question[] = [
    {
        type: "free-response",
        id: "q1",
        question: "What was this peer's biggest strength?",
    },
    {
        type: "rating",
        id: "q2",
        question: "How would you rate this peer's communication?",
        scale: 5,
        labels: ["Poor", "Excellent"],
    },
    {
        type: "rubric",
        id: "q3",
        question: "Evaluate the following aspects:",
        rows: [
            {
                label: "Clarity",
                options: ["Poor", "Fair", "Good", "Excellent"],
            },
            {
                label: "Teamwork",
                options: ["Poor", "Fair", "Good", "Excellent"],
            },
        ],
    },
];

// Metadata of Form
const formName = "Sprint 2 Peer Assessment";

// --- Main Component ---
const peers = ["Alice", "Bob", "Prof. Carol"];

const FeedbackFormCurrent: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [responses, setResponses] = useState<Record<number, Record<string, any>>>({});

    const handleFreeResponse = (id: string, value: string) => {
        setResponses((prev) => ({
            ...prev,
            [activeTab]: { ...(prev[activeTab] || {}), [id]: value },
        }));
    };

    const handleRating = (id: string, value: number) => {
        setResponses((prev) => ({
            ...prev,
            [activeTab]: { ...(prev[activeTab] || {}), [id]: value },
        }));
    };

    const handleRubric = (id: string, rowIdx: number, colIdx: number) => {
        setResponses((prev) => ({
            ...prev,
            [activeTab]: {
                ...(prev[activeTab] || {}),
                [id]: { ...((prev[activeTab] && prev[activeTab][id]) || {}), [rowIdx]: colIdx },
            },
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Submit logic here
        // alert("Submitted! " + JSON.stringify(responses, null, 2));
    };

    const handleBack = () => {
        window.history.back();
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-4 space-y-8">
                <button
                    type="button"
                    onClick={handleBack}
                    className="mb-4 text-blue-600 underline"
                >
                    &larr; Back
                </button>
                <div className="flex justify-center mb-6 space-x-2">
                    {peers.map((name, idx) => (
                        <button
                            key={name}
                            type="button"
                            className={`px-4 py-2 rounded-t ${
                                activeTab === idx
                                    ? "bg-blue-600 text-white font-bold"
                                    : "bg-gray-200 text-gray-700"
                            }`}
                            onClick={() => setActiveTab(idx)}
                        >
                            {name}
                        </button>
                    ))}
                </div>
                <p className="text-xl">{formName} — <span className="font-semibold">{peers[activeTab]}</span></p>
                {questions.map((q) => {
                    const tabResponses = responses[activeTab] || {};
                    switch (q.type) {
                        case "free-response":
                            return (
                                <div key={q.id} className="space-y-2">
                                    <label className="block font-semibold">{q.question}</label>
                                    <textarea
                                        className="w-full border rounded p-2"
                                        value={tabResponses[q.id] || ""}
                                        onChange={(e) => handleFreeResponse(q.id, e.target.value)}
                                        rows={4}
                                    />
                                </div>
                            );
                        case "rating":
                            return (
                                <div key={q.id} className="space-y-2">
                                    <label className="block font-semibold">{q.question}</label>
                                    <div className="flex items-center space-x-2">
                                        {q.labels && <span>{q.labels[0]}</span>}
                                        {[...Array(q.scale)].map((_, i) => (
                                            <label key={i} className="flex flex-col items-center">
                                                <input
                                                    type="radio"
                                                    name={`${q.id}-${activeTab}`}
                                                    value={i + 1}
                                                    checked={tabResponses[q.id] === i + 1}
                                                    onChange={() => handleRating(q.id, i + 1)}
                                                />
                                                <span>{i + 1}</span>
                                            </label>
                                        ))}
                                        {q.labels && <span>{q.labels[1]}</span>}
                                    </div>
                                </div>
                            );
                        case "rubric":
                            return (
                                <div key={q.id} className="space-y-2">
                                    <label className="block font-semibold">{q.question}</label>
                                    <table className="w-full border">
                                        <thead>
                                            <tr>
                                                <th></th>
                                                {q.rows[0].options.map((opt, colIdx) => (
                                                    <th key={colIdx} className="px-2 py-1 border">
                                                        {opt}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {q.rows.map((row, rowIdx) => (
                                                <tr key={rowIdx}>
                                                    <td className="border px-2 py-1">{row.label}</td>
                                                    {row.options.map((_, colIdx) => (
                                                        <td key={colIdx} className="border text-center">
                                                            <input
                                                                type="radio"
                                                                name={`${q.id}-row-${rowIdx}-${activeTab}`}
                                                                checked={tabResponses[q.id]?.[rowIdx] === colIdx}
                                                                onChange={() =>
                                                                    handleRubric(q.id, rowIdx, colIdx)
                                                                }
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        default:
                            return null;
                    }
                })}
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded font-semibold"
                >
                    Submit
                </button>
            </form>
        </>
    );
};

export default FeedbackFormCurrent;