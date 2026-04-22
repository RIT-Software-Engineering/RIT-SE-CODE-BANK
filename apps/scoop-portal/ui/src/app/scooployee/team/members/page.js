"use client";
import React, { useEffect, useState } from "react";
import Header from '@components/Header';
import { Container, Typography } from '@mui/material';
import { useUser } from "../../../utils/user-context/page";
import {
  Box,
  Grid,
  Paper,
  Chip,
  Divider,
  CircularProgress,
  Button,
  Modal,
  TextField,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";


export default function ViewTeamMembers() {
  const [teams, setTeams] = useState([]);
  const {user} = useUser();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [selectedFname, setSelectedFname] = useState('');
  const [selectedLname, setSelectedLname] = useState('');


  const handleOpen = (fname,lname,email) => {
    setSelectedEmail(email);
    setSelectedFname(fname);
    setSelectedLname(lname)
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedEmail('');
    setSelectedFname('');
    setSelectedLname('');
  };


  useEffect(() => {
    async function fetchTeammates() {
      if (user == null || user.fname == null){
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams/${user.id}`);
        const data = await res.json();
        setTeams(data);
      } catch (error) {
        console.error("Failed to fetch teams:", error);
      } 
    }
    fetchTeammates();
  }, [user]);


  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ fontSize: '2rem', fontWeight: 900, color: '#fff', mb: 4 }}>
          Your Team Members
        </Typography>
          <Grid container spacing={4}>
            {teams.map((team, index) => (
              <Grid
                item
                xs={12}
                md={6}
                lg={4}
                key={team.id ?? `temp-team-${index}`}
              >
                <Paper elevation={2} sx={{ borderRadius: 0, p: 3 }}>
                  <Typography
                    variant="h2"
                    sx={{ fontSize: "1.5rem", fontWeight: 700, mb: 1 }}
                  >
                    {team.name}
                  </Typography>
                  <Typography sx={{ fontSize: "1rem", color: theme.palette.text.secondary, mb: 2 }}>
                    Project:{" "}
                    {team.project?.display_name || "No project assigned"}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Typography sx={{ fontWeight: 500, mb: 1 }}>
                    Your Scoopervisor:
                  </Typography>
                  {team.scoopervisor != null ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        <Chip
                          key={team.scoopervisor.id}
                          label={`${team.scoopervisor.fname} ${team.scoopervisor.lname}`}
                          sx={{ backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText }}
                          onClick={() => handleOpen(team.scoopervisor.fname,team.scoopervisor.lname,team.scoopervisor.email)}
                        />
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      No scoopervisor assigned
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Typography sx={{ fontWeight: 500, mb: 1 }}>
                    Your Team Members:
                  </Typography>
                  {Array.isArray(team.members) && team.members.length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {team.members.filter((member) => member.type === "scooployee" && member.id !== user.id).map((member) => (
                        <Chip
                          key={member.id}
                          label={`${member.fname} ${member.lname}`}
                          sx={{ backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText }}
                          onClick={() => handleOpen(member.fname,member.lname,member.email)}
                        />
                        
                      ))}
                      {/* Modal to display contact information*/}
                      <Modal open={open} onClose={handleClose}>
                          <Box  sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: 400,
                            bgcolor: "background.paper",
                            borderRadius: 2,
                            boxShadow: 24,
                            p: 4,
                          }}>
                              <Typography variant="h6">{selectedFname} {selectedLname}</Typography>
                              <Divider sx={{ my: 2 }} />
                              <Typography variant="body1">{selectedEmail}</Typography>
                          </Box>
                      </Modal>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: "#999" }}>
                      No members assigned
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />


                </Paper>
              </Grid>
            ))}
          </Grid>
      </Container>
    </>
  );
}
