// src/components/auth/Login/DevLogin.js
"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
  CircularProgress,
} from "@mui/material";
import { getUser } from "../../../services/db-apis";

/**
 * A component for the development login system using a dropdown.
 * @param {object} props - The component props.
 * @param {function} props.onLoginSuccess - Callback for a successful login.
 * @param {function} props.onSwitchToSignUp - Callback to switch to the sign-up view.
 * @param {object[]} props.allUsers - The list of all users.
 */
export default function DevLogin({
  onLoginSuccess = () => {},
  onSwitchToSignUp = () => {},
  allUsers = [],
}) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUsername, setSelectedUsername] = useState("");

  // Set a default user from the list when the component loads
  useEffect(() => {
    if (allUsers && allUsers.length > 0 && !selectedUsername) {
      setSelectedUsername(allUsers[0].username);
    }
  }, [allUsers, selectedUsername]);

  // Handle changes in the user selection dropdown
  const handleSelectChange = (e) => {
    const { value } = e.target;
    if (value === "new-user") {
      onSwitchToSignUp(); // Trigger the view switch in the parent
    } else {
      setSelectedUsername(value);
    }
  };

  // Handle the sign-in action
  const handleSignIn = async () => {
    if (!selectedUsername) {
      setError("Please select a user.");
      return;
    }
    setIsLoggingIn(true);
    setError(null);
    try {
      // Fetch the basic user info for the selected user
      const user = await getUser(selectedUsername);
      onLoginSuccess(user, "login");
      console.log(`${user.role} signed in using DEV mode.`);
    } catch (err) {
      console.error("Sign in failed:", err);
      setError("Failed to sign in. Could not retrieve user profile.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 200px)", // Adjust based on header/footer height
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
          Welcome to the RIT Teaching Assistant Portal (DEV)
        </Typography>
        <Typography variant="h3" textAlign="center" sx={{ mb: 4 }}>
          Sign in with your RIT Account
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="user-select-label">Select User</InputLabel>
          <Select
            labelId="user-select-label"
            id="user_select"
            value={selectedUsername}
            label="Select User"
            onChange={handleSelectChange}
          >
            <MenuItem value="new-user">-- Create New User --</MenuItem>
            {allUsers.map((user) => (
              <MenuItem key={user.username} value={user.username}>
                {user.fname} {user.lname} ({user.role})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        <Button
          variant="contained"
          color="secondary"
          size="large"
          onClick={handleSignIn}
          disabled={!selectedUsername || isLoggingIn}
          sx={{ mt: 4, width: "60%" }}
        >
          {isLoggingIn ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Sign In"
          )}
        </Button>
      </Paper>
    </Container>
  );
}