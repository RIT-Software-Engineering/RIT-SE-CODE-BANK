"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@components/Header";
import { useTheme } from "@mui/material/styles";
import {
  Typography,
  Paper,
  Table,
  TableHead,
  TableCell,
  TableRow,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  DialogActions,
  Select,
  MenuItem,
  TableSortLabel,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  InputAdornment,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";

import { useUser } from "../../utils/user-context/page";
import Snackbar from "@components/Snackbar";

const STATUSES = ["ALL", "PENDING", "APPROVED", "REJECTED"];

const StatusBadge = ({ status }) => {
  const theme = useTheme();
  const label = status
    ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    : "Pending";
  const config = {
    APPROVED: { color: theme.palette.success.main },
    REJECTED: { color: theme.palette.error.main },
    PENDING:  { color: theme.palette.warning.main },
  };
  const { color } = config[status] ?? config.PENDING;
  return (
    <Chip
      label={label}
      size="medium"
      sx={{
        fontWeight: 400,
        fontSize: "0.85rem",
        px: 1,
        bgcolor: color,
        color: theme.ritColors.white,
        border: "none",
      }}
    />
  );
};

const getStatusState = (status) => {
  if (status === "APPROVED") return "APPROVED";
  if (status === "REJECTED") return "REJECTED";
  return "PENDING";
};

export default function ProposalsPage() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const { user } = useUser();
  const currentUserId = user?.id;

  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [filterStatus, setFilterStatus] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [submitOpen, setSubmitOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchProposals = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projectproposal`);
      const data = await res.json();
      setProposals(data.filter((p) => p.submittedById === currentUserId));
    } catch (err) {
      console.error("Failed to fetch proposals:", err);
    }
  };

  useEffect(() => {
    if (currentUserId) fetchProposals();
  }, [currentUserId]);

  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === "asc";
    setSortField(field);
    setSortOrder(isAsc ? "desc" : "asc");
  };

  const sortedProposals = [...proposals].sort((a, b) => {
    if (!sortField) return 0;
    let aVal, bVal;
    if (sortField === "createdAt") {
      aVal = new Date(a.createdAt);
      bVal = new Date(b.createdAt);
    } else if (sortField === "status") {
      aVal = getStatusState(a.status);
      bVal = getStatusState(b.status);
    } else {
      aVal = a[sortField]?.toString().toLowerCase() ?? "";
      bVal = b[sortField]?.toString().toLowerCase() ?? "";
    }
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const filteredProposals = sortedProposals.filter((p) => {
    if (filterStatus !== "ALL" && p.status !== filterStatus) return false;
    if (dateFrom && new Date(p.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(p.createdAt) > new Date(dateTo + "T23:59:59")) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      if (!p.title?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleOpen = (proposal) => {
    setSelectedProposal(proposal);
  };

  const handleClose = () => {
    setSelectedProposal(null);
  };

  const handleFormChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async () => {
    const next = {};
    if (!form.title.trim()) next.title = "Title is required.";
    if (!form.description.trim()) next.description = "Description is required.";
    setFormErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projectproposal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, submittedById: currentUserId }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setSnackbarSeverity("success");
      setSnackbarMsg("Proposal submitted successfully!");
      setSnackbarOpen(true);
      setSubmitOpen(false);
      setForm({ title: "", description: "" });
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
    setForm({ title: "", description: "" });
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

  return (
    <>
      <Header />
      <IconButton onClick={() => router.back()} aria-label="back">
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        My Project Proposals
      </Typography>

      {/* Toolbar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
          <Button variant="outline-orange" startIcon={<FilterAltOutlinedIcon />} onClick={() => setFilterDialogOpen(true)}>
            Filter
          </Button>
          {filterStatus !== "ALL" && (
            <Chip
              size="medium"
              label={`Status: ${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1).toLowerCase()}`}
              onDelete={() => setFilterStatus("ALL")}
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
          <Button variant="solid-orange" onClick={() => setSubmitOpen(true)} startIcon={<AddIcon />}>
            New Proposal
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <Paper elevation={1} square sx={{ maxHeight: 500, overflow: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>
                <TableSortLabel
                  active={sortField === "title"}
                  direction={sortField === "title" ? sortOrder : "asc"}
                  onClick={() => handleSort("title")}
                  sx={{ color: theme.ritColors.white, "& .MuiTableSortLabel-icon": { color: `${theme.ritColors.white} !important` } }}
                >
                  Title
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>
                <TableSortLabel
                  active={sortField === "createdAt"}
                  direction={sortField === "createdAt" ? sortOrder : "asc"}
                  onClick={() => handleSort("createdAt")}
                  sx={{ color: theme.ritColors.white, "& .MuiTableSortLabel-icon": { color: `${theme.ritColors.white} !important` } }}
                >
                  Submitted
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>
                <TableSortLabel
                  active={sortField === "status"}
                  direction={sortField === "status" ? sortOrder : "asc"}
                  onClick={() => handleSort("status")}
                  sx={{ color: theme.ritColors.white, "& .MuiTableSortLabel-icon": { color: `${theme.ritColors.white} !important` } }}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }} align="right">
                Options
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProposals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6, color: "text.secondary", fontStyle: "italic" }}>
                  No proposals found
                </TableCell>
              </TableRow>
            ) : (
              filteredProposals.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.title}</TableCell>
                  <TableCell>
                    {new Date(p.createdAt).toLocaleDateString(undefined, {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell align="right">
                    <Button variant="outline-orange" onClick={() => handleOpen(p)}>Details</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Detail Modal */}
      <Dialog open={!!selectedProposal} onClose={handleClose} maxWidth="sm" fullWidth>
        {selectedProposal && (
          <>
            <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: theme.ritColors.white, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {selectedProposal.title}
              <StatusBadge status={selectedProposal.status} />
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {selectedProposal.description}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Submitted
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {new Date(selectedProposal.createdAt).toLocaleDateString(undefined, {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </Typography>
                </Box>
                {selectedProposal.reviewNotes && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: isDark ? "rgba(255,255,255,0.05)" : "grey.100",
                      borderLeft: `4px solid ${
                        selectedProposal.status === "APPROVED"
                          ? theme.palette.success.main
                          : selectedProposal.status === "REJECTED"
                          ? theme.palette.error.main
                          : theme.palette.warning.main
                      }`,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Reviewer Notes
                      {selectedProposal.reviewedBy && (
                        <span style={{ fontWeight: 400, textTransform: "none" }}>
                          {" "}— {selectedProposal.reviewedBy.fname} {selectedProposal.reviewedBy.lname}
                        </span>
                      )}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {selectedProposal.reviewNotes}
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 2, py: 1.5 }}>
              <Button variant="solid-orange" onClick={handleClose}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Submit Proposal Dialog */}
      <Dialog open={submitOpen} onClose={handleCloseSubmit} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: theme.ritColors.white, fontWeight: 600 }}>
          Submit Project Proposal
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Project Title *"
              value={form.title}
              onChange={handleFormChange("title")}
              error={!!formErrors.title}
              helperText={formErrors.title}
              fullWidth
            />
            <TextField
              label="Description *"
              value={form.description}
              onChange={handleFormChange("description")}
              error={!!formErrors.description}
              helperText={formErrors.description}
              fullWidth
              multiline
              minRows={4}
              maxRows={8}
              inputProps={{ maxLength: 2000 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, gap: 0.5 }}>
          <Button onClick={handleCloseSubmit} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button variant="solid-orange" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Proposal"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: theme.ritColors.white, fontWeight: 600 }}>
          Filter Proposals
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="From"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={datePickerSx}
            />
            <TextField
              label="To"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={datePickerSx}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, gap: 0.5 }}>
          <Button variant="outlined" color="inherit"
            onClick={() => { setFilterStatus("ALL"); setDateFrom(""); setDateTo(""); }}>
            Reset
          </Button>
          <Button variant="solid-orange" onClick={() => setFilterDialogOpen(false)}>Apply</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} message={snackbarMsg} severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)} />
    </>
  );
}