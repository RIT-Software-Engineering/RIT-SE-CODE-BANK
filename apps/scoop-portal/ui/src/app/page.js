"use client";
import React from "react";
import Link from "next/link";
// import Header from "@components/Header";
import LandingHeader from "@components/LandingHeader";
import Footer from "@components/Footer";
import { Box, Typography, useTheme } from "@mui/material";

const NavButton = ({ href, children }) => {
  const theme = useTheme();
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderRadius: 0,
    padding: "8px 24px",
    fontWeight: 600,
    minWidth: "100px",
    textAlign: "center",
    textDecoration: "none",
    cursor: "pointer",
    transition: "background-color 300ms cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "none",
  };

  const [hover, setHover] = React.useState(false);

  return (
    <Link
      href={href}
      role="button"
      style={{
        ...baseStyle,
        backgroundColor: hover ? "#000000" : theme.palette.primary.main,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </Link>
  );
};

const LandingPage = () => {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh"
        sx={{
        width: '100vw',
        overflowX: 'hidden',
    }}
    >
      <LandingHeader />

      {/* Hero Section with Overlapping Banner */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
        }}
      >
        {/* Hero Image Section */}
        <Box
          sx={{
            width: "100%",
            height: "400px",
            backgroundImage: "url('/scoop-portal/aerial_drone_09-web.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Orange Banner - Overlapping */}
        <Box
          sx={{
            position: "absolute",
            bottom: "-25px",
            left: "50%",
            transform: "translateX(-50%)",
            width: { xs: "80%", md: "33%" },
            backgroundColor: (theme) => theme.palette.primary.main,
            py: 2,
            px: { xs: 2, md: 3 },
            textAlign: "center",
            borderRadius: 0,
            zIndex: 10,
          }}
        >
          <Typography variant="h2" sx={{ color: (theme) => theme.palette.primary.contrastText, fontWeight: 700 }}>
            Welcome to SCOOPortal
          </Typography>
        </Box>
      </Box>

      {/* Content Section */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: { xs: 8, md: 10 },
          px: { xs: 2, md: 3 },
          textAlign: "center",
          backgroundColor: (theme) => theme.palette.background.default,
          mt: { xs: 4, md: 2 },
        }}
      >
        <Box
          sx={{
            maxWidth: "800px",
            mx: "auto",
          }}
        >
          <Typography variant="h1" sx={{ color: (theme) => theme.palette.text.primary, mb: 2 }}>
            Software Coop Program SCOOP
          </Typography>
          <Typography variant="body1" sx={{ color: (theme) => theme.palette.text.primary, mb: 4, fontWeight: 700 }}>
            The Software Engineering department&apos;s SCOOP Program connects
            students with real-world software development experiences,
            interdisciplinary teams, and mentorship from faculty.
          </Typography>

          <Box gap={2} sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", mb: 6 }}>
            <NavButton href="/application">Apply Now</NavButton>
            <NavButton href="/interest-form">Interest Form</NavButton>
          </Box>
        </Box>
      </Box>

      <Footer/>
    </Box>
  );
};

export default LandingPage;
