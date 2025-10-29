'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '../../../utils/user-context/page';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Chip,
  Divider,
  CircularProgress,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

export default function ManageTeams() {
  const { user } = useUser();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTeam, setActiveTeam] = useState(null);
  const [openModal, setOpenModal] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTeamData, setEditTeamData] = useState({ id: '', name: '', description: '' });
  const [newTeamData, setNewTeamData] = useState({ name: '', description: '' });

  useEffect(() => {
    async function fetchTeams() {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams?scoopervisorId=${user?.id}`);
        const data = await res.json();
        setTeams(data);
      } catch (err) {
        console.error('Failed to fetch teams:', err);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) fetchTeams();
  }, [user]);

  // Add/Edit/Delete handlers remain for prototyping
  const handleAddTeam = () => {
    const newTeam = {
      id: Math.random().toString(36).substr(2, 9),
      name: newTeamData.name,
      description: newTeamData.description,
      scoopervisorId: user?.id
    };
    setTeams([newTeam, ...teams]);
    setIsAddDialogOpen(false);
    setNewTeamData({ name: '', description: '' });
  };
  const handleEditTeam = () => {
    setTeams(teams.map(team => team.id === editTeamData.id ? editTeamData : team));
    setIsEditDialogOpen(false);
    setEditTeamData({ id: '', name: '', description: '' });
  };
  const handleDeleteTeam = (id) => {
    setTeams(teams.filter(team => team.id !== id));
  };

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ fontSize: '2rem', fontWeight: 900, color: '#fff', mb: 4 }}>
          My Teams
        </Typography>
        <Button variant="solid-orange" sx={{ mb: 2 }} onClick={() => setIsAddDialogOpen(true)}>
          Add Team
        </Button>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
            <CircularProgress color="warning" />
          </Box>
        ) : (
          <Grid container spacing={4}>
            {teams.map((team, index) => (
              <Grid item xs={12} md={6} lg={4} key={team.id ?? `temp-team-${index}`}>
                <Paper elevation={2} sx={{ borderRadius: 4, p: 3 }}>
                  <Typography variant="h2" sx={{ fontSize: "1.5rem", fontWeight: 700, mb: 1 }}>
                    {team.name}
                  </Typography>
                  <Typography sx={{ fontSize: "1rem", color: "#666", mb: 2 }}>
                    Project: {team.project?.display_name || "No project assigned"}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography sx={{ fontWeight: 500, mb: 1 }}>Members:</Typography>
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
                    <Button size="small" variant="contained" color="info" onClick={() => {
                      setActiveTeam(team);
                      setOpenModal("members");
                    }}>
                      Edit Members
                    </Button>
                    <Button size="small" variant="contained" color="error" onClick={() => {
                      setActiveTeam(team);
                      setOpenModal("delete");
                    }}>
                      Delete Team
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
      {/* Add/Edit dialogs remain for prototyping */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
        <DialogTitle>Add New Team</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Team Name"
            fullWidth
            value={newTeamData.name}
            onChange={e => setNewTeamData({ ...newTeamData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newTeamData.description}
            onChange={e => setNewTeamData({ ...newTeamData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
          <Button variant="solid-orange" onClick={handleAddTeam}>Add</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
        <DialogTitle>Edit Team</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Team Name"
            fullWidth
            value={editTeamData.name}
            onChange={e => setEditTeamData({ ...editTeamData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={editTeamData.description}
            onChange={e => setEditTeamData({ ...editTeamData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button variant="solid-orange" onClick={handleEditTeam}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
