"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FeedbackForm, Inquiry, InquiryType } from "@/types/assessment";
import { getAllForms } from "@/services/form";
import { assignAssessmentToProject } from "@/services/project";

type AssessmentModalProps = {
    assessments: FeedbackForm[];
    isOpen: boolean;
    onClose: () => void;
    onFormSelect: (form: FeedbackForm) => void;
};

function QuestionDisplay({ inquiry }: { inquiry: Inquiry }) {
    switch (inquiry.type) {
        case InquiryType.FREE_RESPONSE:
            return (
                <div className="mb-4">
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
    onFormSelect,
}: AssessmentModalProps) {
    const [openIdx, setOpenIdx] = useState<number[]>([]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-lg/40 p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <button
                    className="absolute top-4 right-6 text-gray-500 hover:text-gray-700 cursor-pointer"
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
                                    setOpenIdx(
                                        openIdx.includes(idx)
                                            ? openIdx.filter((i) => i != idx)
                                            : [...openIdx, idx]
                                    )
                                }
                            >
                                <span>{form.name}</span>
                                <span>{openIdx.includes(idx) ? "▲" : "▼"}</span>
                            </button>
                            {openIdx.includes(idx) && (
                                <>
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
                                    <button
                                        className="left-0 bottom-0 w-full px-4 py-3 bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer"
                                        onClick={() => onFormSelect(form)}
                                    >
                                        Select This Form
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

type AssignAssessmentPageProps = {
    params: { projectId: string };
};

export default function AssignAssessmentPage({
    params,
}: AssignAssessmentPageProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [forms, setForms] = useState<FeedbackForm[]>([]);
    const [selectedForm, setSelectedForm] = useState<FeedbackForm | undefined>(
        undefined
    );

    const today = new Date().toISOString().split("T")[0];
    const inAWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

    const [formName, setFormName] = useState<string>("");
    const [formDesc, setFormDesc] = useState<string>("");
    const [formStartDate, setStartDate] = useState<string>(today);
    const [formDueDate, setDueDate] = useState<string>(inAWeek);
    const [error, setError] = useState<string>("");

    const { projectId } = params;

    useEffect(() => {
        (async () => {
            setForms(await getAllForms());
        })();
    }, []);

    const handleCreateNew = () => {
        router.push("./createAssessment");
    };

    const handleUsePreMade = () => {
        setIsModalOpen(true);
    };

    const handleFormSelect = (form: FeedbackForm) => {
        setSelectedForm(form);
        setIsModalOpen(false);
        setFormName(form.name);
    };

    const handleAssign = async () => {
        if (formStartDate == "" || formDueDate == "") {
            setError("Dates must be filled");
            return;
        }

        try {
            await assignAssessmentToProject(projectId, {
                formId: selectedForm!.id,
                name: formName,
                description: formDesc,
                startDate: formStartDate,
                dueDate: formDueDate,
            });

            setError("");
            alert("Assigned assessment");
            router.push(`/projects/${projectId}/asOverseer`);
        } catch (err) {
            setError(`${err}`);
        }
    };

    if (!selectedForm)
        return (
            <div className="max-w-3xl mx-auto py-8 px-4">
                <button
                    className="mb-4 text-blue-600 underline"
                    aria-label="Back"
                    onClick={() => router.back()}
                >
                    &larr; Back
                </button>

                <div className="flex flex-col items-center gap-6">
                    <h1 className="text-3xl font-bold mb-4">
                        Assign Assessment
                    </h1>
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
                        onFormSelect={handleFormSelect}
                    />
                </div>
            </div>
        );

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <button
                className="mb-4 text-blue-600 underline"
                aria-label="Back"
                onClick={() => setSelectedForm(undefined)}
            >
                &larr; Back
            </button>
            <div className="flex flex-col items-center gap-6">
                <h1 className="text-3xl font-bold mb-4">Assign Assessment</h1>
                <div className="flex gap-8 w-full max-w-4xl">
                    {/* Selected Feedback Form Preview */}
                    <div className="flex-1 border rounded-lg p-4 bg-white shadow">
                        <h2 className="text-xl font-semibold mb-3">
                            Selected Feedback Form
                        </h2>
                        {typeof selectedForm === "object" && selectedForm ? (
                            <>
                                {selectedForm.inquiries.length === 0 && (
                                    <div className="text-gray-500 italic">
                                        No questions.
                                    </div>
                                )}
                                {selectedForm.inquiries.map((q, idx) => (
                                    <QuestionDisplay key={idx} inquiry={q} />
                                ))}
                            </>
                        ) : (
                            <div className="text-gray-500 italic">
                                No form selected.
                            </div>
                        )}
                    </div>
                    {/* Assignment Details Form */}
                    <form
                        className="flex-1 p-4 bg-white flex flex-col gap-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleAssign();
                        }}
                    >
                        <h2 className="text-xl font-semibold mb-3">
                            Assignment Details
                        </h2>
                        <label className="flex flex-col gap-1">
                            Name
                            <input
                                type="text"
                                className="border rounded px-2 py-1"
                                required
                                defaultValue={
                                    typeof selectedForm === "object" &&
                                    selectedForm
                                        ? selectedForm.name
                                        : ""
                                }
                                onChange={(e) => setFormName(e.target.value)}
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            Description
                            <input
                                type="text"
                                className="border rounded px-2 py-1"
                                onChange={(e) => setFormDesc(e.target.value)}
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            Start Date
                            <input
                                type="date"
                                className="border rounded px-2 py-1"
                                required
                                defaultValue={today}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            Due Date
                            <input
                                type="date"
                                className="border rounded px-2 py-1"
                                required
                                defaultValue={inAWeek}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </label>
                        <button
                            type="submit"
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                            Assign Assessment
                        </button>
                        {error && <div className="text-red-600">{error}</div>}
                    </form>
                </div>
            </div>
        </div>
    );
}
