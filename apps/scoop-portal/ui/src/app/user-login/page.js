"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Alert,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useUser } from "../utils/user-context/page";

export default function AuthPage() {
  const { setUser } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check SAML auth session
        const authRes = await fetch(
          `${process.env.NEXT_PUBLIC_AUTH_URL}/me`,
          {
            credentials: "include",
          }
        );

        if (!authRes.ok) {
          setLoading(false);
          return;
        }

        const authData = await authRes.json();
        const authId = authData.user?.id;

        if (!authId) {
          setError("No user ID received from authentication service");
          setLoading(false);
          return;
        }

        // Check if user exists in DB by ID
        const dbRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/${encodeURIComponent(
            authId
          )}`
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

        const dbUser = await dbRes.json();

        // Set user + redirect
        setUser(dbUser);
        router.push("/dashboard");
      } catch (err) {
        console.error("Auth check error:", err);
        setError("An error occurred during authentication");
        setLoading(false);
      }
    };

    checkAuth();
  }, [setUser, router]);

  const handleLogin = () => {
    setLoginLoading(true);
    window.location.href = `${
      process.env.NEXT_PUBLIC_AUTH_URL
    }/login?returnTo=${encodeURIComponent(
      "https://apps.se.rit.edu/scoop-portal/dashboard"
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
            Scoop Portal Login
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