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
import {
    Modal,
    Box,
    Button,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import BackArrow from "@/components/BackArrow";

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
                            <>
                                <span></span>
                                <span>
                                    Scale: {inquiry.scale}
                                    <br />
                                    Labels: {
                                        inquiry.labels.split(";")[0]
                                    } - {inquiry.labels.split(";")[1]}
                                </span>
                            </>
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
                                        {inquiry.options}
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
        <div>
            <Modal open={isOpen} onClose={onClose}>
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        bgcolor: "background.paper",
                        borderRadius: 2,
                        boxShadow: 24,
                        p: 4,
                        width: "100%",
                        maxWidth: 600,
                        maxHeight: "80vh",
                        overflowY: "auto",
                    }}
                >
                    <Button
                        onClick={onClose}
                        sx={{
                            position: "absolute",
                            top: 16,
                            right: 16,
                            minWidth: 0,
                            color: "grey.600",
                            fontSize: 24,
                        }}
                    >
                        ×
                    </Button>
                    <Typography variant="h5" fontWeight="bold" mb={3}>
                        Assessments
                    </Typography>
                    <div>
                        {assessments.map((form, idx) => (
                            <Accordion
                                key={form.id}
                                expanded={openIdx.includes(idx)}
                                onChange={() =>
                                    setOpenIdx(
                                        openIdx.includes(idx)
                                            ? openIdx.filter((i) => i !== idx)
                                            : [...openIdx, idx]
                                    )
                                }
                                sx={{ mb: 2 }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                >
                                    <Typography fontWeight="bold">
                                        {form.name}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    {form.inquiries.length === 0 && (
                                        <Typography
                                            color="text.secondary"
                                            fontStyle="italic"
                                        >
                                            No questions.
                                        </Typography>
                                    )}
                                    {form.inquiries.map((q, qIdx) => (
                                        <QuestionDisplay
                                            key={qIdx}
                                            inquiry={q}
                                        />
                                    ))}
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        sx={{ mt: 2 }}
                                        onClick={() => onFormSelect(form)}
                                    >
                                        Select This Form
                                    </Button>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </div>
                </Box>
            </Modal>
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
            <div className="rounded-lg shadow-lg p-6 w-full max-w-lg relative bg-white dark:bg-zinc-900">
                <Button
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        top: 16,
                        right: 24,
                        minWidth: 0,
                        color: "grey.600",
                        fontSize: 24,
                    }}
                >
                    ×
                </Button>
                <Typography variant="h5" fontWeight="bold" mb={3}>
                    Select Peers
                </Typography>
                <Box mb={4} display="flex" alignItems="center" gap={2}>
                    <Box display="flex" alignItems="center">
                        <input
                            type="checkbox"
                            checked={splitPeers}
                            onChange={(e) => setSplitPeers(e.target.checked)}
                            style={{ marginRight: 8 }}
                            id="split-peers-checkbox"
                        />
                        <label htmlFor="split-peers-checkbox">
                            Split into responders and receivers
                        </label>
                    </Box>
                </Box>
                <Box mb={4} display="flex" gap={2}>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleSelectAll}
                        type="button"
                    >
                        Select All
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleDeselectAll}
                        type="button"
                    >
                        Deselect All
                    </Button>
                </Box>
                {splitPeers ? (
                    <Box display="flex" gap={6}>
                        <Box flex={1}>
                            <Typography
                                variant="subtitle1"
                                fontWeight="bold"
                                mb={2}
                            >
                                Responders
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={2}>
                                {peers.map((peer) => (
                                    <Button
                                        key={peer.id}
                                        variant={
                                            responders.includes(peer)
                                                ? "contained"
                                                : "outlined"
                                        }
                                        color={
                                            responders.includes(peer)
                                                ? "primary"
                                                : "inherit"
                                        }
                                        onClick={() =>
                                            togglePeer(peer, "responders")
                                        }
                                        sx={{
                                            borderRadius: 2,
                                            minWidth: 0,
                                            px: 2,
                                            py: 1,
                                            textTransform: "none",
                                        }}
                                    >
                                        {peer.name}
                                    </Button>
                                ))}
                            </Box>
                        </Box>
                        <Box flex={1}>
                            <Typography
                                variant="subtitle1"
                                fontWeight="bold"
                                mb={2}
                            >
                                Receivers
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={2}>
                                {peers.map((peer) => (
                                    <Button
                                        key={peer.id}
                                        variant={
                                            receivers.includes(peer)
                                                ? "contained"
                                                : "outlined"
                                        }
                                        color={
                                            receivers.includes(peer)
                                                ? "primary"
                                                : "inherit"
                                        }
                                        onClick={() =>
                                            togglePeer(peer, "receivers")
                                        }
                                        sx={{
                                            borderRadius: 2,
                                            minWidth: 0,
                                            px: 2,
                                            py: 1,
                                            textTransform: "none",
                                        }}
                                    >
                                        {peer.name}
                                    </Button>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                ) : (
                    <Box>
                        <Typography
                            variant="subtitle1"
                            fontWeight="bold"
                            mb={2}
                        >
                            Peers
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={2}>
                            {peers.map((peer) => (
                                <Button
                                    key={peer.id}
                                    variant={
                                        selected.includes(peer)
                                            ? "contained"
                                            : "outlined"
                                    }
                                    color={
                                        selected.includes(peer)
                                            ? "primary"
                                            : "inherit"
                                    }
                                    onClick={() => togglePeer(peer, "all")}
                                    sx={{
                                        borderRadius: 2,
                                        minWidth: 0,
                                        px: 2,
                                        py: 1,
                                        textTransform: "none",
                                    }}
                                >
                                    {peer.name}
                                </Button>
                            ))}
                        </Box>
                    </Box>
                )}
                <Box mt={6} display="flex" justifyContent="flex-end">
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onClose}
                        type="button"
                    >
                        Done
                    </Button>
                </Box>
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

        // Re-fetch forms since we added a new one
        setForms(await getAllForms());

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
            <Box maxWidth="md" mx="auto" py={8} px={4}>
                <Button
                    sx={{ mb: 2 }}
                    color="primary"
                    variant="text"
                    startIcon={<span>&larr;</span>}
                    aria-label="Back"
                    onClick={() => router.back()}
                >
                    Back
                </Button>

                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    gap={4}
                >
                    <Typography variant="h4" fontWeight="bold" mb={2}>
                        Assign Assessment
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        sx={{ px: 4, py: 2 }}
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        Create New Assessment
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        size="large"
                        sx={{ px: 4, py: 2 }}
                        onClick={() => setIsReuseModalOpen(true)}
                    >
                        Use Pre-made Assessment
                    </Button>
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
                </Box>
            </Box>
        );

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <BackArrow />
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={6}
            >
                <Typography variant="h4" fontWeight="bold" mb={4}>
                    Assign Assessment
                </Typography>
                <Box display="flex" gap={8} width="100%" maxWidth="lg">
                    {/* Selected Feedback Form Preview */}
                    <Box
                        flex={1}
                        borderRadius={2}
                        p={4}
                        bgcolor="background.paper"
                        boxShadow={2}
                    >
                        <Typography variant="h6" fontWeight="bold" mb={3}>
                            Selected Feedback Form
                        </Typography>
                        {typeof selectedForm === "object" && selectedForm ? (
                            <>
                                {selectedForm.inquiries.length === 0 && (
                                    <Typography
                                        color="text.secondary"
                                        fontStyle="italic"
                                    >
                                        No questions.
                                    </Typography>
                                )}
                                {selectedForm.inquiries.map((q, idx) => (
                                    <QuestionDisplay key={idx} inquiry={q} />
                                ))}
                            </>
                        ) : (
                            <Typography
                                color="text.secondary"
                                fontStyle="italic"
                            >
                                No form selected.
                            </Typography>
                        )}
                    </Box>
                    {/* Assignment Details Form */}
                    <Box
                        component="form"
                        flex={1}
                        p={4}
                        bgcolor="background.paper"
                        display="flex"
                        flexDirection="column"
                        gap={2}
                        onSubmit={(e: React.FormEvent) => {
                            e.preventDefault();
                            handleAssign();
                        }}
                    >
                        <Typography variant="h6" fontWeight="bold" mb={3}>
                            Assignment Details
                        </Typography>
                        <Box mb={2}>
                            <Typography>Name</Typography>
                            <input
                                type="text"
                                required
                                className="border rounded px-2 py-1"
                                style={{ width: "100%", marginTop: 4 }}
                                defaultValue={
                                    typeof selectedForm === "object" &&
                                    selectedForm
                                        ? selectedForm.name
                                        : ""
                                }
                                onChange={(e) => setFormName(e.target.value)}
                            />
                        </Box>
                        <Box mb={2}>
                            <Typography>Description</Typography>
                            <input
                                type="text"
                                className="border rounded px-2 py-1"
                                style={{ width: "100%", marginTop: 4 }}
                                onChange={(e) => setFormDesc(e.target.value)}
                            />
                        </Box>
                        <Box mb={2}>
                            <Typography>Start Date</Typography>
                            <input
                                type="date"
                                required
                                className="border rounded px-2 py-1"
                                style={{ width: "100%", marginTop: 4 }}
                                defaultValue={today}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </Box>
                        <Box mb={2}>
                            <Typography>Due Date</Typography>
                            <input
                                type="date"
                                required
                                className="border rounded px-2 py-1"
                                style={{ width: "100%", marginTop: 4 }}
                                defaultValue={inAWeek}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </Box>
                        <Button
                            variant="contained"
                            color="secondary"
                            sx={{ mt: 2 }}
                            onClick={() => setIsPeerModalOpen(true)}
                            type="button"
                        >
                            Select Peers
                        </Button>
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
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            sx={{ mt: 2 }}
                        >
                            Assign Assessment
                        </Button>
                        {error && (
                            <Typography color="error" sx={{ mt: 1 }}>
                                {error}
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Box>
        </div>
    );
}
