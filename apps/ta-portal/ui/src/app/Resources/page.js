// src/app/Applications/Resources/page.js
"use client";

import React, { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

import {
    Box,
    Container,
    Typography,
} from "@mui/material";

import Link from "@mui/material/Link";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";

export default function ResourcesPage() {
    const LINKS = [
        {
            title: "RIT Student Employment Website",
            desc: "RIT's Student Employment Office supports students throughout their on‑campus job experience, from hiring to understanding payroll, timesheets, and employment policies. Learn about RIT's hiring policies on their website.",
            link: "https://www.rit.edu/careerservices/students/on-campus-employment"
        },
        {
            title: "Training Website",
            desc: "Access information about the mandatory trainings all Teachers Assistants have to complete through RIT's training website. ",
            link: "https://www.rit.edu/fa/compliance/training-and-education"
        },
        {
            title: "Title IX",
            desc: "RIT's Title IX Office is a neutral entity, dedicated to maintaining a safe and inclusive environment that is free from harassment and discrimination against any member of the RIT Community on the basis of their sex or gender.",
            link: "https://www.rit.edu/fa/compliance/title-ix-home"
        }, 
        {
            title: "Employee Rights",
            desc: "Learn about your rights as an worker.",
            link: "https://www.justice.gov/crt/immigrant-and-employee-rights-section"
        },
    ];


    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ textAlign: "center", mb: 4 }}>
                <Typography variant="h1" component="h1" gutterBottom>
                    Resources
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {LINKS.map((info, index) => (
                        <Box key={index} sx={{ display: "flex", justifyContent: "flex-start", flexDirection: "column" }}>
                            <Typography fontWeight="fontWeightBold" align="left" color="var(--color-rit-orange)" variant="h2" component="h2">{info.title}</Typography>
                            <Typography variant="body2" align="left">{info.desc}</Typography>
                            <Link align="left"
                                href={info.link}
                                underline="none"
                                color="text.primary"
                                sx={{
                                    outline: "none",
                                    gap: "0.25rem",
                                    textDecoration: "none",
                                    "&:hover": {
                                        textDecoration: "underline",
                                        textDecorationColor: "var(--color-rit-orange)",
                                        textDecorationThickness: "0.125rem",
                                        textUnderlineOffset: "0.125rem",
                                    },
                                }}
                            >
                                {info.link}
                                <KeyboardArrowRightIcon sx={{color:"var(--color-rit-orange)"}}/>
                            </Link>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Container>
    );
}