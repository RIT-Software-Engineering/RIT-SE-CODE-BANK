"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@components/Header";
import StatusBadge from "@components/StatusBadge";
import SortableTableHeader from "@components/SortableTableHeader";
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
  Snackbar,
  Alert,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { useUser } from "../../utils/user-context/page";

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
  const [searchQuery, setSearchQuery] = useState("");

  const [filterStatus, setFilterStatus] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const [submitOpen, setSubmitOpen] = useState(false);
  const [newProposal, setNewProposal] = useState({ title: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState({});

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

  const handleOpen = (proposal) => {
    setSelectedProposal(proposal);
  };

  const handleClose = () => {
    setSelectedProposal(null);
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === "asc";
    setSortField(field);
    setSortOrder(isAsc ? "desc" : "asc");
  };

  const sortedProposals = [...proposals].sort((a, b) => {
    if (!sortField) return 0;
    let aVal = sortField === "createdAt"
      ? new Date(a[sortField])
      : a[sortField]?.toString().toLowerCase() ?? "";
    let bVal = sortField === "createdAt"
      ? new Date(b[sortField])
      : b[sortField]?.toString().toLowerCase() ?? "";
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const filteredProposals = sortedProposals.filter((p) => {
    if (filterStatus !== "ALL" && p.status !== filterStatus) return false;
    if (dateFrom && new Date(p.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(p.createdAt) > new Date(dateTo + "T23:59:59")) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return p.title?.toLowerCase().includes(q);
  });

  const validateSubmit = (fields) => {
    const errs = {};
    if (!fields.title.trim()) errs.title = "Title is required.";
    if (!fields.description.trim()) errs.description = "Description is required.";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validateSubmit(newProposal);
    setSubmitErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projectproposal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newProposal, submittedById: currentUserId }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      await fetchProposals();
      setSnackbarSeverity("success");
      setSnackbarMsg("Proposal submitted successfully!");
      setSnackbarOpen(true);
      setNewProposal({ title: "", description: "" });
      setSubmitErrors({});
      setSubmitOpen(false);
    } catch (err) {
      console.error(err);
      setSnackbarSeverity("error");
      setSnackbarMsg(err.message || "Failed to submit proposal. Please try again.");
      setSnackbarOpen(true);
    } finally {
      setSubmitting(false);
    }
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

  const tableCellSx = { backgroundColor: theme.palette.primary.main, color: theme.ritColors.white };
  const sortLabelSx = { color: theme.ritColors.white, "& .MuiTableSortLabel-icon": { color: `${theme.ritColors.white} !important` } };

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
              label={`Status: ${filterStatus.charAt(0) + filterStatus.slice(1).toLowerCase()}`}
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
                <SortableTableHeader
                  id="title"
                  label="Title"
                  isActive={sortField === "title"}
                  sortDirection={sortOrder}
                  onSort={handleSort}
                />
              <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white, width: "35%" }}>Description</TableCell>
                <SortableTableHeader
                  id="createdAt"
                  label="Submitted"
                  isActive={sortField === "createdAt"}
                  sortDirection={sortOrder}
                  onSort={handleSort}
                />
              <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white, width: "12%" }}>Status</TableCell>
              <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white, width: "13%" }} align="right">Options</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProposals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary", fontStyle: "italic" }}>
                  No proposals found
                </TableCell>
              </TableRow>
            ) : (
              filteredProposals.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {p.title}
                      {p.project && (
                        <CheckCircleIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", maxWidth: 0 }}>
                    <Typography variant="body2" noWrap sx={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: 260 }}>
                      {p.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(p.createdAt).toLocaleDateString(undefined, {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={p.status} type="proposal" />
                  </TableCell>
                  <TableCell align="right">
                    <Button variant="outline-orange" onClick={() => handleOpen(p)}>View</Button>
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
              {selectedProposal.project && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    mb: 2,
                    bgcolor: isDark ? "rgba(46, 125, 50, 0.15)" : "rgba(46, 125, 50, 0.1)",
                    border: "1px solid",
                    borderColor: theme.palette.success.main,
                    borderRadius: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircleIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                    <Typography variant="body2" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                      Converted to Project
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: 3.5 }}>
                    {selectedProposal.project.display_name}
                  </Typography>
                </Paper>
              )}
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
                        {" "}- {selectedProposal.reviewedBy.fname} {selectedProposal.reviewedBy.lname}
                      </span>
                    )}
                  </Typography>
                  {selectedProposal.reviewNotes ? (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {selectedProposal.reviewNotes}
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ mt: 0.5, fontStyle: "italic", color: "text.secondary" }}>
                      No review notes yet.
                    </Typography>
                  )}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 2, py: 1.5 }}>
              <Button variant="solid-orange" onClick={handleClose}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Submit Proposal Dialog */}
      <Dialog
        open={submitOpen}
        onClose={() => { setSubmitOpen(false); setNewProposal({ title: "", description: "" }); setSubmitErrors({}); }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Submit Project Proposal</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Project Title *"
              value={newProposal.title}
              onChange={(e) => { setNewProposal((p) => ({ ...p, title: e.target.value })); setSubmitErrors((p) => ({ ...p, title: undefined })); }}
              fullWidth
              error={!!submitErrors.title}
              helperText={submitErrors.title}
            />
            <TextField
              label="Description *"
              value={newProposal.description}
              onChange={(e) => { setNewProposal((p) => ({ ...p, description: e.target.value })); setSubmitErrors((p) => ({ ...p, description: undefined })); }}
              fullWidth
              multiline
              minRows={4}
              maxRows={8}
              inputProps={{ maxLength: 2000 }}
              error={!!submitErrors.description}
              helperText={submitErrors.description}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, gap: 0.5 }}>
          <Button
            onClick={() => { setSubmitOpen(false); setNewProposal({ title: "", description: "" }); setSubmitErrors({}); }}
            variant="outlined" color="inherit"
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="solid-orange" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
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

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </>
  );
}