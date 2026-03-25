"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
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
import StatusBadge from "@components/StatusBadge";
import SortableTableHeader from "@components/SortableTableHeader";
import { getComparator } from "@utils/sortingUtils";

const STATUSES = ["ALL", "PENDING", "APPROVED", "REJECTED"];

export default function ReviewProposalsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const router = useRouter();

  const [proposals, setProposals] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("createdAt");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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
    router.push(`/scoopdinator/projectproposals/${proposal.id}`);
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
                <SortableTableHeader
                  key={col.id}
                  id={col.id}
                  label={col.label}
                  isActive={orderBy === col.id}
                  sortDirection={order}
                  onSort={handleSort}
                />
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
                    <StatusBadge value={p.status} type="proposal" />
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