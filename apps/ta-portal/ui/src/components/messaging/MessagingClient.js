// src/components/messaging/MessagingClient.js
"use client";

import { useState, useEffect, useRef } from "react";
import { getSlackOAuthURL, sendMessageToSlack, getSlackMessageHistory, getSlackSession, slackLogout, getRecentDMs } from "@/services/slack-apis";
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
  const [connected, setConnected] = useState(false);
  const [teamId, setTeamId] = useState(null);
  const [email, setEmail] = useState(initialEmail);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [message, setMessage] = useState("");
  const [messageHistory, setMessageHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [recentDMs, setRecentDMs] = useState([]);
  const [dmsLoading, setDmsLoading] = useState(false);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messageHistory]);

  const fetchMessageHistory = async (recipientEmail) => {
    setHistoryLoading(true);
    try {
      const history = await getSlackMessageHistory({ email: recipientEmail, limit: 50 });
      setMessageHistory(history.messages?.reverse() || []);
      setSelectedEmail(recipientEmail);
      sessionStorage.setItem('slack_selected_email', recipientEmail);
    } catch (error) {
      console.error("Failed to fetch message history:", error);
      setMessageHistory([]);
      setFeedback({ type: "error", message: `Could not load history: ${error.message}` });
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLoadThread = async () => {
    if (!email.trim()) {
      setFeedback({ type: "error", message: "Please enter an email address" });
      return;
    }
    await fetchMessageHistory(email);
  };

  useEffect(() => {
    (async () => {
      try {
        const sess = await getSlackSession();
        setConnected(Boolean(sess.connected));
        if (sess.teamId) setTeamId(sess.teamId);
        
        if (sess.connected) {
          try {
            const dms = await getRecentDMs();
            setRecentDMs(dms.conversations || []);
          } catch (error) {
            console.error("Failed to fetch recent DMs:", error);
            setRecentDMs([]);
          }
        }
        
        // Restore from session storage if available
        const lastEmail = sessionStorage.getItem('slack_selected_email');
        if (lastEmail && sess.connected) {
          setEmail(lastEmail);
          fetchMessageHistory(lastEmail);
        }
        
        // Clean up query params
        if (window.location.search) {
          const params = new URLSearchParams(window.location.search);
          const err = params.get('error');
          if (err) setFeedback({ type: 'error', message: `Authentication failed: ${err}` });
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {
        console.error('Failed to load Slack session', e);
      }
    })();
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

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setFeedback({ type: "error", message: "Message cannot be empty" });
      return;
    }

    if (!selectedEmail) {
      setFeedback({ type: "error", message: "Please load a message thread first" });
      return;
    }

    setIsLoading(true);
    setFeedback({ type: "", message: "" });
    try {
      const result = await sendMessageToSlack({ email: selectedEmail, text: message });

      if (result.success) {
        setMessage("");
        setFeedback({ type: "success", message: "Message sent successfully!" });
        // Refresh history after sending
        await fetchMessageHistory(selectedEmail);
      } else {
        setFeedback({ type: "error", message: result.message || "Failed to send message" });
      }
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectSlack = async () => {
    try {
      await slackLogout();
      setConnected(false);
      setTeamId(null);
      setSelectedEmail(null);
      setMessageHistory([]);
      sessionStorage.removeItem('slack_selected_email');
      setFeedback({ type: "success", message: "Disconnected from Slack successfully." });
    } catch (e) {
      setFeedback({ type: "error", message: e.message || 'Failed to disconnect' });
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 }, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: "background.paper",
          borderRadius: 2,
          overflow: 'hidden',
          flex: 1,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Header */}
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          backgroundColor: 'background.default',
        }}>
          {!connected ? (
            <Typography variant="h5" component="h1" fontWeight={600}>
              Slack Messages
            </Typography>
          ) : selectedEmail ? (
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {selectedEmail}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  via Slack
                </Typography>
              </Box>
              <Button
                onClick={() => {
                  setSelectedEmail(null);
                  setMessageHistory([]);
                  setEmail("");
                  sessionStorage.removeItem('slack_selected_email');
                }}
                variant="outlined"
                color="error"
                size="small"
                sx={{ 
                  minWidth: 'auto', 
                  width: 36,
                  height: 36,
                  p: 0,
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </Button>
            </Box>
          ) : (
            <Typography variant="h6" fontWeight={600}>
              New Message
            </Typography>
          )}
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!connected ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flex: 1,
              flexDirection: 'column',
              gap: 2,
              p: 4,
            }}>
              <Typography color="text.secondary">
                Connect your Slack account to send messages
              </Typography>
              <Button
                onClick={handleConnectToSlack}
                disabled={isLoading}
                variant="contained"
                size="large"
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Connect to Slack"
                )}
              </Button>
            </Box>
          ) : !selectedEmail ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'stretch', 
              justifyContent: 'flex-start', 
              flex: 1,
              gap: 3,
              p: 3,
              overflow: 'hidden',
            }}>
              {/* Recent DMs Sidebar */}
              <Box sx={{ 
                width: 280,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                overflowY: 'auto',
              }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                  Recent Messages
                </Typography>
                {dmsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : recentDMs.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">
                    No recent DMs
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {recentDMs.map((dm) => (
                      <Button
                        key={dm.id}
                        onClick={() => {
                          setEmail(dm.email || dm.name);
                          fetchMessageHistory(dm.email || dm.name);
                        }}
                        variant="text"
                        fullWidth
                        sx={{
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          py: 1,
                          px: 1.5,
                          borderRadius: 1,
                          '&:hover': { backgroundColor: 'action.hover' },
                        }}
                      >
                        <Box sx={{ overflow: 'hidden', flex: 1 }}>
                          <Typography variant="body2" noWrap fontWeight={500}>
                            {dm.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {dm.email}
                          </Typography>
                        </Box>
                        {dm.unread_count > 0 && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              ml: 1,
                              backgroundColor: 'primary.main',
                              color: 'primary.contrastText',
                              borderRadius: 1,
                              px: 0.75,
                              py: 0.25,
                              fontWeight: 'bold',
                            }}
                          >
                            {dm.unread_count}
                          </Typography>
                        )}
                      </Button>
                    ))}
                  </Box>
                )}
              </Box>

              {/* Compose Area */}
              <Box sx={{ width: '100%', maxWidth: 400 }}>
                <TextField
                  type="email"
                  label="Recipient's Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  onKeyPress={(e) => e.key === "Enter" && handleLoadThread()}
                  fullWidth
                  autoFocus
                />
                <Button
                  onClick={handleLoadThread}
                  disabled={isLoading || historyLoading}
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{ mt: 2 }}
                >
                  Start Conversation
                </Button>
                <Button
                  onClick={handleDisconnectSlack}
                  variant="text"
                  fullWidth
                  size="small"
                  color="error"
                  sx={{ mt: 1 }}
                >
                  Disconnect Slack
                </Button>
              </Box>
            </Box>
          ) : (
            <>
              {/* Messages Area */}
              <Box
                ref={messagesContainerRef}
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  p: 2,
                  backgroundColor: "background.default",
                }}
              >
                {historyLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress size={40} />
                  </Box>
                ) : messageHistory.length === 0 ? (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%',
                  }}>
                    <Typography color="text.secondary">
                      No messages yet. Start the conversation!
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {messageHistory.map((msg, idx) => {
                      const showTimestamp = idx === 0 || 
                        (messageHistory[idx - 1].ts && Math.abs(msg.ts - messageHistory[idx - 1].ts) > 300); // 5 min gap
                      
                      return (
                        <Box key={idx}>
                          {showTimestamp && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                display: 'block',
                                textAlign: 'center',
                                color: 'text.secondary',
                                my: 1,
                                fontSize: '0.75rem',
                              }}
                            >
                              {new Date(msg.ts * 1000).toLocaleString([], { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </Typography>
                          )}
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: msg.isMe ? "flex-end" : "flex-start",
                            }}
                          >
                            <Box
                              sx={{
                                p: 1.5,
                                maxWidth: "70%",
                                borderRadius: 3,
                                backgroundColor: msg.isMe ? "primary.main" : "grey.700",
                                color: msg.isMe ? "primary.contrastText" : "grey.100",
                                boxShadow: 1,
                              }}
                            >
                              {!msg.isMe && (
                                <Typography 
                                  variant="caption" 
                                  fontWeight="bold" 
                                  sx={{ 
                                    display: 'block',
                                    mb: 0.5,
                                    opacity: 0.8,
                                  }}
                                >
                                  {msg.user_name || msg.username || "Slack User"}
                                </Typography>
                              )}
                              <Typography variant="body1">
                                {msg.text}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>

              {/* Message Input Area */}
              <Box
                sx={{
                  p: 2,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                }}
              >
                <Box
                  component="form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  sx={{ display: "flex", gap: 1, alignItems: 'center' }}
                >
                  <Button
                    onClick={() => fetchMessageHistory(selectedEmail)}
                    disabled={historyLoading}
                    variant="outlined"
                    sx={{ 
                      minWidth: 'auto',
                      width: 48,
                      height: 48,
                      borderRadius: 3,
                      p: 0,
                    }}
                  >
                    {historyLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      <Typography sx={{ fontSize: '1.5rem' }}>↻</Typography>
                    )}
                  </Button>
                  <TextField
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Type a message..."
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !message.trim()}
                    variant="contained"
                    sx={{ 
                      minWidth: 'auto',
                      px: 3,
                      borderRadius: 3,
                      height: 48,
                    }}
                  >
                    {isLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      "Send"
                    )}
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Box>        {feedback.message && (
          <Box sx={{ 
            position: 'absolute', 
            top: 16, 
            right: 16, 
            maxWidth: 400,
            zIndex: 1000,
          }}>
            <Alert
              severity={feedback.type === "error" ? "error" : "success"}
              onClose={() => setFeedback({ type: "", message: "" })}
            >
              {feedback.message}
            </Alert>
          </Box>
        )}
      </Paper>
    </Container>
  );
}