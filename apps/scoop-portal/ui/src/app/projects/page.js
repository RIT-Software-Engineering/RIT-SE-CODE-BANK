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
  useTheme,
  Chip,
  Paper,
} from "@mui/material";

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
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState({
    title: "",
    display_name: "",
    description: "",
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
    setForm({ title: "", display_name: "", description: "", teams: "", semesterGroupId: "" });
    setCreateModalOpen(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setForm({
      title: project.title || "",
      display_name: project.display_name || "",
      description: project.description || "",
      teams: (project.teams || []).map(t => (t && t.id) ? t.id.toString() : t),
      semesterGroupId: project.semesterGroupId ?? "",
    });
    setCreateModalOpen(true);
  };

  const closeModal = () => {
    setCreateModalOpen(false);
  };

  const openViewModal = (project) => {
    setViewingProject(project);
    setViewModalOpen(true);
  }


  const closeViewModal = () => {
    setViewingProject([]);
    setViewModalOpen(false);
  }

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
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h1">Projects</Typography>
          <Button variant="contained" onClick={openCreateModal}>Create Project</Button>
        </Box>

        {projects.length === 0 ? (
          <Typography variant="body1">
            No projects found. Please check back later.
          </Typography>
        ) : (
          projects.map((project) => (
            <Card
              square
              key={project.id}
              sx={{
                padding: "1em",
                margin: "0.5rem",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="h2">
                  {project.display_name || project.title || "Unknown Project"}
                </Typography>
                <Box>
                  <Button sx={{ mr: 1 }} variant="outlined" onClick={() => openEditModal(project)}>Edit</Button>
                  <Button variant="solid-orange" onClick={() => openViewModal(project)}>View</Button>
                </Box>
              </Box>
              <Box
                sx={{
                  padding: "0.25em 0.75em",
                  display: "inline-block",
                  backgroundColor:
                    project.status === "active"
                      ? "rgba(0, 156, 189, 0.2)"
                      : project.status === "in progress"
                        ? "rgba(246, 190, 0, 0.2)"
                        : project.status === "completed"
                          ? "rgba(132, 189, 0, 0.2)"
                          : "rgba(124, 135, 142, 0.2)",
                  color:
                    project.status === "active"
                      ? theme.palette.info.main
                      : project.status === "in progress"
                        ? theme.palette.warning.main
                        : project.status === "completed"
                          ? theme.palette.success.main
                          : "rgb(124, 135, 142)",
                }}
              >
                <Typography sx={{ margin: "0" }}>
                  {project.status ? project.status.toUpperCase() : "UNKNOWN"}
                </Typography>
              </Box>
              <Typography>{project.description}</Typography>
            </Card>
          ))
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
            <Typography>{JSON.stringify(form)}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
      <Dialog open={viewModalOpen} onClose={closeViewModal} fullWidth maxWidth="sm">
        <Paper elevation={2} sx={{ borderRadius: 4, p: 3 }}>
          <Typography
            variant="h2"
            sx={{ fontSize: "1.5rem", fontWeight: 700, mb: 1 }}
            >
          {viewingProject.display_name}
          </Typography>
          <Typography sx={{ fontSize: "1rem", color: "#666", mb: 2 }}>
            Description:{" "}
            {viewingProject.description}
          </Typography>
          <Typography sx={{ fontWeight: 500, mb: 1 }}>
            Teams assigned:
          </Typography>
          {Array.isArray(viewingProject.teams) && viewingProject.teams.length > 0 ? (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {viewingProject.teams.map((team) => (
                  <Chip
                    key={team.id}
                    label={team.name}
                    sx={{ backgroundColor: "#F76902", color: "#fff" }}
                    
                    />
                ))}
            </Box>                   
          ) : (
            <Typography variant="body2" sx={{ color: "#999" }}>
              No teams assigned
            </Typography>
          )}
        </Paper>
      </Dialog>
    </>
  );
}
