"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  Chip,
  Divider,
  CircularProgress,
  Button,
  Modal,
  TextField,
} from "@mui/material";
import Header from "../../_components/Header";

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTeam, setActiveTeam] = useState(null);
  const [openModal, setOpenModal] = useState(null);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [createTeamModalOpen, setCreateTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projects, setProjects] = useState([]);
  const [scoopervisors, setScoopervisors] = useState([]);
  const [selectedScoopervisorId, setSelectedScoopervisorId] = useState("");

  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`);
        const data = await res.json();
        setTeams(data);
      } catch (error) {
        console.error("Failed to fetch teams:", error);
      } finally {
        setLoading(false);
      }
    }
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

      <Container maxWidth="lg" sx={{ py: 4, maxWidth: "1280px" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h1">Teams Overview</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setCreateTeamModalOpen(true)}
          >
            New Team
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
            <CircularProgress color="warning" />
          </Box>
        ) : (
          <Grid container spacing={4}>
            {teams.map((team, index) => (
              <Grid
                item
                xs={12}
                md={6}
                lg={4}
                key={team.id ?? `temp-team-${index}`}
              >
                <Paper elevation={2} sx={{ borderRadius: 4, p: 3 }}>
                  <Typography
                    variant="h2"
                    sx={{ fontSize: "1.5rem", fontWeight: 700, mb: 1 }}
                  >
                    {team.name}
                  </Typography>
                  <Typography sx={{ fontSize: "1rem", color: "#666", mb: 2 }}>
                    Project:{" "}
                    {team.project?.display_name || "No project assigned"}
                  </Typography>

                  <Divider sx={{ my: 2 }} />
                  <Typography sx={{ fontWeight: 500, mb: 1 }}>
                    Scoopervisor:
                  </Typography>
                  {team.scoopervisorId != "" ? (
                    <Chip
                      key={team.scoopervisor.id}
                      label={`${team.scoopervisor.fname} ${team.scoopervisor.lname}`}
                      sx={{ backgroundColor: "#F76902", color: "#fff" }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ color: "#999" }}>
                      No Scoopervisor assigned
                    </Typography>
                  )

                  }
                  <Typography sx={{ fontWeight: 500, mb: 1 }}>
                    Members:
                  </Typography>
                  {Array.isArray(team.members) && team.members.length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {team.members.map((member) => (
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

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                    {/* Added a button for changing the project but not sure if it's even needed. Something to discuss. */}
                    { <Button
                      size="small"
                      variant="contained"
                      color="warning"
                      onClick={() => {
                        setActiveTeam(team);
                        setOpenModal('project');
                      }}
                    >
                      Change Project
                    </Button> }

                    <Button
                      size="small"
                      variant="contained"
                      color="info"
                      onClick={() => {
                        setActiveTeam(team);
                        setOpenModal("members");
                      }}
                    >
                      Edit Members
                    </Button>

                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      onClick={() => {
                        setActiveTeam(team);
                        setOpenModal("scoopervisor");
                      }}
                    >
                      Change Scoopervisor
                    </Button>

                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={() => {
                        setActiveTeam(team);
                        setOpenModal("delete");
                      }}
                    >
                      Delete Team
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Modal for project and members */}
      <Modal
        open={!!openModal && openModal !== "delete"}
        onClose={() => setOpenModal(null)}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          {openModal === "project" && (
            <>
              <Typography variant="h6" mb={2} fontWeight="bold">
                Change Project for {activeTeam?.name}
              </Typography>
              <TextField
                select
                fullWidth
                label="Project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                slotProps={{ select: { native: true } }}
                sx={{ mb: 3 }}
              >
                <option value=""></option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.display_name}
                  </option>
                ))}
              </TextField>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={async () => {
                        try {
                          const res = await fetch(
                            `${process.env.NEXT_PUBLIC_API_URL}/api/teams`,
                            { method: "PUT",
                              headers: {"Content-Type": "application/json"},
                              body: JSON.stringify({teamId:activeTeam.id,projectId:selectedProjectId})
                             }
                          );

                          if (!res.ok)
                            throw new Error("Failed to update team project");
                          const updatedTeam = await res.json();
                          setTeams((prev) =>
                            prev.map((t) =>
                              t.id === activeTeam.id ? updatedTeam.team : t
                            )
                          );
                          setActiveTeam(updatedTeam.team);
                          setOpenModal(null);
                        } catch (err) {
                          console.error("Error updating team project:", err);
                        }
                        setSelectedProjectId("")
                      }}
              >
                Save
              </Button>
            </>
          )}

          {openModal === "members" && (
            <>
              <Typography variant="h6" mb={2} fontWeight="bold">
                Edit Members for {activeTeam?.name}
              </Typography>

              {Array.isArray(activeTeam?.members) &&
                activeTeam.members.map((member) => (
                  <Box
                    key={member.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1.5,
                    }}
                  >
                    <Typography>
                      {member.fname} {member.lname}
                    </Typography>
                    <Button
                      size="small"
                      color="error"
                      variant="contained"
                      onClick={async () => {
                        try {
                          const res = await fetch(
                            `${process.env.NEXT_PUBLIC_API_URL}/api/teams/${activeTeam.id}/members/${member.id}`,
                            { method: "DELETE" }
                          );

                          if (!res.ok)
                            throw new Error("Failed to remove member");

                          const updatedTeam = await res.json();
                          setTeams((prev) =>
                            prev.map((t) =>
                              t.id === activeTeam.id ? updatedTeam.team : t
                            )
                          );
                          setActiveTeam(updatedTeam.team);
                        } catch (err) {
                          console.error("Error removing member:", err);
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </Box>
                ))}
              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <Button
                  variant="solid-orange"
                  sx={{ flex: 1 }}
                  onClick={() => setAddMemberModalOpen(true)}
                >
                  Add Members
                </Button>
                <Button
                  variant="outline-orange"
                  sx={{ flex: 1 }}
                  onClick={() => setOpenModal(null)}
                >
                  Cancel
                </Button>
              </Box>
            </>
          )}
          {openModal === "scoopervisor" && (
            <>
              <Typography variant="h6" mb={2} fontWeight="bold">
                Change Scoopervisor for {activeTeam?.name}
              </Typography>
              <TextField
                select
                fullWidth
                label="Scoopervisor"
                value={selectedScoopervisorId}
                onChange={(e) => setSelectedScoopervisorId(e.target.value)}
                slotProps={{ select: { native: true } }}
                sx={{ mb: 3 }}
              >
                <option value=""></option>
                {scoopervisors.map((svr) => (
                  <option key={svr.id} value={svr.id}>
                    {`${svr.fname} ${svr.lname}`}
                  </option>
                ))}
              </TextField>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={async () => {
                        try {
                          const res = await fetch(
                            `${process.env.NEXT_PUBLIC_API_URL}/api/teams/scoopervisor`,
                            { method: "PUT",
                              headers: {"Content-Type": "application/json"},
                              body: JSON.stringify({teamId:activeTeam.id,scoopervisorId:selectedScoopervisorId})
                             }
                          );

                          if (!res.ok)
                            throw new Error("Failed to update Scoopervisor");
                          const updatedTeam = await res.json();
                          setTeams((prev) =>
                            prev.map((t) =>
                              t.id === activeTeam.id ? updatedTeam.team : t
                            )
                          );
                          setActiveTeam(updatedTeam.team);
                          setOpenModal(null);
                        } catch (err) {
                          console.error("Error updating Scoopervisor:", err);
                        }
                        setSelectedScoopervisorId("")
                      }}
              >
                Save
              </Button>
            </>
          )}

        </Box>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={openModal === "delete"} onClose={() => setOpenModal(null)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 380,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6" mb={3} fontWeight="bold">
            Confirm Delete
          </Typography>
          <Typography mb={3}>
            Are you sure you want to delete the team{" "}
            <strong>{activeTeam?.name}</strong>? This action cannot be undone.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button variant="outlined" onClick={() => setOpenModal(null)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteTeam}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Add Member Search Modal */}
      <Modal
        open={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            maxHeight: "70vh",
            overflowY: "auto",
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6" mb={2} fontWeight="bold">
            Search Users to Add
          </Typography>
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

          {/* Compute if no matching results after filtering out members */}
          {!searchLoading &&
            userResults.filter(
              (user) =>
                !activeTeam?.members?.some((member) => member.id === user.id)
            ).length === 0 &&
            userSearch.trim() !== "" && (
              <Typography sx={{ color: "#999" }}>
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
        </Box>
      </Modal>

      {/* New Team Modal */}
      <Modal
        open={createTeamModalOpen}
        onClose={() => setCreateTeamModalOpen(false)}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Create New Team
          </Typography>

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
            label="Project (optional)"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            slotProps={{ select: { native: true } }}
            sx={{ mb: 3 }}
          >
            <option value=""></option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.display_name}
              </option>
            ))}
          </TextField>

          <Button
            variant="contained"
            color="success"
            fullWidth
            disabled={!newTeamName.trim()}
            onClick={async () => {
              try {
                const body = {
                  name: newTeamName,
                  ...(selectedProjectId
                    ? { projectId: Number(selectedProjectId) }
                    : {}),
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

                setTeams(allTeams);
                setNewTeamName("");
                setSelectedProjectId("");
                setCreateTeamModalOpen(false);
              } catch (err) {
                console.error("Error creating team:", err);
                alert("Failed to create team. Please try again.");
              }
            }}
          >
            Create Team
          </Button>
        </Box>
      </Modal>

      <Box
        component="footer"
        sx={{
          width: "100%",
          height: "80px",
          bgcolor: "#212121",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, md: 3 },
          mt: 8,
          position: "fixed",
          bottom: 0,
          left: 0,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 300 }}>
          © {new Date().getFullYear()} RIT | Contact | Terms
        </Typography>
      </Box>
    </Box>
  );
}
