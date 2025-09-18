'use client';
import React from 'react';
import {
  Box, Typography, Container, Button, Grid, Paper,
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import Header from '@components/Header';

const workflows = [
  {
    title: "Scooployees",
    steps: [
      {
        title: "Review Applications",
        roles: ["scoopdinator","scoopervisor"],
        description: "Approve or reject scooployee applications.",
        link: "/scoopdinator/applications",
      },
      {
        title: "Manage Employees",
        roles: ["Scoopdinator"],
        description: "Review current scooployee details and statuses.",
        link: "/scoopdinator/scooployees",
      },
      {
        title: 'Onboarding Workflow',
        roles: ["Scoopdinator","Scoopervisor"],
        description: 'To begin the total onboarding process, view the workflow dashboard.',
        link: '/scoopdinator/workflows',
      },
    ],
  },
  {
    title: "Projects",
    steps: [
      {
        title: "Manage Projects",
        roles: ["Scoopdinator"],
        description: "Create, edit, and archive scoop projects.",
        link: "/projects/1",
      },
      {
        title: "View Projects",
        roles: ["Scoopdinator"],
        description: "View existing projects and their statuses.",
        link: "/projects",
      },
      {
        title: "Assign Teams",
        roles: ["Scoopdinator"],
        description: "Assign teams to existing projects.",
        link: "/projects/assign/team",
      },
      {
        title: "View Teams",
        roles: ["Scoopdinator","Scoopervisor"],
        description: "View and modify existing scoop teams.",
        link: "/scoopdinator/teams",
      },
    ],
  },
  {
    title: "Administration",
    steps: [
      {
        title: "Contact Advisors",
        roles: ["Scoopdinator","Scoopervisor","Scooployee"],
        description: "Get in touch with academic advisors.",
        link: "/scoopdinator/administrative/contact/advisors",
      },
      {
        title: "Contact Co-op Coordinators",
        roles: ["Scoopdinator","Scoopervisor","Scooployee"],
        description: "Communicate with coordinators for co-op management and advising.",
        link: "/scoopdinator/administrative/contact/coordinators",
      },
      {
        title: "Manage Co-op Reports",
        roles: ["Scoopdinator","Scoopervisor"],
        description: "Review and manage reports related to co-op experiences.",
        link: "/scoopdinator/administrative/reports",
      },
      {
        title: "Open Communications Journal",
        roles: ["Scoopdinator","Scoopervisor","Scooployee"],
        description:
          "View your past communications with others and leave notes.",
        link: "/scoopdinator/administrative/journal",
      },
    ],
  },
];
const filteredWorkflows = []

/**
 * Renders the content for the Scoopdinator's Dashboard
 * @returns {JSX.Element}
 */
export default function WorkflowDashboard() {
  const { user } = useUser();
  // console.log("current user: ", user, user ? user.type : 'no user');
  // if (!user || user.type !== "admin") {
  //   return <UnauthorizedPage />;
  // }

  return (
    // <ProtectedRoute requiredRole="admin">
    <Box
      sx={{
        fontFamily: '"Helvetica Neue", Helvetica, Roboto, Arial, sans-serif',
      }}
    >
      <Header role="/scoopdinator/dashboard"/> 
      <Container maxWidth="lg" sx={{ py: 4, maxWidth: "1280px" }}>
        <Typography
          variant="h1"
          sx={{
            mb: 5,
          }}
        >
          {user} Dashboard
        </Typography>

        <Grid container spacing={4} direction="column">
          {workflows.forEach((workflow) => workflow.steps.filter((step) => step.roles.includes(user.type))).map((workflow) => (
            <Grid item xs={12} key={workflow.title}>
              <Paper elevation={1} sx={{ p: 3 }}>
                <Typography
                  variant="h2"
                  sx={{
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
                  {workflow.map((step, index) => (
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
                          variant="body1"
                          sx={{
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
    // </ProtectedRoute>
  );
}
