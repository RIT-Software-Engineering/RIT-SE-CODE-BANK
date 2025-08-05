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
import { Inquiry, InquiryType } from "@/types/assessment";

const inquiryTypeOptions = [
    { label: "Free Response", value: InquiryType.FREE_RESPONSE },
    { label: "Rating", value: InquiryType.RATING },
    { label: "Rubric", value: InquiryType.RUBRIC },
];

type CreateAssessmentModalProps = {
    visible: boolean;
    onCancel: () => void;
    onCreate: (assessment: { title: string; inquiries: Inquiry[] }) => void;
};

const CreateAssessmentModal: React.FC<CreateAssessmentModalProps> = ({
    visible,
    onCancel,
    onCreate,
}) => {
    const [title, setTitle] = useState("");
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);

    const handleAddInquiry = () => {
        setInquiries((prev) => [
            ...prev,
            {
                id: "",
                question: "How are you today?",
                type: InquiryType.FREE_RESPONSE,
            },
        ]);
    };

    const handleInquiryChange = (index: number, field: string, value: any) => {
        const updated = inquiries.map((inq, i) =>
            i === index ? { ...inq, [field]: value } : inq
        );
        setInquiries(updated);
    };

    const handleRemoveInquiry = (index: number) => {
        setInquiries(inquiries.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!title.trim() || inquiries.length === 0) return;
        onCreate({ title, inquiries });
        setTitle("");
        setInquiries([]);
    };

    return (
        <Dialog open={visible} onClose={onCancel} fullWidth maxWidth="sm">
            <DialogTitle>Create Assessment</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <TextField
                        label="Assessment Title"
                        required
                        fullWidth
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter assessment title"
                    />
                    <Box>
                        <Stack spacing={2}>
                            {inquiries.map((inq, idx) => (
                                <Stack
                                    direction="row"
                                    spacing={2}
                                    alignItems="flex-start"
                                    key={idx}
                                >
                                    <TextField
                                        label="Inquiry question"
                                        value={inq.question}
                                        onChange={(e) =>
                                            handleInquiryChange(
                                                idx,
                                                "question",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Inquiry question"
                                        sx={{ width: 220 }}
                                    />
                                    <FormControl sx={{ width: 140 }}>
                                        <InputLabel id={`type-label-${idx}`}>
                                            Type
                                        </InputLabel>
                                        <Select
                                            labelId={`type-label-${idx}`}
                                            value={inq.type}
                                            label="Type"
                                            onChange={(e) =>
                                                handleInquiryChange(
                                                    idx,
                                                    "type",
                                                    e.target.value
                                                )
                                            }
                                        >
                                            {inquiryTypeOptions.map((opt) => (
                                                <MenuItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <IconButton
                                        color="error"
                                        onClick={() => handleRemoveInquiry(idx)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                    {/* RATING extra fields */}
                                    {inq.type === InquiryType.RATING && (
                                        <Stack
                                            spacing={1}
                                            sx={{ minWidth: 220 }}
                                        >
                                            <TextField
                                                label="Scale"
                                                type="number"
                                                inputProps={{ min: 2, max: 10 }}
                                                value={inq.scale ?? 5}
                                                onChange={(e) =>
                                                    handleInquiryChange(
                                                        idx,
                                                        "scale",
                                                        Math.max(
                                                            2,
                                                            Math.min(
                                                                10,
                                                                Number(
                                                                    e.target
                                                                        .value
                                                                )
                                                            )
                                                        )
                                                    )
                                                }
                                                sx={{ width: 80 }}
                                            />
                                            <Stack direction="row" spacing={1}>
                                                <TextField
                                                    label="Left Label"
                                                    value={
                                                        inq?.labels?.split(
                                                            ";"
                                                        )[0] ?? ""
                                                    }
                                                    onChange={(e) =>
                                                        handleInquiryChange(
                                                            idx,
                                                            "labels",
                                                            `${
                                                                e.target.value
                                                            };${
                                                                inq?.labels?.split(
                                                                    ";"
                                                                )[1] ?? ""
                                                            }`
                                                        )
                                                    }
                                                    sx={{ width: 90 }}
                                                />
                                                <TextField
                                                    label="Right Label"
                                                    value={
                                                        inq?.labels?.split(
                                                            ";"
                                                        )[1] ?? ""
                                                    }
                                                    onChange={(e) =>
                                                        handleInquiryChange(
                                                            idx,
                                                            "labels",
                                                            `${
                                                                inq.labels?.split(
                                                                    ";"
                                                                )[0]
                                                            };${e.target.value}`
                                                        )
                                                    }
                                                    sx={{ width: 90 }}
                                                />
                                            </Stack>
                                        </Stack>
                                    )}
                                    {/* RUBRIC extra fields */}
                                    {inq.type === InquiryType.RUBRIC && (
                                        <Stack
                                            spacing={1}
                                            sx={{ minWidth: 320 }}
                                        >
                                            {(inq.rows ?? []).map(
                                                (row: any, rIdx: number) => (
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        key={rIdx}
                                                        alignItems="center"
                                                    >
                                                        <TextField
                                                            label="Row Label"
                                                            value={row.label}
                                                            onChange={(e) => {
                                                                const newRows =
                                                                    [
                                                                        ...(inq.rows ??
                                                                            []),
                                                                    ];
                                                                newRows[rIdx] =
                                                                    {
                                                                        ...row,
                                                                        label: e
                                                                            .target
                                                                            .value,
                                                                    };
                                                                handleInquiryChange(
                                                                    idx,
                                                                    "rows",
                                                                    newRows
                                                                );
                                                            }}
                                                            sx={{ width: 120 }}
                                                        />
                                                        <TextField
                                                            label="Options (; separated)"
                                                            value={row.options}
                                                            onChange={(e) => {
                                                                const newRows =
                                                                    [
                                                                        ...(inq.rows ??
                                                                            []),
                                                                    ];
                                                                newRows[rIdx] =
                                                                    {
                                                                        ...row,
                                                                        options:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    };
                                                                handleInquiryChange(
                                                                    idx,
                                                                    "rows",
                                                                    newRows
                                                                );
                                                            }}
                                                            sx={{ width: 160 }}
                                                        />
                                                        <IconButton
                                                            color="error"
                                                            onClick={() => {
                                                                const newRows =
                                                                    [
                                                                        ...(inq.rows ??
                                                                            []),
                                                                    ];
                                                                newRows.splice(
                                                                    rIdx,
                                                                    1
                                                                );
                                                                handleInquiryChange(
                                                                    idx,
                                                                    "rows",
                                                                    newRows
                                                                );
                                                            }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Stack>
                                                )
                                            )}
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => {
                                                    const newRows = [
                                                        ...(inq.rows ?? []),
                                                        {
                                                            label: "",
                                                            options: [],
                                                        },
                                                    ];
                                                    handleInquiryChange(
                                                        idx,
                                                        "rows",
                                                        newRows
                                                    );
                                                }}
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
                <Button onClick={onCancel}>Cancel</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={!title.trim() || inquiries.length === 0}
                >
                    Create
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateAssessmentModal;
