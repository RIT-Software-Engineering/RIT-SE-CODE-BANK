
"use client";

import { useAuth } from "@/context/AuthContext";
import {
    getAssessmentById,
    getAssessmentInquiriesById,
    getAssessmentPeers,
    getReceivedAssessmentResponses,
} from "@/services/assessment";
import { getProjectsPeers as getProjectPeers } from "@/services/project";

import {
    InquiryResponseField,
    type UserProfile,
    type Assessment,
    type Inquiry,
} from "@rit/peereval-components";

import React, { useEffect, useState } from "react";
import BackArrow from "@/components/BackArrow";
import { Tabs, Tab, Button } from "@mui/material";
import { useParams } from "next/navigation";

// --- Main Component ---

const FeedbackForm: React.FC = () => {
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

    const { projectId, assessmentId } = useParams<{
        projectId: string;
        assessmentId: string;
    }>();

    // Load assessment information, inquiries, and responders.
    useEffect(() => {
        if (!currentUser) return;

        (async () => {
            // Get assessment metadata.
            const a = await getAssessmentById(assessmentId);
            setAssessmentMetadata(a);

            // Get assessment inquiries.
            const inqs = await getAssessmentInquiriesById(assessmentId);
            setInquiries(inqs);

            // Get the responders.
            const ps = await getAssessmentPeers(assessmentId);

            // Exclude the current user and anonymize peer names.
            const rs = ps.responders
                .filter((r) => r.id !== currentUser.id)
                .map((u, i) => ({
                    ...u,
                    name: `P${i + 1}`,
                }));

            setPeers(rs);
            setActivePeer(rs[0]);
        })();
    }, [currentUser]);

    // Load received feedback for the selected peer.
    useEffect(() => {
        if (!currentUser || !activePeer) return;

        (async () => {
            const rs = await getReceivedAssessmentResponses(
                assessmentId,
                currentUser.id,
                currentUser.id
            );

            // Retrieve all peers' responses for this recipient.
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

    // Switch between anonymous peer tabs.
    const handleSwitchTab = (idx: number) => {
        setActiveTab(idx);
        setActivePeer(peers[idx]);
    };

    const handleBack = () => {
        window.history.back();
    };

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
                <BackArrow />

                {/* Anonymous peer selection tabs. */}
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
                            {peers.map(({ id, name }) => (
                                <Tab key={id} label={name} />
                            ))}
                        </Tabs>
                    </div>
                </div>

                {/* Assessment title and anonymous peer. */}
                <p className="text-xl">
                    {assessmentMetadata.name} —{" "}
                    <span className="font-semibold">
                        {activePeer.name}
                    </span>
                </p>

                {/* Reusable read-only inquiry components. */}
                {inquiries.map((inquiry) => (
                    <InquiryResponseField
                        key={inquiry.id}
                        inquiry={inquiry}
                        value={
                            responses[activePeer.id]?.[inquiry.id] ?? ""
                        }
                        editable={false}
                    />
                ))}

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
