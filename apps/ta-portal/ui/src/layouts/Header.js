// src/components/Header.js
"use client";
import Link from "next/link";
import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Brightness4,
  Brightness7,
  Home,
  Message,
  AccessTime,
  Work,
  Description,
  People,
  AccountCircle,
} from "@mui/icons-material";
import { ROLES } from "@/configuration/dashboard.config";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeContext } from "@/styles/ThemeRegistry";

const HEADER_LINKS = [
  {
    text: "Home",
    href: "/",
    icon: <Home />,
    roles: [ROLES.CANDIDATE, ROLES.EMPLOYEE, ROLES.ADMIN, ROLES.EMPLOYER],
  },
  {
    text: "Messaging",
    href: "/Messaging",
    icon: <Message />,
    roles: [ROLES.CANDIDATE, ROLES.EMPLOYEE, ROLES.ADMIN, ROLES.EMPLOYER],
  },
  {
    text: "Timecard",
    href: "/Timecard/Employee/[username]",
    icon: <AccessTime />,
    roles: [ROLES.EMPLOYEE],
  },
  {
    text: "Timecard",
    href: "/Timecard/Admin/[username]",
    icon: <AccessTime />,
    roles: [ROLES.ADMIN],
  },
  {
    text: "Timecard",
    href: "/Timecard/Employer/[username]",
    icon: <AccessTime />,
    roles: [ROLES.EMPLOYER],
  },
  {
    text: "Positions",
    href: "/Positions/Candidate/[username]",
    icon: <Work />,
    roles: [ROLES.CANDIDATE],
  },
  {
    text: "Positions",
    href: "/Positions/Employer/[username]",
    icon: <Work />,
    roles: [ROLES.EMPLOYER],
  },
  {
    text: "Positions",
    href: "/Positions/Employee/[username]",
    icon: <Work />,
    roles: [ROLES.EMPLOYEE],
  },
  {
    text: "Positions",
    href: "/Positions/Admin/[username]",
    icon: <Work />,
    roles: [ROLES.ADMIN],
  },
  {
    text: "Applications",
    href: "/Applications/Candidate/[username]",
    icon: <Description />,
    roles: [ROLES.CANDIDATE],
  },
  {
    text: "Applications",
    href: "/Applications/Employer/[username]",
    icon: <Description />,
    roles: [ROLES.EMPLOYER],
  },
  {
    text: "Applications",
    href: "/Applications/Employee/[username]",
    icon: <Description />,
    roles: [ROLES.EMPLOYEE],
  },
  {
    text: "Applications",
    href: "/Applications/Admin/[username]",
    icon: <Description />,
    roles: [ROLES.ADMIN],
  },
  {
    text: "Users",
    href: "/Users",
    icon: <People />,
    roles: [ROLES.ADMIN],
  },
  {
    text: "Profile",
    href: "/Profile",
    icon: <AccountCircle />,
    roles: [ROLES.CANDIDATE, ROLES.EMPLOYEE, ROLES.ADMIN, ROLES.EMPLOYER],
  },
];

export default function Header() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const { toggleTheme, mode } = useContext(ThemeContext);
  const userRole = currentUser ? currentUser.role : null;
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:1380px)");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const availableLinks = HEADER_LINKS.filter((link) =>
    link.roles.includes(userRole)
  );

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const drawer = (
    <Box
      onClick={handleDrawerToggle}
      sx={{ textAlign: "left", width: 250 }}
      role="presentation"
    >
      <Typography variant="h6" sx={{ my: 2, px: 2.5 }}>
        TA Portal Menu
      </Typography>
      <Divider />
      <List sx={{ px: 1 }}>
        {availableLinks.map((link) => {
          const finalHref =
            link.href.includes("[username]") && currentUser
              ? link.href.replace("[username]", currentUser.username)
              : link.href;
          return (
            <ListItem key={finalHref} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={Link}
                href={finalHref}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: "auto",
                    mr: 2,
                    color: "inherit",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {link.icon}
                </ListItemIcon>
                <ListItemText
                  primary={link.text}
                  primaryTypographyProps={{ sx: { mb: 0 } }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static" color="primary" sx={{ height: "125px" }}>
        <Toolbar sx={{ height: "100%", px: { xs: 2, sm: 3 } }}>
          {/* Title Section */}
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h1"
              component="div"
              sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem", md: "2rem" } }}
            >
              Teaching Assistant Portal
            </Typography>
            <Typography
              variant="h3"
              sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem", md: "1rem" } }}
            >
              Department of Software Engineering, RIT
            </Typography>
          </Box>

          {isMobile ? (
            // Mobile View: Menu Icon
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Tooltip
                title={
                  mode === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
              >
                <IconButton
                  sx={{ ml: 1, mr: currentUser ? 0 : 1 }}
                  onClick={toggleTheme}
                  color="inherit"
                >
                  {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Tooltip>
              {currentUser && (
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="end"
                  onClick={handleDrawerToggle}
                >
                  <MenuIcon />
                </IconButton>
              )}
            </Box>
          ) : (
            // Desktop View: Full Navigation
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <nav>
                {availableLinks.map((link) => {
                  const finalHref =
                    link.href.includes("[username]") && currentUser
                      ? link.href.replace("[username]", currentUser.username)
                      : link.href;

                  return (
                    <Button
                      key={finalHref}
                      color="inherit"
                      component={Link}
                      href={finalHref}
                      sx={{
                        color: "white",
                        marginRight: 2,
                        fontSize: "1rem",
                      }}
                    >
                      {link.text}
                    </Button>
                  );
                })}
              </nav>
              <Tooltip
                title={
                  mode === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
              >
                <IconButton
                  sx={{ ml: 1 }}
                  onClick={toggleTheme}
                  color="inherit"
                >
                  {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Tooltip>

              {currentUser && (
                <Button
                  onClick={handleLogout}
                  variant="contained"
                  sx={{
                    ml: 2,
                    backgroundColor: "white",
                    color: "primary.main",
                    "&:hover": {
                      backgroundColor: "grey.200",
                    },
                  }}
                >
                  Logout
                </Button>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={handleDrawerToggle}>
        {drawer}
        {currentUser && (
          <Box sx={{ p: 2, position: "absolute", bottom: 0, width: "100%" }}>
            <Button
              onClick={() => {
                handleDrawerToggle();
                handleLogout();
              }}
              variant="contained"
              fullWidth
            >
              Logout
            </Button>
          </Box>
        )}
      </Drawer>
    </>
  );
}