
"use client";

import { useAuth } from "@/context/AuthContext";
import {
    getAssessmentById,
    getAssessmentInquiriesById,
    getAssessmentPeerResponses,
    getAssessmentPeers,
    sendAssessmentResponses,
} from "@/services/assessment";

import {
    InquiryResponseField,
    type Assessment,
    type Inquiry,
    type UserProfile,
} from "@rit/peereval-components";

import React, { useEffect, useState } from "react";

import {
    Button,
    IconButton,
    Snackbar,
    SnackbarCloseReason,
    Tab,
    Tabs,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import BackArrow from "@/components/BackArrow";
import { useParams } from "next/navigation";

// --- Main Component ---

const FeedbackForm: React.FC = () => {
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

    const { projectId, assessmentId } = useParams<{
        projectId: string;
        assessmentId: string;
    }>();

    // Load assessment information, inquiries, and available peers.
    useEffect(() => {
        if (!currentUser) return;

        (async () => {
            // Get assessment metadata.
            const a = await getAssessmentById(assessmentId);
            setAssessmentMetadata(a);

            // Determine whether the assessment is currently editable.
            setEditable(new Date() >= new Date(a.startDate));

            // Get assessment inquiries.
            const inqs = await getAssessmentInquiriesById(assessmentId);
            setInquiries(inqs);

            // Get the receivers.
            const ps = await getAssessmentPeers(assessmentId);
            const rs = ps.receivers.filter(
                (r) => r.id !== currentUser.id
            );

            setPeersToEval(rs);
            setActivePeer(rs[0]);
        })();
    }, [currentUser]);

    // Load saved responses for the currently selected peer.
    useEffect(() => {
        if (!currentUser || !activePeer) return;

        (async () => {
            const rs = await getAssessmentPeerResponses(
                assessmentId,
                currentUser.id
            );

            // Only display responses for the currently selected peer.
            const peerRs = rs.find(
                (r) => r.respondeeId === activePeer.id
            );

            if (!peerRs) {
                setResponses({});
            } else {
                setResponses(
                    peerRs.responses.reduce((acc, r) => {
                        acc[r.inquiryId] = r.answer;
                        return acc;
                    }, {} as Record<string, string>)
                );
            }
        })();
    }, [activePeer]);

    // Save the current responses before switching peers.
    const handleSwitchTab = (idx: number) => {
        void submitForm().catch((err) => {
            console.error(
                "Failed to save assessment responses:",
                err
            );
        });

        setActiveTab(idx);
        setActivePeer(peersToEval[idx]);
    };

    // Handle final assessment submission.
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await submitForm(true);
            setShowSnack(true);
        } catch (err) {
            console.error(
                "Failed to save assessment responses:",
                err
            );
        }
    };

    // Submit or save responses for the active peer.
    const submitForm = (submitted = false) => {
        return sendAssessmentResponses(
            assessmentId,
            currentUser!.id,
            activePeer!.id,
            responses,
            submitted
        );
    };

    // Save responses before returning to the previous page.
    const handleBack = () => {
        void submitForm().catch((err) => {
            console.error(
                "Failed to save assessment responses:",
                err
            );
        });

        window.history.back();
    };

    // Handle closing the submission notification.
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

    // Loading state.
    if (!activePeer && !assessmentMetadata) {
        return <p>Loading...</p>;
    }

    // Assessment loading error fallback.
    if (!assessmentMetadata) {
        return <p>Man something happened idk</p>;
    }

    // No available peers to evaluate.
    if (!activePeer) {
        return <p>You are alone in this project :(</p>;
    }

    return (
        <>
            <form
                onSubmit={handleSubmit}
                className="max-w-xl mx-auto p-4 space-y-8"
            >
                <BackArrow />

                {/* Peer selection tabs. */}
                <div className="flex justify-center mb-6">
                    <div>
                        <Tabs
                            value={activeTab}
                            onChange={(_, idx) => handleSwitchTab(idx)}
                            indicatorColor="primary"
                            textColor="inherit"
                            variant="scrollable"
                            scrollButtons="auto"
                            aria-label="Peer Tabs"
                        >
                            {peersToEval.map(({ id, name }) => (
                                <Tab key={id} label={name} />
                            ))}
                        </Tabs>
                    </div>
                </div>

                {/* Assessment title and selected peer. */}
                <p className="text-xl">
                    {assessmentMetadata.name} —{" "}
                    <span className="font-semibold">
                        {activePeer.name}
                    </span>
                </p>

                {/* Reusable inquiry components. */}
                {inquiries.map((inquiry) => (
                    <InquiryResponseField
                        key={inquiry.id}
                        inquiry={inquiry}
                        value={responses[inquiry.id] ?? ""}
                        onChange={(value) =>
                            setResponses((prev) => ({
                                ...prev,
                                [inquiry.id]: value,
                            }))
                        }
                        editable={editable}
                    />
                ))}

                {/* Submission controls. */}
                {editable ? (
                    <>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{ py: 1, fontWeight: "bold" }}
                        >
                            Submit
                        </Button>

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
                        {new Date() <
                        new Date(assessmentMetadata.startDate)
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
