"use client";
import React from "react";
import Link from "next/link";
// import Header from "@components/Header";
import LandingHeader from "@components/LandingHeader";
import Footer from "@components/Footer";
import {Box} from "@mui/material";

const NavButton = ({ href, children }) => {
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F76902",
    color: "white",
    borderRadius: "9999px",
    padding: "8px 24px",
    fontWeight: 500,
    minWidth: "100px",
    textAlign: "center",
    textDecoration: "none",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  };

  const [hover, setHover] = React.useState(false);

  return (
    <Link
      href={href}
      role="button"
      style={{
        ...baseStyle,
        backgroundColor: hover ? "#d95e00" : "#F76902",
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
      // style={{
      //   minHeight: "100vh",
      //   backgroundColor: "fff",
      //   color: "000",
      //   fontFamily: "sans-serif",
      //   display: "flex",
      //   flexDirection: "column",
      //   maxWidth: "100vw",
      //   maxHeight: "100%",
      //   overflowX: "hidden",
      // }}
    >
      <LandingHeader />

      <main
        style={{
          flexGrow: 1,
          backgroundImage: "url('/scoop-portal/aerial_drone_09-web.png')",
          backgroundSize:"cover",
          backgroundPosition:"center",
          width:"100%",
          minHeight:"430px",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <div style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "60px 20px",
        }}>
            <h1 style={{ fontSize: "2.5rem", marginBottom: "20px" }}>
                Software Coop Program SCOOP
            </h1>
            <p style={{ fontSize: "1.2rem", marginBottom: "40px" , fontWeight:"bold"}}>
                The Software Engineering department&apos;s SCOOP Program connects
                students with real-world software development experiences,
                interdisciplinary teams, and mentorship from faculty.
            </p>
            <Box gap={2} sx={{ display: "flex", justifyContent: "center"}}>
                <NavButton href="/application" >Apply Now</NavButton>
                <NavButton href="/interest-form">Interest Form</NavButton>
            </Box>
            <Box 
                sx={{
                backgroundImage: 'url("/scoop-portal/RIT_rgb_vert_w.png")',
                backgroundSize: 'contain',
                backgroundColor: 'black',
                backgroundRepeat: 'no-repeat',
                //   height: '40px',
            }}/>
        </div>
      </main>
      <Footer/>
    </Box>
  );
};

export default LandingPage;
