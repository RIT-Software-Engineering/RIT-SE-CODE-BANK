import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Checkbox, Divider, LinearProgress,
  List, ListItem, ListItemIcon, ListItemText, Paper, Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

const ROLE_TASKS = {
  Faculty: [
    { id: "profile", label: "Set up your profile", desc: "Fill in your name, rank, unit, and affiliations.", route: "/profile" },
    { id: "highlights_form", label: "Submit your highlights form", desc: "Fill out services, grants, publications, student support, and course sections.", route: "/highlights_form" },
    { id: "teaching_eval", label: "Upload your teaching evaluation", desc: "Upload your teaching evaluation as a PDF or CSV.", route: "/highlights?upload=true" },
    { id: "highlights", label: "View your highlights & teaching evals", desc: "See all your submitted highlights forms and uploaded teaching evaluations in one place.", route: "/highlights" },
  ],
  Supervisor: [
    { id: "profile", label: "Set up your profile", desc: "Fill in your name, rank, unit, and affiliations.", route: "/profile" },
    { id: "supervising", label: "View your supervised faculty", desc: "Go to the Supervising page to see who you manage.", route: "/supervising" },
    { id: "highlights", label: "Review faculty highlights", desc: "Browse highlights submitted by your faculty.", route: "/highlights" },
    { id: "teaching_evals", label: "Check teaching evaluations", desc: "Review teaching eval data for your faculty.", route: "/teaching-evals" },
  ],
  Admin: [
    { id: "departments", label: "Set up departments", desc: "Create the academic departments in the system.", route: "/departments" },
    { id: "courses", label: "Add courses", desc: "Configure the courses offered.", route: "/courses" },
    { id: "users", label: "Add users", desc: "Create faculty and supervisor accounts and assign roles.", route: "/users" },
    { id: "admin_highlights", label: "Review all highlights", desc: "Browse highlights submitted across all faculty.", route: "/admin-highlights" },
    { id: "teaching_evals", label: "Check teaching evaluations", desc: "Review teaching evaluations system-wide.", route: "/teaching-evals" },
  ],
};

function loadChecked(role) {
  try {
    return JSON.parse(localStorage.getItem(`fpes_checklist_${role}`)) ?? [];
  } catch {
    return [];
  }
}

export default function GettingStartedPage({ roles }) {
  const navigate = useNavigate();
  const activeRole = ["Admin", "Supervisor", "Faculty"].find(r => roles?.has(r));
  const tasks = ROLE_TASKS[activeRole] ?? [];

  const [checked, setChecked] = useState(() => loadChecked(activeRole));

  const toggle = (id) => {
    const updated = checked.includes(id) ? checked.filter(c => c !== id) : [...checked, id];
    setChecked(updated);
    localStorage.setItem(`fpes_checklist_${activeRole}`, JSON.stringify(updated));
  };

  const reset = () => {
    setChecked([]);
    localStorage.removeItem(`fpes_checklist_${activeRole}`);
  };

  const openTask = (task) => {
    if (!checked.includes(task.id)) toggle(task.id);
    navigate(task.route);
  };

  const progress = tasks.length ? Math.round((checked.length / tasks.length) * 100) : 0;
  const allDone = progress === 100;

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", mt: 4, px: 2 }} style={{background:"white"}}>
      <Typography variant="h5" sx={{ mb: 0.5 }} color="black">Getting Started</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        A quick checklist to help you get familiar with the system as a <strong>{activeRole}</strong>.
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        All steps are part of this portal. Complete them in any order — steps are numbered for reference only.
      </Typography>

      <Box sx={{ mb: 1, display: "flex", justifyContent: "space-between" }}>
        <Typography variant="body2" color="text.secondary">
          {checked.length} of {tasks.length} completed
        </Typography>
        {allDone && (
          <Typography variant="body2" sx={{ color: "success.main", fontWeight: "bold" }}>
            🎉 All done!
          </Typography>
        )}
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ mb: 3, height: 8, borderRadius: 4 }}
        color={allDone ? "success" : "primary"}
      />

      <Paper elevation={2}>
        <List disablePadding>
          {tasks.map((task, i) => {
            const done = checked.includes(task.id);
            return (
              <React.Fragment key={task.id}>
                {i > 0 && <Divider />}
                <ListItem
                  alignItems="flex-start"
                  secondaryAction={
                    <Button size="small" variant="outlined" onClick={() => openTask(task)} sx={{ whiteSpace: "nowrap" }}>
                      Open
                    </Button>
                  }
                  sx={{ pr: 10 }}
                >
                  <ListItemIcon sx={{ mt: 0.5, minWidth: 40 }}>
                    <Checkbox
                      edge="start"
                      checked={done}
                      onChange={() => toggle(task.id)}
                      icon={<RadioButtonUncheckedIcon />}
                      checkedIcon={<CheckCircleIcon color="success" />}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle2"
                        sx={{ textDecoration: done ? "line-through" : "none", color: done ? "text.disabled" : "text.primary" }}
                      >
                        {i + 1}. {task.label}
                      </Typography>
                    }
                    secondary={task.desc}
                  />
                </ListItem>
              </React.Fragment>
            );
          })}
        </List>
      </Paper>

      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button size="small" color="inherit" onClick={reset}>Reset checklist</Button>
      </Box>
    </Box>
  );
}
