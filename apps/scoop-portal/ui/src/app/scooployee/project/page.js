"use client";
import React, { useEffect, useState } from "react";
import Header from '@components/Header';
import { Container, Typography } from '@mui/material';
import { useUser } from "../../utils/user-context/page";
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


export default function ViewTeamMembers() {
  const [projects, setProjects] = useState([]);
  const {user} = useUser();





  useEffect(() => {
    async function fetchProjects() {
      if (user == null || user.fname == null){
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams/${user.id}`);
        const data = await res.json();
        const loadedProjects = data.map(team =>team.project);
        setProjects(loadedProjects);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } 
    }
    fetchProjects();
  }, [user]);


  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ fontSize: '2rem', fontWeight: 900, color: '#fff', mb: 4 }}>
          Your Projects
        </Typography>
          <Grid container spacing={4}>
            {projects.map((project, index) => (
              <Grid
                item
                xs={12}
                md={6}
                lg={4}
                key={project.id ?? `temp-project-${index}`}
              >
                <Paper elevation={2} sx={{ borderRadius: 4, p: 3 }}>
                  <Typography
                    variant="h2"
                    sx={{ fontSize: "1.5rem", fontWeight: 700, mb: 1 }}
                  >
                    {project?.display_name || "No project assigned"}
                  </Typography>



                  <Divider sx={{ my: 2 }} />
                  <Typography sx={{ fontWeight: 500, mb: 1 }}>
                    Description:
                  </Typography>
                  <Typography sx={{ fontWeight: 500, mb: 1 }}>
                      {project?.description || "No description"}
                  </Typography>


                  <Divider sx={{ my: 2 }} />


                </Paper>
              </Grid>
            ))}
          </Grid>
      </Container>
    </>
  );
}
