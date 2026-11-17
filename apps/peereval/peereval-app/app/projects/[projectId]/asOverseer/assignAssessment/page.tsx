"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
    InquiryResponseField,
    CreateAssessmentModal,
    PeerSelectModal,
    InquiryType,
    ReuseAssessmentModal,
} from "@rit/peereval-components";

import type {
    FeedbackForm,
    UserProfile,
    Inquiry,
} from "@rit/peereval-components";

import { createForm, getAllForms } from "@/services/form";

import {
    assignAssessmentToProject,
    getProjectsPeers,
} from "@/services/project";

import {
    Box,
    Button,
    Typography,
} from "@mui/material";

import BackArrow from "@/components/BackArrow";

export default function AssignAssessmentPage() {
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

    const { projectId } = useParams<{ projectId: string }>();

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
                                {selectedForm.inquiries.map((q) => (
                                    <InquiryResponseField
                                        key={q.id}
                                        inquiry={q}
                                        value=""
                                        editable={false}
                                    />
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
