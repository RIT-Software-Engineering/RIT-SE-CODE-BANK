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
import BackArrow from "@/components/BackArrow";
import { Button, MenuItem, Select } from "@mui/material";

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
    const [responses, setResponses] = useState<
        Record<string, Record<string, string>>
    >({});
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [allResponders, setAllResponders] = useState<UserProfile[]>([]);
    const [allReceivers, setAllReceivers] = useState<UserProfile[]>([]);
    const [responders, setResponders] = useState<UserProfile[]>([]);
    const [receivers, setReceivers] = useState<UserProfile[]>([]);
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

            // Get the assessment peers
            const ps = await getAssessmentPeers(assessmentId);

            setResponders(ps.responders);
            setAllResponders(ps.responders);
            setReceivers(
                ps.receivers.filter((r) => r.id != ps.responders[0].id)
            );
            setAllReceivers(ps.receivers);

            setActivePair([
                ps.responders[0],
                ps.receivers.filter((r) => r.id != ps.responders[0].id)[0],
            ]);

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

    if (!activePair) return;

    const getActivePairId = () => `${activePair[0].id}>${activePair[1].id}`;

    const handleBack = () => {
        window.history.back();
    };

    const handleResponderSelect = (peerId: string) => {
        const resp = responders.find((r) => r.id == peerId)!;
        const rece =
            activePair[1].id == resp.id
                ? allReceivers.find((r) => r.id != resp.id)!
                : activePair[1];

        setActivePair([resp, rece]);

        setReceivers(allReceivers.filter((r) => r.id != peerId));
    };

    const handleReceiverSelect = (peerId: string) => {
        setActivePair((prev) => [
            prev![0],
            receivers.find((r) => r.id == peerId)!,
        ]);
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
                <BackArrow />
                <div className="mb-6 flex justify-center items-baseline space-x-2 h-16">
                    {/* First dropdown */}
                    <Select
                        value={activePair[0].id}
                        onChange={(e) =>
                            handleResponderSelect(e.target.value as string)
                        }
                        displayEmpty
                        sx={{
                            minWidth: 160,
                            mr: 2,
                            "& .MuiSelect-icon": {
                                color: (theme) =>
                                    theme.palette.mode === "dark"
                                        ? theme.ritColors.gray_1 // VSCode thinks `ritColors` is undefined :(
                                        : theme.palette.grey[800],
                            },
                        }}
                        inputProps={{ "aria-label": "Responder" }}
                    >
                        {responders.map((peer) => (
                            <MenuItem key={peer.id} value={peer.id}>
                                {peer.name}
                            </MenuItem>
                        ))}
                    </Select>

                    {/* Arrow */}
                    <span className="text-lg font-semibold text-gray-600">
                        →
                    </span>

                    {/* Second dropdown */}
                    <Select
                        value={activePair[1].id}
                        onChange={(e) =>
                            handleReceiverSelect(e.target.value as string)
                        }
                        displayEmpty
                        sx={{
                            minWidth: 160,
                            mr: 2,
                            "& .MuiSelect-icon": {
                                color: (theme) =>
                                    theme.palette.mode === "dark"
                                        ? theme.ritColors.gray_1 // VSCode thinks `ritColors` is undefined :(
                                        : theme.palette.grey[800],
                            },
                        }}
                        inputProps={{ "aria-label": "Receiver" }}
                    >
                        {receivers.map((peer) => (
                            <MenuItem key={peer.id} value={peer.id}>
                                {peer.name}
                            </MenuItem>
                        ))}
                    </Select>
                </div>
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
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ py: 1, fontWeight: "bold" }}
                    disabled
                >
                    Read Only
                </Button>
            </form>
        </>
    );
};

export default FeedbackForm;
