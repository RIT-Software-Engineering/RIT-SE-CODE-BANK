"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";

import Header from "@components/Header";
import { useUser } from "../../utils/user-context/page";

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

export default function ReviewProposalsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const router = useRouter();

  const { user } = useUser();
  const currentUserId = user?.id;

  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("createdAt");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [reviewFields, setReviewFields] = useState({ status: "", reviewNotes: "" });
  const [reviewErrors, setReviewErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projectproposal`);
      const data = await res.json();
      setProposals(data);
    } catch (err) {
      console.error("Failed to fetch proposals:", err);
    }
  };

  const handleOpen = (proposal) => {
    setSelectedProposal(proposal);
    setReviewErrors({});
    setReviewFields({
      status: proposal.status ?? "PENDING",
      reviewNotes: proposal.reviewNotes ?? "",
    });
  };

  const handleClose = () => {
    setSelectedProposal(null);
    setReviewErrors({});
    setConfirmOpen(false);
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
          p.title?.toLowerCase().includes(q) ||
          p.submittedBy?.fname?.toLowerCase().includes(q) ||
          p.submittedBy?.lname?.toLowerCase().includes(q);
        if (!matched) return false;
      }
      return true;
    });
    return [...filtered].sort(getComparator(order, orderBy));
  }, [proposals, filter, dateFrom, dateTo, searchQuery, order, orderBy]);

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
        `${process.env.NEXT_PUBLIC_API_URL}/api/projectproposal/${selectedProposal.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: reviewFields.status,
            reviewNotes: reviewFields.reviewNotes,
            reviewedById: currentUserId,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to update proposal");
      await fetchProposals();
      setConfirmOpen(false);
      handleClose();
      setSnackbarSeverity("success");
      setSnackbarMsg("Proposal updated successfully!");
      setSnackbarOpen(true);
    } catch (err) {
      console.error(err);
      setSnackbarSeverity("error");
      setSnackbarMsg(err.message || "Failed to update proposal. Please try again.");
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
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

  const columns = [
    { id: "title", label: "Title" },
    { id: "submittedBy", label: "Submitted By" },
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
        Review Project Proposals
      </Typography>

      {/* Toolbar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
          <Button variant="outline-orange" startIcon={<FilterAltOutlinedIcon />} onClick={() => setFilterDialogOpen(true)}>
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
      </Box>

      {/* Table */}
      <Paper elevation={1} square sx={{ maxHeight: 500, overflow: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.id} sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>
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
              <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }} align="right">
                Options
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
                    {p.submittedBy ? `${p.submittedBy.fname} ${p.submittedBy.lname}` : "—"}
                  </TableCell>
                  <TableCell>
                    {new Date(p.createdAt).toLocaleDateString(undefined, {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell align="right">
                    <Button variant="outline-orange" onClick={() => handleOpen(p)}>
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Review Modal */}
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
                    Submitted By
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {selectedProposal.submittedBy
                      ? `${selectedProposal.submittedBy.fname} ${selectedProposal.submittedBy.lname} — ${selectedProposal.submittedBy.email}`
                      : "—"}
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
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {selectedProposal.description}
                  </Typography>
                </Box>
                <FormControl fullWidth error={!!reviewErrors.status}>
                  <InputLabel>Status *</InputLabel>
                  <Select
                    value={reviewFields.status}
                    label="Status *"
                    onChange={(e) => { setReviewFields((p) => ({ ...p, status: e.target.value })); setReviewErrors((p) => ({ ...p, status: undefined })); }}
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
                  onChange={(e) => setReviewFields((p) => ({ ...p, reviewNotes: e.target.value }))}
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={6}
                  inputProps={{ maxLength: 500 }}
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, gap: 0.5 }}>
              <Button onClick={handleClose} variant="outlined" color="inherit" disabled={saving}>
                Cancel
              </Button>
              <Button variant="solid-orange" onClick={handleSaveClick} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Review</DialogTitle>
        <DialogContent>
          <Typography>
            Save review for <strong>{selectedProposal?.title}</strong> with status{" "}
            <strong>{reviewFields.status.charAt(0).toUpperCase() + reviewFields.status.slice(1).toLowerCase()}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, gap: 0.5 }}>
          <Button onClick={() => setConfirmOpen(false)} variant="outlined" color="inherit">Cancel</Button>
          <Button onClick={handleConfirmSave} variant="solid-orange" disabled={saving}>
            {saving ? "Saving..." : "Confirm"}
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
              <Select value={filter} label="Status" onChange={(e) => setFilter(e.target.value)}>
                {STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s === "ALL" ? "All" : s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Submitted From"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: dateTo || undefined }}
              sx={datePickerSx}
            />
            <TextField
              label="Submitted To"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: dateFrom || undefined }}
              sx={datePickerSx}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, gap: 0.5 }}>
          <Button variant="outlined" color="inherit" onClick={() => { setFilter("ALL"); setDateFrom(""); setDateTo(""); }}>Reset</Button>
          <Button variant="solid-orange" onClick={() => setFilterDialogOpen(false)}>Apply</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}