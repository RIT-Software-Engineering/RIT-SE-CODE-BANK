"use client";

import {
    Card,
    CardActionArea,
    CardContent,
    Typography,
} from "@mui/material";

export type ProjectCardProps = {
    name: string;
    description: string;
    onClick: () => void;
};

export default function ProjectCard({
    name,
    description,
    onClick,
}: ProjectCardProps) {
    return (
        <Card
            variant="elevation"
            sx={{ height: "100%" }}
        >
            <CardActionArea
                onClick={onClick}
                focusRipple
                sx={{ height: "100%" }}
            >
                <CardContent>
                    <Typography
                        variant="h3"
                        sx={{ mb: 1.25 }}
                    >
                        {name}
                    </Typography>

                    <Typography variant="body2">
                        {description}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}