"use client";

/**
 * PeerEval Component Showcase
 * 
 * Demonstrates the reusable components exported by
 * @rit/peereval-components.
 * 
 * Uses local sample date and React state to demonstrate component
 * functionality without requiring the PeerEval backend, database,
 * authentication system, or notificiation service.
 * 
 * Organized into project, assessment, peer management. and 
 * navigation/layout component categories.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
    Alert,
    Box,
    Button,
    Divider,
    Paper,
    Stack,
    Typography,
} from "@mui/material";

import {
    AddPeerDialog,
    AppFooter,
    AssessmentSection,
    BackButton,
    CreateAssessmentModal,
    InquiryResponseField,
    InquiryType,
    PeerSelectModal,
    ProjectAssessmentList,
    ProjectCard,
    ProjectPeerList,
    ReuseAssessmentModal,
} from "@rit/peereval-components";

import type {
    Assessment,
    FeedbackForm,
    Inquiry,
    UserProfile,
} from "@rit/peereval-components";
import { Create } from "@mui/icons-material";

// Sample assessment data

const demoInquiries: Inquiry[] = [
    {
        id: "question-1",
        type: InquiryType.FREE_RESPONSE,
        question: "What did this team member do well?",
    },
    {
        id: "question-2",
        type: InquiryType.RATING,
        question: "How would you rate this person's collaboration?",
        scale: 5,
        labels: "Needs Improvement,Excellent",
    },
    {
        id: "question-3",
        type: InquiryType.RUBRIC,
        question: "Evaluate this person's technical contribution.",
        options: "Poor,Average,Good,Excellent",
        rows: [
            { label: "Technical Skills" },
            { label: "Problem Solving" },
            { label: "Communication" },
        ],
    },
];

const initialForms: FeedbackForm[] = [
    {
        id: "form-1",
        name: "Peer Evaluation Form",
        inquiries: demoInquiries,
    },
    {
        id: "form-2",
        name: "Team Collaboration Evaluation",
        inquiries: [
            {
                id: "question-4",
                type: InquiryType.FREE_RESPONSE,
                question: "Describe this peron's teamwork skills.",
            },
            {
                id: "question-5",
                type: InquiryType.RATING,
                question: "Rate their reliability.",
                scale: 5,
                labels: "Unreliable,Reliable",
            },
        ],
    }
];

const demoAssessments: Assessment[] = [
    {
        id: "assessment-1",
        projectId: "project-1",
        name: "Midterm Peer Evaluation",
        description: "Midterm team performance review.",
        startDate: "2026-11-01",
        dueDate: "2026-11-30",
        feedbackForm: initialForms[0],
    },
    {
        id: "assessment-2",
        projectId: "project-1",
        name: "Final Peer Evaluation",
        description: "End-of-semester feedback.",
        startDate: "2026-12-01",
        dueDate: "2026-12-15",
        feedbackForm: initialForms[1],
    },
];

// Sample peer data

const initialPeers: UserProfile[] = [
    {
        id: "user-1",
        name: "Nate Saunders",
        email: "nate@rit.edu",
    },
    {
        id: "user-2",
        name: "Owen Lowry",
        email: "owen@rit.edu",
    },
    {
        id: "user-3",
        name: "Isaac Bohn",
        email: "isaac@rit.edu",
    },
];

// Demo page

export default function PeerEvalDemoPage() {
    const router = useRouter();

    const [peers, setPeers] = useState<UserProfile[]>(initialPeers);
    const [selectedPeers, setSelectedPeers] = useState<UserProfile[]>([initialPeers[0]]);
    const [responders, setResponders] = useState<UserProfile[]>([initialPeers[0]]);
    const [receivers, setReceivers] = useState<UserProfile[]>([initialPeers[1]]);
    const [splitPeers, setSplitPeers] = useState(false);

    const [peerModalOpen, setPeerModalOpen] = useState(false);
    const [addPeerOpen, setAddPeerOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [reuseModalOpen, setReuseModalOpen] = useState(false);

    const [forms, setForms] = useState<FeedbackForm[]>(initialForms);
    const [selectedForm, setSelectedForm] = useState<FeedbackForm | undefined>(initialForms[0]);
    const [responses, setResponses] = useState<Record<string, string>>({
        "question-1":
            "Nate has been a great team member, always willing to help and contribute.",
            "question-2": "4",
            "question-3": JSON.stringify([2, 3, 2]),
    });

    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");

    const [status, setStatus] = useState("");

    // Peer actions

    const handleAddPeer = () => {
        const normalizedEmail = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setEmailError("Please enter a valid email address.");
            return;
        }

        if (peers.some((peer) => peer.email.toLowerCase() === normalizedEmail)) {
            setEmailError("This email is already in the peer list.");
            return;
        }

        const name = normalizedEmail
            .split("@")[0]
            .replace(/[._-]+/g, " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase());

        const newPeer: UserProfile = {
            id: `demo-${normalizedEmail}`,
            name,
            email: normalizedEmail,
        };

        setPeers((previous) => [...previous, newPeer]);
        setStatus(`Added ${name} to the demo peer list.`);
        closeAddPeer();
    }

    const handleRemovePeer = (peer: UserProfile) => {
        setPeers((previous) => previous.filter((item) => item.id !== peer.id));
        setSelectedPeers((previous) => previous.filter((item) => item.id !== peer.id));
        setResponders((previous) => previous.filter((item) => item.id !== peer.id));
        setReceivers((previous) => previous.filter((item) => item.id !== peer.id));
        setStatus(`Removed ${peer.name} from the demo peer list.`);
    };

    function closeAddPeer() {
        setAddPeerOpen(false);
        setEmail("");
        setEmailError("");
    }

    // Assessment actions

    const handleAssessmentCreated = (assessment: {
        title: string;
        inquiries: Inquiry[];
    }) => {
        const newForm: FeedbackForm = {
            id: `demo-form-${Date.now()}`,
            name: assessment.title,
            inquiries: assessment.inquiries,
        };

        setForms((previous) => [...previous, newForm]);
        setSelectedForm(newForm);
        setCreateModalOpen(false);
        setStatus(`Created "${assessment.title}" with ${assessment.inquiries.length} questions.`);
    };

    const handleFormSelected = (form: FeedbackForm) => {
        setSelectedForm(form);
        setReuseModalOpen(false);
        setStatus(`Selected form: ${form.name}`);
    };

    // Rendering

    return (
        <Box sx={{ minHeight: "100vh" }}>
            <Box
                sx={{
                    maxWidth: 1200,
                    mx: "auto",
                    px: { xs: 2, md: 4 },
                    py: 4,
                }}
            >
                {/* Header */}
                <Stack spacing={2} sx={{ mb: 5 }}>
                    <BackButton onClick={() => router.push("/")} />
                        <Typography variant="h3" fontWeight={700}>
                            PeerEval Components
                        </Typography>
                        <Typography color="text.secondary">
                            Reusable components extracted from the PeerEval application, demonstrated with sample data and interactive examples. These components are designed to be flexible and can be integrated into other applications or projects.
                        </Typography>
                </Stack>

                {status && (
                    <Alert
                        severity="success"
                        onClose={() => setStatus("")}
                        sx={{ mb: 4 }}
                    >
                        {status}
                    </Alert>
                )}
                <Stack spacing={5}>
                    {/* Project Components */}
                    <Box>
                        <Typography variant="h4" sx={{ mb: 1 }}>
                            Project Components
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            Project cards, assessment lists, and assessment navigation.
                        </Typography>
                        <Stack spacing={3}>
                            <Paper variant="outlined" sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    ProjectCard
                                </Typography>
                                <Box sx={{ maxWidth: 360 }}>
                                    <ProjectCard
                                        name="Software Engineering Project"
                                        description="A collaborative project demonstrating reusable PeerEval components."
                                        onClick={() => setStatus("ProjectCard clicked: Software Engineering Project")}
                                    />
                                </Box>
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    ProjectAssessmentList
                                </Typography>
                                <ProjectAssessmentList
                                    assessments={demoAssessments}
                                    onAssessmentSelect={(id) => setStatus(`Selected assessment: ${id}`)}
                                    onAssign={() => setCreateModalOpen(true)}
                                />
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    AssessmentSection
                                </Typography>
                                <AssessmentSection
                                    title="Upcoming Assessments"
                                    assessments={demoAssessments}
                                    onAssessmentSelect={(id) => setStatus(`Opened assessment: ${id}`)}
                                    emptyMessage="No upcoming assessments."
                                />
                            </Paper>
                        </Stack>
                    </Box>
                    <Divider />
                    {/* Assessment Components */}
                    <Box>
                        <Typography variant="h4" sx={{ mb: 1 }}>
                            Assessment Components
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            Inquiry rendering, response editing, and assessment creation and selection.
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                InquiryResponseField
                            </Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 2 }}
                            >
                                Try editing the responses below. All three inquiry types are represented: free response, rating, and rubric.
                            </Typography>
                            <Stack spacing={3}>
                                {demoInquiries.map((inquiry) => (
                                    <InquiryResponseField
                                        key={inquiry.id}
                                        inquiry={inquiry}
                                        value={responses[inquiry.id] ?? ""}
                                        editable
                                        onChange={(value) =>
                                            setResponses((previous) => ({
                                                ...previous,
                                                [inquiry.id]: value
                                            }))
                                        }
                                    />
                                ))}
                            </Stack>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Assessment Modals
                            </Typography>
                            <Stack 
                                direction={{ xs: "column", sm: "row" }}
                                spacing={2}
                            >
                                <Button
                                    variant="contained"
                                    onClick={() => setCreateModalOpen(true)}
                                >
                                    Create Assessment
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => setReuseModalOpen(true)}
                                >
                                    Reuse Assessment
                                </Button>
                            </Stack>
                            {selectedForm && (
                                <Alert severity="info" sx={{ mt: 3 }}>
                                    Currently selected form:{" "}
                                    {selectedForm.name}
                                </Alert>
                            )}
                        </Paper>
                    </Box>
                    <Divider />
                    {/* Peer Management Components */}
                    <Box>
                        <Typography variant="h4" sx={{ mb: 1 }}>
                            Peer Management Components
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            Peer lists, adding project members, and assigning responders and receivers.
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                ProjectPeerList
                            </Typography>
                            <ProjectPeerList
                                peers={peers}
                                onAddPeer={() => setAddPeerOpen(true)}
                                onRemovePeer={handleRemovePeer}
                            />
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                ProjectPeerList (Compact)
                            </Typography>
                            <ProjectPeerList
                                peers={peers}
                                variant="compact"
                                showTitle={false}
                            />
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                PeerSelectModal
                            </Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 2 }}
                            >
                                Selected peers: {selectedPeers.length} |{" "}
                                Responders: {responders.length} |{" "}
                                Receivers: {receivers.length}
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => setPeerModalOpen(true)}
                            >
                                Open Peer Selection
                            </Button>
                        </Paper>
                    </Box>
                    <Divider />
                    {/* Navigation and Layout */}
                    <Box>
                        <Typography variant="h4" sx={{ mb: 1 }}>
                            Navigation and Layout
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            Components providing shared navigation and page structure.
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                BackButton
                            </Typography>
                            <BackButton onClick={() => router.push("/")} />
                        </Paper>
                    </Box>
                </Stack>
            </Box>
            {/* Shared footer */}
            <AppFooter
                copyrightText="&copy; 2026 RIT Software Engineering - PeerEval Components Demo"
            />
            {/* Interactive modals */}
            <CreateAssessmentModal
                visible={createModalOpen}
                onCancel={() => setCreateModalOpen(false)}
                onCreate={handleAssessmentCreated}
            />
            <ReuseAssessmentModal
                assessments={forms}
                isOpen={reuseModalOpen}
                onClose={() => setReuseModalOpen(false)}
                onFormSelect={handleFormSelected}
            />
            <PeerSelectModal
                isOpen={peerModalOpen}
                onClose={() => setPeerModalOpen(false)}
                peers={peers}
                selected={selectedPeers}
                setSelected={setSelectedPeers}
                splitPeers={splitPeers}
                setSplitPeers={setSplitPeers}
                responders={responders}
                setResponders={setResponders}
                receivers={receivers}
                setReceivers={setReceivers}
            />
            <AddPeerDialog
                open={addPeerOpen}
                email={email}
                error={emailError}
                onEmailChange={setEmail}
                onClose={closeAddPeer}
                onSubmit={handleAddPeer}
            />
        </Box>
    );
}