// src/components/Header.js
"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useContext } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useFeatureFlags, FEATURES } from "@/configuration/featureFlags";
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
  Collapse,
  InputBase,
  Paper,
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
  Settings,
  Logout as LogoutIcon,
  ExpandLess,
  ExpandMore,
  Search as SearchIcon,
  Close as CloseIcon,
  Notifications,
} from "@mui/icons-material";
import { ROLES } from "@/configuration/dashboard.config";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeContext } from "@/styles/ThemeRegistry";

// Define header links
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
    feature: FEATURES.MESSAGING,
  },
  {
    text: "Timecard",
    href: "/Timecard/Employee/[username]",
    icon: <AccessTime />,
    roles: [ROLES.EMPLOYEE],
    feature: FEATURES.TIMECARD,
  },
  {
    text: "Timecard",
    href: "/Timecard/Admin/[username]",
    icon: <AccessTime />,
    roles: [ROLES.ADMIN],
    feature: FEATURES.TIMECARD,
  },
  {
    text: "Timecard",
    href: "/Timecard/Employer/[username]",
    icon: <AccessTime />,
    roles: [ROLES.EMPLOYER],
    feature: FEATURES.TIMECARD,
  },
  {
    text: "Positions",
    href: "/Positions/Candidate/[username]",
    icon: <Work />,
    roles: [ROLES.CANDIDATE],
    feature: FEATURES.POSITIONS,
  },
  {
    text: "Positions",
    href: "/Positions/Employer/[username]",
    icon: <Work />,
    roles: [ROLES.EMPLOYER],
    feature: FEATURES.POSITIONS,
  },
  {
    text: "Positions",
    href: "/Positions/Employee/[username]",
    icon: <Work />,
    roles: [ROLES.EMPLOYEE],
    feature: FEATURES.POSITIONS,
  },
  {
    text: "Positions",
    href: "/Positions/Admin/[username]",
    icon: <Work />,
    roles: [ROLES.ADMIN],
    feature: FEATURES.POSITIONS,
  },
  {
    text: "Applications",
    href: "/Applications/Candidate/[username]",
    icon: <Description />,
    roles: [ROLES.CANDIDATE],
    feature: FEATURES.APPLICATIONS,
  },
  {
    text: "Applications",
    href: "/Applications/Employer/[username]",
    icon: <Description />,
    roles: [ROLES.EMPLOYER],
    feature: FEATURES.APPLICATIONS,
  },
  {
    text: "Applications",
    href: "/Applications/Employee/[username]",
    icon: <Description />,
    roles: [ROLES.EMPLOYEE],
    feature: FEATURES.APPLICATIONS,
  },
  {
    text: "Applications",
    href: "/Applications/Admin/[username]?tab=all",
    icon: <Description />,
    roles: [ROLES.ADMIN],
    feature: FEATURES.APPLICATIONS,
  },
  {
    text: "Users",
    href: "/Users",
    icon: <People />,
    roles: [ROLES.ADMIN],
  },
];


/**
 * Header component
 *
 * This component is used to display the top-level navigation bar and drawer
 * for the application. It provides links to the main sections of the app, as
 * well as a toggle for the theme and a logout button.
 *
 * @returns {JSX.Element} The Header component
 */
export default function Header() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toggleTheme, mode } = useContext(ThemeContext);
  const { isFeatureEnabled } = useFeatureFlags();
  const userRole = currentUser ? currentUser.role : null;
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:1380px)");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const availableLinks = HEADER_LINKS.filter((link) =>
    link.roles.includes(userRole) && 
    (!link.feature || isFeatureEnabled(link.feature))
  );

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleSettingsToggle = () => {
    setSettingsOpen(!settingsOpen);
  };

  // Search functionality
  const allPages = availableLinks.map((link) => {
    const finalHref =
      link.href.includes("[username]") && currentUser
        ? link.href.replace("[username]", currentUser.username)
        : link.href;
    return { text: link.text, href: finalHref, category: "Navigation" };
  });

  // Add additional searchable pages and actions
  const additionalPages = [];
  
  if (currentUser) {
    // Profile and settings
    additionalPages.push(
      { text: "My Profile", href: "/Profile", category: "Settings" },
      { text: "Notification Preferences", href: "/Settings", category: "Settings" },
      { text: "Theme/Appearance", href: "#", category: "Settings", action: () => {
        setDrawerOpen(true);
        setSettingsOpen(true);
      }},
      { text: "Dark Mode", href: "#", category: "Settings", action: () => {
        setDrawerOpen(true);
        setSettingsOpen(true);
      }}
    );

    // Admin-specific pages
    if (userRole === ROLES.ADMIN) {
      additionalPages.push(
        { text: "Feature Settings", href: "/Admin/Features", category: "Admin" },
        { text: "All Users", href: "/Users", category: "Admin" },
        { text: "Manage Users", href: "/Users", category: "Admin" },
        { text: "Hire Candidates", href: `/Applications/Admin/${currentUser.username}`, category: "Admin" },
        { text: "Hire Applicants", href: `/Applications/Admin/${currentUser.username}`, category: "Admin" },
        { text: "Hiring", href: `/Applications/Admin/${currentUser.username}`, category: "Admin" }
      );
    }

    // Role-specific quick actions
    if (userRole === ROLES.CANDIDATE && isFeatureEnabled(FEATURES.POSITIONS)) {
      additionalPages.push(
        { text: "Browse Positions", href: `/Positions/Candidate/${currentUser.username}`, category: "Quick Actions" },
        { text: "Find Jobs", href: `/Positions/Candidate/${currentUser.username}`, category: "Quick Actions" }
      );
    }

    if (userRole === ROLES.EMPLOYER && isFeatureEnabled(FEATURES.POSITIONS)) {
      additionalPages.push(
        { text: "Create Position", href: `/Positions/Employer/${currentUser.username}`, category: "Quick Actions" },
        { text: "New Job Posting", href: `/Positions/Employer/${currentUser.username}`, category: "Quick Actions" },
        { text: "My Positions", href: `/Positions/Employer/${currentUser.username}`, category: "Quick Actions" }
      );
    }

    if (userRole === ROLES.EMPLOYEE && isFeatureEnabled(FEATURES.TIMECARD)) {
      additionalPages.push(
        { text: "Submit Timecard", href: `/Timecard/Employee/${currentUser.username}`, category: "Quick Actions" },
        { text: "My Timecard", href: `/Timecard/Employee/${currentUser.username}`, category: "Quick Actions" }
      );
    }
  }

  const searchablePages = [...allPages, ...additionalPages];

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }
    const filtered = searchablePages.filter((page) =>
      page.text.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
  };

  const handleSearchSelect = (href) => {
    // Check if it's an action (dark mode toggle)
    const selected = searchResults.find(r => r.href === href);
    if (selected?.action) {
      selected.action();
    } else {
      // Smart routing for Applications page when already on it
      if (currentUser && pathname?.includes('/Applications/Admin/')) {
        const currentTab = searchParams?.get('tab') || 'hiring'; // No tab param = hiring tab (default)
        const isSearchingForHiring = selected?.text?.toLowerCase().includes('hir');
        const isSearchingForApplications = selected?.text === 'Applications';
        
        // If on hiring and searching for Applications, go to all tab
        if (currentTab === 'hiring' && isSearchingForApplications) {
          const newUrl = `/Applications/Admin/${currentUser.username}?tab=all`;
          router.push(newUrl);
          // Force scroll to trigger re-render detection
          window.scrollTo(0, 0);
          setSearchOpen(false);
          setSearchQuery("");
          setSearchResults([]);
          return;
        }
        // If on all tab and searching for hiring, go to hiring tab
        else if (currentTab === 'all' && isSearchingForHiring) {
          const newUrl = `/Applications/Admin/${currentUser.username}`;
          router.push(newUrl);
          // Force scroll to trigger re-render detection
          window.scrollTo(0, 0);
          setSearchOpen(false);
          setSearchQuery("");
          setSearchResults([]);
          return;
        }
      }
      // Default routing
      router.push(href);
    }
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const drawer = (
    <Box
      sx={{ textAlign: "left", width: 280 }}
      role="presentation"
    >
      {/* Drawer Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Menu
        </Typography>
      </Box>

      {/* Navigation Links */}
      <List sx={{ px: 1, py: 2 }}>
        {availableLinks.map((link) => {
          const finalHref =
            link.href.includes("[username]") && currentUser
              ? link.href.replace("[username]", currentUser.username)
              : link.href;
          return (
            <ListItem key={finalHref} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={finalHref}
                onClick={handleDrawerToggle}
                sx={{
                  py: 1,
                  px: 2,
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.primary.main,
                    "& .MuiListItemIcon-root": {
                      color: theme.palette.primary.main,
                    },
                  },
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
                  primaryTypographyProps={{ sx: { mb: 0, fontSize: "0.95rem" } }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ my: 1 }} />

      {/* Settings Section */}
      <List sx={{ px: 1, py: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleSettingsToggle}
            sx={{
              py: 1,
              px: 2,
              borderRadius: 1,
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.primary.main,
                "& .MuiListItemIcon-root": {
                  color: theme.palette.primary.main,
                },
              },
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
              <Settings />
            </ListItemIcon>
            <ListItemText
              primary="Settings"
              primaryTypographyProps={{ sx: { mb: 0, fontSize: "0.95rem" } }}
            />
            {settingsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>

        {/* Settings Submenu */}
        <Collapse in={settingsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem disablePadding sx={{ pl: 4 }}>
              <ListItemButton
                onClick={() => {
                  toggleTheme();
                }}
                sx={{
                  py: 1,
                  px: 2,
                  borderRadius: 1,
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.primary.main,
                    "& .MuiListItemIcon-root": {
                      color: theme.palette.primary.main,
                    },
                  },
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
                  {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
                </ListItemIcon>
                <ListItemText
                  primary="Dark Mode"
                  secondary={mode === "dark" ? "On" : "Off"}
                  primaryTypographyProps={{ sx: { mb: 0, fontSize: "0.9rem" } }}
                  secondaryTypographyProps={{ 
                    sx: { 
                      fontSize: "0.8rem",
                      color: "inherit",
                    } 
                  }}
                />
              </ListItemButton>
            </ListItem>
            {/* Admin Feature Settings */}
            {userRole === ROLES.ADMIN && (
              <ListItem disablePadding sx={{ pl: 4 }}>
                <ListItemButton
                  component={Link}
                  href="/Admin/Features"
                  onClick={handleDrawerToggle}
                  sx={{
                    py: 1,
                    px: 2,
                    borderRadius: 1,
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.primary.main,
                      "& .MuiListItemIcon-root": {
                        color: theme.palette.primary.main,
                      },
                    },
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
                    <Settings />
                  </ListItemIcon>
                  <ListItemText
                    primary="Feature Settings"
                    primaryTypographyProps={{ sx: { mb: 0, fontSize: "0.9rem" } }}
                  />
                </ListItemButton>
              </ListItem>
            )}
            {/* Notification Preferences */}
            <ListItem disablePadding sx={{ pl: 4 }}>
              <ListItemButton
                component={Link}
                href="/Settings"
                onClick={handleDrawerToggle}
                sx={{
                  py: 1,
                  px: 2,
                  borderRadius: 1,
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.primary.main,
                    "& .MuiListItemIcon-root": {
                      color: theme.palette.primary.main,
                    },
                  },
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
                  <Notifications />
                </ListItemIcon>
                <ListItemText
                  primary="Notification Preferences"
                  primaryTypographyProps={{ sx: { mb: 0, fontSize: "0.9rem" } }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>
      </List>

      <Divider sx={{ my: 1 }} />

      {/* Profile and Logout */}
      <List sx={{ px: 1, py: 1 }}>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            component={Link}
            href="/Profile"
            onClick={handleDrawerToggle}
            sx={{
              py: 1,
              px: 2,
              borderRadius: 1,
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.primary.main,
                "& .MuiListItemIcon-root": {
                  color: theme.palette.primary.main,
                },
              },
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
              <AccountCircle />
            </ListItemIcon>
            <ListItemText
              primary="Profile"
              primaryTypographyProps={{ sx: { mb: 0, fontSize: "0.95rem" } }}
            />
          </ListItemButton>
        </ListItem>

        {currentUser && (
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                handleDrawerToggle();
                handleLogout();
              }}
              sx={{
                py: 1,
                px: 2,
                borderRadius: 1,
                color: theme.palette.error.main,
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                },
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
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{ sx: { mb: 0, fontSize: "0.95rem" } }}
              />
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <>
      {/* RIT-Branded Header */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: "#000000", // always black
          height: "85px",
          boxShadow: theme.palette.mode === 'dark' ? '0 1px 0 rgba(255, 255, 255, 0.1)' : 'none',
          borderBottom: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
          width: '100%',
          maxWidth: '100vw',
          overflowX: 'hidden',
        }}
      >
        <Toolbar
          sx={{
            height: "100%",
            px: { xs: 1, sm: 2, md: 3 },
            py: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: "85px",
            maxWidth: '100%',
            width: '100%',
          }}
        >
          {/* Left: RIT Logo and Title */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0 }}>
            {/* RIT Logo - Using actual RIT logo image */}
            <Link href="/" style={{ display: "flex", alignItems: "center" }}>
              <Image
                src={"/ta-portal/rit-logo.png"}
                alt="RIT Logo"
                width={100}
                height={100}
                priority
                style={{
                  objectFit: "contain",
                  flexShrink: 0,
                  cursor: "pointer",
                }}
              />
            </Link>

            {/* Title Section - Software Engineering Department */}
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography
                sx={{
                  fontSize: { sm: "1rem", md: "1.1rem" },
                  color: "white",
                  fontWeight: 500,
                  letterSpacing: 0.5,
                  m: 0,
                  p: 0,
                }}
              >
                Software Engineering Department
              </Typography>
            </Box>
          </Box>

          {/* Right: Actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Desktop Navigation (hidden on mobile) */}
            {!isMobile && currentUser && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mr: 2,
                }}
              >
                {availableLinks.slice(0, 5).map((link) => {
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
                        fontSize: "0.9rem",
                        textTransform: "none",
                        "&:hover": {
                          color: theme.palette.primary.main,
                        },
                      }}
                    >
                      {link.text}
                    </Button>
                  );
                })}
              </Box>
            )}

            {/* Theme Toggle Button - Desktop */}
            <Tooltip
              title={
                mode === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              <IconButton
                sx={{ 
                  ml: 1,
                  "&:hover": {
                    color: theme.palette.primary.main,
                  },
                }}
                onClick={toggleTheme}
                color="inherit"
              >
                {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Tooltip>

            {/* Search Bar - Desktop */}
            {!isMobile && searchOpen && (
              <Paper
                sx={{
                  p: "2px 4px",
                  display: "flex",
                  alignItems: "center",
                  width: 250,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <InputBase
                  sx={{ ml: 1, flex: 1, color: "white" }}
                  placeholder="Search pages..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  autoFocus
                  inputProps={{
                    style: { color: "white" },
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  sx={{ p: "10px", color: "white" }}
                >
                  <CloseIcon />
                </IconButton>
              </Paper>
            )}

            {/* Search Icon Button */}
            {!isMobile && !searchOpen && (
              <Tooltip title="Search pages">
                <IconButton
                  onClick={() => setSearchOpen(true)}
                  sx={{
                    color: "white",
                    "&:hover": {
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  <SearchIcon />
                </IconButton>
              </Tooltip>
            )}

            {/* Login Button - Show when not logged in */}
            {!currentUser && (
              <Button
                component={Link}
                href="/login"
                variant="text"
                sx={{
                  color: "white",
                  fontSize: "0.9rem",
                  textTransform: "none",
                  "&:hover": {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                Login
              </Button>
            )}

            {/* Hamburger Menu */}
            {currentUser && (
              <IconButton
                color="inherit"
                aria-label="open menu"
                edge="end"
                onClick={handleDrawerToggle}
                sx={{
                  color: "white",
                  "&:hover": {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          "& .MuiDrawer-paper": {
            width: 280,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Search Results Dropdown */}
      {searchOpen && searchResults.length > 0 && !isMobile && (
        <Paper
          sx={{
            position: "fixed",
            top: 85,
            right: { xs: 16, sm: 24, md: 32 },
            width: 300,
            maxHeight: 400,
            overflowY: "auto",
            zIndex: 1300,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          }}
        >
          <List sx={{ p: 0 }}>
            {searchResults.map((result, index) => (
              <ListItemButton
                key={index}
                onClick={() => handleSearchSelect(result.href)}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  "&:last-child": {
                    borderBottom: "none",
                  },
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
                  <Typography variant="body2">{result.text}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {result.category}
                  </Typography>
                </Box>
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}
    </>
  );
}