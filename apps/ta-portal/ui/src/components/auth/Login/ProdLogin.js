// src/components/auth/Login/ProdLogin.js
"use client";

import { authenticateUser, resetPassword } from "@/services/db-apis";
import { useNotification } from "@/contexts/NotificationContext";
import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  CircularProgress,
  Link as MuiLink,
} from "@mui/material";

/**
 * A component for a production username/password login system.
 * @param {object} props - The component props.
 * @param {function} props.onLoginSuccess - Callback for a successful login.
 * @param {function} props.onSwitchToSignUp - Callback to switch to the sign-up view.
 */
export default function ProdLogin({
  onLoginSuccess = () => {},
  onSwitchToSignUp = () => {},
}) {
  const { showNotification } = useNotification();

  const [view, setView] = useState("login");
  const [loginCredentials, setLoginCredentials] = useState({
    username: "",
    password: "",
  });
  const [resetCredentials, setResetCredentials] = useState({
    username: "",
    newPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetCredentials((prev) => ({ ...prev, [name]: value }));
  };

  // Handle sign-in
  const handleSignIn = async () => {
    const { username, password } = loginCredentials;
    if (!username || !password) {
      showNotification("Please enter both username and password.", "error");
      return;
    }
    setIsLoading(true);
    try {
      const user = await authenticateUser(username, password);
      onLoginSuccess(user, "login");
    } catch (err) {
      console.error("Login failed:", err);
      showNotification(err.message || "Invalid username or password.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    const { username, newPassword } = resetCredentials;
    if (!username || !newPassword) {
      showNotification(
        "Please provide a username and a new password.",
        "error"
      );
      return;
    }
    setIsLoading(true);
    try {
      const response = await resetPassword(username, newPassword);
      showNotification(response.message, "success");
      setView("login");
    } catch (err) {
      console.error("Password reset failed:", err);
      showNotification(
        err.message || "An error occurred during password reset.",
        "error"
      );
    } finally {
      setResetCredentials({ username: "", newPassword: "" });
      setIsLoading(false);
    }
  };

  // Render the login view
  const renderLoginView = () => (
    <>
      <TextField
        label="Username"
        name="username"
        value={loginCredentials.username}
        onChange={handleLoginChange}
        margin="normal"
        fullWidth
        placeholder="Enter username (e.g., xyz1234)"
        inputProps={{ maxLength: 7 }}
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        value={loginCredentials.password}
        onChange={handleLoginChange}
        margin="normal"
        fullWidth
        placeholder="Enter password"
      />
      <Button
        onClick={handleSignIn}
        disabled={isLoading}
        variant="contained"
        color="secondary"
        size="large"
        sx={{ mt: 3, mb: 2, width: "60%" }}
      >
        {isLoading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          "Sign In"
        )}
      </Button>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 1 }}>
        <MuiLink
          component="button"
          variant="body2"
          onClick={() => setView("forgot")}
          sx={{ mb: 1 }}
        >
          Forgot Password?
        </MuiLink>
        <MuiLink
          component="button"
          variant="body2"
          onClick={onSwitchToSignUp}
        >
          Don&apos;t have an account? Sign Up
        </MuiLink>
      </Box>
    </>
  );

  // Render the forgot password view
  const renderForgotView = () => (
    <>
      <TextField
        label="Your Username"
        name="username"
        value={resetCredentials.username}
        onChange={handleResetChange}
        margin="normal"
        fullWidth
        placeholder="Enter username (e.g., xyz1234)"
        inputProps={{ maxLength: 7 }}
      />
      <TextField
        label="New Password"
        name="newPassword"
        type="password"
        value={resetCredentials.newPassword}
        onChange={handleResetChange}
        margin="normal"
        fullWidth
        placeholder="Enter new password"
      />
      <Button
        onClick={handleResetPassword}
        disabled={isLoading}
        variant="contained"
        color="primary"
        size="large"
        sx={{ mt: 3, mb: 2, width: "80%" }}
      >
        {isLoading ? "Resetting..." : "Reset Password"}
      </Button>
      <MuiLink
        component="button"
        variant="body2"
        onClick={() => setView("login")}
      >
        Back to Login
      </MuiLink>
    </>
  );

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
          backgroundColor: "background.paper",
        }}
      >
        <Typography variant="h2" component="h1" textAlign="center">
          Welcome to the RIT Teaching Assistant Portal
        </Typography>
        <Typography variant="h3" textAlign="center" sx={{ mt: 2, mb: 3 }}>
          {view === "login"
            ? "Sign in with your RIT Account"
            : "Reset Your Password"}
        </Typography>
        {view === "login" ? renderLoginView() : renderForgotView()}
      </Paper>
    </Container>
  );
}