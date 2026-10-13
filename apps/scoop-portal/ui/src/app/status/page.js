"use client"
import { useRouter } from "next/navigation"
import Link from "next/link";
import {Box, Container, Grid, IconButton, Typography, Paper, useTheme} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import Header from "@components/Header"
import { useState, useEffect, useMemo } from "react"
import { useUser } from "../utils/user-context/page";

export default function Status() {

    const [interestForms, setInterestForms] = useState([]);
    const [applications, setApplications] = useState([]);
    // const [filteredInterestForms, setFilteredInterestForms] = useState([]);
    const { user } = useUser();
    const [interestFormStatus, setInterestFormStatus] = useState("");
    const [applicationStatus, setApplicationStatus] = useState("");

    useEffect(() => {
        const fetchForms = async () => {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interestform`);
            const data = await res.json();
            setInterestForms(data);
          } catch (err) {
            console.error("Failed to fetch interest forms:", err);
          }
        };
        fetchForms();
        const fetchApps = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/application`);
                const data = await res.json();
                setApplications(data);
            } catch (err) {
                console.error("Failed to fetch applications:", err);
            }
        };
        fetchApps();
      }, []);

    useEffect(() => {
        getInterestFormStatus();
        getApplicationStatus();
    });

    const getInterestFormStatus = async () => {
        const filteredInterestForms = interestForms.filter((form) => form.ritEmail === user.email);
        const acceptedInterestForms = filteredInterestForms.filter((form) => form.status === "ACCEPTED");
        
        if (filteredInterestForms.length > 0) {

            if (acceptedInterestForms.length > 0) {
                setInterestFormStatus("Accepted");
            }

            else {
                setInterestFormStatus("Submitted");
            }
        }

        else {
            setInterestFormStatus("Not submitted");
        }
    }

    const getApplicationStatus = async () => {
        const filteredApplications = applications.filter((application) => application.ritEmail === user.email);
        const acceptedApplications = filteredApplications.filter((application) => application.status === "APPROVED");

        if (filteredApplications.length > 0) {

            if (acceptedApplications.length > 0) {
                setApplicationStatus("Approved");
            }

            else {
                setApplicationStatus("Submitted");
            }
        }

        else {
            setApplicationStatus("Not submitted");
        }
    }

    const NavButton = ({ href, children }) => {
        const theme = useTheme();
        const baseStyle = {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            borderRadius: 0,
            padding: "8px 24px",
            fontWeight: 600,
            minWidth: "100px",
            textAlign: "center",
            textDecoration: "none",
            cursor: "pointer",
            transition: "background-color 300ms cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "none",
        };

        const [hover, setHover] = useState(false);

        return (
            <Link
            href={href}
            role="button"
            style={{
                ...baseStyle,
                backgroundColor: hover ? "#000000" : theme.palette.primary.main,
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            >
            {children}
            </Link>
        );
    };

    const router = useRouter();
    return (
        <Box>
            <Header />
            <IconButton onClick={() => router.back()} aria-label="back">
                <ArrowBackIcon />
            </IconButton>
            <Container maxWidth="lg" sx={{ py: 4, maxWidth: "1280px" }}>
                <Typography
                    variant="h1"
                    sx={{
                    mb: 3,
                    color: (theme) => theme.palette.text.primary,
                    }}
                >
                    Status
                </Typography>
                <Grid container spacing={4} direction="column">
                    <Paper elevation={1} sx={{ p: 3, borderRadius: 0, border: (theme) => `1px solid ${theme.palette.divider}`, backgroundColor: (theme) => theme.palette.background.paper }}>
                        <Typography
                            variant="h2"
                            sx={{
                            fontWeight: 700,
                            mb: 3,
                            borderBottom: (theme) => `2px solid ${theme.palette.primary.main}`,
                            pb: 1,
                            maxWidth: "max-content",
                            }}
                        >
                        </Typography>
                        <Box 
                            key="Interest Form:"
                            sx={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                mb: 3,
                                flexWrap: "nowrap",
                            }}>
                            {/* <Box
                                sx={{
                                minWidth: 32,
                                minHeight: 32,
                                borderRadius: "50%",
                                bgcolor: (theme) => theme.palette.primary.main,
                                color: (theme) => theme.palette.common.white,
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mr: 2,
                                userSelect: "none",
                                fontSize: "1rem",
                                flexShrink: 0,
                                }}
                            >
                            </Box> */}

                            <Box
                                sx={{
                                flexGrow: 1,
                                minWidth: 0,
                                }}
                            >
                                <Box>
                                    <Typography
                                        variant="h3"
                                        sx={{
                                            mb: 0.5,
                                            fontWeight: 700,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                        title="Step title"
                                        >
                                        Interest form status:
                                    </Typography>
                                    <Typography
                                    variant="body1"
                                    sx={{
                                    color: (theme) => theme.palette.text.secondary,
                                    whiteSpace: "normal",
                                    }}>
                                    {interestFormStatus}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography
                                        variant="h3"
                                        sx={{
                                            mb: 0.5,
                                            fontWeight: 700,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                        title="Step title"
                                        >
                                        Application status:
                                    </Typography>
                                    <Typography
                                    variant="body1"
                                    sx={{
                                    color: (theme) => theme.palette.text.secondary,
                                    whiteSpace: "normal",
                                    }}>
                                    {applicationStatus}
                                    </Typography>
                                </Box>
                                <Typography
                                variant="body1"
                                sx={{
                                    color: (theme) => theme.palette.text.secondary,
                                    whiteSpace: "normal",
                                }}
                                >
                                Once you have submitted an interest form, an advisor will review it and accept or reject it.
                                Once an interest form has been accepted, you can submit an application to join the SCOOP Program.
                                </Typography>
                      </Box>
                        </Box>
                    </Paper>
                    <Box gap={2} sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", mb: 6 }}>
                        <NavButton href="/application">Apply Now</NavButton>
                        <NavButton href="/interest-form">Interest Form</NavButton>
                    </Box>
                </Grid>
                
            </Container>
        </Box>
    )
}