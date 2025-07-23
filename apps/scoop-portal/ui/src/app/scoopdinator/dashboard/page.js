"use client";
import React from "react";
import { Box, Typography, Container, Button, Grid, Paper } from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

import Header from "../../_components/Header";

const workflows = [
  {
    title: "Scooployees",
    steps: [
      {
        title: "Review Applications",
        description: "Approve or reject scooployee applications.",
        link: "/scoopdinator/applications",
      },
      {
        title: "View Employees",
        description: "Review current scooployee details and statuses.",
        link: "/scoopdinator/scooployees/view",
      },
      {
        title: "Assign Scooployees to Teams",
        description: "Assign scooployees to appropriate teams for projects.",
        link: "/scoopdinator/scooployees/assign",
      },
    ],
  },
  {
    title: "Projects",
    steps: [
      {
        title: "Manage Projects",
        description: "Create, edit, and archive scoop projects.",
        link: "/projects/1",
      },
      {
        title: "View Projects",
        description: "View existing projects and their statuses.",
        link: "/projects",
      },
      {
        title: "Assign Teams",
        description: "Assign teams to existing projects.",
        link: "/projects/assign/team",
      },
      {
        title: "Assign Supervisors",
        description: "Assign supervisors to oversee projects and teams.",
        link: "/projects/assign/scoopervisor",
      },
    ],
  },
  {
    title: "Administration",
    steps: [
      {
        title: "Contact Advisors",
        description: "Get in touch with academic advisors for student support.",
        link: "/scoopdinator/administrative/contact/advisors",
      },
      {
        title: "Contact Co-op Coordinators",
        description:
          "Communicate with coordinators for co-op management and advertising.",
        link: "/scoopdinator/administrative/contact/coordinators",
      },
      {
        title: "Manage Co-op Reports",
        description: "Review and manage reports related to co-op experiences.",
        link: "/scoopdinator/administrative/reports",
      },
      {
        title: "Open Communications Journal",
        description:
          "View your past communications with others and leave notes.",
        link: "/scoopdinator/administrative/journal",
      },
    ],
  },
];

export default function WorkflowDashboard() {
  return (
    <Box
      sx={{
        fontFamily: '"Helvetica Neue", Helvetica, Roboto, Arial, sans-serif',
        color: "#212121",
      }}
    >
      <Header />
      <Container maxWidth="lg" sx={{ py: 4, maxWidth: "1280px" }}>
        <Typography
          variant="h1"
          sx={{
            fontSize: "2rem",
            fontWeight: 900,
            mb: 5,
            color: "#fff",
          }}
        >
          Scoopdinator Dashboard
        </Typography>

        <Grid container spacing={4} direction="column">
          {workflows.map((workflow) => (
            <Grid item xs={12} key={workflow.title}>
              <Paper elevation={1} sx={{ p: 3 }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    mb: 3,
                    borderBottom: "2px solid #F76902",
                    pb: 1,
                    maxWidth: "max-content",
                  }}
                >
                  {workflow.title}
                </Typography>

                <Box>
                  {workflow.steps.map((step, index) => (
                    <Box
                      key={step.title}
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        mb: index !== workflow.steps.length - 1 ? 3 : 0,
                        flexWrap: "nowrap",
                      }}
                    >
                      <Box
                        sx={{
                          minWidth: 32,
                          minHeight: 32,
                          borderRadius: "50%",
                          bgcolor: "#F76902",
                          color: "#fff",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mr: 2,
                          userSelect: "none",
                          fontSize: "1rem",
                          flexShrink: 0,
                        }}
                      >
                        {index + 1}
                      </Box>

                      <Box
                        sx={{
                          flexGrow: 1,
                          minWidth: 0,
                        }}
                      >
                        <Typography
                          variant="h3"
                          sx={{
                            fontSize: "1.25rem",
                            fontWeight: 300,
                            mb: 0.5,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={step.title}
                        >
                          {step.title}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "1rem",
                            lineHeight: 1.5,
                            color: "#555",
                            whiteSpace: "normal",
                          }}
                        >
                          {step.description}
                        </Typography>
                      </Box>

                      <Button
                        href={step.link}
                        variant="solid-orange"
                        sx={{
                          textTransform: "none",
                          ml: 2,
                          flexShrink: 0,
                        }}
                        endIcon={<ArrowForwardIosIcon fontSize="small" />}
                      >
                        Go
                      </Button>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box
        component="footer"
        sx={{
          height: "80px",
          bgcolor: "#212121",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, md: 3 },
          mt: 8,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 300 }}>
          © {new Date().getFullYear()} RIT | Contact | Terms
        </Typography>
      </Box>
    </Box>
  );
}
