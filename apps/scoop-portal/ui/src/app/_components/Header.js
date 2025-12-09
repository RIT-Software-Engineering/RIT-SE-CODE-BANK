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
  Skeleton
} from "@mui/material";

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
const RIT_ORANGE = "#F76902";
const RIT_DEEP_ORANGE = "#d15800";

const navItems = [
  { label: "Dashboard", path: "/dashboard", submenu: [] },
  {
    label: "Workflows",
    submenu: [
      { label: "Scooployee", path: "/scooployee/workflows" },
      { label: "Scoopdinator", path: "/scoopdinator/workflows" },
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

export default function Header() {
  const [anchorEls, setAnchorEls] = useState({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const { user } = useUser();
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  
  const [notificationPrefs, setNotificationPrefs] = useState({
    notifyEmail: false,
    notifySlack: true,
    userEmail: "",
    slackUsername: "",
  });
  
  const [editMode, setEditMode] = useState(false);
  const [tempPrefs, setTempPrefs] = useState({ ...notificationPrefs });
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
    }
    setProfileOpen(true);
  };

  const handleProfileClose = () => {
    setProfileOpen(false);
    setEditMode(false);
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
      const url = `${baseUrl}/preferences/scoop/${user.id}`;
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
      const url = `${baseUrl}/preferences/scoop/${user.id}`;
      
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
        setEditMode(false);
        setStatusMsg({ open: true, msg: "Preferences saved successfully", severity: "success" });
      } else {
        setStatusMsg({ open: true, msg: `Error saving: ${res.status}`, severity: "error" });
      }
    } catch (error) {
      setStatusMsg({ open: true, msg: "Network error saving preferences", severity: "error" });
    }
  };

  const handlePrefChange = (field, value) => {
    setTempPrefs((prev) => ({ ...prev, [field]: value }));
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
          bgcolor: "#fff",
          color: "#212121",
          boxShadow: 2,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, md: 3 } }}>
          {/* Logo and Nav Items */}
          <Box display="flex" alignItems="center">
            <Link href={"/dashboard"} passHref>
              <Box component="span" sx={{ display: "flex", alignItems: "center", mr: 2, cursor: "pointer" }}>
                <Box
                  component="img"
                  src="/RIT_RGB_hor.png"
                  alt="RIT Logo"
                  sx={{ height: 48, width: "auto" }}
                />
              </Box>
            </Link>

            {navItems.map(({ label, submenu, path }) => (
              <Box key={label} sx={{ position: "relative", mr: 1 }}>
                {path ? (
                  <Button
                    component={Link}
                    href={path}
                    sx={{ color: "#212121", fontWeight: 600, textTransform: "none", '&:hover': { bgcolor: "rgba(0,0,0,0.04)" } }}
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
                      sx={{ color: "#212121", fontWeight: 600, textTransform: "none" }}
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
                  </>
                )}
              </Box>
            ))}
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
                      bgcolor: "#f1f1f1",
                      borderRadius: 4,
                      width: 240,
                      border: "1px solid #ddd"
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
                   <Avatar sx={{ bgcolor: RIT_ORANGE, width: 36, height: 36, fontSize: '1rem' }}>
                      {user && user.fname ? user.fname[0] : <PersonIcon />}
                   </Avatar>
                </IconButton>
            </Tooltip>

            {/* Logout Button */}
            <Button
              href="/"
              variant="outlined"
              color="inherit"
              startIcon={<LogoutIcon />}
              sx={{ textTransform: "none", borderRadius: 4, borderColor: "#ddd" }}
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
                <Box sx={{ bgcolor: RIT_ORANGE, height: 100, position: 'relative' }}>
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
                        <Avatar 
                            sx={{ 
                                width: 100, 
                                height: 100, 
                                bgcolor: "background.paper", // Matches card background 
                                color: RIT_ORANGE,
                                border: "4px solid",
                                borderColor: "background.paper",
                                boxShadow: 2,
                                fontSize: "2.5rem",
                                mb: 1
                            }}
                        >
                            {user.fname[0]}{user.lname[0]}
                        </Avatar>
                        <Typography variant="h5" fontWeight="bold">
                            {user.fname} {user.lname}
                        </Typography>
                        <Chip 
                            label={user.type} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                            sx={{ mt: 0.5, borderColor: RIT_ORANGE, color: RIT_ORANGE }} 
                        />
                    </Box>

                    {/* Basic Info */}
                    <Stack spacing={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon color="action" />
                            <Typography variant="body1">{user.email}</Typography>
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
                            // CHANGED: Use theme-aware background instead of hardcoded white
                            bgcolor: "background.default", 
                            color: "text.primary" 
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <NotificationsActiveIcon color="white" fontSize="small" />
                                    <Typography variant="subtitle1" fontWeight="600">Preferences</Typography>
                                </Box>
                                {!editMode && (
                                    <Button 
                                        startIcon={<EditIcon />} 
                                        size="small" 
                                        onClick={() => setEditMode(true)}
                                        sx={{ color: RIT_ORANGE }}
                                    >
                                        Edit
                                    </Button>
                                )}
                            </Box>

                            {!editMode ? (
                                <Stack spacing={1}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="text.secondary">Email Alerts</Typography>
                                        <Typography variant="body2" fontWeight="500">{notificationPrefs.notifyEmail ? "On" : "Off"}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="text.secondary">Slack Alerts</Typography>
                                        <Typography variant="body2" fontWeight="500">{notificationPrefs.notifySlack ? "On" : "Off"}</Typography>
                                    </Box>
                                    {notificationPrefs.slackUsername && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="text.secondary">Slack ID</Typography>
                                            <Typography variant="body2">{notificationPrefs.slackUsername}</Typography>
                                        </Box>
                                    )}
                                </Stack>
                            ) : (
                                <Stack spacing={2}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                size="small"
                                                checked={tempPrefs.notifyEmail}
                                                onChange={(e) => handlePrefChange("notifyEmail", e.target.checked)}
                                                color="warning"
                                            />
                                        }
                                        label={<Typography variant="body2">Enable Email Notifications</Typography>}
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                size="small"
                                                checked={tempPrefs.notifySlack}
                                                onChange={(e) => handlePrefChange("notifySlack", e.target.checked)}
                                                color="warning"
                                            />
                                        }
                                        label={<Typography variant="body2">Enable Slack Notifications</Typography>}
                                    />
                                    
                                    <TextField
                                        label="Notification Email"
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
                                        label="Slack Username"
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

                                    <Box sx={{ display: 'flex', gap: 1, pt: 1 }}>
                                        <Button 
                                            fullWidth
                                            variant="contained" 
                                            startIcon={<SaveIcon />}
                                            onClick={handleSavePreferences}
                                            sx={{ bgcolor: RIT_ORANGE, '&:hover': { bgcolor: RIT_DEEP_ORANGE } }}
                                        >
                                            Save
                                        </Button>
                                        <Button 
                                            fullWidth
                                            variant="outlined" 
                                            startIcon={<CancelIcon />}
                                            onClick={() => {
                                                setEditMode(false);
                                                setTempPrefs({ ...notificationPrefs });
                                            }}
                                            color="inherit"
                                        >
                                            Cancel
                                        </Button>
                                    </Box>
                                </Stack>
                            )}
                        </CardContent>
                    </Card>
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