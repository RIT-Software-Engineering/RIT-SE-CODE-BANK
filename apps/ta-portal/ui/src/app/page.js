// src/app/page.js (root page)
'use client';

import { Box, Container, Paper, Typography, useTheme } from "@mui/material";
import LandingDashboard from "@/components/dashboard/LandingDashboard";
import HeroBanner from "@/components/HeroBanner";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { ArrowForward } from "@mui/icons-material";

/**
 * Home Page Component
 * --------------------
 * Acts as the root page of the application. 
 * Displays the hero banner and dashboard for authenticated users.
 *
 * @returns {JSX.Element} The rendered root page
 */
export default function Home() {
  const { currentUser } = useAuth();
  const theme = useTheme();

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Hero Banner - Shows on home page for both logged in and logged out users */}
      <HeroBanner />

      {/* Description text below hero banner - styled like RIT homepage */}
      <Container maxWidth="lg">
        <Box
          sx={{
            textAlign: "center",
            mt: { xs: 2, md: 3 },
            mb: 3,
            px: 2,
            py: 2,
          }}
        >
          <Box
            component="p"
            sx={{
              fontSize: { xs: "1.4rem", md: "1.7rem" },
              lineHeight: 1.6,
              maxWidth: "900px",
              mx: "auto",
              color: "text.primary",
              "& .orange-text": {
                color: "#F76902",
                fontWeight: 700,
              },
            }}
          >
            Students can <span className="orange-text">find opportunities</span> to be a teaching assistant for the Software Engineering Department. Faculty and admin can <span className="orange-text">manage</span> job postings and <span className="orange-text">hire</span> teaching assistants.
          </Box>
        </Box>
      </Container>

      {/* Show dashboard - for both logged in and logged out users */}
      {currentUser ? (
        <LandingDashboard user={currentUser} />
      ) : (
        <Container maxWidth="lg">
          <Box
            sx={{
              mb: 10,
              textAlign: "center",
              pt: 4,
              borderTop: "2px solid",
              borderColor: "divider",
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
                href="/login?redirect=positions"
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
                  Login
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", color: "primary.main" }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      mr: 1,
                    }}
                  >
                    Login or sign up here
                  </Typography>
                  <ArrowForward sx={{ fontSize: "1.2rem" }} />
                </Box>
              </Paper>
            </Box>
          </Box>
        </Container>
      )}
    </Box>
  );
}