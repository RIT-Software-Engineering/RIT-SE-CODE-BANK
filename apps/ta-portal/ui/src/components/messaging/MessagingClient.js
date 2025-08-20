// src/components/messaging/MessagingClient.js
"use client";

import { useState, useEffect } from "react";
import { getSlackOAuthURL, sendMessageToSlack } from "@/services/slack-apis";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

export default function MessagingClient({ initialEmail = "" }) {
  const [slackToken, setSlackToken] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get("token");
    const team = queryParams.get("teamId");
    const error = queryParams.get("error");

    if (token && team) {
      setSlackToken(token);
      setTeamId(team);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (error) {
      setFeedback({
        type: "error",
        message: `Authentication failed: ${error}`,
      });
    }
  }, []);

  const handleConnectToSlack = async () => {
    setIsLoading(true);
    setFeedback({ type: "", message: "" });
    try {
      const oauthUrl = await getSlackOAuthURL(email);
      window.location.href = oauthUrl;
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!email || !message) {
      setFeedback({
        type: "error",
        message: "Email and message cannot be empty.",
      });
      return;
    }
    setIsLoading(true);
    setFeedback({ type: "", message: "" });
    try {
      const result = await sendMessageToSlack({
        token: slackToken,
        teamId: teamId,
        email: email,
        text: message,
      });
      setFeedback({ type: "success", message: result.message });
      setEmail("");
      setMessage("");
    } catch (error) {
      setFeedback({ type: "error", message: `Error: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <Paper
        elevation={4}
        sx={{
          p: { xs: 3, md: 5 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "background.paper",
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom>
          Send a Slack Message
        </Typography>

        {!slackToken ? (
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Please connect your Slack account to continue.
            </Typography>
            <Button
              onClick={handleConnectToSlack}
              disabled={isLoading}
              variant="contained"
              color="primary"
              size="large"
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Connect to Slack"
              )}
            </Button>
          </Box>
        ) : (
          <Box
            component="form"
            onSubmit={handleSendMessage}
            sx={{ width: "100%", mt: 3 }}
          >
            <TextField
              type="email"
              label="Recipient's Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Your Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              fullWidth
              margin="normal"
              multiline
              rows={6}
              required
            />
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Button
                type="submit"
                disabled={isLoading}
                variant="contained"
                color="primary"
                size="large"
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Send Message"
                )}
              </Button>
            </Box>
          </Box>
        )}

        {feedback.message && (
          <Alert
            severity={feedback.type === "error" ? "error" : "success"}
            sx={{ width: "100%", mt: 4 }}
          >
            {feedback.message}
          </Alert>
        )}
      </Paper>
    </Container>
  );
}