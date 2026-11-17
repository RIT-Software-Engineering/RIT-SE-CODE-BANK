"use client";

import {
    Card,
    CardActionArea,
    CardContent,
    Stack,
    Typography,
} from "@mui/material";

import type { Assessment } from "../types/assessment";

export type AssessmentSectionProps = {
    title: string;
    assessments: Assessment[];
    onAssessmentSelect: (assessmentId: string) => void;
    emptyMessage?: string;
};

export default function AssessmentSection({
    title,
    assessments,
    onAssessmentSelect,
    emptyMessage = "No assessments.",
}: AssessmentSectionProps) {
    return (
        <section className="mb-8">
            <Typography variant="h6" component="h2" gutterBottom>
                {title}
            </Typography>

            <Stack spacing={2}>
                {assessments.length === 0 && (
                    <Typography color="textPrimary">
                        {emptyMessage}
                    </Typography>
                )}

                {assessments.map((assessment) => (
                    <Card key={assessment.id} variant="outlined">
                        <CardActionArea
                            onClick={() =>
                                onAssessmentSelect(assessment.id)
                            }
                        >
                            <CardContent>
                                <Typography
                                    variant="subtitle1"
                                    color="textPrimary"
                                    fontWeight={500}
                                >
                                    {assessment.name}
                                </Typography>

                                <Typography
                                    variant="caption"
                                    color="textPrimary"
                                >
                                    {new Date(
                                        assessment.startDate
                                    ).toLocaleDateString()}
                                    {" – "}
                                    {new Date(
                                        assessment.dueDate
                                    ).toLocaleDateString()}
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                ))}
            </Stack>
        </section>
    );
}