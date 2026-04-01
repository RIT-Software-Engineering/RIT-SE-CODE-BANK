"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@components/Header";
import ProjectsLoading from "./loading";
import {
  Box,
  Button,
  Card,
  Container,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  Autocomplete,
  InputLabel,
  MenuItem,
  Select,
  useTheme,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import TableRowsIcon from "@mui/icons-material/TableRows";
import GridViewIcon from "@mui/icons-material/GridView";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StatusBadge from "@components/StatusBadge";

/**
 * This is the component that fetches and displays a list of projects.
 *
 * @returns {JSX.Element} The elements that make up the Projects page.
 * @throws {Error} If the fetch request fails, an error is logged to the console.
 */
export default function Projects() {
  const theme = useTheme();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [semesterGroups, setSemesterGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [view, setView] = useState("table");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterSemesterGroup, setFilterSemesterGroup] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({
    title: "",
    display_name: "",
    description: "",
    status: "active",
    teams: "",
    semesterGroupId: "",
  });

  useEffect(() => {
    console.log("API URL: ", process.env.NEXT_PUBLIC_API_URL);
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const [projectRes, teamRes, semestersRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project`), 
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/semestergroup`),
        ]);

        const [projects, loadedTeams, semesterGroups] = await Promise.all([
          projectRes.json(),
          teamRes.json(),
          semestersRes.json(),
        ]);
        setProjects(projects);
        const teamMap = {};
        loadedTeams.forEach((team) => {
          teamMap[team.id] = team.name;
        });
        setAllTeams(teamMap);
        const semesterGroupMap = {};
        semesterGroups.forEach((group) => {
          semesterGroupMap[group.id] = group.name;
        });
        setSemesterGroups(semesterGroupMap);
    
      } catch (err) {
        console.error("Failed to fetch projects: ", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const STATUS_OPTIONS = ["ALL", "ACTIVE", "IN PROGRESS", "COMPLETED", "INACTIVE"];

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const status = (project.status || "").toUpperCase();
      if (filterStatus !== "ALL" && status !== filterStatus) {
        return false;
      }
      if (filterSemesterGroup !== "ALL" && String(project.semesterGroupId) !== String(filterSemesterGroup)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const haystack = `${project.title || ""} ${project.display_name || ""} ${project.description || ""}`.toLowerCase();
        if (!haystack.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [projects, filterStatus, filterSemesterGroup, searchQuery]);

  const openCreateModal = () => {
    setEditingProject(null);
    setForm({ title: "", display_name: "", description: "", status: "active", teams: "", semesterGroupId: "" });
    setCreateModalOpen(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setForm({
      title: project.title || "",
      display_name: project.display_name || "",
      description: project.description || "",
      status: project.status || "active",
      teams: (project.teams || []).map(t => (t && t.id) ? t.id.toString() : t),
      semesterGroupId: project.semesterGroupId ?? "",
    });
    setCreateModalOpen(true);
  };

  const closeModal = () => {
    setCreateModalOpen(false);
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const teamsArray = form.teams ? form.teams.map(s => Number(s.trim())).filter(Boolean) : [];
    const payload = {
      title: form.title,
      display_name: form.display_name,
      description: form.description,
      status: form.status,
      teams: teamsArray,
      semesterGroupId: form.semesterGroupId ? Number(form.semesterGroupId) : undefined,
    };

    try {
      if (editingProject) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project/${editingProject.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        // const updated = await res.json();
        // setProjects(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      } else {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        // const body = await res.json();
        // const newProject = body.project || body;
        // setProjects(prev => [newProject, ...prev]);
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project`);
      setProjects(await res.json());
      closeModal();
    } catch (err) {
      console.error("Failed to save project", err);
    }
  };

  if (loading) {
    return <ProjectsLoading />;
  }

  return (
    <Box sx={{ backgroundColor: (theme) => theme.palette.grey[100], minHeight: "100vh" }}>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4, maxWidth: "1280px" }}>
        <IconButton onClick={() => router.back()} aria-label="back">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h1" sx={{ mb: 3 }}>
          Projects
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 2, mb: 3 }}>
          <Box />
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateModal}>Create Project</Button>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 3 }}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <Button variant="outline-orange" startIcon={<FilterAltOutlinedIcon />} onClick={() => setFilterDialogOpen(true)}>
              Filter
            </Button>
            {filterStatus !== "ALL" && (
              <Chip
                size="medium"
                label={filterStatus.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                onDelete={() => setFilterStatus("ALL")}
                sx={{ bgcolor: theme.palette.info.main, color: theme.ritColors.white }}
              />
            )}
            {filterSemesterGroup !== "ALL" && (
              <Chip
                size="medium"
                label={`Semester: ${semesterGroups[filterSemesterGroup] || "Unknown"}`}
                onDelete={() => setFilterSemesterGroup("ALL")}
                sx={{ bgcolor: theme.palette.info.main, color: theme.ritColors.white }}
              />
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder="Search projects..."
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
              onChange={(_, val) => val && setView(val)}
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

        {projects.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            No projects found. Check back later or create a new project.
          </Typography>
        ) : filteredProjects.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            No matching projects found for the current filters.
          </Typography>
        ) : view === "table" ? (
          <Paper elevation={1} square sx={{ width: "100%", maxHeight: 520, overflow: "auto" }}>
            <Table stickyHeader sx={{ width: "100%", minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>Project</TableCell>
                  <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>Semester</TableCell>
                  <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>Teams</TableCell>
                  <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>Status</TableCell>
                  <TableCell align="right" sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>Options</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {project.display_name || project.title || "Untitled Project"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {project.description || "No description available."}
                      </Typography>
                    </TableCell>
                    <TableCell>{semesterGroups[project.semesterGroupId] || "No semester"}</TableCell>
                    <TableCell>
                      {Array.isArray(project.teams) && project.teams.length > 0
                        ? project.teams.map((team) => team?.name || allTeams[team?.id] || team).join(", ")
                        : "No teams"}
                    </TableCell>
                    <TableCell>
                      {project.status ? <StatusBadge value={project.status} type="project" size="small" /> : "—"}
                    </TableCell>
                    <TableCell align="right">
                      <Button variant="outline-orange" onClick={() => openEditModal(project)}>
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
            {filteredProjects.map((project) => (
              <Card
                square
                key={project.id}
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
                    {project.display_name || project.title || "Untitled Project"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 72 }}>
                    {project.description || "No project description available."}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                    <Chip size="small" label={semesterGroups[project.semesterGroupId] || "No semester"} variant="outlined" />
                    {project.teams && project.teams.length > 0 ? (
                      project.teams.map((team) => (
                        <Chip key={team.id || team} size="small" label={team.name || allTeams[team] || team} variant="outlined" />
                      ))
                    ) : (
                      <Chip size="small" label="No teams" variant="outlined" />
                    )}
                    {project.status ? (
                      <StatusBadge value={project.status} type="project" size="small" />
                    ) : null}
                  </Box>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2, flexWrap: "wrap" }}>
                  <Button variant="outline-orange" onClick={() => openEditModal(project)}>
                    Edit
                  </Button>
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Container>

      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Filter Projects</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status === "ALL" ? "All" : status.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Semester</InputLabel>
              <Select
                value={filterSemesterGroup}
                label="Semester"
                onChange={(e) => setFilterSemesterGroup(e.target.value)}
              >
                <MenuItem value="ALL">All</MenuItem>
                {Object.entries(semesterGroups).map(([id, name]) => (
                  <MenuItem key={id} value={id}>{name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, gap: 0.5 }}>
          <Button variant="outlined" color="inherit" onClick={() => { setFilterStatus("ALL"); setFilterSemesterGroup("ALL"); setSearchQuery(""); }}>
            Reset
          </Button>
          <Button variant="solid-orange" onClick={() => setFilterDialogOpen(false)}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createModalOpen} onClose={closeModal} fullWidth maxWidth="sm">
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingProject ? "Edit Project" : "Create Project"}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              margin="normal"
              label="Title"
              name="title"
              value={form.title}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Display Name"
              name="display_name"
              value={form.display_name}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
              multiline
              minRows={3}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Status"
              name="status"
              value={form.status}
              onChange={handleChange}
              select
            >
              {[
                { value: "active", label: "Active" },
                { value: "in progress", label: "In Progress" },
                { value: "completed", label: "Completed" },
                { value: "inactive", label: "Inactive" },
              ].map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
             <FormControl fullWidth>
              <Autocomplete
                multiple
                options={Object.entries(allTeams).map(([id, name]) => ({
                  label: name,
                  value: id,
                }))}
                getOptionLabel={(option) => option.label}
                value={form.teams ? form.teams.map(teamID => {
                  const teamName = allTeams[teamID];
                  return { label: teamName, value: teamID };
                }) : []}
                isOptionEqualToValue={(option, value) => option?.value === value?.value}
                onChange={(event, selected) =>
                  setForm((prev) => ({
                    ...prev,
                    teams: selected ? selected.map(option => option.value) : [],
                  }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Teams"
                    variant="outlined"
                    fullWidth
                  />
                )}
                sx={{ my: 2 }}
              />
            </FormControl>
            <FormControl fullWidth>
              <Autocomplete
                options={Object.entries(semesterGroups).map(([id, name]) => ({
                  label: name,
                  value: id,
                }))}
                getOptionLabel={(option) => option.label}
                value={Object.entries(semesterGroups).map(([id, name]) => ({ label: name, value: Number(id) })).find(opt => opt.value === Number(form.semesterGroupId)) || null}
                isOptionEqualToValue={(option, value) => option?.value === value?.value}
                onChange={(event, newValue) =>
                  setForm((prev) => ({
                    ...prev,
                    semesterGroupId: newValue ? newValue.value : "",
                  }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Semester"
                    variant="outlined"
                    fullWidth
                    required
                  />
                )}
                sx={{ my: 2 }}
              />
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
