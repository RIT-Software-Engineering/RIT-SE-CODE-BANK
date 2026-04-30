"use client";
import React, { useEffect, useRef, useState } from "react";
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
  Modal,
  Typography,
  Divider,
  Switch,
  TextField,
  Alert,
  Snackbar,
  Avatar,
  Stack,
  Chip,
  Card,
  CardContent,
  FormControlLabel,
  InputAdornment,
  Tooltip,
  Skeleton,
  List
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

// Icons
import SearchIcon from "@mui/icons-material/Search";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import EmailIcon from "@mui/icons-material/Email";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import TagIcon from "@mui/icons-material/Tag";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";

import { useUser } from "../utils/user-context/page";

// --- Theme Colors ---
// theme values are used directly in the header for consistency

const navItems = [
  { label: "Dashboard", path: "/dashboard", submenu: [] },
  {
    label: "Workflows",
    submenu: [
      { label: "Scooployee", path: "/scooployee/workflows" },
      { label: "Scoopdinator", path: "/scoopdinator/workflows" },
      { label: "Submission", path: "/scoopdinator/workflows/submission" },
      { label: "Bubbles", path: "/bubbles" },
    ],
  },
  {
    label: "Contacts",
    submenu: [
      { label: "Academic Advisors", path: "https://www.rit.edu/computing/academic-advising" },
      { label: "CO-OP Coordinators", path: "https://www.rit.edu/careerservices/contacts/coordinators-by-college" },
    ],
  },
];

const searchablePages = [
    { label: "Workflows", path: "/scoopdinator/workflows" },
    { label: "Dashboard", path: "/scoopdinator/dashboard" },
    { label: "Review Applications", path: "/scoopdinator/applications" },
    { label: "Interest Forms", path: "/scoopdinator/interest-forms" },
    { label: "View Scooployees", path: "/scoopdinator/scooployees/view" },
    { label: "Assign Scooployees to Teams", path: "/scoopdinator/scooployees/assign" },
    { label: "Manage Projects", path: "/projects" },
    { label: "View Projects", path: "/projects" },
    { label: "Assign Teams", path: "/projects/assign/team" },
    { label: "Assign Scoopervisor", path: "/projects/assign/scoopervisor" },
    { label: "Contact Advisors", path: "/scoopdinator/administrative/contact/advisors" },
    { label: "Contact Co-op Coordinators", path: "/scoopdinator/administrative/contact/coordinators" },
    { label: "Manage Co-op Reports", path: "/scoopdinator/administrative/reports" },
];

const getFilteredWorkflowItems = (role, submenu) => {
  const normalizedRole = (role || "").toLowerCase();
  if (normalizedRole === "scooployee") {
    return submenu.filter((item) => ["Scooployee", "Bubbles"].includes(item.label));
  }

  if (normalizedRole === "scoopdinator") {
    return submenu.filter((item) => ["Scoopdinator", "Submission", "Bubbles"].includes(item.label));
  }

  return submenu.filter((item) => item.label === "Bubbles");
};

export default function Header() {
  const theme = useTheme();
  const [anchorEls, setAnchorEls] = useState({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, setUser } = useUser();
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const fileInputRef = useRef(null);
  
  const [notificationPrefs, setNotificationPrefs] = useState({
    notifyEmail: false,
    notifySlack: true,
    userEmail: "",
    slackUsername: "",
  });
  
  const [tempPrefs, setTempPrefs] = useState({ ...notificationPrefs });
  const [tempProfileImage, setTempProfileImage] = useState("");
  const [statusMsg, setStatusMsg] = useState({ open: false, msg: "", severity: "info" });

  // --- Handlers ---

  const handleMenuOpen = (event, label) => {
    setAnchorEls((prev) => ({ ...prev, [label]: event.currentTarget }));
  };

  const handleMenuClose = (label) => {
    setAnchorEls((prev) => ({ ...prev, [label]: null }));
  };

  const handleProfileOpen = () => {
    if (user && user.id) {
      fetchUserInfo();
      fetchNotificationPreferences();
      setTempProfileImage(user.profilePicture || "");
    }
    setProfileOpen(true);
  };

  const handleProfileClose = () => {
    setProfileOpen(false);
  };

  const getBaseUrl = (url) => url ? url.replace(/\/$/, "") : "";

  async function fetchUserInfo() {
      try {
        const baseUrl = getBaseUrl(process.env.NEXT_PUBLIC_API_URL);
        if (!baseUrl) return;
        const res = await fetch(`${baseUrl}/api/teams/${user.id}`);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        const data = await res.json();
        
        if (Array.isArray(data)) {
            setTeams(data.map(team => team.name));
            const projList = data.map(team => team.project).filter(p => p);
            setProjects(projList.map(project => project.title));
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      } 
    }

  async function fetchNotificationPreferences() {
    if (!user || !user.id) return;
    try {
      const baseUrl = getBaseUrl(process.env.NEXT_PUBLIC_NOTIFICATION);
      const url = `${baseUrl}/preferences/scoop-portal/${user.id}`;
      const res = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" }});

      if (!res.ok) {
        console.warn(`Failed to fetch notification preferences: ${res.status}`);
        return;
      }
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      const safePrefs = {
        notifyEmail: data.notifyEmail || false,
        notifySlack: data.notifySlack || false,
        userEmail: data.userEmail || user.email || "",
        slackUsername: data.slackUsername || "",
      };
      setNotificationPrefs(safePrefs);
      setTempPrefs(safePrefs);
    } catch (error) {
      console.error("Failed to fetch notification preferences:", error);
    }
  }

  const handleSavePreferences = async () => {
    if (!user || !user.id) return;
    try {
      const baseUrl = getBaseUrl(process.env.NEXT_PUBLIC_NOTIFICATION);
      const url = `${baseUrl}/preferences/scoop-portal/${user.id}`;
      
      let formattedSlack = tempPrefs.slackUsername.trim();
      if (formattedSlack.length > 0 && !formattedSlack.startsWith("@")) {
        formattedSlack = "@" + formattedSlack;
      }

      const payload = { ...tempPrefs, slackUsername: formattedSlack };

      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setNotificationPrefs({ ...payload });
        setTempPrefs(payload); 
        setStatusMsg({ open: true, msg: "Preferences saved successfully", severity: "success" });
      } else {
        setStatusMsg({ open: true, msg: `Error saving: ${res.status}`, severity: "error" });
      }
    } catch (error) {
      setStatusMsg({ open: true, msg: "Network error saving preferences", severity: "error" });
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !user.id) return;
    
    try {
      // Save profile picture and user info
      const baseUrl = getBaseUrl(process.env.NEXT_PUBLIC_API_URL);
      if (!baseUrl) {
        setStatusMsg({ open: true, msg: "API URL not configured", severity: "error" });
        return;
      }

      const userRes = await fetch(`${baseUrl}/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profilePicture: tempProfileImage,
        }),
      });

      if (!userRes.ok) {
        setStatusMsg({ open: true, msg: `Error saving profile: ${userRes.status}`, severity: "error" });
        return;
      }

      const updatedUser = await userRes.json();
      
      // Update user context with new profile picture
      if (setUser) {
        setUser({ ...user, profilePicture: tempProfileImage });
      }

      // Save notification preferences
      let formattedSlack = tempPrefs.slackUsername.trim();
      if (formattedSlack.length > 0 && !formattedSlack.startsWith("@")) {
        formattedSlack = "@" + formattedSlack;
      }

      const notifPayload = { ...tempPrefs, slackUsername: formattedSlack };
      const notifBaseUrl = getBaseUrl(process.env.NEXT_PUBLIC_NOTIFICATION);
      const notifUrl = `${notifBaseUrl}/preferences/scoop-portal/${user.id}`;
      
      const notifRes = await fetch(notifUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifPayload),
      });

      if (notifRes.ok) {
        setNotificationPrefs({ ...notifPayload });
        setTempPrefs(notifPayload);
        setStatusMsg({ open: true, msg: "Profile saved successfully", severity: "success" });
      } else {
        setStatusMsg({ open: true, msg: "Profile picture saved, but notification preferences failed to update", severity: "warning" });
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setStatusMsg({ open: true, msg: "Network error saving profile", severity: "error" });
    }
  };

  const handleResetProfile = () => {
    setTempProfileImage(user?.profilePicture || "");
    setTempPrefs({ ...notificationPrefs });
  };

  const handlePrefChange = (field, value) => {
    setTempPrefs((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (user?.profilePicture) {
      setTempProfileImage(user.profilePicture);
    } else {
      setTempProfileImage("");
    }
  }, [user]);

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfilePictureSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl === "string") {
        setTempProfileImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredResults = query
    ? searchablePages.filter((page) => page.label.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <>
      <Snackbar 
        open={statusMsg.open} 
        autoHideDuration={6000} 
        onClose={() => setStatusMsg({ ...statusMsg, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={statusMsg.severity} variant="filled" onClose={() => setStatusMsg({ ...statusMsg, open: false })}>
            {statusMsg.msg}
        </Alert>
      </Snackbar>

      <AppBar
        position="fixed"
        sx={{
          bgcolor: theme.ritColors.white,
          color: theme.palette.mode === "light" ? theme.ritColors.black : theme.ritColors.white,
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          borderBottom: `1px solid ${theme.ritColors.gray_1}`,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, md: 3 } }}>
          {/* Logo and Nav Items */}
          <Box display="flex" alignItems="center">
            <Link href={"/dashboard"} passHref>
              <Box component="span" sx={{ display: "flex", alignItems: "center", mr: 2, cursor: "pointer" }}>
                <Box
                  component="img"
                  src={process.env.NEXT_PUBLIC_URL_BASE_PATH+"/RIT_RGB_hor.png"}
                  alt="RIT Logo"
                  sx={{ height: 48, width: "auto" }}
                />
              </Box>
            </Link>

            {navItems.map(({ label, submenu, path }) => {
              const visibleSubmenu = label === "Workflows" ? getFilteredWorkflowItems(user?.type, submenu) : submenu;
              return (
                <Box key={label} sx={{ position: "relative", mr: 1 }}>
                  {path ? (
                    <Button
                      component={Link}
                      href={path}
                      sx={{
                        color: theme.palette.mode === "light" ? theme.ritColors.black : theme.ritColors.white,
                        fontWeight: 600,
                        textTransform: "none",
                        '&:hover': {
                          bgcolor: 'transparent',
                          textDecoration: 'underline',
                          textDecorationColor: theme.ritColors.orange,
                          textDecorationThickness: '2px',
                          textUnderlineOffset: '4px',
                        },
                      }}
                    >
                      {label}
                    </Button>
                  ) : (
                    <>
                      <Button
                        aria-controls={anchorEls[label] ? `${label}-menu` : undefined}
                        aria-haspopup="true"
                        onClick={(e) => handleMenuOpen(e, label)}
                        endIcon={<ArrowDropDownIcon />}
                        sx={{
                          color: theme.palette.mode === "light" ? theme.ritColors.black : theme.ritColors.white,
                          fontWeight: 600,
                          textTransform: "none",
                          '&:hover': {
                            bgcolor: 'transparent',
                            textDecoration: 'underline',
                            textDecorationColor: theme.ritColors.orange,
                            textDecorationThickness: '2px',
                            textUnderlineOffset: '4px',
                          },
                        }}
                      >
                        {label}
                      </Button>
                      <Menu
                        id={`${label}-menu`}
                        anchorEl={anchorEls[label]}
                        open={Boolean(anchorEls[label])}
                        onClose={() => handleMenuClose(label)}
                        PaperProps={{ elevation: 3, sx: { mt: 1 } }}
                      >
                        {visibleSubmenu.map((item) => (
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
                    </>
                  )}
                </Box>
              );
            })}
          </Box>

          {/* Search, Profile, Logout */}
          <Box display="flex" alignItems="center" gap={1}>
            {/* Search Bar */}
            <ClickAwayListener onClickAway={() => setSearchOpen(false)}>
              <Box sx={{ position: "relative" }}>
                {searchOpen ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: "2px 4px",
                      display: "flex",
                      alignItems: "center",
                      bgcolor: theme.ritColors.warm_gray_1,
                      borderRadius: 4,
                      width: 240,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <InputBase
                      sx={{ ml: 1, flex: 1 }}
                      placeholder="Search..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      autoFocus
                    />
                    <IconButton size="small" onClick={() => setSearchOpen(false)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                ) : (
                  <IconButton onClick={() => setSearchOpen(true)}>
                    <SearchIcon />
                  </IconButton>
                )}

                {searchOpen && filteredResults.length > 0 && (
                  <Paper
                    elevation={4}
                    sx={{
                      position: "absolute",
                      top: 45,
                      right: 0,
                      width: 250,
                      maxHeight: 300,
                      overflowY: "auto",
                      zIndex: 1300,
                      borderRadius: 2,
                    }}
                  >
                    <List disablePadding>
                      {filteredResults.map((page) => (
                        <Link key={page.label} href={page.path} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                          <MenuItem onClick={() => { setSearchOpen(false); setQuery(""); }}>
                            {page.label}
                          </MenuItem>
                        </Link>
                      ))}
                    </List>
                  </Paper>
                )}
              </Box>
            </ClickAwayListener>

            {/* Profile Avatar Button */}
            <Tooltip title="Profile">
                <IconButton onClick={handleProfileOpen} sx={{ ml: 1, p: 0.5 }}>
                   <Avatar sx={{ bgcolor: theme.ritColors.orange, width: 36, height: 36, fontSize: '1rem' }}>
                      {user && user.fname ? user.fname[0] : <PersonIcon />}
                   </Avatar>
                </IconButton>
            </Tooltip>

            {/* Logout Button */}
            <Button
              href={process.env.NEXT_PUBLIC_URL_BASE_PATH}
              variant="outlined"
              color="inherit"
              startIcon={<LogoutIcon />}
              sx={{
                textTransform: "none",
                borderRadius: 4,
                borderColor: theme.palette.divider,
                color: theme.palette.mode === "light" ? theme.ritColors.black : theme.ritColors.white,
                '&:hover': {
                  backgroundColor: theme.ritColors.orange,
                  color: theme.ritColors.white,
                  borderColor: theme.ritColors.orange,
                },
              }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

          {/* Profile Modal */}
      <Modal open={profileOpen} onClose={handleProfileClose} aria-labelledby="profile-modal">
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 500 },
            maxHeight: "90vh",
            overflowY: "auto",
            outline: "none",
          }}
        >
          <Paper 
            sx={{ 
                overflow: "hidden", 
                borderRadius: 3, 
                bgcolor: "background.paper", // Ensure modal background is theme aware
                color: "text.primary" // Explicitly force text color
            }}
          >
            {user && user.fname ? (
              <>
                {/* Header Banner */}
                <Box sx={{ bgcolor: theme.ritColors.orange, height: 100, position: 'relative' }}>
                    <IconButton 
                        onClick={handleProfileClose} 
                        sx={{ position: 'absolute', top: 8, right: 8, color: 'white' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
                
                {/* User Content */}
                <Box sx={{ px: 4, pb: 4, mt: -6 }}>
                    {/* Avatar & Name */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                        <Box
                            sx={{
                                position: 'relative',
                                mb: 1,
                                cursor: 'pointer',
                                '&:hover .profilePictureOverlay': {
                                    opacity: 1,
                                },
                            }}
                            onClick={handleProfilePictureClick}
                        >
                            <Avatar
                                src={tempProfileImage || undefined}
                                sx={{
                                    width: 100,
                                    height: 100,
                                    bgcolor: tempProfileImage ? theme.ritColors.gray_1 : "background.paper",
                                    color: theme.ritColors.orange,
                                    border: "4px solid",
                                    borderColor: "background.paper",
                                    boxShadow: 2,
                                    fontSize: "2.5rem",
                                }}
                            >
                                {user.fname[0]}{user.lname[0]}
                            </Avatar>
                            <Box
                                className="profilePictureOverlay"
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    bgcolor: 'rgba(0, 0, 0, 0.75)',
                                    color: theme.ritColors.white,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    opacity: 0,
                                    transition: 'opacity 0.2s ease-in-out',
                                    px: 1,
                                    textAlign: 'center',
                                    fontWeight: 600,
                                }}
                            >
                                <Typography variant="caption" textAlign="center">
                                    Edit Profile Picture
                                </Typography>
                            </Box>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={handleProfilePictureSelect}
                            />
                        </Box>
                        <Typography variant="h5" fontWeight="bold">
                            {user.fname} {user.lname}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                            Click the profile picture to change your photo
                        </Typography>
                        <Chip 
                            label={user.type ? `${user.type.charAt(0).toUpperCase()}${user.type.slice(1)}` : user.type} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                            sx={{ mt: 0.5, borderColor: theme.ritColors.orange, color: theme.ritColors.orange }} 
                        />
                    </Box>

                    {/* Basic Info */}
                    <Stack spacing={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon color="action" fontSize="small" />
                            <Typography variant="body1" sx={{ lineHeight: 1.25 }}>{user.email}</Typography>
                        </Box>
                        
                        <Divider />
                        
                        {/* Teams */}
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Teams
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {Array.isArray(teams) && teams.length > 0 ? (
                                    teams.map((t, idx) => <Chip key={idx} label={t} />)
                                ) : (
                                    <Typography variant="caption" color="text.disabled">No teams assigned</Typography>
                                )}
                            </Box>
                        </Box>

                        {/* Projects */}
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Projects
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {Array.isArray(projects) && projects.length > 0 ? (
                                    projects.map((p, idx) => <Chip key={idx} label={p} variant="outlined" />)
                                ) : (
                                    <Typography variant="caption" color="text.disabled">No projects assigned</Typography>
                                )}
                            </Box>
                        </Box>
                    </Stack>

                    {/* Notification Settings Card */}
                    <Card 
                        variant="outlined" 
                        sx={{ 
                            mt: 3, 
                            bgcolor: "background.default", 
                            color: "text.primary", 
                            borderColor: theme.ritColors.gray_2,
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <NotificationsActiveIcon sx={{ color: theme.ritColors.orange }} fontSize="small" />
                                <Typography variant="subtitle1" fontWeight="600">Notification preferences</Typography>
                            </Box>
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Email alerts</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" fontWeight="500">{tempPrefs.notifyEmail ? "On" : "Off"}</Typography>
                                        <Switch
                                            size="small"
                                            checked={tempPrefs.notifyEmail}
                                            onChange={(e) => handlePrefChange("notifyEmail", e.target.checked)}
                                            color="warning"
                                        />
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Slack alerts</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" fontWeight="500">{tempPrefs.notifySlack ? "On" : "Off"}</Typography>
                                        <Switch
                                            size="small"
                                            checked={tempPrefs.notifySlack}
                                            onChange={(e) => handlePrefChange("notifySlack", e.target.checked)}
                                            color="warning"
                                        />
                                    </Box>
                                </Box>
                                {tempPrefs.slackUsername && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="text.secondary">Slack username</Typography>
                                        <Typography variant="body2">{tempPrefs.slackUsername}</Typography>
                                    </Box>
                                )}
                                <TextField
                                    label="Notification email"
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    value={tempPrefs.userEmail}
                                    onChange={(e) => handlePrefChange("userEmail", e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small"/></InputAdornment>,
                                    }}
                                />
                                <TextField
                                    label="Slack username"
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    placeholder="@username"
                                    value={tempPrefs.slackUsername}
                                    onChange={(e) => handlePrefChange("slackUsername", e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><TagIcon fontSize="small"/></InputAdornment>,
                                    }}
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                    <Box sx={{ display: 'flex', gap: 1, pt: 1, flexWrap: 'wrap' }}>
                                    <Button 
                                        fullWidth
                                        variant="contained" 
                                        startIcon={<SaveIcon />}
                                        onClick={handleSaveProfile}
                                        sx={{
                                            bgcolor: theme.ritColors.orange,
                                            color: theme.ritColors.white,
                                            '&:hover': {
                                                bgcolor: theme.ritColors.black,
                                                color: theme.ritColors.white,
                                            },
                                        }}
                                    >
                                        Save Profile
                                    </Button>
                                    <Button 
                                        fullWidth
                                        variant="outlined" 
                                        startIcon={<CancelIcon />}
                                        onClick={handleResetProfile}
                                        color="inherit"
                                    >
                                        Reset
                                    </Button>
                                </Box>
                </Box>
              </>
            ) : (
                // Loading Skeleton State
                <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Skeleton variant="circular" width={80} height={80} sx={{ mb: 2 }} />
                    <Skeleton variant="text" width="60%" height={32} />
                    <Skeleton variant="text" width="40%" height={20} sx={{ mb: 4 }} />
                    <Skeleton variant="rectangular" width="100%" height={200} />
                </Box>
            )}
          </Paper>
        </Box>
      </Modal>

      <Toolbar />
    </>
  );
}