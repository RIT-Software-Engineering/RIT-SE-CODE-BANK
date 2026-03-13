"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Header from "@components/Header";

/**
 * The statuses available for an application.
 */
const STATUSES = ["ALL", "ACCEPTED", "REJECTED", "PENDING"];

const STATUS_COLORS = {
  ACCEPTED: "success",
  REJECTED: "error",
  PENDING: "warning",
};

const StatusBadge = ({ status }) => {
  const theme = useTheme();
  const label = status
    ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    : "Pending";
  const color = STATUS_COLORS[status] ?? "default";
  const bgColor =
    color === "success"
      ? theme.palette.success.main
      : color === "error"
      ? theme.palette.error.main
      : theme.palette.warning.main;
  return (
    <Chip
      label={label}
      size="medium"
      sx={{
        fontWeight: 400,
        fontSize: "0.85rem",
        px: 1,
        bgcolor: bgColor,
        color: "rgba(0,0,0,0.87)",
        border: "none",
      }}
    />
  );
};

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

export default function ApplicationDetailPage() {
  const { applicationId } = useParams();
  const router = useRouter();
  const theme = useTheme();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/application/${applicationId}`
        );
        if (!res.ok) throw new Error("Failed to fetch application");
        const data = await res.json();
        setApplication(data);
      } catch (err) {
        console.error("Failed to fetch application:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplication();
  }, [applicationId]);

  const downloadResume = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/application/${applicationId}/resume`
      );
      if (!response.ok) throw new Error("Failed to download resume");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = application?.resumeFileName || "resume.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading resume:", error);
      setNotification({ open: true, message: "Failed to download resume", severity: "error" });
    }
  };

  const openResume = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/application/${applicationId}/resume`
      );
      if (!response.ok) throw new Error("Failed to open resume");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error opening resume:", error);
      setNotification({ open: true, message: "Failed to open resume", severity: "error" });
    }
  };

  /**
   * Updates the status of the application in the database.
   *
   * @async
   * @param {string} newStatus - The new status to set.
   * @throws {Error} If the update fails.
   * @returns {Promise<void>}
   */
  async function putApplicationStatus(newStatus) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/application/${applicationId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }
    );
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to update");
  }

  /**
   * Handles the logic for updating the status of the application.
   *
   * @param {string} newStatus - The new status to set the application to.
   * @returns {void}
   */
  const handleStatusUpdate = async (newStatus) => {
    try {
      await putApplicationStatus(newStatus);
      await handleUserStatusUpdate(newStatus, application);
      router.back();
    } catch (err) {
      setNotification({
        open: true,
        message: `Failed to update status: ${err.message}`,
        severity: "error",
      });
    }
  };

  // Users are guaranteed to exist in the DB as 'prospect' before they can apply,
  // so we just update their role and active state directly without checking for existence first.
  async function handleUserStatusUpdate(status, app) {
    const new_role = status === "ACCEPTED" ? "scooployee" : "applicant";
    const new_active = status === "ACCEPTED" ? "active" : "pending";
    try {
      await fetch(
        process.env.NEXT_PUBLIC_API_URL + `/api/users/${app.applicant_id}`,
        {
          method: "PUT",
          body: JSON.stringify({ type: new_role, active: new_active }),
          headers: { "Content-Type": "application/json" },
        }
      );
      handleJournalEntry(app, status);
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  }

  async function handleJournalEntry(app, status) {
    console.log("Creating journal entry for", app.firstName, "with status", status);
    let entry_string = "";
    if (status === "ACCEPTED")
      entry_string = `${app.firstName} ${app.lastName} has been accepted for SCOOP.`;
    else if (status === "REJECTED")
      entry_string = `${app.firstName} ${app.lastName} has been rejected for SCOOP.`;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString(),
          sender_id: app.applicant_id,
          notes: entry_string,
          recipient_ids: [],
          topic_id: app.applicant_id,
          semester_GroupId: null,
          previous_entryid: null,
          entry_type: "AUTOMATED",
          visibility_level: 1,
          privacy_level: "PUBLIC",
        }),
      });
    } catch (error) {
      console.error("Error creating journal entry:", error);
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <Typography sx={{ mt: 4 }} color="text.secondary">Loading...</Typography>
      </>
    );
  }

  if (!application) {
    return (
      <>
        <Header />
        <Typography sx={{ mt: 4 }} color="error">Application not found.</Typography>
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
          {application.firstName} {application.lastName}
        </Typography>
        <StatusBadge status={application.status} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, ml: 6 }}>
        Submitted on {new Date(application.createdAt).toLocaleDateString(undefined, {
          year: "numeric", month: "long", day: "numeric",
        })}
      </Typography>

      {/* Content */}
      <Paper elevation={1} square sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>

          <Section title="Contact">
            <Field question="Email" answer={application.ritEmail} />
          </Section>

          <Divider />

          <Section title="Academic Background">
            <Field question="Which semester did you start at RIT?" answer={application.startSemester} />
            <Field question="Number of co-op blocks completed?" answer={application.coopsCompleted} />
            <Field
              question="Which courses have you already taken or are about to complete this term?"
              answer={application.coursesTaken}
            />
          </Section>

          <Divider />

          <Section title="Co-op Search">
            <Field question="When did you start searching for this co-op?" answer={application.coopSearchStartDate} />
            <Field
              question="What methods/platforms have you used in order to try and get this co-op?"
              answer={application.coopSearchPlatforms}
            />
            <Field
              question="Do you have any pending/open employer replies that you are waiting to hear back from?"
              answer={application.pendingOffers}
            />
            <Field
              question="If yes, name each employer and your last date of contact for each."
              answer={application.pendingOffersDetails}
            />
            <Field
              question="Have you received formal rejection letters/responses?"
              answer={application.rejectionLetters}
            />
            <Field
              question="If yes, approximately how many? Name as many as you can recall."
              answer={application.rejectionLettersDetails}
            />
          </Section>

          <Divider />

          <Section title="SE Co-op Interest">
            <Field
              question="If an approved unpaid opportunity became available, would you be interested in pursuing it?"
              answer={application.SEcoopInterest}
            />
            <Field
              question="Would you be able to participate in-person at RIT for the duration of the co-op?"
              answer={application.SEcoopAvailability}
            />
            <Field
              question="If unable to attend in-person, please confirm your remote capabilities."
              answer={application.remoteAbility}
            />
          </Section>

          <Divider />

          <Section title="Additional Info">
            <Field
              question="Is there anything else you'd like to share about your search efforts or summer availability?"
              answer={application.additionalComments}
            />
          </Section>

          <Divider />

          <Section title="Resume">
            {application.hasResume ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outline-orange"
                  size="small"
                  onClick={openResume}
                >
                  View in Browser
                </Button>
                <Button
                  variant="outline-orange"
                  color="inherit"
                  size="small"
                  onClick={downloadResume}
                >
                  Download
                </Button>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                No resume uploaded
              </Typography>
            )}
          </Section>

        </Box>
      </Paper>

      {/* Actions */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
        <Button variant="outlined" color="inherit" onClick={() => router.back()}>
          Back
        </Button>
        {application.status !== "REJECTED" && (
          <Button
            variant="contained"
            color="error"
            onClick={() => handleStatusUpdate(STATUSES[2])}
          >
            Reject
          </Button>
        )}
        {application.status !== "ACCEPTED" && (
          <Button
            variant="contained"
            color="success"
            onClick={() => handleStatusUpdate(STATUSES[1])}
          >
            Accept
          </Button>
        )}
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification((p) => ({ ...p, open: false }))}
      >
        <Alert
          onClose={() => setNotification((p) => ({ ...p, open: false }))}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}