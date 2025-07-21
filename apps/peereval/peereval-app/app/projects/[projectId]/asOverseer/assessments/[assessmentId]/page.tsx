"use client";

import { useAuth } from "@/context/AuthContext";
import {
    getAssessmentById,
    getAssessmentInquiriesById,
    getAssessmentPeers,
    getAssessmentResponses,
} from "@/services/assessment";
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
    const [activePair, setActivePair] = useState<
        [UserProfile, UserProfile] | null
    >(null);
    const [activeTab, setActiveTab] = useState<number>(0);
    const [responses, setResponses] = useState<
        Record<string, Record<string, string>>
    >({});
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [peerPairs, setPeerPairs] = useState<[UserProfile, UserProfile][]>(
        []
    );
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

            const pairs: [UserProfile, UserProfile][] = [];
            ps.responders.forEach((responder) =>
                ps.receivers.forEach(
                    (receiver) =>
                        responder.id != receiver.id &&
                        pairs.push([responder, receiver])
                )
            );
            setPeerPairs(pairs);
            setActivePair(pairs[0]);

            // Get assessment responses
            const rs = await getAssessmentResponses(assessmentId);

            // We're gonna do all peers at the same time
            setResponses(
                rs.reduce(
                    (acc1, formRes) => ({
                        ...acc1,
                        [`${formRes.responderId}>${formRes.respondeeId}`]:
                            formRes.responses.reduce(
                                (acc2, inqRes) => ({
                                    ...acc2,
                                    [inqRes.inquiryId]: inqRes.answer,
                                }),
                                {}
                            ),
                    }),
                    {}
                )
            );
        })();
    }, [currentUser]);

    const getActivePairId = () => `${activePair![0].id}>${activePair![1].id}`;

    const handleSwitchTab = (idx: number) => {
        setActiveTab(idx);
        setActivePair(peerPairs[idx]);
    };

    const handleBack = () => {
        window.history.back();
    };

    const { FREE_RESPONSE, RUBRIC, RATING } = InquiryType;

    if (!activePair && !assessmentMetadata) {
        return <p>Loading...</p>;
    }

    if (!assessmentMetadata) {
        return <p>Man something happened idk</p>;
    }

    if (!activePair) {
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
                <div className="mb-6">
                    {/* Outer wrapper to control layout */}
                    <div className="relative">
                        {/* Scroll container */}
                        <div
                            className="overflow-x-auto"
                            style={{ paddingBottom: "12px" }} // space for scrollbar
                        >
                            {/* Tab buttons */}
                            <div className="flex w-max space-x-2 px-2">
                                {peerPairs.map((pair, idx) => (
                                    <button
                                        key={`${pair[0].id}>${pair[1].id}`}
                                        type="button"
                                        className={`px-4 py-2 whitespace-nowrap rounded-t ${
                                            activeTab === idx
                                                ? "bg-blue-600 text-white font-bold"
                                                : "bg-gray-200 text-gray-700"
                                        }`}
                                        onClick={() => handleSwitchTab(idx)}
                                    >
                                        {pair[0].name} → {pair[1].name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>{" "}
                <p className="text-xl">
                    {assessmentMetadata.name} —{" "}
                    <span className="font-semibold">
                        {activePair[0].name} → {activePair[1].name}
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
                                            responses[getActivePairId()]?.[
                                                q.id
                                            ] || ""
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
                                        {q.labels && <span>{q.labels[0]}</span>}
                                        {[...Array(q.scale)].map((_, i) => (
                                            <label
                                                key={i}
                                                className="flex flex-col items-center"
                                            >
                                                <input
                                                    type="radio"
                                                    name={`${q.id}-${activePair}`}
                                                    value={i + 1}
                                                    checked={
                                                        responses[
                                                            getActivePairId()
                                                        ]?.[q.id] == `${i + 1}`
                                                    }
                                                    disabled
                                                />
                                                <span>{i + 1}</span>
                                            </label>
                                        ))}
                                        {q.labels && <span>{q.labels[1]}</span>}
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
                                                {q.rows[0].options.map(
                                                    (opt, colIdx) => (
                                                        <th
                                                            key={colIdx}
                                                            className="px-2 py-1 border"
                                                        >
                                                            {opt}
                                                        </th>
                                                    )
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {q.rows.map((row, rowIdx) => (
                                                <tr key={rowIdx}>
                                                    <td className="border px-2 py-1">
                                                        {row.label}
                                                    </td>
                                                    {row.options.map(
                                                        (_, colIdx) => (
                                                            <td
                                                                key={colIdx}
                                                                className="border text-center"
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name={`${q.id}-row-${rowIdx}-${activePair}`}
                                                                    checked={
                                                                        (!responses[
                                                                            getActivePairId()
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
                                                                                      getActivePairId()
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
                                                        )
                                                    )}
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
