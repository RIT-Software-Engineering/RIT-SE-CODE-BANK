// src/components/auth/SignUpForm.js

"use client";

import React, { useState } from "react";
import {
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link as MuiLink,
} from "@mui/material";

/**
 * A form for creating a new user account.
 * @param {object} props - The component props.
 * @param {function} props.onSignUpSubmit - Callback for when the user submits the form.
 * @param {function} props.onSwitchToLogin - Callback to switch the view back to the login form.
 * @param {object[]} props.allUsers - The list of all existing users for validation.
 */
export default function SignUpForm({
  onSignUpSubmit = () => {},
  onSwitchToLogin = () => {},
  allUsers = [],
}) {
  const [error, setError] = useState(null);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "CANDIDATE",
  });

  // Event handler for creating a new user
  const handleCreateAndContinue = () => {
    // Validate input
    const trimmedUsername = newUser.username.trim();
    if (!trimmedUsername || !newUser.password.trim() || !newUser.role) {
      setError("Please fill in all fields to create a new user.");
      return;
    }

    // Check for username existence
    const usernameExists = allUsers.some(
      (user) => user.username.toLowerCase() === trimmedUsername.toLowerCase()
    );
    if (usernameExists) {
      setError("This username is already taken. Please choose another one.");
      return;
    }

    setError(null);
    onSignUpSubmit(newUser, "signup"); // Pass data and action to parent
  };

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
          Create a New Account
        </Typography>

        <TextField
          label="Username"
          value={newUser.username}
          onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
          margin="normal"
          fullWidth
          placeholder="Enter username (e.g., xyz1234)"
          inputProps={{ maxLength: 7 }}
        />
        <TextField
          label="Password"
          type="password"
          value={newUser.password}
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          margin="normal"
          fullWidth
          placeholder="Enter password"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel id="role-select-label">I am a...</InputLabel>
          <Select
            labelId="role-select-label"
            value={newUser.role}
            label="I am a..."
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          >
            <MenuItem value="CANDIDATE">Candidate</MenuItem>
            <MenuItem value="EMPLOYEE">Employee</MenuItem>
            <MenuItem value="EMPLOYER">Employer</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
          </Select>
        </FormControl>

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleCreateAndContinue}
          sx={{ mt: 3, mb: 2, width: "80%" }}
        >
          Create and Continue
        </Button>

        <MuiLink
          component="button"
          variant="body2"
          onClick={onSwitchToLogin}
        >
          Already have an account? Sign In
        </MuiLink>
      </Paper>
    </Container>
  );
}
