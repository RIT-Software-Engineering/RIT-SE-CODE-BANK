"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Header from "@components/Header";
import { useUser } from "../../../utils/user-context/page";

const STATUS_COLORS = {
  APPROVED: "success",
  REJECTED: "error",
  PENDING: "warning",
};

const StatusBadge = ({ status }) => {
  const theme = useTheme();
  const label = status
    ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    : "Pending";
  const color = STATUS_COLORS[status] ?? "warning";
  const bgColor =
    color === "success"
      ? theme.palette.success.main
      : color === "error"
      ? theme.palette.error.main
      : theme.palette.grey[500];
  return (
    <Chip
      label={label}
      size="medium"
      sx={{
        fontWeight: 400,
        fontSize: "0.85rem",
        px: 1,
        bgcolor: bgColor,
        color: theme.ritColors.white,
        border: "none",
      }}
    />
  );
};

const Field = ({ label, value }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  if (!value && value !== false && value !== 0) return null;
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Box
        sx={{
          px: 1.75,
          py: 1.25,
          border: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.23)" : "rgba(0,0,0,0.23)",
          borderRadius: 1,
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
        }}
      >
        <Typography variant="body1">{String(value)}</Typography>
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

export default function ProposalDetailPage() {
  const { proposalId } = useParams();
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user } = useUser();

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewFields, setReviewFields] = useState({ status: "", reviewNotes: "" });
  const [reviewErrors, setReviewErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projectproposal/${proposalId}`);
        if (!res.ok) throw new Error("Failed to fetch proposal");
        const data = await res.json();
        setProposal(data);
        setReviewFields({
          status: data.status ?? "PENDING",
          reviewNotes: data.reviewNotes ?? "",
        });
      } catch (err) {
        console.error("Failed to fetch proposal:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProposal();
  }, [proposalId]);

  const handleSaveClick = () => {
    const errs = {};
    if (!reviewFields.status) errs.status = "Status is required.";
    setReviewErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projectproposal/${proposalId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: reviewFields.status,
            reviewNotes: reviewFields.reviewNotes,
            reviewedById: user?.id,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to update proposal");
      const updatedData = await res.json();
      setProposal(updatedData.proposal);
      setConfirmOpen(false);
      setSnackbar({ 
        open: true, 
        message: updatedData.proposal.project 
          ? "Proposal approved and project created successfully!" 
          : "Proposal updated successfully!", 
        severity: "success" 
      });
    } catch (err) {
      console.error(err);
      setConfirmOpen(false);
      setSnackbar({ open: true, message: err.message || "Failed to update proposal. Please try again.", severity: "error" });
    } finally {
      setSaving(false);
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

  if (!proposal) {
    return (
      <>
        <Header />
        <Typography sx={{ mt: 4 }} color="error">Proposal not found.</Typography>
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
          {proposal.title}
        </Typography>
        <StatusBadge status={proposal.status} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, ml: 6 }}>
        Submitted on{" "}
        {new Date(proposal.createdAt).toLocaleDateString(undefined, {
          year: "numeric", month: "long", day: "numeric",
        })}
      </Typography>

      {/* Project Created Alert */}
      {proposal.project && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            bgcolor: isDark ? "rgba(46, 125, 50, 0.15)" : "rgba(46, 125, 50, 0.1)",
            border: "1px solid",
            borderColor: theme.palette.success.main,
            borderRadius: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" fontWeight={600} sx={{ color: theme.palette.success.main }}>
                Project Created
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This proposal has been converted to a project: <strong>{proposal.project.display_name}</strong>
              </Typography>
            </Box>
            <Button
              variant="solid-orange"
              size="small"
              onClick={() => router.push(`/scoopdinator/projects/${proposal.project.id}`)}
            >
              View Project
            </Button>
          </Box>
        </Paper>
      )}

      {/* Content */}
      <Paper elevation={1} square sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>

          <Section title="Submitted By">
            <Field
              label="Name"
              value={
                proposal.submittedBy
                  ? `${proposal.submittedBy.fname} ${proposal.submittedBy.lname}`
                  : null
              }
            />
            <Field label="Email" value={proposal.submittedBy?.email} />
          </Section>

          <Divider />

          <Section title="Proposal">
            <Field label="Title" value={proposal.title} />
            <Field label="Description" value={proposal.description} />
          </Section>

          <Divider />

          <Section title="Review Decision">
            <FormControl fullWidth error={!!reviewErrors.status}>
              <InputLabel>Status *</InputLabel>
              <Select
                value={reviewFields.status}
                label="Status *"
                onChange={(e) => {
                  setReviewFields((prev) => ({ ...prev, status: e.target.value }));
                  setReviewErrors((prev) => ({ ...prev, status: undefined }));
                }}
              >
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
              {reviewErrors.status && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                  {reviewErrors.status}
                </Typography>
              )}
            </FormControl>
            <TextField
              label="Review Notes"
              value={reviewFields.reviewNotes}
              onChange={(e) => setReviewFields((prev) => ({ ...prev, reviewNotes: e.target.value }))}
              fullWidth
              multiline
              minRows={3}
              maxRows={6}
              inputProps={{ maxLength: 500 }}
            />
            {proposal.reviewedBy && (
              <Typography variant="body2" color="text.secondary">
                Last reviewed by {proposal.reviewedBy.fname} {proposal.reviewedBy.lname}
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
        <Button variant="solid-orange" onClick={handleSaveClick} disabled={saving}>
          {saving ? "Saving..." : "Save Review"}
        </Button>
      </Box>

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Review</DialogTitle>
        <DialogContent>
          <Typography>
            Save review for <strong>{proposal.title}</strong> with status{" "}
            <strong>
              {reviewFields.status.charAt(0).toUpperCase() + reviewFields.status.slice(1).toLowerCase()}
            </strong>?
          </Typography>
          {reviewFields.status === "APPROVED" && !proposal.project && (
            <Typography sx={{ mt: 1.5, fontStyle: "italic", color: "text.secondary" }}>
              Note: Approving this proposal will automatically create a new project.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, gap: 0.5 }}>
          <Button onClick={() => setConfirmOpen(false)} variant="outlined" color="inherit">Cancel</Button>
          <Button onClick={handleConfirmSave} variant="solid-orange" disabled={saving}>
            {saving ? "Saving..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}