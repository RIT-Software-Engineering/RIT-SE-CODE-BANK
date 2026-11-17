
"use client";

import { useAuth } from "@/context/AuthContext";
import {
    getAssessmentById,
    getAssessmentInquiriesById,
    getAssessmentPeers,
    getAssessmentResponses,
    releaseAssessmentResponse,
} from "@/services/assessment";

import {
    InquiryResponseField,
    type UserProfile,
    type Assessment,
    type Inquiry,
} from "@rit/peereval-components";

import React, { useEffect, useState } from "react";
import BackArrow from "@/components/BackArrow";
import { Button, MenuItem, Select } from "@mui/material";
import { useParams } from "next/navigation";

// --- Main Component ---

type ResponseStatus = {
    submittedAt: string | null;
    releasedAt: string | null;
};

const FeedbackForm: React.FC = () => {
    const [assessmentMetadata, setAssessmentMetadata] =
        useState<Assessment | null>(null);

    const [activePair, setActivePair] = useState<
        [UserProfile, UserProfile] | null
    >(null);

    const [responses, setResponses] = useState<
        Record<string, Record<string, string>>
    >({});

    const [responseStatuses, setResponseStatuses] = useState<
        Record<string, ResponseStatus>
    >({});

    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [allReceivers, setAllReceivers] = useState<UserProfile[]>([]);
    const [responders, setResponders] = useState<UserProfile[]>([]);
    const [receivers, setReceivers] = useState<UserProfile[]>([]);

    const [isReleasing, setIsReleasing] = useState(false);
    const [releaseMessage, setReleaseMessage] = useState("");
    const [releaseError, setReleaseError] = useState("");
    const [loadError, setLoadError] = useState("");

    const { currentUser } = useAuth();
    const { projectId, assessmentId } = useParams<{
        projectId: string;
        assessmentId: string;
    }>();

    // Load assessment details, peers, and responses.
    useEffect(() => {
        if (!currentUser) return;

        let cancelled = false;

        const loadAssessment = async () => {
            try {
                setLoadError("");

                const assessment = await getAssessmentById(assessmentId);
                const assessmentInquiries =
                    await getAssessmentInquiriesById(assessmentId);
                const peers = await getAssessmentPeers(assessmentId);

                if (cancelled) return;

                setAssessmentMetadata(assessment);
                setInquiries(assessmentInquiries);
                setResponders(peers.responders);
                setAllReceivers(peers.receivers);

                // Avoid selecting the same person as responder and recipient.
                if (peers.responders.length === 0) {
                    setActivePair(null);
                    setReceivers([]);
                    return;
                }

                const firstResponder = peers.responders[0];

                const availableReceivers = peers.receivers.filter(
                    (peer) => peer.id !== firstResponder.id
                );

                setReceivers(availableReceivers);

                if (availableReceivers.length === 0) {
                    setActivePair(null);
                    return;
                }

                setActivePair([
                    firstResponder,
                    availableReceivers[0],
                ]);

                // Retrieve all feedback for overseer review.
                const formResponses = await getAssessmentResponses(
                    assessmentId,
                    currentUser.id
                );

                if (cancelled) return;

                const responseMap: Record<
                    string,
                    Record<string, string>
                > = {};

                const statusMap: Record<string, ResponseStatus> = {};

                formResponses.forEach((formResponse) => {
                    const pairId =
                        `${formResponse.responderId}>${formResponse.respondeeId}`;

                    responseMap[pairId] = {};

                    formResponse.responses.forEach((answer) => {
                        responseMap[pairId][answer.inquiryId] =
                            answer.answer;
                    });

                    statusMap[pairId] = {
                        submittedAt: formResponse.submittedAt,
                        releasedAt: formResponse.releasedAt,
                    };
                });

                setResponses(responseMap);
                setResponseStatuses(statusMap);
            } catch (error) {
                if (cancelled) return;

                console.error("Failed to load assessment:", error);

                setLoadError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load assessment responses."
                );
            }
        };

        void loadAssessment();

        return () => {
            cancelled = true;
        };
    }, [assessmentId, currentUser]);

    const getActivePairId = () =>
        activePair
            ? `${activePair[0].id}>${activePair[1].id}`
            : "";

    const handleBack = () => {
        window.history.back();
    };

    const handleResponderSelect = (peerId: string) => {
        if (!activePair) return;

        const responder = responders.find(
            (peer) => peer.id === peerId
        );

        if (!responder) return;

        const receiver =
            activePair[1].id === responder.id
                ? allReceivers.find(
                      (peer) => peer.id !== responder.id
                  )
                : activePair[1];

        if (!receiver) return;

        setActivePair([responder, receiver]);

        setReceivers(
            allReceivers.filter(
                (peer) => peer.id !== responder.id
            )
        );

        setReleaseMessage("");
        setReleaseError("");
    };

    const handleReceiverSelect = (peerId: string) => {
        if (!activePair) return;

        const receiver = receivers.find(
            (peer) => peer.id === peerId
        );

        if (!receiver) return;

        setActivePair([activePair[0], receiver]);

        setReleaseMessage("");
        setReleaseError("");
    };

    // Release feedback only after it has been explicitly submitted.
    const handleRelease = async () => {
        if (!currentUser || !activePair) return;

        const pairId = getActivePairId();
        const status = responseStatuses[pairId];

        if (!status?.submittedAt || status.releasedAt) return;

        setIsReleasing(true);
        setReleaseMessage("");
        setReleaseError("");

        try {
            const result = await releaseAssessmentResponse(
                assessmentId,
                activePair[0].id,
                activePair[1].id,
                currentUser.id
            );

            setResponseStatuses((previous) => ({
                ...previous,
                [pairId]: {
                    submittedAt:
                        previous[pairId]?.submittedAt ??
                        status.submittedAt,
                    releasedAt:
                        result.releasedAt ??
                        new Date().toISOString(),
                },
            }));

            setReleaseMessage(
                "Feedback released successfully. The recipient can now view it."
            );
        } catch (error) {
            console.error("Failed to release feedback:", error);

            setReleaseError(
                error instanceof Error
                    ? error.message
                    : "Failed to release feedback. Please try again."
            );
        } finally {
            setIsReleasing(false);
        }
    };

    if (loadError) {
        return (
            <div className="max-w-xl mx-auto p-4 space-y-4">
                <BackArrow />

                <p role="alert" className="text-red-600">
                    {loadError}
                </p>

                <Button
                    variant="outlined"
                    onClick={handleBack}
                >
                    Go Back
                </Button>
            </div>
        );
    }

    if (!assessmentMetadata) {
        return <p className="p-4">Loading assessment...</p>;
    }

    if (!activePair) {
        return (
            <div className="max-w-xl mx-auto p-4 space-y-4">
                <BackArrow />

                <p>
                    No eligible responder and recipient pair is available
                    for this assessment.
                </p>
            </div>
        );
    }

    const activeStatus = responseStatuses[getActivePairId()];

    return (
        <>
            <form
                className="max-w-xl mx-auto p-4 space-y-8"
                onSubmit={(event) => event.preventDefault()}
            >
                <BackArrow />

                <div className="mb-6 flex justify-center items-baselinespace-x-2 h-16">
                    {/* Responder dropdown */}
                    <Select
                        value={activePair[0].id}
                        onChange={(event) =>
                            handleResponderSelect(
                                event.target.value as string
                            )
                        }
                        displayEmpty
                        sx={{
                            minWidth: 160,
                            mr: 2,
                            "& .MuiSelect-icon": {
                                color: (theme) =>
                                    theme.palette.mode === "dark"
                                        ? theme.ritColors.gray_1
                                        : theme.palette.grey[800],
                            },
                        }}
                        inputProps={{
                            "aria-label": "Responder",
                        }}
                    >
                        {responders.map((peer) => (
                            <MenuItem
                                key={peer.id}
                                value={peer.id}
                            >
                                {peer.name}
                            </MenuItem>
                        ))}
                    </Select>

                    <span className="text-lg font-semibold text-gray-600">
                        →
                    </span>

                    {/* Recipient dropdown */}
                    <Select
                        value={activePair[1].id}
                        onChange={(event) =>
                            handleReceiverSelect(
                                event.target.value as string
                            )
                        }
                        displayEmpty
                        sx={{
                            minWidth: 160,
                            mr: 2,
                            "& .MuiSelect-icon": {
                                color: (theme) =>
                                    theme.palette.mode === "dark"
                                        ? theme.ritColors.gray_1
                                        : theme.palette.grey[800],
                            },
                        }}
                        inputProps={{
                            "aria-label": "Recipient",
                        }}
                    >
                        {receivers.map((peer) => (
                            <MenuItem
                                key={peer.id}
                                value={peer.id}
                            >
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

                {/* Reusable read-only inquiry components */}
                {inquiries.map((inquiry) => (
                    <InquiryResponseField
                        key={inquiry.id}
                        inquiry={inquiry}
                        value={
                            responses[getActivePairId()]?.[inquiry.id] ?? ""
                        }
                        editable={false}
                    />
                ))}

                {/* Submission and release status */}
                <div className="space-y-3 border-t pt-4">
                    <h2 className="text-lg font-semibold">
                        Feedback Approval
                    </h2>

                    <p className="text-sm font-medium">
                        {!activeStatus?.submittedAt
                            ? "Draft — this feedback has not been submitted."
                            : activeStatus.releasedAt
                              ? "Released — the recipient can view thisfeedback."
                              : "Awaiting review — submitted and ready for approval."}
                    </p>

                    <Button
                        type="button"
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{
                            py: 1,
                            fontWeight: "bold",
                        }}
                        disabled={
                            !activeStatus?.submittedAt ||
                            !!activeStatus.releasedAt ||
                            isReleasing
                        }
                        onClick={handleRelease}
                    >
                        {isReleasing
                            ? "Releasing..."
                            : activeStatus?.releasedAt
                              ? "Feedback Released"
                              : activeStatus?.submittedAt
                                ? "Release Feedback to Recipient"
                                : "Awaiting Peer Submission"}
                    </Button>

                    {releaseMessage && (
                        <p
                            role="status"
                            className="text-sm text-green-700"
                        >
                            {releaseMessage}
                        </p>
                    )}

                    {releaseError && (
                        <p
                            role="alert"
                            className="text-sm text-red-600"
                        >
                            {releaseError}
                        </p>
                    )}
                </div>
            </form>
        </>
    );
};

export default FeedbackForm;
