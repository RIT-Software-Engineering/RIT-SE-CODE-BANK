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
const formName = "[YOUR FEEDBACK] Sprint 2 Peer Assessment";

// --- Main Component ---
const peers = ["P1", "P2"];

const ReceievedFeedback: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);

    const responses: Record<string, any>[] = [
        {
            "q1": "Then Minerva said, Father, son of Saturn, king of kings, it served them right, and so it would any one else who does as they did; but Aegisthus is neither here nor there—it is for Ulysses that my heart bleeds, when I think of his sufferings in that lonely sea-girt island, far away, poor man, from all his friends. It is an island covered with forest, in the very middle of the sea, and a goddess lives there, daughter of the magician Atlas, who looks after the bottom of the ocean, and carries the great columns that keep heaven and earth asunder. This daughter of Atlas has got hold of poor unhappy Ulysses, and keeps trying by every kind of blandishment to make him forget his home, so that he is tired of life, and thinks of nothing but how he may once more see the smoke of his own chimneys.",
            "q2": 4,
            "q3": {
                0: 2,
                1: 3
            }
        },
        {
            "q1": "But Ulysses sat as one dumbfounded; and his eyes filled with tears as he heard the things that his father was telling him. He flung his arms about his father and said, ‘I am he, father, about whom you are asking—I have returned after having been away for twenty years. But stay your weeping—we have no time to lose; go, rather, and tell the servants to make ready a meal of the best that there is. I have brought spoil from many places, and there is enough to feast us all.’",
            "q2": 4,
            "q3": {
                0: 2,
                1: 3
            }
        },
        {
            "q1": "Then Ulysses tore off his rags, and sprang on to the broad pavement with his bow and his quiver full of arrows. He shed the arrows on the ground at his feet and said, ‘The mighty contest is at an end. I will now see whether Apollo will vouchsafe it to me to hit another mark which no man has yet hit.’",
            "q2": 1,
            "q3": {
                0: 2,
                1: 3
            }
        },
    ]

    const handleBack = () => {
        window.history.back();
    };

    return (
        <>
        <form className="max-w-xl mx-auto p-4 space-y-8">
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
                switch (q.type) {
                    case "free-response":
                        return (
                            <div key={q.id} className="space-y-2">
                                <label className="block font-semibold">{q.question}</label>
                                <textarea
                                    className="w-full border rounded p-2"
                                    value={responses[activeTab][q.id] || ""}
                                    rows={4}
                                    readOnly={true}
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
                                                name={q.id}
                                                value={i + 1}
                                                checked={responses[activeTab][q.id] === i + 1}
                                                disabled={true}
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
                                                            name={`${q.id}-row-${rowIdx}`}
                                                            checked={responses[activeTab][q.id]?.[rowIdx] === colIdx}
                                                            disabled={true}
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
            {/* <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded font-semibold"
            >
                Submit
            </button> */}
        </form>
                </>

    );
};

export default ReceievedFeedback;