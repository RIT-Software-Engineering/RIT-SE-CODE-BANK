"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Button,
  Menu,
  MenuItem,
  InputBase,
  Paper,
  ClickAwayListener,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CloseIcon from "@mui/icons-material/Close";

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
  const [anchorEls, setAnchorEls] = useState({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

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

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          bgcolor: "#fff",
          color: "#212121",
          height: "64px",
          boxShadow: 2,
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
                src="/RIT_RGB_hor.png"
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

            <Link href="/user-roles" passHref>
              <Button variant="outline-orange">Log In</Button>
            </Link>
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* spacer */}
    </>
  );
}
