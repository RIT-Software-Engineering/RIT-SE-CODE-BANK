"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FeedbackForm, Inquiry, InquiryType } from "@/types/assessment";
import { createForm, getAllForms } from "@/services/form";
import {
    assignAssessmentToProject,
    getProjectsPeers,
} from "@/services/project";
import { UserProfile } from "@/types/userProfile";
import CreateAssessmentModal from "./CreateAssessmentModal";

type ReuseAssessmentModalProps = {
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

export function ReuseAssessmentModal({
    assessments,
    isOpen,
    onClose,
    onFormSelect,
}: ReuseAssessmentModalProps) {
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

type PeerSelectModalProps = {
    isOpen: boolean;
    onClose: () => void;
    peers: UserProfile[]; // list of peer emails or names
    selected: UserProfile[];
    setSelected: (peers: UserProfile[]) => void;
    splitPeers: boolean;
    setSplitPeers: (split: boolean) => void;
    responders: UserProfile[];
    setResponders: (peers: UserProfile[]) => void;
    receivers: UserProfile[];
    setReceivers: (peers: UserProfile[]) => void;
};

export function PeerSelectModal({
    isOpen,
    onClose,
    peers,
    selected,
    setSelected,
    splitPeers,
    setSplitPeers,
    responders,
    setResponders,
    receivers,
    setReceivers,
}: PeerSelectModalProps) {
    if (!isOpen) return null;

    // Helper functions for select/deselect all
    const handleSelectAll = () => {
        if (splitPeers) {
            setResponders(peers);
            setReceivers(peers);
        } else {
            setSelected(peers);
        }
    };
    const handleDeselectAll = () => {
        if (splitPeers) {
            setResponders([]);
            setReceivers([]);
        } else {
            setSelected([]);
        }
    };

    // Toggle peer selection
    const togglePeer = (
        peer: UserProfile,
        group: "all" | "responders" | "receivers"
    ) => {
        if (splitPeers) {
            if (group === "responders") {
                setResponders(
                    responders.includes(peer)
                        ? responders.filter((p) => p !== peer)
                        : [...responders, peer]
                );
            } else if (group === "receivers") {
                setReceivers(
                    receivers.includes(peer)
                        ? receivers.filter((p) => p !== peer)
                        : [...receivers, peer]
                );
            }
        } else {
            setSelected(
                selected.includes(peer)
                    ? selected.filter((p) => p !== peer)
                    : [...selected, peer]
            );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
                <button
                    className="absolute top-4 right-6 text-gray-500 hover:text-gray-700 cursor-pointer"
                    onClick={onClose}
                    type="button"
                >
                    ×
                </button>
                <h2 className="text-2xl font-bold mb-4">Select Peers</h2>
                <div className="mb-4 flex items-center gap-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={splitPeers}
                            onChange={(e) => setSplitPeers(e.target.checked)}
                        />
                        <span>Split into responders and receivers</span>
                    </label>
                </div>
                <div className="mb-4 flex gap-2">
                    <button
                        className="px-3 py-1 rounded border hover:bg-gray-100 cursor-pointer"
                        onClick={handleSelectAll}
                        type="button"
                    >
                        Select All
                    </button>
                    <button
                        className="px-3 py-1 rounded border hover:bg-gray-100 cursor-pointer"
                        onClick={handleDeselectAll}
                        type="button"
                    >
                        Deselect All
                    </button>
                </div>
                {splitPeers ? (
                    <div className="flex gap-6">
                        <div className="flex-1">
                            <h3 className="font-semibold mb-2">Responders</h3>
                            <div className="flex flex-wrap gap-2">
                                {peers.map((peer) => (
                                    <button
                                        key={peer.id}
                                        type="button"
                                        className={`px-2 py-1 rounded border ${
                                            responders.includes(peer)
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-100 text-gray-800"
                                        }`}
                                        onClick={() =>
                                            togglePeer(peer, "responders")
                                        }
                                    >
                                        {peer.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold mb-2">Receivers</h3>
                            <div className="flex flex-wrap gap-2">
                                {peers.map((peer) => (
                                    <button
                                        key={peer.id}
                                        type="button"
                                        className={`px-2 py-1 rounded border ${
                                            receivers.includes(peer)
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-100 text-gray-800"
                                        }`}
                                        onClick={() =>
                                            togglePeer(peer, "receivers")
                                        }
                                    >
                                        {peer.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h3 className="font-semibold mb-2">Peers</h3>
                        <div className="flex flex-wrap gap-2">
                            {peers.map((peer) => (
                                <button
                                    key={peer.id}
                                    type="button"
                                    className={`px-2 py-1 rounded border ${
                                        selected.includes(peer)
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-100 text-gray-800"
                                    }`}
                                    onClick={() => togglePeer(peer, "all")}
                                >
                                    {peer.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div className="mt-6 flex justify-end">
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={onClose}
                        type="button"
                    >
                        Done
                    </button>
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
    const [isReuseModalOpen, setIsReuseModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [forms, setForms] = useState<FeedbackForm[]>([]);
    const [selectedForm, setSelectedForm] = useState<FeedbackForm | undefined>(
        undefined
    );
    const [projectPeers, setProjectPeers] = useState<UserProfile[]>([]);

    const today = new Date().toISOString().split("T")[0];
    const inAWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

    const [formName, setFormName] = useState<string>("");
    const [formDesc, setFormDesc] = useState<string>("");
    const [formStartDate, setStartDate] = useState<string>(today);
    const [formDueDate, setDueDate] = useState<string>(inAWeek);
    const [selected, setSelected] = useState<UserProfile[]>([]);
    const [responders, setResponders] = useState<UserProfile[]>([]);
    const [receivers, setReceivers] = useState<UserProfile[]>([]);
    const [splitPeers, setSplitPeers] = useState(false);
    const [isPeerModalOpen, setIsPeerModalOpen] = useState(false);
    const [error, setError] = useState<string>("");

    const { projectId } = params;

    useEffect(() => {
        (async () => {
            setForms(await getAllForms());

            const allPeers = await getProjectsPeers(projectId);
            setProjectPeers(allPeers);
            setSelected(allPeers);
        })();
    }, []);

    const handleCreateNew = async (assessment: {
        title: string;
        inquiries: Inquiry[];
    }) => {
        let inquiriesSansId = assessment.inquiries.map(
            ({ id, ...rest }) => rest // Remove ID field
        );
        inquiriesSansId = inquiriesSansId.map((i) => {
            let newI = i as any;
            if (i.type === InquiryType.RUBRIC) {
                newI.rows = {
                    create: i.rows,
                };
            }
            return newI;
        });

        const form = await createForm({
            ...assessment,
            inquiries: inquiriesSansId,
        });

        console.log("DA FORM:");
        console.dir(form);

        setSelectedForm(form);
        setIsCreateModalOpen(false);
        setFormName(form.name);
    };

    const handleFormSelect = (form: FeedbackForm) => {
        setSelectedForm(form);
        setIsReuseModalOpen(false);
        setFormName(form.name);
    };

    const handleAssign = async () => {
        if (formStartDate == "" || formDueDate == "") {
            setError("Dates must be filled");
            return;
        }

        try {
            const assessment = {
                formId: selectedForm!.id,
                name: formName,
                description: formDesc,
                startDate: formStartDate,
                dueDate: formDueDate,
            };

            splitPeers
                ? await assignAssessmentToProject(
                      projectId,
                      assessment,
                      undefined,
                      responders.map((p) => p.email),
                      receivers.map((p) => p.email)
                  )
                : await assignAssessmentToProject(
                      projectId,
                      assessment,
                      selected.map((p) => p.email)
                  );

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
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        Create New Assessment
                    </button>
                    <button
                        className="px-6 py-3 text-lg bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition cursor-pointer"
                        onClick={() => setIsReuseModalOpen(true)}
                    >
                        Use Pre-made Assessment
                    </button>
                    <ReuseAssessmentModal
                        assessments={forms}
                        isOpen={isReuseModalOpen}
                        onClose={() => setIsReuseModalOpen(false)}
                        onFormSelect={handleFormSelect}
                    />
                    <CreateAssessmentModal
                        visible={isCreateModalOpen}
                        onCancel={() => setIsCreateModalOpen(false)}
                        onCreate={handleCreateNew}
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
                            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                            onClick={() => setIsPeerModalOpen(true)}
                            type="button"
                        >
                            Select Peers
                        </button>
                        <PeerSelectModal
                            isOpen={isPeerModalOpen}
                            onClose={() => setIsPeerModalOpen(false)}
                            peers={projectPeers}
                            splitPeers={splitPeers}
                            setSplitPeers={setSplitPeers}
                            responders={responders}
                            setResponders={setResponders}
                            receivers={receivers}
                            setReceivers={setReceivers}
                            selected={selected}
                            setSelected={setSelected}
                        />
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
