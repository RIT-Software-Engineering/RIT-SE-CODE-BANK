// src/components/auth/Login/ShibbLogin.js
"use client";




import React, { useState, useEffect } from "react";
import {
    Button,
    Container,
    Paper,
    Typography,
    CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useNotification } from '@/contexts/NotificationContext';
import { getUser } from "../../../services/db-apis";

/**
 * A component for Shibboleth Login
 * @param {object} props - The component props.
 * @param {function} props.onLoginSuccess - Callback for a successful login.
 * @param {function} props.onSwitchToSignUp - Callback to switch to the sign-up view.
 * @param {object[]} props.allUsers - The list of all users.
 */
export default function ShibbLogin({
    onLoginSuccess = () => { },
    onSwitchToSignUp = () => { },
    allUsers = [],
}) {
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState(null);
    const [selectedUsername, setSelectedUsername] = useState("");
    const router = useRouter();
    const [user, setUser] = useState(null);
    const { showNotification } = useNotification();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Check SAML auth session
                const authRes = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/me`,
                    {
                        credentials: "include",
                    }
                );
                if (!authRes.ok) {
                    window.location.href = `$ {process.env.NEXT_PUBLIC_AUTH_URL}/login?returnTo=${encodeURIComponent(
                        "https://apps.se.rit.edu/ta-portal"
                    )}`;
                }
                const authData = await authRes.json();
                const authId = authData.user?.id;

                if (!authId) {
                    setError("No user ID received from authentication service");
                    return;
                }
                // Check if user exists in DB by ID
                const dbRes = await getUser(authId);
                if (dbRes.status === 404) {
                    showNotification('User not found in our database. Signing you up now', warning);
                    onSwitchToSignUp();
                    return;
                }

                if (!dbRes.ok) {
                    setError("Unable to fetch user data from database");
                    showNotification('Internal server error', error);
                    return;
                }

                const dbUser = await dbRes.json();

                // Set user + redirect
                setUser(dbUser);
                onLoginSuccess(dbUser, "login");
                console.log(`${user.role} signed in using Shibboleth.`);
            } catch (err) {
                console.error("Auth check error:", err);
                setError("An error occurred during authentication");
            }
        };
        checkAuth();
    },
        []);

    // Set a default user from the list when the component loads
    useEffect(() => {
        if (allUsers && allUsers.length > 0 && !selectedUsername) {
            setSelectedUsername(allUsers[0].username);
        }
    }, [allUsers, selectedUsername]);

    return (
        <Container
            maxWidth="sm"
            sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "calc(100vh - 200px)",
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    p: { xs: 3, md: 5 },
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%",
                    backgroundColor: "background.paper", // Adapts to theme
                }}
            >
                <Typography
                    variant="h2"
                    component="h1"
                    textAlign="center"
                    gutterBottom
                >
                    Welcome to the RIT Teaching Assistant Portal
                </Typography>
                <Typography variant="h3" textAlign="center" sx={{ mb: 4 }}>
                    Sign in with Shibboleth
                </Typography>

                {error && (
                    <Typography color="error" sx={{ mt: 2 }}>
                        {error}
                    </Typography>
                )}
            </Paper>
        </Container>
    );
}