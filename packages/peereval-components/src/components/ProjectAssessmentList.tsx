"use client";

import {
    Button,
    Card,
    CardActionArea,
    CardContent,
    Stack,
    Typography,
} from "@mui/material";

import type { Assessment } from "../types/assessment";

export type ProjectAssessmentListProps = {
    assessments: Assessment[];
    onAssessmentSelect: (assessmentId: string) => void;
    onAssign: () => void;
};

export default function ProjectAssessmentList({
    assessments,
    onAssessmentSelect,
    onAssign,
}: ProjectAssessmentListProps) {
    const sortedAssessments = [...assessments].sort(
        (a, b) =>
            new Date(a.startDate).getTime() -
            new Date(b.startDate).getTime()
    );

    return (
        <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">
                Project Assessments
            </h2>

            <Stack spacing={2}>
                {sortedAssessments.map((assessment) => (
                    <Card
                        key={assessment.id}
                        variant="outlined"
                        sx={{
                            cursor: "pointer",
                            "&:hover": { boxShadow: 3 },
                        }}
                    >
                        <CardActionArea
                            onClick={() =>
                                onAssessmentSelect(assessment.id)
                            }
                        >
                            <CardContent>
                                <Typography variant="h6">
                                    {assessment.name}
                                </Typography>

                                <Typography
                                    variant="body2"
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

                <hr />

                <Card
                    variant="outlined"
                    sx={{
                        borderStyle: "dashed",
                    }}
                >
                    <CardContent
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <div>
                            <Typography
                                variant="subtitle1"
                                color="textPrimary"
                            >
                                Assign New Assessment
                            </Typography>

                            <Typography
                                variant="body2"
                                color="textPrimary"
                            >
                                Create and assign a new assessment to
                                project peers.
                            </Typography>
                        </div>

                        <Button
                            variant="contained"
                            color="primary"
                            sx={{ ml: 2 }}
                            onClick={onAssign}
                        >
                            Assign
                        </Button>
                    </CardContent>
                </Card>
            </Stack>
        </section>
    );
}