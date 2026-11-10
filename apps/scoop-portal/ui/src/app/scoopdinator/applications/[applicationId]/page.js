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
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Header from "@components/Header";
import StatusBadge from "@components/StatusBadge";

const STATUSES = ["ALL", "APPROVED", "REJECTED", "PENDING"];

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

  const handleApprove = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offer/${applicationId}/send`,
        { method: "PUT" }
      );
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to approve application");
      }

      setNotification({
        open: true,
        message: "Application approved and offer sent to student",
        severity: "success",
      });

      setTimeout(() => router.back(), 1500);
    } catch (err) {
      setNotification({
        open: true,
        message: `Failed to approve: ${err.message}`,
        severity: "error",
      });
    }
  };

  const handleReject = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/application/${applicationId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "REJECTED" }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to reject application");
      }

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/${application.applicant_id}`,
        {
          method: "PUT",
          body: JSON.stringify({ active: "rejected" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      setNotification({
        open: true,
        message: "Application rejected",
        severity: "success",
      });

      setTimeout(() => router.back(), 1500);
    } catch (err) {
      setNotification({
        open: true,
        message: `Failed to reject: ${err.message}`,
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

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <IconButton onClick={() => router.back()} aria-label="back">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          {application.firstName} {application.lastName}
        </Typography>
        <StatusBadge value={application.status} type="application" />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, ml: 6 }}>
        Submitted on {new Date(application.createdAt).toLocaleDateString(undefined, {
          year: "numeric", month: "long", day: "numeric",
        })}
      </Typography>

      <Paper elevation={1} square sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>

          <Section title="Contact">
            <Field question="Email" answer={application.ritEmail} />
            <Field question="UID" answer={application.userID} />
          </Section>

          <Divider />

          <Section title="Academic Background">
            <Field question="Who is your academic advisor?" answer={application.academicAdvisor} />
            <Field question="How many credits are remaining in your degree?" answer={application.creditsRemaining} />
            <Field question="What is your cumulative GPA?" answer={application.cumulativeGPA} />
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
            <Field question="Number of co-op blocks completed?" answer={application.coopsCompleted} />
            <Field question="Which semester did you start at RIT?" answer={application.startSemester} />
          </Section>

          <Divider />

          <Section title="Job Search Acknowledgment">
            <Field
              question="It is imperative that you continue your search between now and the beginning of your SCOOP term.
                            Students often find jobs at the very last minute before a term starts,
                            so there is no such thing as too late to do your search. Please acknowledge this below:"
              answer={application.jobSearchAcknowledgment}
            />
            <Field
              question="Why the student chose 'Other':"
              answer={application.jobSearchAcknowledgmentDetails}
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

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
        <Button variant="outlined" color="inherit" onClick={() => router.back()}>
          Back
        </Button>
        {application.status !== "REJECTED" && (
          <Button
            variant="contained-error"
            color="error"
            onClick={handleReject}
          >
            Reject
          </Button>
        )}
        {application.status !== "APPROVED" && (
          <Button
            variant="contained-success"
            color="success"
            onClick={handleApprove}
          >
            Approve & Send Offer
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