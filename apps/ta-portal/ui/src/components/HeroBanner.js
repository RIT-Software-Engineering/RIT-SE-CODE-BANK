// src/components/HeroBanner.js
"use client";
import { useState, useEffect, useRef } from "react";
import { Box, IconButton } from "@mui/material";
import { PlayArrow, Pause } from "@mui/icons-material";

/**
 * HeroBanner component
 * 
 * A full-width video banner component inspired by the RIT GCCIS homepage.
 * Features:
 * - Auto-playing background video
 * - Play/Pause control
 * - Responsive video sources (desktop and mobile)
 * - Accessibility features (captions, descriptive text)
 * 
 * @returns {JSX.Element} The HeroBanner component
 */
export default function HeroBanner() {
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef(null);
  const mobileVideoRef = useRef(null);

  useEffect(() => {
    // Autoplay videos on mount
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log("Desktop video autoplay prevented:", error);
      });
    }
    if (mobileVideoRef.current) {
      mobileVideoRef.current.play().catch((error) => {
        console.log("Mobile video autoplay prevented:", error);
      });
    }
  }, []);

  const togglePlayPause = () => {
    const desktop = videoRef.current;
    const mobile = mobileVideoRef.current;

    if (isPlaying) {
      desktop?.pause();
      mobile?.pause();
    } else {
      desktop?.play();
      mobile?.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: { xs: "300px", sm: "400px", md: "500px", lg: "600px" },
          backgroundColor: "#000",
          overflow: "hidden",
        }}
      >
        {/* Desktop Video */}
        <Box
          component="video"
          ref={videoRef}
          src="https://www.rit.edu/computing/sites/rit.edu.computing/files/videos/GCCIS-2021-04-16.mp4#t=1"
          sx={{
            display: { xs: "none", md: "block" },
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          autoPlay
          muted
          loop
          playsInline
          aria-describedby="hero-video-description"
        >
          <track
            src="https://www.rit.edu/computing/sites/rit.edu.computing/files/videos/GCCIS-2021-04-16.vtt"
            label="English"
            kind="captions"
            srcLang="en-us"
          />
        </Box>

        {/* Mobile Video */}
        <Box
          component="video"
          ref={mobileVideoRef}
          src="https://www.rit.edu/computing/sites/rit.edu.computing/files/videos/GCCIS-2021-04-16-mobile.mp4#t=1"
          sx={{
            display: { xs: "block", md: "none" },
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          autoPlay
          muted
          loop
          playsInline
          aria-describedby="hero-video-description"
        >
          <track
            src="https://www.rit.edu/computing/sites/rit.edu.computing/files/videos/GCCIS-2021-04-16.vtt"
            label="English"
            kind="captions"
            srcLang="en-us"
          />
        </Box>

        {/* Screen reader description */}
        <Box id="hero-video-description" sx={{ position: "absolute", left: "-9999px" }}>
          A video showcasing different elements of RIT&apos;s College of Computing and
          Information Sciences, including cyber labs, group collaboration, and brick
          and glass buildings on campus.
        </Box>

        {/* Play/Pause Button */}
        <IconButton
          onClick={togglePlayPause}
          sx={{
            position: "absolute",
            bottom: { xs: 16, md: 24 },
            right: { xs: 16, md: 24 },
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            color: "white",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.8)",
            },
            width: { xs: 40, md: 48 },
            height: { xs: 40, md: 48 },
            zIndex: 999,
          }}
          aria-label={isPlaying ? "Pause Video" : "Play Video"}
        >
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>
      </Box>

      {/* Orange Text Overlay Box - Half in/half out of video frame - OUTSIDE video container */}
      <Box
        sx={{
          position: "relative",
          bottom: { xs: "50px", md: "65px" },
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#F76902", // RIT Orange
          color: "white",
          py: { xs: 2, md: 3 },
          px: { xs: 4, md: 6 },
          textAlign: "center",
          width: "fit-content",
          maxWidth: "90%",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          zIndex: 1400,
          marginBottom: { xs: "-50px", md: "-65px" }, // Compensate for the negative space
        }}
      >
        <Box
          component="h1"
          sx={{
            margin: 0,
            fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          Teaching Assistant Portal
        </Box>
      </Box>
    </>
  );
}
