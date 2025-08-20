// src/components/dashboard/LandingDashboard.js
'use client';

import SelectionCard from "@/components/dashboard/SelectionCard";
import { DASHBOARD_OPTIONS } from "@/configuration/dashboard.config";
import Link from "next/link";
import { Box, Container, Grid, Paper, Typography } from "@mui/material";

export default function LandingDashboard({ user }) {
  // filter options based on user role
  const userRole = user?.role;
  const PersonalOptions = DASHBOARD_OPTIONS.filter(
    (option) =>
      option.roles.includes(userRole) && option.category === "Personal"
  );
  const formattedUserRole = userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Personal Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h2" component="h1" mb={2}>
          Personal
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {PersonalOptions.map((option, index) => {
            const finalLink =
              option.link.includes("[username]") && user
                ? option.link.replace("[username]", user.username)
                : option.link;

            return (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <SelectionCard text={option.text} link={finalLink} />
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* --- Integrated Explore Section --- */}
      <Box sx={{ width: '100%', textAlign: 'center', mt: 10 }}>
        <Typography variant="h3" component="h1" mb={2}>
          Explore
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <Paper
            component={Link}
            href={`/Positions/${formattedUserRole}/${user.username}`}
            elevation={3}
            sx={{
              // Sizing and Layout
              width: '90%',
              minHeight: 176,
              p: 3,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',

              // Transitions & Hover Effects
              transition: (theme) => theme.transitions.create(
                ['transform', 'box-shadow', 'background-color'],
                { duration: '200ms', easing: 'ease-in-out' }
              ),
              '&:hover': {
                backgroundColor: '#fff4e6',
                transform: 'scale(1.05)',
                boxShadow: 8,
              },
            }}
          >
            <Typography
              variant="h5"
              fontWeight="600"
              color="primary"
            >
              Find Open Positions
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}