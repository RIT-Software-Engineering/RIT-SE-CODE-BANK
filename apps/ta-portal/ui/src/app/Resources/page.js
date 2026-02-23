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
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

export default function ResourcesPage() {
    const LINKS = [
        {
            title: "RIT Student Employment Website",
            desc: "sefh lsghe flawuehf ialwehfliawehf liaweuhf liuefhl iauweh raiwuefh liahewfliuaewhflkaedloawehflriauwehrliuawrkjawn ekfresf jf aslfi agwefljs jldf sjef alsue",
            link: "https://www.rit.edu/careerservices/students/on-campus-employment"
        },
        {
            title: "Training Website",
            desc: "",
            link: "https://www.rit.edu/fa/compliance/training-and-education"
        },
        {
            title: "Employee Rights",
            desc: "",
            link: ""
        },
        {
            title: "Title IX",
            desc: "",
            link: "https://www.rit.edu/fa/compliance/title-ix-home"
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
                                    outline: 'none',
                                    gap: '0.25rem',
                                    textDecoration: 'none',
                                    '&:hover': {
                                        textDecoration: 'underline',
                                        textDecorationColor: 'var(--color-rit-orange)',
                                        textDecorationThickness: '0.125rem',
                                        textUnderlineOffset: '0.125rem',
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