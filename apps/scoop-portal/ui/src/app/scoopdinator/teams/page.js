"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Typography,
  Container,
  Paper,
  Card,
  Chip,
  Divider,
  CircularProgress,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import TableRowsIcon from "@mui/icons-material/TableRows";
import GridViewIcon from "@mui/icons-material/GridView";
import FilterDialog from "../../_components/FilterDialog";
import StatusBadge from "../../_components/StatusBadge";
import Header from "../../_components/Header";

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTeam, setActiveTeam] = useState(null);
  const [openModal, setOpenModal] = useState(null);
  const [view, setView] = useState("table");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterProjectId, setFilterProjectId] = useState("ALL");
  const [filterScoopervisorId, setFilterScoopervisorId] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [createTeamModalOpen, setCreateTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [projects, setProjects] = useState([]);
  const [scoopervisors, setScoopervisors] = useState([]);
  const [selectedScoopervisorId, setSelectedScoopervisorId] = useState("");
  const [semesterGroups, setSemesterGroups] = useState([]);
  const [filterSemesterGroupId, setFilterSemesterGroupId] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [editedTeamName, setEditedTeamName] = useState("");
  const [editedTeamStatus, setEditedTeamStatus] = useState("active");
  const [editedSemesterGroupId, setEditedSemesterGroupId] = useState("");
  const [newTeamStatus, setNewTeamStatus] = useState("active");
  const [newTeamSemesterGroupId, setNewTeamSemesterGroupId] = useState("");

  const theme = useTheme();

  const fetchTeams = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTeams(data);
      } else if (Array.isArray(data?.teams)) {
        setTeams(data.teams);
      } else {
        console.error("Unexpected teams response:", data);
        setTeams([]);
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/project`
        );
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      }
    }
    fetchProjects();
  }, []);

  useEffect(() => {
    async function fetchScoopervisors() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/supervisors`
        );
        const data = await res.json();
        setScoopervisors(data);
      } catch(err) {
        console.error("Failed to fetch Scoopervisors:", err);
      }
    }
    fetchScoopervisors();
  }, []);

  useEffect(() => {
    async function fetchSemesterGroups() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/semestergroup`);
        const data = await res.json();
        setSemesterGroups(data);
      } catch (err) {
        console.error("Failed to fetch semester groups:", err);
      }
    }
    fetchSemesterGroups();
  }, []);

  const getProjectId = (team) =>
    team?.project?.id ?? team?.projectId ?? "";

  const getScoopervisorId = (team) =>
    team?.scoopervisor?.id ?? team?.scoopervisorId ?? "";

  const filteredTeams = useMemo(() => {
    const teamList = Array.isArray(teams) ? teams : [];
    return teamList.filter((team) => {
      if (filterProjectId !== "ALL" && String(getProjectId(team)) !== String(filterProjectId)) {
        return false;
      }
      if (filterScoopervisorId !== "ALL" && String(getScoopervisorId(team)) !== String(filterScoopervisorId)) {
        return false;
      }
      if (filterSemesterGroupId !== "ALL") {
        const semesterGroupId = team.semesterGroupId ?? team.SemesterGroup?.id ?? "";
        if (String(semesterGroupId) !== String(filterSemesterGroupId)) {
          return false;
        }
      }
      if (filterStatus !== "ALL") {
        if (String(team.status || "").toLowerCase() !== String(filterStatus).toLowerCase()) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const haystack = `${team.name || ""} ${team.project?.display_name || ""} ${team.scoopervisor?.fname || ""} ${team.scoopervisor?.lname || ""} ${team.SemesterGroup?.name || ""} ${team.status || ""}`.toLowerCase();
        if (!haystack.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [teams, filterProjectId, filterScoopervisorId, filterSemesterGroupId, filterStatus, searchQuery]);

  const openEditModal = (team) => {
    setActiveTeam(team);
    setSelectedScoopervisorId(String(getScoopervisorId(team) || ""));
    setEditedTeamName(team?.name || "");
    setEditedTeamStatus(team?.status || "active");
    setEditedSemesterGroupId(String(team?.semesterGroupId ?? team?.SemesterGroup?.id ?? ""));
    setOpenModal("edit");
  };

  const handleSaveTeam = async () => {
    if (!activeTeam) return;
    try {
      const updates = {};
      const scoopervisorId = selectedScoopervisorId ? Number(selectedScoopervisorId) : null;
      const semesterGroupId = editedSemesterGroupId ? Number(editedSemesterGroupId) : null;
      const trimmedName = editedTeamName?.trim();
      const normalizedStatus = editedTeamStatus?.trim().toLowerCase() || "active";

      if (trimmedName && trimmedName !== activeTeam.name) {
        updates.name = trimmedName;
      }
      if (String(getScoopervisorId(activeTeam)) !== String(scoopervisorId)) {
        updates.scoopervisorId = scoopervisorId;
      }
      if (String(activeTeam.semesterGroupId ?? activeTeam?.SemesterGroup?.id ?? "") !== String(semesterGroupId)) {
        updates.semesterGroupId = semesterGroupId;
      }
      if (String(activeTeam.status || "active").toLowerCase() !== normalizedStatus) {
        updates.status = normalizedStatus;
      }

      if (Object.keys(updates).length > 0) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId: activeTeam.id, ...updates }),
        });
        if (!res.ok) throw new Error("Failed to save team");
      }

      await fetchTeams();
      setOpenModal(null);
      setActiveTeam(null);
      setSelectedScoopervisorId("");
      setEditedTeamName("");
      setEditedSemesterGroupId("");
      setEditedTeamStatus("active");
    } catch (err) {
      console.error("Error saving team:", err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/employees?search=${encodeURIComponent(userSearch)}`
        );
        if (!res.ok) throw new Error("Failed to fetch users");
        const users = await res.json();
        setUserResults(users);
      } catch (err) {
        console.error(err);
        setUserResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [userSearch]);

  async function handleDeleteTeam() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/teams/${activeTeam.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete team");

      setTeams((prev) => prev.filter((t) => t.id !== activeTeam.id));
      setActiveTeam(null);
      setOpenModal(null);
      setDeleteConfirmOpen(false);
    } catch (err) {
      console.error("Error deleting team:", err);
    }
  }

  return (
    <Box
      sx={{
        fontFamily: '"Helvetica Neue", Helvetica, Roboto, Arial, sans-serif',
      }}
    >
      <Header />

      <Container maxWidth="xl" sx={{ py: 4, width: "100%" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography variant="h1">Teams Overview</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedScoopervisorId("");
              setNewTeamName("");
              setNewTeamStatus("active");
              setNewTeamSemesterGroupId("");
              setCreateTeamModalOpen(true);
            }}
          >
            New Team
          </Button>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <Button
              variant="outline-orange"
              startIcon={<FilterAltOutlinedIcon />}
              onClick={() => setFilterDialogOpen(true)}
            >
              Filter
            </Button>
            {filterProjectId !== "ALL" && (
              <Chip
                size="medium"
                label={`Project: ${projects.find((p) => String(p.id) === filterProjectId)?.display_name || "Unknown"}`}
                onDelete={() => setFilterProjectId("ALL")}
                sx={{ bgcolor: theme.palette.info.main, color: theme.ritColors.white }}
              />
            )}
            {filterScoopervisorId !== "ALL" && (
              <Chip
                size="medium"
                label={`Scoopervisor: ${scoopervisors.find((s) => String(s.id) === filterScoopervisorId)?.fname} ${scoopervisors.find((s) => String(s.id) === filterScoopervisorId)?.lname}`}
                onDelete={() => setFilterScoopervisorId("ALL")}
                sx={{ bgcolor: theme.palette.info.main, color: theme.ritColors.white }}
              />
            )}
            {filterSemesterGroupId !== "ALL" && (
              <Chip
                size="medium"
                label={`Semester: ${semesterGroups.find((s) => String(s.id) === filterSemesterGroupId)?.name || "Unknown"}`}
                onDelete={() => setFilterSemesterGroupId("ALL")}
                sx={{ bgcolor: theme.palette.info.main, color: theme.ritColors.white }}
              />
            )}
            {filterStatus !== "ALL" && (
              <Chip
                size="medium"
                label={filterStatus === "active" ? "Active" : filterStatus === "inactive" ? "Inactive" : filterStatus}
                onDelete={() => setFilterStatus("ALL")}
                sx={{ bgcolor: theme.palette.info.main, color: theme.ritColors.white }}
              />
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 280 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                  </InputAdornment>
                ),
              }}
            />
            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={(_, next) => next && setView(next)}
              size="small"
            >
              <ToggleButton value="table" aria-label="table view">
                <TableRowsIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="grid" aria-label="grid view">
                <GridViewIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
            <CircularProgress color="warning" />
          </Box>
        ) : filteredTeams.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            No teams found for the current filters.
          </Typography>
        ) : view === "table" ? (
          <Paper elevation={1} square sx={{ width: "100%", overflow: "auto" }}>
            <Table stickyHeader sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>Name</TableCell>
                  <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>Project</TableCell>
                  <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>Semester Group</TableCell>
                  <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>Scoopervisor</TableCell>
                  <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>Status</TableCell>
                  <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>Members</TableCell>
                  <TableCell align="right" sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>Options</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTeams.map((team) => (
                  <TableRow key={team.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {team.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{team.project?.display_name || "No project assigned"}</TableCell>
                    <TableCell>{team.SemesterGroup?.name || "No semester group"}</TableCell>
                    <TableCell>
                      {team.scoopervisor?.fname
                        ? `${team.scoopervisor.fname} ${team.scoopervisor.lname}`
                        : "No Scoopervisor"}
                    </TableCell>
                    <TableCell>
                      {team.status ? (
                        <StatusBadge value={team.status} type="active" size="small" />
                      ) : (
                        "No status"
                      )}
                    </TableCell>
                    <TableCell>
                      {Array.isArray(team.members) && team.members.length > 0
                        ? team.members.map((member) => `${member.fname} ${member.lname}`).join(", ")
                        : "No members"}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outline-orange"
                        onClick={() => openEditModal(team)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 3 }}>
            {filteredTeams.map((team) => (
              <Card
                square
                key={team.id}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: theme.palette.background.paper,
                  boxShadow: theme.palette.mode === "light" ? "0 12px 24px rgba(15, 23, 42, 0.04)" : "0 10px 20px rgba(0, 0, 0, 0.16)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 280,
                }}
              >
                <Box>
                  <Typography variant="h2" sx={{ fontSize: "1.25rem", fontWeight: 700, mb: 1 }}>
                    {team.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 72 }}>
                    {team.project?.display_name
                      ? `Project: ${team.project.display_name}`
                      : "No project assigned"}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                    <Chip size="small" label={team.SemesterGroup?.name || "No semester group"} variant="outlined" />
                    {team.status ? (
                      <StatusBadge value={team.status} type="active" size="small" />
                    ) : (
                      <Chip size="small" label="No status" variant="outlined" />
                    )}
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                    {team.scoopervisor?.id ? (
                      <Chip size="small" label={`${team.scoopervisor.fname} ${team.scoopervisor.lname}`} variant="outlined" />
                    ) : (
                      <Chip size="small" label="No scoopervisor" variant="outlined" />
                    )}
                    {Array.isArray(team.members) && team.members.length > 0 ? (
                      team.members.map((member) => (
                        <Chip
                          key={`member-${member.id}`}
                          size="small"
                          label={`${member.fname} ${member.lname}`}
                          variant="outlined"
                        />
                      ))
                    ) : (
                      <Chip size="small" label="No members" variant="outlined" />
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2, flexWrap: "wrap" }}>
                  <Button variant="outline-orange" onClick={() => openEditModal(team)}>
                    Edit
                  </Button>
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Container>

      <Dialog open={openModal === "edit"} onClose={() => setOpenModal(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Team</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Team Name"
              value={editedTeamName}
              onChange={(e) => setEditedTeamName(e.target.value)}
            />
            <TextField
              select
              fullWidth
              label="Scoopervisor"
              value={selectedScoopervisorId}
              onChange={(e) => setSelectedScoopervisorId(e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {scoopervisors.map((svr) => (
                <MenuItem key={svr.id} value={svr.id}>
                  {`${svr.fname} ${svr.lname}`}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              fullWidth
              label="Semester Group"
              value={editedSemesterGroupId}
              onChange={(e) => setEditedSemesterGroupId(e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {semesterGroups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              fullWidth
              label="Status"
              value={editedTeamStatus}
              onChange={(e) => setEditedTeamStatus(e.target.value)}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
            <Box>
              <Typography sx={{ fontWeight: 500, mb: 1 }}>Members</Typography>
              {Array.isArray(activeTeam?.members) && activeTeam.members.length > 0 ? (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {activeTeam.members.map((member) => (
                    <Chip
                      key={member.id}
                      label={`${member.fname} ${member.lname}`}
                      sx={{ backgroundColor: "#F76902", color: "#fff" }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: "#999" }}>
                  No members assigned
                </Typography>
              )}
            </Box>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setAddMemberModalOpen(true)}
            >
              Add Members
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outline-orange" onClick={() => setOpenModal(null)}>
            Cancel
          </Button>
          <Button variant="outline-orange" color="error" onClick={() => setDeleteConfirmOpen(true)}>
            Delete
          </Button>
          <Button variant="contained" onClick={handleSaveTeam}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <FilterDialog
        open={filterDialogOpen}
        title="Filter Teams"
        onCancel={() => setFilterDialogOpen(false)}
        onSubmit={() => setFilterDialogOpen(false)}
        actionLabel="Apply"
        actionButtonProps={{ variant: "solid-orange" }}
        secondaryAction={
          <Button
            variant="outline-orange"
            color="inherit"
            onClick={() => {
              setFilterProjectId("ALL");
              setFilterScoopervisorId("ALL");
              setFilterSemesterGroupId("ALL");
              setFilterStatus("ALL");
              setSearchQuery("");
            }}
          >
            Reset
          </Button>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            select
            fullWidth
            label="Project"
            value={filterProjectId}
            onChange={(e) => setFilterProjectId(e.target.value)}
          >
            <MenuItem value="ALL">All</MenuItem>
            {projects.map((proj) => (
              <MenuItem key={proj.id} value={String(proj.id)}>
                {proj.display_name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Scoopervisor"
            value={filterScoopervisorId}
            onChange={(e) => setFilterScoopervisorId(e.target.value)}
          >
            <MenuItem value="ALL">All</MenuItem>
            {scoopervisors.map((svr) => (
              <MenuItem key={svr.id} value={String(svr.id)}>
                {`${svr.fname} ${svr.lname}`}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Semester Group"
            value={filterSemesterGroupId}
            onChange={(e) => setFilterSemesterGroupId(e.target.value)}
          >
            <MenuItem value="ALL">All</MenuItem>
            {semesterGroups.map((group) => (
              <MenuItem key={group.id} value={String(group.id)}>
                {group.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="ALL">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
        </Box>
      </FilterDialog>

      {/* Delete confirmation modal */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the team <strong>{activeTeam?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outline-orange" onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="outline-orange" color="error" onClick={handleDeleteTeam}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Search Dialog */}
      <Dialog
        open={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Search Users to Add</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Search by first or last name"
            variant="outlined"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            autoFocus
            sx={{ mb: 2 }}
          />

          {searchLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {!searchLoading &&
            userResults.filter(
              (user) =>
                !activeTeam?.members?.some((member) => member.id === user.id)
            ).length === 0 &&
            userSearch.trim() !== "" && (
              <Typography sx={{ color: "#999", mb: 2 }}>
                No matching results
              </Typography>
            )}

          <Box
            sx={{
              maxHeight: 200,
              overflowY: "auto",
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              mb: 1,
            }}
          >
            {userResults.map((user) => {
              const isMember = activeTeam?.members?.some(
                (member) => member.id === user.id
              );

              return (
                <Chip
                  key={user.id}
                  label={`${user.fname} ${user.lname}`}
                  clickable={!isMember}
                  color={isMember ? "default" : "primary"}
                  variant="outlined"
                  disabled={isMember}
                  sx={{
                    borderRadius: "16px",
                    opacity: isMember ? 0.5 : 1,
                    cursor: isMember ? "not-allowed" : "pointer",
                  }}
                  onClick={async () => {
                    if (isMember) return; // ignore clicks on disabled chips

                    try {
                      console.log(
                        "Adding user to team:",
                        activeTeam.id,
                        user.id
                      );
                      const res = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/teams/${activeTeam.id}/members`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: user.id }),
                        }
                      );

                      if (!res.ok) throw new Error("Failed to add member");

                      const updatedTeam = await res.json();

                      setTeams((prev) =>
                        prev.map((t) =>
                          t.id === activeTeam.id ? updatedTeam.team : t
                        )
                      );
                      setActiveTeam(updatedTeam.team);
                      setAddMemberModalOpen(false);
                    } catch (error) {
                      console.error("Add member error:", error);
                      alert("Failed to add member. Please try again.");
                    }
                  }}
                />
              );
            })}
          </Box>
        </DialogContent>
      </Dialog>

      {/* New Team Dialog */}
      <Dialog
        open={createTeamModalOpen}
        onClose={() => setCreateTeamModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Create New Team</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Team Name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            select
            fullWidth
            label="Scoopervisor (optional)"
            value={selectedScoopervisorId}
            onChange={(e) => setSelectedScoopervisorId(e.target.value)}
            sx={{ mb: 3 }}
          >
            <MenuItem value="">None</MenuItem>
            {scoopervisors.map((svr) => (
              <MenuItem key={svr.id} value={svr.id}>
                {`${svr.fname} ${svr.lname}`}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Semester Group (optional)"
            value={newTeamSemesterGroupId}
            onChange={(e) => setNewTeamSemesterGroupId(e.target.value)}
            sx={{ mb: 3 }}
          >
            <MenuItem value="">None</MenuItem>
            {semesterGroups.map((group) => (
              <MenuItem key={group.id} value={group.id}>
                {group.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Status"
            value={newTeamStatus}
            onChange={(e) => setNewTeamStatus(e.target.value)}
            sx={{ mb: 3 }}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateTeamModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            disabled={!newTeamName.trim()}
            onClick={async () => {
              try {
                const body = {
                  name: newTeamName,
                  status: newTeamStatus,
                  ...(newTeamSemesterGroupId
                    ? { semesterGroupId: Number(newTeamSemesterGroupId) }
                    : {}),
                  scoopervisorId: selectedScoopervisorId === "" ? null : selectedScoopervisorId,
                };

                const res = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/api/teams`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                  }
                );

                if (!res.ok) throw new Error("Failed to create team");
                const allTeamsRes = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/api/teams`
                );
                if (!allTeamsRes.ok)
                  throw new Error("Failed to fetch teams after creation");
                const allTeams = await allTeamsRes.json();
                setTeams(
                  Array.isArray(allTeams)
                    ? allTeams
                    : Array.isArray(allTeams?.teams)
                    ? allTeams.teams
                    : []
                );
                setNewTeamName("");
                setSelectedScoopervisorId("");
                setNewTeamSemesterGroupId("");
                setNewTeamStatus("active");
                setCreateTeamModalOpen(false);
              } catch (err) {
                console.error("Error creating team:", err);
                alert("Failed to create team. Please try again.");
              }
            }}
          >
            Create Team
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
