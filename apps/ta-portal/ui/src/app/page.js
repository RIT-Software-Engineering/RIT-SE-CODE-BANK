// src/app/page.js (root page)
'use client';

import { useState, useEffect } from "react";
import { Box, CircularProgress, Container } from "@mui/material";
import LandingDashboard from "@/components/dashboard/LandingDashboard";
import HeroBanner from "@/components/HeroBanner";
import { useAuth } from "@/contexts/AuthContext";
import { getAllUsers } from "@/services/db-apis";

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
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch all users on component mount.
   */
  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Render a full-page loading spinner while initial data is being fetched
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Hero Banner - Shows on home page for both logged in and logged out users */}
      <HeroBanner />

      {/* Description text below hero banner - styled like RIT homepage */}
      <Container maxWidth="lg">
        <Box
          sx={{
            textAlign: "center",
            mt: { xs: 4, md: 5 },
            mb: 6,
            px: 2,
            py: 4,
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
            Find <span className="orange-text">opportunities</span> to be a teaching assistant for the Software Engineering Department and{" "}
            <span className="orange-text">manage</span> your teaching assistant responsibilities
          </Box>
        </Box>
      </Container>

      {/* Show dashboard - for both logged in and logged out users */}
      {currentUser && (
        <LandingDashboard user={currentUser} />
      )}
    </Box>
  );
}