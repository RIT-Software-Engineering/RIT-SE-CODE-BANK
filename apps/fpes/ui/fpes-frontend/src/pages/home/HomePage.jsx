import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Card, CardActionArea, CardContent, Typography } from "@mui/material";

const ROLE_CARDS = {
  Faculty: [
    { title: "Fill Out Your Highlights Form", desc: "Submit your research, publications, and achievements for the evaluation period.", route: "/highlights_form" },
    { title: "View Highlights & Teaching Evals", desc: "Review your submitted highlights and see your teaching evaluation scores.", route: "/highlights" },
    { title: "Profile", desc: "Update your personal and professional information.", route: "/profile" },
  ],
  Supervisor: [
    { title: "Supervising", desc: "View and manage the faculty members you supervise.", route: "/supervising" },
    { title: "Highlights & Teaching Evals", desc: "Review highlights and teaching evaluations for your supervised faculty.", route: "/highlights" },
    { title: "Teaching Evals", desc: "Browse teaching evaluation data across your faculty.", route: "/teaching-evals" },
  ],
  Admin: [
    { title: "Manage Users", desc: "Add, edit, or remove system users and assign roles.", route: "/users" },
    { title: "Manage Departments", desc: "Create and manage academic departments.", route: "/departments" },
    { title: "Manage Courses", desc: "Add and configure courses in the system.", route: "/courses" },
    { title: "All Highlights", desc: "View submitted highlights across all faculty.", route: "/admin-highlights" },
    { title: "Teaching Evals", desc: "Review teaching evaluations system-wide.", route: "/teaching-evals" },
  ],
};

export default function HomePage({ roles }) {
  const navigate = useNavigate();
  const [bannerDismissed, setBannerDismissed] = useState(
    () => localStorage.getItem("fpes_seen_welcome") === "true"
  );

  const handleDismiss = () => {
    localStorage.setItem("fpes_seen_welcome", "true");
    setBannerDismissed(true);
  };

  const activeRole = ["Admin", "Supervisor", "Faculty"].find(r => roles?.has(r));
  const cards = ROLE_CARDS[activeRole] ?? [];

  return (
    <Box sx={{ padding: "5rem 2rem 2rem" }}>
      {!bannerDismissed && (
        <Alert
          severity="info"
          onClose={handleDismiss}
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate("/getting-started")}>
              View Checklist
            </Button>
          }
        >
          First time here? Check out the Getting Started checklist.
        </Alert>
      )}

      <Typography variant="h5" sx={{ mb: 1 }}>Welcome back</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Here's what you can do as a <strong>{activeRole}</strong>:
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {cards.map((card) => (
          <Card key={card.route} sx={{ width: 260 }} elevation={2}>
            <CardActionArea onClick={() => navigate(card.route)} sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.desc}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
