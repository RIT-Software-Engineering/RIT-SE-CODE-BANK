"use client";

import { useAuth } from "@/context/AuthContext";
import {
    getAssessmentById,
    getAssessmentInquiriesById,
    getAssessmentPeerResponses,
    getAssessmentPeers,
    sendAssessmentResponses,
} from "@/services/assessment";
import { getProjectsPeers as getProjectPeers } from "@/services/project";
import { UserProfile } from "@/types/userProfile";
import {
    Assessment,
    Inquiry,
    InquiryType,
    RubricInquiry,
} from "@/types/assessment";
import React, { useEffect, useState } from "react";
import { IconButton, Snackbar, SnackbarCloseReason } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// --- Main Component ---
interface FeedbackFormProps {
    params: {
        projectId: string;
        assessmentId: string;
    };
}
const FeedbackForm: React.FC<FeedbackFormProps> = ({ params }) => {
    const [editable, setEditable] = useState(false);
    const [assessmentMetadata, setAssessmentMetadata] =
        useState<Assessment | null>(null);
    const [activePeer, setActivePeer] = useState<UserProfile | null>(null);
    const [activeTab, setActiveTab] = useState<number>(0);
    const [responses, setResponses] = useState<Record<string, string>>({});
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [peersToEval, setPeersToEval] = useState<UserProfile[]>([]);
    const [showSnack, setShowSnack] = useState(false);
    const { currentUser } = useAuth();

    const { projectId, assessmentId } = params;

    useEffect(() => {
        if (!currentUser) return;

        (async () => {
            // Get assessment metadata
            const a = await getAssessmentById(assessmentId);
            setAssessmentMetadata(a);

            // See if the peer should be able to edit the form
            setEditable(new Date() >= new Date(a.startDate));

            // Get assessment inquiries
            const inqs = await getAssessmentInquiriesById(assessmentId);
            setInquiries(inqs);

            // Get the receivers
            const ps = await getAssessmentPeers(assessmentId);
            const rs = ps.receivers.filter((r) => r.id != currentUser.id);
            setPeersToEval(rs);
            setActivePeer(rs[0]);
        })();
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser || !activePeer) return;

        (async () => {
            // Get assessment responses
            const rs = await getAssessmentPeerResponses(
                assessmentId,
                currentUser.id
            );

            // We only do one peer at a time
            // Get current peer under review, set the responses
            const peerRs = rs.find((r) => r.respondeeId == activePeer.id);

            if (!peerRs) {
                setResponses({});
            } else
                setResponses(
                    peerRs.responses.reduce((acc, r) => {
                        acc[r.inquiryId] = r.answer;
                        return acc;
                    }, {} as Record<string, string>)
                );
        })();
    }, [activePeer]);

    const handleSwitchTab = (idx: number) => {
        submitForm();

        setActiveTab(idx);
        setActivePeer(peersToEval[idx]);
    };

    const handleFreeResponse = (qid: string, answer: string) => {
        setResponses((prev) => ({
            ...prev,
            [qid]: answer,
        }));
    };

    const handleRating = (qid: string, answer: number) => {
        setResponses((prev) => ({
            ...prev,
            [qid]: `${answer}`,
        }));
    };

    const handleRubric = (qid: string, rowIdx: number, colIdx: number) => {
        setResponses((prev) => {
            const prevAns: number[] = prev[qid]
                ? JSON.parse(prev[qid])
                : Array(
                      (inquiries.find((inq) => inq.id == qid) as RubricInquiry)
                          .rows.length
                  ).fill(-1);
            prevAns[rowIdx] = colIdx;
            return {
                ...prev,
                [qid]: JSON.stringify(prevAns),
            };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        submitForm();
        setShowSnack(true);
    };

    const submitForm = () => {
        sendAssessmentResponses(
            assessmentId,
            currentUser!.id,
            activePeer!.id,
            responses
        );
    };

    const handleBack = () => {
        submitForm();
        window.history.back();
    };

    const handleClose = (
        event: React.SyntheticEvent | Event,
        reason?: SnackbarCloseReason
    ) => {
        if (reason === "clickaway") {
            return;
        }

        setShowSnack(false);
    };

    const snackAction = (
        <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
        >
            <CloseIcon fontSize="small" />
        </IconButton>
    );

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
            <form
                onSubmit={handleSubmit}
                className="max-w-xl mx-auto p-4 space-y-8"
            >
                <button
                    type="button"
                    onClick={handleBack}
                    className="mb-4 text-blue-600 underline"
                >
                    &larr; Back
                </button>
                <div className="flex justify-center mb-6 space-x-2">
                    {peersToEval.map(({ id, name }, idx) => (
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
                    <span className="font-semibold">{activePeer.name}</span>
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
                                        value={responses[q.id] || ""}
                                        onChange={(e) =>
                                            handleFreeResponse(
                                                q.id,
                                                e.target.value
                                            )
                                        }
                                        rows={4}
                                        disabled={!editable}
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
                                                    name={`${q.id}-${activePeer}`}
                                                    value={i + 1}
                                                    checked={
                                                        responses[q.id] ==
                                                        `${i + 1}`
                                                    }
                                                    onChange={() =>
                                                        handleRating(
                                                            q.id,
                                                            i + 1
                                                        )
                                                    }
                                                    disabled={!editable}
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
                                                                    name={`${q.id}-row-${rowIdx}-${activePeer}`}
                                                                    checked={
                                                                        (!responses[
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
                                                                                      q
                                                                                          .id
                                                                                  ]
                                                                              ) as number[]))[
                                                                            rowIdx
                                                                        ] ===
                                                                        colIdx
                                                                    }
                                                                    onChange={() =>
                                                                        handleRubric(
                                                                            q.id,
                                                                            rowIdx,
                                                                            colIdx
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        !editable
                                                                    }
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
                {editable ? (
                    <>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 rounded font-semibold cursor-pointer"
                        >
                            Submit
                        </button>
                        <Snackbar
                            open={showSnack}
                            autoHideDuration={6000}
                            message="Response submitted"
                            onClose={handleClose}
                            action={snackAction}
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "center",
                            }}
                        />
                    </>
                ) : (
                    <button
                        disabled
                        className="w-full bg-gray-400 text-white py-2 rounded font-semibold"
                    >
                        {new Date() < new Date(assessmentMetadata.startDate)
                            ? "Starts " +
                              new Date(
                                  assessmentMetadata.startDate
                              ).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                              })
                            : "Past Due"}
                    </button>
                )}
            </form>
        </>
    );
};

export default FeedbackForm;
