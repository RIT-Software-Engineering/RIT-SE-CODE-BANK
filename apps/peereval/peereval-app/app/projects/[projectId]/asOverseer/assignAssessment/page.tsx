"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FeedbackForm, Inquiry, InquiryType } from "@/types/assessment";
import { getAllForms } from "@/services/form";

type AssessmentModalProps = {
    assessments: FeedbackForm[];
    isOpen: boolean;
    onClose: () => void;
};

function QuestionDisplay({ inquiry }: { inquiry: Inquiry }) {
    switch (inquiry.type) {
        case InquiryType.FREE_RESPONSE:
            return (
                <div className="mb-4">
                    <div className="font-semibold">Free Response</div>
                    <div className="mb-1">{inquiry.question}</div>
                    <textarea
                        className="w-full border rounded p-2"
                        disabled
                        placeholder="Response..."
                    />
                </div>
            );
        case InquiryType.RATING:
            return (
                <div className="mb-4">
                    <div className="font-semibold">Rating</div>
                    <div className="mb-1">{inquiry.question}</div>
                    <div>
                        {inquiry.labels && (
                            <span>
                                Scale: {inquiry.labels[0]} - {inquiry.labels[1]}
                            </span>
                        )}
                        <input
                            type="range"
                            min={0}
                            max={1}
                            disabled
                            className="w-full"
                        />
                    </div>
                </div>
            );
        case InquiryType.RUBRIC:
            return (
                <div className="mb-4">
                    <div className="font-semibold">Rubric</div>
                    <div className="mb-1">{inquiry.question}</div>
                    <table className="w-full border">
                        <thead>
                            <tr>
                                <th className="border px-2 py-1 text-left">
                                    Criteria
                                </th>
                                <th className="border px-2 py-1 text-left">
                                    Description
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {inquiry.rows.map((row, idx) => (
                                <tr key={idx}>
                                    <td className="border px-2 py-1">
                                        {row.label}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {row.options}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        default:
            return null;
    }
}

export function AssessmentModal({
    assessments,
    isOpen,
    onClose,
}: AssessmentModalProps) {
    const [openIdx, setOpenIdx] = useState<number | null>(null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <button
                    className="absolute top-4 right-6 text-gray-500 hover:text-gray-700"
                    onClick={onClose}
                >
                    ×
                </button>
                <h2 className="text-2xl font-bold mb-4">Assessments</h2>
                <div>
                    {assessments.map((form, idx) => (
                        <div key={form.id} className="mb-3 border rounded">
                            <button
                                className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 font-semibold rounded-t flex justify-between items-center"
                                onClick={() =>
                                    setOpenIdx(openIdx === idx ? null : idx)
                                }
                            >
                                <span>{form.name}</span>
                                <span>{openIdx === idx ? "▲" : "▼"}</span>
                            </button>
                            {openIdx === idx && (
                                <div className="px-4 py-3 bg-white rounded-b">
                                    {form.inquiries.length === 0 && (
                                        <div className="text-gray-500 italic">
                                            No questions.
                                        </div>
                                    )}
                                    {form.inquiries.map((q, qIdx) => (
                                        <QuestionDisplay
                                            key={qIdx}
                                            inquiry={q}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function AssignAssessmentPage() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [forms, setForms] = useState<FeedbackForm[]>([]);

    useEffect(() => {
        (async () => {
            setForms(await getAllForms());
            console.dir(await getAllForms());
        })();
    }, []);

    // Dummy data for demonstration; replace with real data as needed
    // const forms: FeedbackForm[] = [
    //     {
    //         id: "1",
    //         name: "Sample Assessment",
    //         questions: [
    //             { type: "freeResponse", prompt: "Describe your experience." },
    //             {
    //                 type: "rating",
    //                 prompt: "Rate your teamwork.",
    //                 scaleMin: 1,
    //                 scaleMax: 5,
    //             },
    //             {
    //                 type: "rubric",
    //                 prompt: "Evaluate the following criteria:",
    //                 criteria: [
    //                     { label: "Quality", description: "Work quality" },
    //                     { label: "Timeliness", description: "Met deadlines" },
    //                 ],
    //             },
    //         ],
    //     },
    // ];

    const handleCreateNew = () => {
        router.push("./createAssessment");
    };

    const handleUsePreMade = () => {
        setIsModalOpen(true);
    };

    return (
        <div className="flex flex-col items-center gap-6 mt-16">
            <h1 className="text-3xl font-bold mb-4">Assign Assessment</h1>
            <button
                className="px-6 py-3 text-lg bg-blue-600 text-white rounded hover:bg-blue-700 transition cursor-pointer"
                onClick={handleCreateNew}
            >
                Create New Assessment
            </button>
            <button
                className="px-6 py-3 text-lg bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition cursor-pointer"
                onClick={handleUsePreMade}
            >
                Use Pre-made Assessment
            </button>
            <AssessmentModal
                assessments={forms}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
