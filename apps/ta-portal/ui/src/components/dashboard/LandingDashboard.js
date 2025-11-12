// src/components/dashboard/LandingDashboard.js
'use client';

import SelectionCard from "@/components/dashboard/SelectionCard";
import { DASHBOARD_OPTIONS } from "@/configuration/dashboard.config";
import Link from "next/link";
import { Box, Container, Grid, Paper, Typography, Button, useTheme } from "@mui/material";
import { ArrowForward } from "@mui/icons-material";

export default function LandingDashboard({ user }) {
  const theme = useTheme();
  
  // filter options based on user role
  const userRole = user?.role;
  const PersonalOptions = DASHBOARD_OPTIONS.filter(
    (option) =>
      option.roles.includes(userRole) && option.category === "Personal"
  );
  const formattedUserRole = userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();

  return (
    <Box
      sx={{
        minHeight: "100%",
        background: theme.palette.mode === 'dark' 
          ? "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
          : "linear-gradient(135deg, #f5f5f5 0%, #efefef 100%)",
        py: { xs: 3, sm: 4, md: 6 },
        overflow: "hidden",
      }}
    >
      <Container maxWidth="lg" sx={{ width: "100%", overflow: "hidden" }}>
        {/* Hero Section */}
        <Box sx={{ mb: 8, textAlign: "center", pt: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: theme.palette.text.primary,
              fontSize: { xs: "1.8rem", sm: "2.2rem", md: "2.8rem" },
            }}
          >
            Welcome to TA Portal
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 400,
              maxWidth: "700px",
              mx: "auto",
              fontSize: { xs: "0.95rem", sm: "1.05rem", md: "1.1rem" },
            }}
          >
            Find opportunities as a teaching assistant for the Software Engineering Department and manage your teaching assistant responsibilities
          </Typography>
        </Box>

        {/* Explore Section - NOW FIRST */}
        <Box
          sx={{
            mb: 10,
            textAlign: "center",
          }}
        >
          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontWeight: 600,
              mb: 4,
              color: theme.palette.primary.main,
              fontSize: { xs: "1.4rem", sm: "1.7rem", md: "2rem" },
            }}
          >
            Explore Positions
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Paper
              component={Link}
              href={`/Positions/${formattedUserRole}/${user.username}`}
              elevation={0}
              sx={{
                // Sizing and Layout
                width: "100%",
                maxWidth: "500px",
                minHeight: 140,
                p: { xs: 3, sm: 4 },
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "space-between",
                textDecoration: "none",
                background: theme.palette.mode === 'dark'
                  ? "linear-gradient(135deg, #2d2d2d 0%, #1f1f1f 100%)"
                  : "linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%)",
                border: `2px solid ${theme.palette.primary.main}`,

                // Transitions & Hover Effects
                transition: (theme) => theme.transitions.create(
                  ["transform", "box-shadow", "background-color"],
                  { duration: "200ms", easing: "ease-in-out" }
                ),
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: `0 12px 24px ${theme.palette.action.focus}`,
                  background: theme.palette.mode === 'dark'
                    ? "linear-gradient(135deg, #3d3d3d 0%, #2f2f2f 100%)"
                    : "linear-gradient(135deg, #fffbf0 0%, #fff5e0 100%)",
                },
              }}
            >
              <Typography
                variant="h5"
                fontWeight="600"
                color="primary"
                sx={{
                  fontSize: { xs: "1.1rem", sm: "1.3rem" },
                  mb: 1,
                }}
              >
                Find Open Positions
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", color: "primary.main" }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    mr: 1,
                  }}
                >
                  Explore opportunities
                </Typography>
                <ArrowForward sx={{ fontSize: "1.2rem" }} />
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* Quick Actions Section - NOW SECOND */}
        <Box sx={{ mb: 10, textAlign: "center", pt: 8, borderTop: `2px solid ${theme.palette.divider}` }}>
          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontWeight: 600,
              mb: 4,
              color: theme.palette.primary.main,
              fontSize: { xs: "1.4rem", sm: "1.7rem", md: "2rem" },
            }}
          >
            Quick Actions
          </Typography>

          <Grid
            container
            spacing={{ xs: 2, sm: 3, md: 4 }}
            justifyContent="center"
          >
            {PersonalOptions.map((option, index) => {
              const finalLink =
                option.link.includes("[username]") && user
                  ? option.link.replace("[username]", user.username)
                  : option.link;

              return (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  lg={2}
                  key={index}
                  sx={{ display: "flex", justifyContent: "center" }}
                >
                  <SelectionCard text={option.text} link={finalLink} />
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* OLD SECTIONS REMOVED - REPLACED ABOVE */}
      </Container>
    </Box>
  );
}