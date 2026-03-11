"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import Header from "@components/Header";
import { useUser } from "../../utils/user-context/page";
import Snackbar from "@components/Snackbar";

const STATUSES = ["ALL", "PENDING", "APPROVED", "REJECTED"];
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
        color: theme.ritColors.white,
        border: "none",
      }}
    />
  );
};

function descendingComparator(a, b, orderBy) {
  const aVal = orderBy === "createdAt" ? new Date(a[orderBy]) : (a[orderBy] ?? "");
  const bVal = orderBy === "createdAt" ? new Date(b[orderBy]) : (b[orderBy] ?? "");
  if (bVal < aVal) return -1;
  if (bVal > aVal) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

const EMPTY_FORM = {
  title: "",
  description: "",
};

export default function ProposalsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const router = useRouter();

  const { user } = useUser();
  const currentUserId = user?.id;

  const [proposals, setProposals] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("createdAt");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [submitOpen, setSubmitOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [detailProposal, setDetailProposal] = useState(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scoop-portal/api/projectproposal`);
      const data = await res.json();
      setProposals(data.filter((p) => p.submittedById === currentUserId));
    } catch (err) {
      console.error("Failed to fetch proposals:", err);
    }
  };

  const handleSort = (column) => {
    if (orderBy === column) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOrderBy(column);
      setOrder("asc");
    }
  };

  const filteredProposals = useMemo(() => {
    const filtered = proposals.filter((p) => {
      if (filter !== "ALL" && p.status !== filter) return false;
      if (dateFrom && new Date(p.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(p.createdAt) > new Date(dateTo + "T23:59:59")) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matched =
          p.title?.toLowerCase().includes(q);
        if (!matched) return false;
      }
      return true;
    });
    return [...filtered].sort(getComparator(order, orderBy));
  }, [proposals, filter, dateFrom, dateTo, searchQuery, order, orderBy]);

  const handleFormChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = "Title is required";
    if (!form.description.trim()) next.description = "Description is required";
    return next;
  };

  const handleSubmit = async () => {
    const next = validate();
    if (Object.keys(next).length > 0) {
      setFormErrors(next);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scoop-portal/api/projectproposal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          teamSize: form.teamSize ? Number(form.teamSize) : null,
          submittedById: currentUserId,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setSnackbarSeverity("success");
      setSnackbarMsg("Proposal submitted successfully!");
      setSnackbarOpen(true);
      setSubmitOpen(false);
      setForm(EMPTY_FORM);
      setFormErrors({});
      fetchProposals();
    } catch (err) {
      console.error("Error submitting proposal:", err);
      setSnackbarSeverity("error");
      setSnackbarMsg("Failed to submit proposal. Please try again.");
      setSnackbarOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSubmit = () => {
    setSubmitOpen(false);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  const datePickerSx = {
    "& input[type='date']::-webkit-calendar-picker-indicator": {
      filter: isDark ? "invert(1)" : "none",
      cursor: "pointer",
    },
  };

  const filterChipSx = {
    bgcolor: theme.palette.info.main,
    color: theme.ritColors.white,
    fontWeight: 400,
    fontSize: "0.85rem",
    px: 0.5,
    "& .MuiChip-deleteIcon": {
      color: "rgba(255,255,255,0.7)",
      "&:hover": { color: theme.ritColors.white },
    },
  };

  const columns = [
    { id: "title", label: "Title" },
    { id: "createdAt", label: "Submitted" },
    { id: "status", label: "Status" },
  ];

  return (
    <Box>
      <Header />
      <IconButton onClick={() => router.back()} aria-label="back">
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        My Project Proposals
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
          <Button
            variant="outline-orange"
            startIcon={<FilterAltOutlinedIcon />}
            onClick={() => setFilterDialogOpen(true)}
          >
            Filter
          </Button>
          {filter !== "ALL" && (
            <Chip
              size="medium"
              label={`Status: ${filter.charAt(0).toUpperCase() + filter.slice(1).toLowerCase()}`}
              onDelete={() => setFilter("ALL")}
              sx={filterChipSx}
            />
          )}
          {(dateFrom || dateTo) && (
            <Chip
              size="medium"
              label={`Submitted: ${dateFrom || "…"} → ${dateTo || "…"}`}
              onDelete={() => { setDateFrom(""); setDateTo(""); }}
              sx={filterChipSx}
            />
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: 220, mt: 1.75 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="solid-orange"
            startIcon={<AddIcon />}
            onClick={() => setSubmitOpen(true)}
          >
            New Proposal
          </Button>
        </Box>
      </Box>

      <Paper elevation={1} square sx={{ maxHeight: 500, overflow: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}
                >
                  <TableSortLabel
                    active={orderBy === col.id}
                    direction={orderBy === col.id ? order : "asc"}
                    onClick={() => handleSort(col.id)}
                    sx={{
                      color: `${theme.ritColors.white} !important`,
                      "& .MuiTableSortLabel-icon": { color: `${theme.ritColors.white} !important` },
                    }}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell
                sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}
                align="right"
              >
                Details
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProposals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 6, color: "text.secondary", fontStyle: "italic" }}>
                  No proposals found
                </TableCell>
              </TableRow>
            ) : (
              filteredProposals.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.title}</TableCell>
                  <TableCell>
                    {new Date(p.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View details">
                      <IconButton size="small" onClick={() => setDetailProposal(p)}>
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={submitOpen} onClose={handleCloseSubmit} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: theme.ritColors.white, fontWeight: 600 }}>
          Submit Project Proposal
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
            <TextField
              label="Project Title"
              value={form.title}
              onChange={handleFormChange("title")}
              error={!!formErrors.title}
              helperText={formErrors.title}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={handleFormChange("description")}
              error={!!formErrors.description}
              helperText={formErrors.description}
              fullWidth
              required
              multiline
              minRows={4}
              maxRows={8}
              inputProps={{ maxLength: 2000 }}
            />

          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, gap: 0.5 }}>
          <Button variant="outlined" color="inherit" onClick={handleCloseSubmit}>
            Cancel
          </Button>
          <Button variant="solid-orange" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Proposal"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!detailProposal} onClose={() => setDetailProposal(null)} maxWidth="sm" fullWidth>
        {detailProposal && (
          <>
            <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: theme.ritColors.white, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {detailProposal.title}
              <StatusBadge status={detailProposal.status} />
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {detailProposal.description}
                  </Typography>
                </Box>
                <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Submitted
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {new Date(detailProposal.createdAt).toLocaleDateString(undefined, {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </Typography>
                  </Box>
                {detailProposal.reviewNotes && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: isDark ? "rgba(255,255,255,0.05)" : "grey.100",
                      borderLeft: `4px solid ${
                        detailProposal.status === "APPROVED"
                          ? theme.palette.success.main
                          : detailProposal.status === "REJECTED"
                          ? theme.palette.error.main
                          : theme.palette.warning.main
                      }`,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Reviewer Notes
                      {detailProposal.reviewedBy && (
                        <span style={{ fontWeight: 400, textTransform: "none" }}>
                          {" "}— {detailProposal.reviewedBy.fname} {detailProposal.reviewedBy.lname}
                        </span>
                      )}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {detailProposal.reviewNotes}
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 2, py: 1.5 }}>
              <Button variant="solid-orange" onClick={() => setDetailProposal(null)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={snackbarOpen} message={snackbarMsg} severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)} />
    </Box>
  );
}