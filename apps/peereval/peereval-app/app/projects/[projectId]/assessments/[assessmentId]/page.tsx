'use client';

import { useUserContext } from "@/context/UserContext";
import React, { act, useEffect, useState } from "react";

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
// const questions: Question[] = [
//     {
//         type: "free-response",
//         id: "q1",
//         question: "What was this peer's biggest strength?",
//     },
//     {
//         type: "rating",
//         id: "q2",
//         question: "How would you rate this peer's communication?",
//         scale: 5,
//         labels: ["Poor", "Excellent"],
//     },
//     {
//         type: "rubric",
//         id: "q3",
//         question: "Evaluate the following aspects:",
//         rows: [
//             {
//                 label: "Clarity",
//                 options: ["Poor", "Fair", "Good", "Excellent"],
//             },
//             {
//                 label: "Teamwork",
//                 options: ["Poor", "Fair", "Good", "Excellent"],
//             },
//         ],
//     },
// ];

// Metadata of Form
const formName = "Sprint 2 Peer Assessment";

// --- Main Component ---
interface FeedbackFormProps {
    params: {
        projectId: string,
        assessmentId: string
    }
}
const FeedbackForm: React.FC<FeedbackFormProps> = ({ params }) => {
    const [activePeer, setActivePeer] = useState<string>("");
    const [activeTab, setActiveTab] = useState<number>(0);
    // Just the completions object
    const [responses, setResponses] = useState<Record<string, Record<string, any>>>({});
    const [questions, setQuestions] = useState<Question[]>([]);
    const [peersToEval, setPeersToEval] = useState([]);
    const {userId, setUserId} = useUserContext();

    const projectId = params.projectId;
    const assessmentId = params.assessmentId;

    useEffect(() => {
        // Get the assessment questions
        fetch("http://localhost:3003/assessments/" + assessmentId)
            .then(res => res.json())
            .then(data => setQuestions(data['questions']));

        // Get the peer's responses
        fetch(`http://localhost:3003/assessments/responses/${userId}/${assessmentId}`)
            .then(res => res.json())
            .then(setResponses);

        // Get the peers the user is responding to
        fetch('http://localhost:3003/projects/getPeers/' + projectId)
            .then(res => res.json())
            .then(data => {
                setPeersToEval(data);
                setActivePeer(data[0]);
            });
    }, []);

    const handleFreeResponse = (qid: string, value: string) => {
        setResponses(prev => {
            const answers = prev[activePeer];
            return ({
                ...prev,
                [activePeer]: {
                    ...answers,
                    [qid]: value
                }
            })
        });
    };

    const handleRating = (qid: string, value: number) => {
        setResponses(prev => {
            const answers = prev[activePeer];
            return ({
                ...prev,
                [activePeer]: {
                    ...answers,
                    [qid]: value
                }
            })
        });
    };

    const handleRubric = (qid: string, rowIdx: number, colIdx: number) => {
        setResponses(prev => {
            const answers = prev[activePeer];
            const newAnswer = answers[qid] ?? [];
            newAnswer[rowIdx] = colIdx;
            return ({
                ...prev,
                [activePeer]: {
                    ...answers,
                    [qid]: newAnswer
                }
            })
        });
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
                    {peersToEval.map((name, idx) => (
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
                <p className="text-xl">{formName} — <span className="font-semibold">{activePeer}</span></p>
                {questions.map((q) => {
                    const tabResponses = responses[activePeer] || {};
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
                                                    name={`${q.id}-${activePeer}`}
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
                                                                name={`${q.id}-row-${rowIdx}-${activePeer}`}
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

export default FeedbackForm;