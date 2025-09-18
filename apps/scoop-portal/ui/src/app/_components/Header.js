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
    label: "Dashboard",
    submenu: [
      { label: "Scooployee", path: "/scooployee/dashboard" },
      { label: "Scoopervisor", path: "/scoopervisor/dashboard" },
      { label: "Scoopdinator", path: "/scoopdinator/dashboard" },
      { label: "Unified", path: "/new-dashboards" },
    ],
  },
  {
    label: "Workflows",
    submenu: [
      { label: "Scooployee", path: "/scooployee/workflows" },
      { label: "Scoopdinator", path: "/scoopdinator/workflows" },
    ],
  },
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
    { label: "Workflows", path: "/scoopdinator/workflows" },
    { label: "Dashboard", path: "/scoopdinator/dashboard" },
    { label: "Review Applications", path: "/scoopdinator/applications" },
    { label: "View Scooployees", path: "/scoopdinator/scooployees/view" },
    {
        label: "Assign Scooployees to Teams",
        path: "/scoopdinator/scooployees/assign",
    },
    { label: "Manage Projects", path: "/projects/1" },
    { label: "View Projects", path: "/projects" },
    { label: "Assign Teams", path: "/projects/assign/team" },
    { label: "Assign Scoopervisor", path: "/projects/assign/scoopervisor" },
    {
        label: "Contact Advisors",
        path: "/scoopdinator/administrative/contact/advisors",
    },
    {
        label: "Contact Co-op Coordinators",
        path: "/scoopdinator/administrative/contact/coordinators",
    },
    {
        label: "Manage Co-op Reports",
        path: "/scoopdinator/administrative/reports",
    },
];

export default function Header() {
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
          <Box display="flex" alignItems="center">
            <Link href={"/new-dashboards"} passHref>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  mr: 2,
                }}
              >
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
              </Box>
            </Link>

            {navItems.map(({ label, submenu }) => (
              <Box key={label} sx={{ position: "relative", mr: 3 }}>
                <Button
                  aria-controls={anchorEls[label] ? `${label}-menu` : undefined}
                  aria-haspopup="true"
                  aria-expanded={anchorEls[label] ? "true" : undefined}
                  onClick={(e) => handleMenuOpen(e, label)}
                  endIcon={<ArrowDropDownIcon />}
                  sx={{
                    color: "#212121",
                    fontWeight: 600,
                    textTransform: "none",
                  }}
                >
                  {label}
                </Button>
                <Menu
                  id={`${label}-menu`}
                  anchorEl={anchorEls[label]}
                  open={Boolean(anchorEls[label])}
                  onClose={() => handleMenuClose(label)}
                >
                  {submenu.map((item) => (
                    <MenuItem
                      key={item.path}
                      component={Link}
                      href={item.path}
                      onClick={() => handleMenuClose(label)}
                    >
                      {item.label}
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            ))}
          </Box>
          <Box display="flex" alignItems="center">
            <ClickAwayListener onClickAway={() => setSearchOpen(false)}>
              <Box sx={{ position: "relative" }}>
                {searchOpen ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Paper
                      sx={{
                        px: 2,
                        py: 0.5,
                        mr: 1,
                        bgcolor: "#f1f1f1",
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        minWidth: 200,
                      }}
                    >
                      <InputBase
                        placeholder="Search..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                        sx={{ width: "100%" }}
                      />
                    </Paper>
                    <IconButton onClick={() => setSearchOpen(false)}>
                      <CloseIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <IconButton onClick={() => setSearchOpen(true)}>
                    <SearchIcon />
                  </IconButton>
                )}

                {searchOpen && filteredResults.length > 0 && (
                  <Paper
                    sx={{
                      position: "absolute",
                      top: 48,
                      right: 0,
                      width: 250,
                      maxHeight: 300,
                      overflowY: "auto",
                      zIndex: 999,
                      borderRadius: 2,
                    }}
                  >
                    {filteredResults.map((page) => (
                      <Link key={page.label} href={page.path} passHref>
                        <MenuItem
                          onClick={() => {
                            setSearchOpen(false);
                            setQuery("");
                          }}
                        >
                          {page.label}
                        </MenuItem>
                      </Link>
                    ))}
                  </Paper>
                )}
              </Box>
            </ClickAwayListener>
            <Button
              href="/"
              variant="solid-orange"
              sx={{
                textTransform: "none",
                ml: 2,
                flexShrink: 0,
              }}
              >
              Logout
          </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar />
    </>
  );
}
