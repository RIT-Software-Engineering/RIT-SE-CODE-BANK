"use client";

/**
 * CreateAssessmentModal
 * 
 * A reusable modal for creating an assessment and configuring its
 * feedback questions.
 * 
 * Supports Free Response, Rating, and Rubric inquiry types, including
 * their associated configuration fields and validation.
 * 
 * Returns the assessment title and configured inquiries through the
 * onCreate callback. Backend persistence is handled by the parent.
 */
import React, { useState } from "react";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";

import {
    Inquiry,
    InquiryType,
    type RubricRow,
} from "../types/assessment";

type CreateAssessmentModalProps = {
    visible: boolean;
    onCancel: () => void;
    onCreate: (assessment: {
        title: string;
        inquiries: Inquiry[];
    }) => void;
};

const inquiryTypeOptions = [
    { label: "Free Response", value: InquiryType.FREE_RESPONSE },
    { label: "Rating", value: InquiryType.RATING },
    { label: "Rubric", value: InquiryType.RUBRIC },
];

const CreateAssessmentModal: React.FC<CreateAssessmentModalProps> = ({
    visible,
    onCancel,
    onCreate,
}) => {
    const [title, setTitle] = useState("");
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);

    const handleAddInquiry = () => {
        setInquiries((previous) => [
            ...previous,
            {
                id: "",
                question: "",
                type: InquiryType.FREE_RESPONSE,
            },
        ]);
    };

    const handleInquiryChange = (
        index: number,
        field: string,
        value: unknown
    ) => {
        setInquiries((previous) =>
            previous.map((inquiry, currentIndex) =>
                currentIndex === index
                    ? { ...inquiry, [field]: value } as Inquiry
                    : inquiry
            )
        );
    };

    const handleTypeChange = (
        index: number,
        nextType: InquiryType
    ) => {
        setInquiries((previous) =>
            previous.map((inquiry, currentIndex) => {
                if (currentIndex !== index) return inquiry;

                const common = {
                    id: inquiry.id,
                    question: inquiry.question,
                };

                switch (nextType) {
                    case InquiryType.FREE_RESPONSE:
                        return {
                            ...common,
                            type: InquiryType.FREE_RESPONSE,
                        };

                    case InquiryType.RATING:
                        return {
                            ...common,
                            type: InquiryType.RATING,
                            scale:
                                inquiry.type === InquiryType.RATING
                                    ? inquiry.scale
                                    : 5,
                            labels:
                                inquiry.type === InquiryType.RATING
                                    ? inquiry.labels
                                    : ";",
                        };

                    case InquiryType.RUBRIC:
                        return {
                            ...common,
                            type: InquiryType.RUBRIC,
                            options:
                                inquiry.type === InquiryType.RUBRIC
                                    ? inquiry.options
                                    : "",
                            rows:
                                inquiry.type === InquiryType.RUBRIC
                                    ? inquiry.rows
                                    : [],
                        };
                    default:
                        return inquiry;
                }
            })
        );
    };

    const handleRemoveInquiry = (index: number) => {
        setInquiries((previous) =>
            previous.filter((_, currentIndex) => currentIndex !== index)
        );
    };

    const handleSubmit = () => {
        if (!title.trim() || inquiries.length === 0) return;

        onCreate({ title, inquiries });

        setTitle("");
        setInquiries([]);
    };

    const isInquiryValid = (inquiry: Inquiry): boolean => {
        if (!inquiry.question.trim()) return false;

        if (inquiry.type === InquiryType.RATING) {
            const [left, right] = (inquiry.labels ?? "").split(";");

            return (
                Boolean(left?.trim()) &&
                Boolean(right?.trim()) &&
                inquiry.scale > 0
            );
        }

        if (inquiry.type === InquiryType.RUBRIC) {
            return (
                Boolean(inquiry.options?.trim()) &&
                Array.isArray(inquiry.rows) &&
                inquiry.rows.length > 0 &&
                inquiry.rows.every((row) => Boolean(row.label?.trim()))
            );
        }

        return true;
    };

    const updateRubricRow = (
        inquiryIndex: number,
        rowIndex: number,
        updatedRow: RubricRow
    ) => {
        const inquiry = inquiries[inquiryIndex];

        if (inquiry.type !== InquiryType.RUBRIC) return;

        const updatedRows = inquiry.rows.map((row, currentIndex) =>
            currentIndex === rowIndex ? updatedRow : row
        );

        handleInquiryChange(inquiryIndex, "rows", updatedRows);
    };

    const removeRubricRow = (
        inquiryIndex: number,
        rowIndex: number
    ) => {
        const inquiry = inquiries[inquiryIndex];

        if (inquiry.type !== InquiryType.RUBRIC) return;

        const updatedRows = inquiry.rows.filter(
            (_, currentIndex) => currentIndex !== rowIndex
        );

        handleInquiryChange(inquiryIndex, "rows", updatedRows);
    };

    const addRubricRow = (inquiryIndex: number) => {
        const inquiry = inquiries[inquiryIndex];

        if (inquiry.type !== InquiryType.RUBRIC) return;

        handleInquiryChange(inquiryIndex, "rows", [
            ...inquiry.rows,
            { label: "" },
        ]);
    };

    return (
        <Dialog
            open={visible}
            onClose={onCancel}
            fullWidth
            maxWidth="md"
        >
            <DialogTitle>Create Assessment</DialogTitle>

            <DialogContent>
                <Stack spacing={2}>
                    <TextField
                        label="Assessment Title"
                        required
                        fullWidth
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Enter assessment title"
                    />

                    <Box>
                        <Stack spacing={2}>
                            {inquiries.map((inquiry, index) => (
                                <Stack
                                    direction="row"
                                    spacing={2}
                                    alignItems="flex-start"
                                    key={index}
                                >
                                    <TextField
                                        label="Inquiry question"
                                        required
                                        value={inquiry.question}
                                        onChange={(event) =>
                                            handleInquiryChange(
                                                index,
                                                "question",
                                                event.target.value
                                            )
                                        }
                                        placeholder="Inquiry question"
                                        sx={{ width: 220 }}
                                    />

                                    <FormControl sx={{ width: 140 }}>
                                        <InputLabel id={`type-label-${index}`}>
                                            Type
                                        </InputLabel>

                                        <Select
                                            labelId={`type-label-${index}`}
                                            value={inquiry.type}
                                            label="Type"
                                            onChange={(event) =>
                                                handleTypeChange(
                                                    index,
                                                    event.target.value as InquiryType
                                                )
                                            }
                                        >
                                            {inquiryTypeOptions.map((option) => (
                                                <MenuItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <IconButton
                                        color="error"
                                        aria-label="Remove inquiry"
                                        onClick={() =>
                                            handleRemoveInquiry(index)
                                        }
                                    >
                                        <DeleteIcon />
                                    </IconButton>

                                    {/* Rating extra fields */}
                                    {inquiry.type === InquiryType.RATING && (
                                        <Stack
                                            spacing={1}
                                            sx={{ minWidth: 220 }}
                                        >
                                            <TextField
                                                label="Scale"
                                                type="number"
                                                inputProps={{
                                                    min: 2,
                                                    max: 10,
                                                }}
                                                value={inquiry.scale}
                                                onChange={(event) =>
                                                    handleInquiryChange(
                                                        index,
                                                        "scale",
                                                        Math.max(
                                                            2,
                                                            Math.min(
                                                                10,
                                                                Number(event.target.value)
                                                            )
                                                        )
                                                    )
                                                }
                                                sx={{ width: 80 }}
                                            />

                                            <Stack direction="row" spacing={1}>
                                                <TextField
                                                    label="Left Label"
                                                    required
                                                    value={
                                                        inquiry.labels.split(";")[0] ?? ""
                                                    }
                                                    onChange={(event) =>
                                                        handleInquiryChange(
                                                            index,
                                                            "labels",
                                                            `${event.target.value};${
                                                                inquiry.labels.split(";")[1] ?? ""
                                                            }`
                                                        )
                                                    }
                                                    sx={{ width: 90 }}
                                                />

                                                <TextField
                                                    label="Right Label"
                                                    required
                                                    value={
                                                        inquiry.labels.split(";")[1] ?? ""
                                                    }
                                                    onChange={(event) =>
                                                        handleInquiryChange(
                                                            index,
                                                            "labels",
                                                            `${
                                                                inquiry.labels.split(";")[0] ?? ""
                                                            };${event.target.value}`
                                                        )
                                                    }
                                                    sx={{ width: 90 }}
                                                />
                                            </Stack>
                                        </Stack>
                                    )}

                                    {/* Rubric extra fields */}
                                    {inquiry.type === InquiryType.RUBRIC && (
                                        <Stack
                                            spacing={1}
                                            sx={{ minWidth: 320 }}
                                        >
                                            <TextField
                                                label="Options (; separated)"
                                                required
                                                value={inquiry.options}
                                                onChange={(event) =>
                                                    handleInquiryChange(
                                                        index,
                                                        "options",
                                                        event.target.value
                                                    )
                                                }
                                                sx={{ width: 240 }}
                                            />

                                            {inquiry.rows.map((row, rowIndex) => (
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    key={rowIndex}
                                                    alignItems="center"
                                                >
                                                    <TextField
                                                        label="Row Label"
                                                        required
                                                        value={row.label}
                                                        onChange={(event) =>
                                                            updateRubricRow(
                                                                index,
                                                                rowIndex,
                                                                {
                                                                    ...row,
                                                                    label: event.target.value,
                                                                }
                                                            )
                                                        }
                                                        sx={{ width: 120 }}
                                                    />

                                                    <IconButton
                                                        color="error"
                                                        aria-label="Remove rubric row"
                                                        onClick={() =>
                                                            removeRubricRow(
                                                                index,
                                                                rowIndex
                                                            )
                                                        }
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            ))}

                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() =>
                                                    addRubricRow(index)
                                                }
                                            >
                                                Add Row
                                            </Button>
                                        </Stack>
                                    )}
                                </Stack>
                            ))}

                            <Button
                                variant="outlined"
                                onClick={handleAddInquiry}
                            >
                                Add Inquiry
                            </Button>
                        </Stack>
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onCancel}>
                    Cancel
                </Button>

                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={
                        !title.trim() ||
                        inquiries.length === 0 ||
                        inquiries.some((inquiry) => !isInquiryValid(inquiry))
                    }
                >
                    Create
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateAssessmentModal;
