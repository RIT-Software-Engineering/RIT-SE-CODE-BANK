"use client";

import React, { useEffect, useState } from "react";
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
  MenuItem,
  useTheme,
  Chip,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import StatusBadge from "@components/StatusBadge";

/**
 * This is the component that fetches and displays a list of projects.
 *
 * @returns {JSX.Element} The elements that make up the Projects page.
 * @throws {Error} If the fetch request fails, an error is logged to the console.
 */
export default function Projects() {
  const theme = useTheme();
  const [projects, setProjects] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [semesterGroups, setSemesterGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
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

  const projectCounts = {
    total: projects.length,
    active: projects.filter((project) => (project.status || "").toLowerCase() === "active").length,
    inProgress: projects.filter((project) => (project.status || "").toLowerCase() === "in progress").length,
    completed: projects.filter((project) => (project.status || "").toLowerCase() === "completed").length,
    inactive: projects.filter((project) => (project.status || "").toLowerCase() === "inactive").length,
    other: projects.filter(
      (project) => !["active", "in progress", "completed", "inactive"].includes((project.status || "").toLowerCase())
    ).length,
  };


  if (loading) {
    return <ProjectsLoading />;
  }

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="h1">Projects</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateModal}>Create Project</Button>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 2, mb: 4 }}>
          {[
            { label: "Total Projects", value: projectCounts.total },
            { label: "Active", value: projectCounts.active },
            { label: "In Progress", value: projectCounts.inProgress },
            { label: "Completed", value: projectCounts.completed },
            { label: "Inactive", value: projectCounts.inactive },
          ].map((stat) => (
            <Paper
              key={stat.label}
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: theme.palette.mode === "light" ? theme.palette.grey[50] : theme.palette.background.paper,
                borderColor: theme.palette.divider,
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
              }}
            >
              <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{stat.value}</Typography>
            </Paper>
          ))}
        </Box>

        {projects.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            No projects found. Check back later or create a new project.
          </Typography>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 3 }}>
            {projects.map((project) => (
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
                        <Chip key={team.id} size="small" label={team.name} variant="outlined" />
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
    </>
  );
}
