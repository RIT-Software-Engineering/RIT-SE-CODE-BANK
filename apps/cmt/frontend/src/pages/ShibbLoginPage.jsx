"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, AUTH_BASE } from "../utils/api.js";
import { getUserFromCookie } from "../utils/auth.js";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Alert,
} from "@mui/material";

export default function ShibbLoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const cookieUser = getUserFromCookie();

        if (!cookieUser?.id) {
          setLoading(false);
          return;
        }

        // Check if user exists in DB
        const dbRes = await fetch(
          `${API_BASE}/users/${encodeURIComponent(cookieUser.id)}`
        );

        if (dbRes.status === 404) {
          setError(
            "Your account is authenticated, but you don't have access to this application. " +
              "Please contact your administrator."
          );
          setLoading(false);
          return;
        }

        if (!dbRes.ok) {
          setError("Unable to fetch user data from database");
          setLoading(false);
          return;
        }

        navigate("/dashboard");
      } catch (err) {
        console.error("Auth check error:", err);
        setError("An error occurred during authentication");
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogin = () => {
    setLoginLoading(true);
    window.location.href = `${AUTH_BASE}/login?returnTo=${encodeURIComponent(
      "https://apps.se.rit.edu/cmt/"
    )}`;
  };

  if (loading) {
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
          Checking authentication...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ backgroundColor: "#f5f5f5", padding: 2 }}
    >
      <Card sx={{ maxWidth: 400, width: "100%" }}>
        <CardContent sx={{ textAlign: "center", padding: 4 }}>
          <Typography variant="h5" gutterBottom>
            CMT Login
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Please sign in using your institutional credentials.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2, textAlign: "left" }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleLogin}
              disabled={loginLoading}
              sx={{ minWidth: 150 }}
            >
              {loginLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Login"
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}