"use client";
import React from "react";
import { Box, Typography, Container, Button, Grid, Paper } from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

import Header from "../../_components/Header";

const workflows = [
  {
    title: "Project",
    steps: [
      {
        title: "Join the GitHub",
        description: "Request access to your team's project repository.",
        link: "https://github.com/RIT-Software-Engineering",
      },
      {
        title: "Join the Slack",
        description:
          "Request access to the shared Slack channels for your project.",
        link: "https://rit.enterprise.slack.com",
      },
      {
        title: "View My Team",
        description:
          "Team resources, including scoopervisor and scooployee contact information.",
        link: "/scooployee/team/members",
      },
      {
        title: "View My Project",
        description: "View project details, submit actions, and log time.",
        link: "/projects/1",
      },
    ],
  },
  {
    title: "Learning Resources",
    steps: [
      {
        title: "Resume Writing",
        description: "Good resource to help write or improve a resume.",
        link: "https://www.indeed.com/career-advice/resumes-cover-letters/how-to-make-a-resume-with-examples",
      },
      {
        title: "View Opportunities",
        description:
          "Explore career connect for upcoming career opportunities.",
        link: "https://rit-csm.symplicity.com/students/app/jobs/discover",
      },
      {
        title: "Practice Coding",
        description:
          "An important part of keeping competetive! Leetcode is only one of the many practice websites that will help with technical interviews.",
        link: "https://leetcode.com/problemset/",
      },
    ],
  },
  {
    title: "CO-OP Resources",
    steps: [
      {
        title: "Contact Advisors",
        description: "Get in touch with your academic advisor.",
        link: "/scooployee/administrative/contact/advisor",
      },
      {
        title: "Contact Co-op Coordinators",
        description: "Communicate with your coordinator for co-op advising",
        link: "/scooployee/administrative/contact/coordinator",
      },
      {
        title: "CO-OP Report",
        description: "Report Your CO-OP For The Term.",
        link: "https://rit-csm.symplicity.com/students/index.php?s=profile&ss=coop",
      },
      {
        title: "Student Work Report",
        description: "Review CO-OP Reports From Your Scoopervisor.",
        link: "https://coopeval.rit.edu/student/evaluations",
      },
      {
        title: "Open Communications Journal",
        description:
          "View your past communications with others and leave notes.",
        link: "/scooployee/administrative/journal",
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
          sx={{ fontSize: "2rem", fontWeight: 900, mb: 5, color: "#fff" }}
        >
          Scooployee Dashboard
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

                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
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
