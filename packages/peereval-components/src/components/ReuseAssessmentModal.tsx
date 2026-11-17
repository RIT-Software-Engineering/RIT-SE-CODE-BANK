"use client";

import { useState } from "react";

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

import InquiryResponseField from "./InquiryResponseField";

import type { FeedbackForm } from "../types/assessment";

export type ReuseAssessmentModalProps = {
    assessments: FeedbackForm[];
    isOpen: boolean;
    onClose: () => void;
    onFormSelect: (form: FeedbackForm) => void;
};

export default function ReuseAssessmentModal({
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

                                    {form.inquiries.map((inquiry) => (
                                        <InquiryResponseField
                                            key={inquiry.id}
                                            inquiry={inquiry}
                                            value=""
                                            editable={false}
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