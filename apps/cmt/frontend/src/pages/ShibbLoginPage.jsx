"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, AUTH_BASE } from "../utils/api.js";
import { getUserFromCookie } from "../utils/auth.js";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";

export default function ShibbLoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const cookieUser = getUserFromCookie();

        if (!cookieUser?.id) {
          window.location.href = `${AUTH_BASE}/login?returnTo=${encodeURIComponent(
            "https://apps.se.rit.edu/cmt/"
          )}`;
          return;
        }

        const dbRes = await fetch(
          `${API_BASE}/users/${encodeURIComponent(cookieUser.id)}`
        );

        if (dbRes.status === 404) {
          setError(
            "Your account is authenticated, but you don't have access to this application. " +
              "Please contact your administrator."
          );
          return;
        }

        if (!dbRes.ok) {
          setError("Unable to fetch user data from database");
          return;
        }

        navigate("/dashboard");
      } catch (err) {
        console.error("Auth check error:", err);
        setError("An error occurred during authentication");
      }
    };

    checkAuth();
  }, [navigate]);

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ backgroundColor: "#f5f5f5", padding: 2 }}
      >
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ backgroundColor: "#f5f5f5" }}
    >
      <CircularProgress size={40} />
      <Typography variant="body1" sx={{ mt: 2, color: "#000" }}>
        Redirecting to login...
      </Typography>
    </Box>
  );
}