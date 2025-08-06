"use client";

import { useAuth } from "@/context/AuthContext";
import {
    getAssessmentById,
    getAssessmentInquiriesById,
    getAssessmentPeers,
    getReceivedAssessmentResponses,
} from "@/services/assessment";
import { getProjectsPeers as getProjectPeers } from "@/services/project";
import { UserProfile } from "@/types/userProfile";
import { Assessment, Inquiry, InquiryType } from "@/types/assessment";
import React, { useEffect, useState } from "react";

// --- Main Component ---
interface FeedbackFormProps {
    params: {
        projectId: string;
        assessmentId: string;
    };
}
const FeedbackForm: React.FC<FeedbackFormProps> = ({ params }) => {
    const [assessmentMetadata, setAssessmentMetadata] =
        useState<Assessment | null>(null);
    const [activePeer, setActivePeer] = useState<UserProfile | null>(null);
    const [activeTab, setActiveTab] = useState<number>(0);
    const [responses, setResponses] = useState<
        Record<string, Record<string, string>>
    >({});
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [peers, setPeers] = useState<UserProfile[]>([]);
    const { currentUser } = useAuth();

    const { projectId, assessmentId } = params;

    useEffect(() => {
        if (!currentUser) return;

        (async () => {
            // Get assessment metadata
            const a = await getAssessmentById(assessmentId);
            setAssessmentMetadata(a);

            // Get assessment inquiries
            const inqs = await getAssessmentInquiriesById(assessmentId);
            setInquiries(inqs);

            // Get the responders
            const ps = await getAssessmentPeers(assessmentId);
            const rs = ps.responders
                .filter((r) => r.id != currentUser.id)
                .map((u, i) => ({ ...u, name: `P${i + 1}` })); // For anonymity

            setPeers(rs);
            setActivePeer(rs[0]);
        })();
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser || !activePeer) return;

        (async () => {
            // Get assessment responses
            const rs = await getReceivedAssessmentResponses(
                assessmentId,
                currentUser.id
            );

            // We're gonna do all peers at the same time
            setResponses(
                rs.reduce(
                    (acc1, r) => ({
                        ...acc1,
                        [r.responderId]: r.responses.reduce(
                            (acc2, res) => ({
                                ...acc2,
                                [res.inquiryId]: res.answer,
                            }),
                            {}
                        ),
                    }),
                    {}
                )
            );
        })();
    }, [activePeer]);

    const handleSwitchTab = (idx: number) => {
        setActiveTab(idx);
        setActivePeer(peers[idx]);
    };

    const handleBack = () => {
        window.history.back();
    };

    const { FREE_RESPONSE, RUBRIC, RATING } = InquiryType;

    if (!activePeer && !assessmentMetadata) {
        return <p>Loading...</p>;
    }

    if (!assessmentMetadata) {
        return <p>Man something happened idk</p>;
    }

    if (!activePeer) {
        return <p>You are alone in this project :(</p>;
    }

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
                    {peers.map(({ id, name }, idx) => (
                        <button
                            key={name}
                            type="button"
                            className={`px-4 py-2 rounded-t ${
                                activeTab === idx
                                    ? "bg-blue-600 text-white font-bold"
                                    : "bg-gray-200 text-gray-700"
                            }`}
                            onClick={() => handleSwitchTab(idx)}
                        >
                            {name}
                        </button>
                    ))}
                </div>
                <p className="text-xl">
                    {assessmentMetadata.name} —{" "}
                    <span className="font-semibold">
                        {activePeer.name} [RECEIVED]
                    </span>
                </p>
                {inquiries.map((q) => {
                    switch (q.type) {
                        case FREE_RESPONSE:
                            return (
                                <div key={q.id} className="space-y-2">
                                    <label className="block font-semibold">
                                        {q.question}
                                    </label>
                                    <textarea
                                        className="w-full border rounded p-2"
                                        value={
                                            responses[activePeer.id]?.[q.id] ||
                                            ""
                                        }
                                        rows={4}
                                        disabled
                                    />
                                </div>
                            );
                        case RATING:
                            return (
                                <div key={q.id} className="space-y-2">
                                    <label className="block font-semibold">
                                        {q.question}
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        {q.labels && (
                                            <span>
                                                {q.labels.split(";")[0]}
                                            </span>
                                        )}
                                        {[...Array(q.scale)].map((_, i) => (
                                            <label
                                                key={i}
                                                className="flex flex-col items-center"
                                            >
                                                <input
                                                    type="radio"
                                                    name={`${q.id}-${activePeer}`}
                                                    value={i + 1}
                                                    checked={
                                                        responses[
                                                            activePeer.id
                                                        ]?.[q.id] == `${i + 1}`
                                                    }
                                                    disabled
                                                />
                                                <span>{i + 1}</span>
                                            </label>
                                        ))}
                                        {q.labels && (
                                            <span>
                                                {q.labels.split(";")[1]}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        case RUBRIC:
                            return (
                                <div key={q.id} className="space-y-2">
                                    <label className="block font-semibold">
                                        {q.question}
                                    </label>
                                    <table className="w-full border">
                                        <thead>
                                            <tr>
                                                <th></th>
                                                {q.options
                                                    .split(";")
                                                    .map((opt, colIdx) => (
                                                        <th
                                                            key={colIdx}
                                                            className="px-2 py-1 border"
                                                        >
                                                            {opt}
                                                        </th>
                                                    ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {q.rows.map((row, rowIdx) => (
                                                <tr key={rowIdx}>
                                                    <td className="border px-2 py-1">
                                                        {row.label}
                                                    </td>
                                                    {q.options
                                                        .split(";")
                                                        .map((_, colIdx) => (
                                                            <td
                                                                key={colIdx}
                                                                className="border text-center"
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name={`${q.id}-row-${rowIdx}-${activePeer}`}
                                                                    checked={
                                                                        (!responses[
                                                                            activePeer
                                                                                .id
                                                                        ]?.[
                                                                            q.id
                                                                        ]
                                                                            ? Array(
                                                                                  q
                                                                                      .rows
                                                                                      .length
                                                                              ).fill(
                                                                                  -1
                                                                              )
                                                                            : (JSON.parse(
                                                                                  responses[
                                                                                      activePeer
                                                                                          .id
                                                                                  ][
                                                                                      q
                                                                                          .id
                                                                                  ]
                                                                              ) as number[]))[
                                                                            rowIdx
                                                                        ] ===
                                                                        colIdx
                                                                    }
                                                                    disabled
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
                            return <p>There shouldn't be a question here.</p>;
                    }
                })}

                <button
                    disabled
                    className="w-full bg-gray-400 text-white py-2 rounded font-semibold"
                >
                    Read Only
                </button>
            </form>
        </>
    );
};

export default FeedbackForm;
