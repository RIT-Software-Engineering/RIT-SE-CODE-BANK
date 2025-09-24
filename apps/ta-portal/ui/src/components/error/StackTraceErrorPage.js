"use client";

import React, { useState, useEffect } from "react";
import { Button, Box, Typography, Collapse, Paper } from "@mui/material";

const StackTraceErrorPage = () => {
  const [errorInfo, setErrorInfo] = useState(null);
  const [userFeedback, setUserFeedback] = useState("");
  const [showStack, setShowStack] = useState(false);

  // Figure out environment
  const env = process.env.NEXT_PUBLIC_NODE_ENV || process.env.NODE_ENV;
  const isDev = env === "development" || env === "DEV";
  const isProd = env === "production" || env === "PROD";

  // ✅ Only read from sessionStorage after mount
  useEffect(() => {
    try {
      const errorDetails = sessionStorage.getItem("errorDetails");
      if (errorDetails) {
        setErrorInfo(JSON.parse(errorDetails));
      }
    } catch (err) {
      console.error("Failed to parse error details:", err);
    }
  }, []);

  const handleGoBack = () => window.history.back();

  const handleCopyStackTrace = async () => {
    if (errorInfo?.stack) {
      try {
        await navigator.clipboard.writeText(errorInfo.stack);
        setUserFeedback("✅ Stack trace copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy stack trace:", err);
        setUserFeedback("❌ Failed to copy stack trace.");
      } finally {
        setTimeout(() => setUserFeedback(""), 3000);
      }
    }
  };

  const handleReportOnGitHub = () => {
    try {
      const version = "v1.8.1";
      const timestamp = errorInfo?.timestamp || "No timestamp saved";
      const error = errorInfo?.error || "Unknown error";
      const statusCode = errorInfo?.statusCode
        ? `\n### Status Code\n${errorInfo.statusCode}\n`
        : "";
      const url = errorInfo?.url ? `\n### URL\n${errorInfo.url}\n` : "";

      // In dev, include backend stack. In prod, frontend stack.
      const stackSection = errorInfo?.stack
        ? `\n### Stack Trace\n\`\`\`\n${errorInfo.stack}\n\`\`\`\n`
        : "No stack trace available.\n\n";

      const title = encodeURIComponent(`Bug Report: ${error}`);
      const body = encodeURIComponent(
        `### Version\n${version}\n\n` +
          `### Timestamp\n${timestamp}\n\n` +
          statusCode +
          url +
          stackSection +
          "### Additional Info: \n"
      );

      const githubUrl = `https://github.com/RIT-Software-Engineering/RIT-SE-CODE-BANK/issues/new?title=${title}&body=${body}&labels=003-TAPortal`;
      window.open(githubUrl, "_blank");
      setUserFeedback("✅ Thank You!");
    } catch (err) {
      console.error("Failed to redirect:", err);
      setUserFeedback("❌ Failed to redirect.");
      setTimeout(() => setUserFeedback(""), 3000);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 600,
        margin: "50px auto",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Typography variant="h4" color="error" gutterBottom>
        ⚠️ An Error Occurred
      </Typography>

      {errorInfo ? (
        <Paper
          elevation={3}
          sx={{ padding: 2, borderRadius: 2, textAlign: "left" }}
        >
          {/* Always show error and status code */}
          <Typography variant="h6" color="error">
            Error: {errorInfo.error}
          </Typography>
          {errorInfo.statusCode && (
            <Typography variant="body2" color="text.secondary">
              Status Code: {errorInfo.statusCode}
            </Typography>
          )}

          {/* Stack trace toggle */}
          {errorInfo.stack && (
            <>
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
                onClick={() => setShowStack((prev) => !prev)}
              >
                {showStack ? "Hide Stack Trace" : "View Stack Trace"}
              </Button>

              <Collapse in={showStack}>
                <Box
                  component="pre"
                  sx={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    backgroundColor: "var(--bg-secondary, #f5f5f5)",
                    padding: 2,
                    borderRadius: 1,
                    mt: 2,
                  }}
                >
                  {errorInfo.stack}
                </Box>
              </Collapse>
            </>
          )}
        </Paper>
      ) : (
        <Typography>No error details available.</Typography>
      )}

      <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "center" }}>
        <Button variant="contained" onClick={handleGoBack}>
          🔙 Go Back
        </Button>
        {isDev && errorInfo?.stack && (
          <Button variant="outlined" onClick={handleCopyStackTrace}>
            📋 Copy Stack Trace
          </Button>
        )}
        <Button
          color="secondary"
          variant="contained"
          onClick={handleReportOnGitHub}
        >
          🐞 Report on GitHub
        </Button>
      </Box>

      {userFeedback && (
        <Typography sx={{ mt: 2 }} color="success.main">
          {userFeedback}
        </Typography>
      )}
    </Box>
  );
};

export default StackTraceErrorPage;
