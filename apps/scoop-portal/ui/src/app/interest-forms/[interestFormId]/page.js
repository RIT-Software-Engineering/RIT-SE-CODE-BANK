"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Divider,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Header from "@components/Header";
import StatusBadge from "@components/StatusBadge";
import { useUser } from "../../utils/user-context/page";
import { sendScoopEmail } from "@utils/ScoopEmailSend";

/**
 * A single question/answer row used throughout the detail page.
 */
const Field = ({ question, answer }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  if (!answer && answer !== false && answer !== 0) return null;
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {question}
      </Typography>
      <Box
        sx={{
          px: 1.75,
          py: 1.25,
          border: `1px solid`,
          borderColor: isDark ? "rgba(255,255,255,0.23)" : "rgba(0,0,0,0.23)",
          borderRadius: 1,
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
        }}
      >
        <Typography variant="body1">
          {String(answer)}
        </Typography>
      </Box>
    </Box>
  );
};

/**
 * A labelled section grouping related fields.
 */
const Section = ({ title, children }) => (
  <Box>
    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1.5 }} color="text.secondary">
      {title}
    </Typography>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {children}
    </Box>
  </Box>
);

export default function InterestFormDetailPage() {
  const { interestFormId } = useParams();
  const router = useRouter();
  const theme = useTheme();

  const { user } = useUser();
  const [interestForm, setInterestForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewComment, setReviewComment] = useState("");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const fetchInterestForm = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/interestform/${interestFormId}`
        );
        if (!res.ok) throw new Error("Failed to fetch interest form");
        const data = await res.json();
        setInterestForm(data);
      } catch (err) {
        console.error("Failed to fetch interest form:", err);
        setNotification({ open: true, message: "Failed to load interest form", severity: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchInterestForm();
  }, [interestFormId]);

  /**
   * Updates the status of the interest form in the database.
   */
  async function putInterestFormStatus(newStatus) {
    const reviewer = user?.email || user?.name || user?.id || null;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/interestform/${interestFormId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          reviewComments: reviewComment || null,
          reviewedBy: reviewer,
        }),
      }
    );
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to update");
  }

  /**
   * Creates a new prospect user from the interest form data.
   */
  async function createProspectUser(form) {
    try {
      const user_id = form.ritEmail.split("@")[0];
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/api/users",
        {
          method: "POST",
          body: JSON.stringify({
            id: user_id,
            fname: form.firstName,
            lname: form.lastName,
            email: form.ritEmail,
            type: "prospect",
            semester_group: "",
            project: "",
            active: "pending",
            last_login: "",
            prev_login: "",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) throw new Error("Failed to create user");
      return response.json();
    } catch (error) {
      console.error("Error creating prospect user:", error);
      throw error;
    }
  }

  /**
   * Handles the logic for accepting an interest form.
   */
  const handleAccept = async () => {
    try {
      await putInterestFormStatus("ACCEPTED");
      await createProspectUser(interestForm);
      setNotification({
        open: true,
        message: "Interest form accepted and prospect user created",
        severity: "success",
      });
      /**
         * This logic will send the person who filled out the interest form a message 
         * to fill out the application if accepted
         */
        const applicationLink = "https://apps.se.rit.edu/scoop-portal/application";
        const recipiant = interestForm.ritEmail;
        const subject = "SCOOP Interest Form";
        const message = `Your interest in SCOOP has been recieved and reviewed.
        \nTo move forward please fill out the application
        \nApplication Link: ${applicationLink}`;

        await sendScoopEmail(recipiant,subject,message);

      router.back();
    } catch (err) {
      setNotification({
        open: true,
        message: `Failed to accept interest form: ${err.message}`,
        severity: "error",
      });
    }
  };

  /**
   * Handles the logic for rejecting an interest form.
   */
  const handleReject = async () => {
    try {
      await putInterestFormStatus("REJECTED");
      setNotification({
        open: true,
        message: "Interest form rejected",
        severity: "success",
      });

      /**
       * This logic will handle the notification if the interest is rejected
       */
      const recipiant = interestForm.ritEmail;
        const subject = "SCOOP Interest Form";
        const message = `Your interest in SCOOP has been recieved and reviewed.
        \nWe appreciate the time you took to fill the interest form out.
        \nbut we will be moving forward with other candidates.
        \nBest of luck
        \n-SCOOP`;

        await sendScoopEmail(recipiant,subject,message);
      router.back();
    } catch (err) {
      setNotification({
        open: true,
        message: `Failed to reject interest form: ${err.message}`,
        severity: "error",
      });
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <Typography sx={{ mt: 4 }} color="text.secondary">Loading...</Typography>
      </>
    );
  }

  if (!interestForm) {
    return (
      <>
        <Header />
        <Typography sx={{ mt: 4 }} color="error">Interest form not found.</Typography>
      </>
    );
  }

  return (
    <Box>
      <Header />

      {/* Page header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <IconButton onClick={() => router.back()} aria-label="back">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          {interestForm.firstName} {interestForm.lastName}
        </Typography>
        <StatusBadge value={interestForm.status} type="interestform" />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, ml: 6 }}>
        Submitted on {new Date(interestForm.createdAt).toLocaleDateString(undefined, {
          year: "numeric", month: "long", day: "numeric",
        })}
      </Typography>

      {(interestForm.reviewedAt || interestForm.reviewedBy || interestForm.reviewComments) && (
        <Paper elevation={0} square sx={{ p: 2, mb: 2, backgroundColor: "rgba(0, 0, 0, 0.02)" }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Review details
          </Typography>
          {interestForm.reviewedBy && (
            <Typography variant="body2">Reviewed by: {interestForm.reviewedBy}</Typography>
          )}
          {interestForm.reviewedAt && (
            <Typography variant="body2">
              Reviewed on: {new Date(interestForm.reviewedAt).toLocaleDateString(undefined, {
                year: "numeric", month: "long", day: "numeric",
              })}
            </Typography>
          )}
          {interestForm.reviewComments && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Comments: {interestForm.reviewComments}
            </Typography>
          )}
        </Paper>
      )}

      {/* Content */}
      <Paper elevation={1} square sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>

          <Section title="Contact">
            <Field question="Email" answer={interestForm.ritEmail} />
            <Field question="UID" answer={interestForm.userID} />
          </Section>

          <Divider />

          <Section title="Academic Information">
            <Field question="Who is your academic advisor?" answer={interestForm.academicAdvisor} />
            <Field question="How many credits are remaining in your degree?" answer={interestForm.creditsRemaining} />
            <Field question="What is your cumulative GPA?" answer={interestForm.cumulativeGPA} />
            <Field
              question="Which courses have you already taken or are about to complete this term?"
              answer={interestForm.coursesTaken}
            />
          </Section>

        </Box>
      </Paper>

      {interestForm.status === "PENDING" && (
        <Box sx={{ mt: 3 }}>
          <TextField
            label="Review comments"
            multiline
            minRows={3}
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            fullWidth
          />
        </Box>
      )}

      {/* Actions */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
        <Button variant="outlined" color="inherit" onClick={() => router.back()}>
          Back
        </Button>
        {interestForm.status !== "REJECTED" && (
          <Button
            variant="contained-error"
            color="error"
            onClick={handleReject}
          >
            Reject
          </Button>
        )}
        {interestForm.status !== "ACCEPTED" && (
          <Button
            variant="contained-success"
            color="success"
            onClick={handleAccept}
          >
            Accept
          </Button>
        )}
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}