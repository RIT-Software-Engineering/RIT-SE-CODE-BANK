"use client"
import { useRouter } from "next/navigation"
import {Box, Container, Grid, IconButton, Typography, Paper} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import Header from "@components/Header"
import { useState, useEffect, useMemo } from "react"
import { useUser } from "../utils/user-context/page";

export default function Status() {

    const [interestForms, setInterestForms] = useState([]);
    // const [filteredInterestForms, setFilteredInterestForms] = useState([]);
    const { user } = useUser();
    const [interestFormStatus, setInterestFormStatus] = useState("");

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
      }, []);

    useEffect(() => {
        // filteredForms();
        // console.log(filteredInterestForms);
        getText();
    });

    // const filteredForms = async() => {
    //     const filtered = interestForms.filter((form) => {
        
    //     const matched = form.ritEmail?.toLowerCase().includes(user.ritEmail);
    //     if (!matched) return false;   
    //     return true;
    //     });
    //     setFilteredInterestForms(filtered);
    // .filter((form) => {form.ritEmail === user.ritEmail});
    //   };

    const getText = async () => {
        const filteredInterestForms = interestForms.filter((form) => form.ritEmail === user.email);
        const acceptedInterestForms = filteredInterestForms.filter((form) => form.status === "ACCEPTED");
        console.log(acceptedInterestForms);
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
                                    Not Submitted
                                    </Typography>
                                </Box>
                                <Typography
                                variant="body1"
                                sx={{
                                    color: (theme) => theme.palette.text.secondary,
                                    whiteSpace: "normal",
                                }}
                                >
                                Step Description
                                </Typography>
                      </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Container>
        </Box>
    )
}