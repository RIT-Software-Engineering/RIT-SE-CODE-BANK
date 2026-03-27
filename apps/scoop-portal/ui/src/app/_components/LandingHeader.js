"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  useTheme,
} from "@mui/material";

const navItems = [
  {
    label: "Contacts",
    submenu: [
      {
        label: "Academic Advisors",
        path: "/scoopdinator/administrative/contact/advisors",
      },
      {
        label: "CO-OP Coordinators",
        path: "/scoopdinator/administrative/contact/coordinators",
      },
    ],
  },
];

// Pages need to be filled in as they are created
const searchablePages = [
  // { label: "Dashboard", path: "/scoopdinator/dashboard" },
  // { label: "Review Applications", path: "/scoopdinator/applications" },
  // { label: "View Scooployees", path: "/scoopdinator/scooployees/view" },
  // {
  //     label: "Assign Scooployees to Teams",
  //     path: "/scoopdinator/scooployees/assign",
  // },
  // { label: "Manage Projects", path: "/projects/1" },
  { label: "View Projects", path: "/projects" },
  // { label: "Assign Teams", path: "/projects/assign/team" },
  // { label: "Assign Scoopervisor", path: "/projects/assign/scoopervisor" },
  {
    label: "Contact Advisors",
    path: "/scoopdinator/administrative/contact/advisors",
  },
  {
    label: "Contact Co-op Coordinators",
    path: "/scoopdinator/administrative/contact/coordinators",
  },
  // {
  //     label: "Manage Co-op Reports",
  //     path: "/scoopdinator/administrative/reports",
  // },
];

export default function LandingHeader() {
  const theme = useTheme();
  const [anchorEls, setAnchorEls] = useState({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMenuOpen = (event, label) => {
    setAnchorEls((prev) => ({ ...prev, [label]: event.currentTarget }));
  };

  const handleMenuClose = (label) => {
    setAnchorEls((prev) => ({ ...prev, [label]: null }));
  };

  const filteredResults = query
    ? searchablePages.filter((page) =>
        page.label.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  if (isScrolled) {
    return (
      <>
        <AppBar
          position="fixed"
          sx={{
            bgcolor: theme.palette.background.default,
            color: theme.palette.text.primary,
            height: "64px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            borderBottom: `1px solid ${theme.ritColors.gray_1}`,
          }}
        >
          <Toolbar
            sx={{
              justifyContent: "space-between",
              px: { xs: 2, md: 3 },
            }}
          >
            {/* Left: Logo */}
            <Box display="flex" alignItems="center">
              <Link href="/" passHref>
                <Box
                  component="img"
                  src={process.env.NEXT_PUBLIC_URL_BASE_PATH+"/RIT_RGB_hor.png"}
                  alt="RIT Logo"
                  sx={{
                    height: 48,
                    width: "auto",
                    cursor: "pointer",
                  }}
                />
              </Link>
            </Box>

            <Box display="flex" alignItems="center" gap={2}>
              <Link href="/application" passHref>
                <Button
                  variant="solid-orange"
                  sx={{
                    m: 1,
                  }}
                >
                  Apply
                </Button>
              </Link>

              <Button variant="outline-orange">About</Button>
              <Button variant="outline-orange">Contact</Button>
              {/** This is where the home dashboard login takes us to */}
              <Link href="/user-login" passHref>
                <Button variant="outline-orange">Log In</Button>
              </Link>
            </Box>
          </Toolbar>
        </AppBar>
        <Toolbar /> {/* spacer */}
      </>
    );
  }

  // Banner with buttons when at top
  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          bgcolor: theme.ritColors.white,
          color: theme.palette.mode === "light" ? theme.ritColors.white : theme.ritColors.black,
          height: "64px",
          boxShadow: "none",
          backdropFilter: "blur(10px)",
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            px: { xs: 2, md: 3 },
          }}
        >
          {/* Left: Logo */}
          <Box display="flex" alignItems="center">
            <Link href="/" passHref>
              <Box
                component="img"
                src={process.env.NEXT_PUBLIC_URL_BASE_PATH+"/RIT_RGB_hor.png"}
                alt="RIT Logo"
                sx={{
                  height: 48,
                  width: "auto",
                  cursor: "pointer",
                }}
              />
            </Link>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <Link href="/application" passHref>
              <Button
                variant="solid-orange"
                sx={{
                  m: 1,
                }}
              >
                Apply
              </Button>
            </Link>

            <Button variant="outline-orange">About</Button>
            <Button variant="outline-orange">Contact</Button>
            {/** This is where the home dashboard login takes us to */}
            <Link href="/user-login" passHref>
              <Button variant="outline-orange">Log In</Button>
            </Link>
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* spacer */}
    </>
  );
}