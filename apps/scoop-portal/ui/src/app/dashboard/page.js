'use client';
import React, {useState, useEffect } from 'react';
import {
  Box, Typography, Container, Button, Grid, Paper,
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useUser } from "../utils/user-context/page";

import Header from '@components/Header';

const workflows = [
    {
    title: "Onboarding",
    steps: [
      {
        title: "Join the GitHub",
        roles: ["scooployee"],
        description: "Request access to your team's project repository.",
        link: "https://github.com/RIT-Software-Engineering",
      },
      {
        title: "Join the Slack",
        roles: ["scooployee"],
        description:
          "Request access to the shared Slack channels for your project.",
        link: "https://rit.enterprise.slack.com",
      },
      {
        title: "View My Team",
        roles: ["scooployee"],
        description:
          "Team resources, including scoopervisor and scooployee contact information.",
        link: process.env.NEXT_PUBLIC_URL_BASE_PATH+"/scooployee/team/members",
      },
      {
        title: "View My Project",
        roles: ["scooployee"],
        description: "View project details, submit actions, and log time.",
        link: process.env.NEXT_PUBLIC_URL_BASE_PATH+"/scooployee/project",
      },
    ],
  },
  {
    title: "Learning Resources",
    steps: [
      {
        title: "Resume Writing",
        roles: ["scooployee"],
        description: "Good resource to help write or improve a resume.",
        link: "https://www.indeed.com/career-advice/resumes-cover-letters/how-to-make-a-resume-with-examples",
      },
      {
        title: "View Opportunities",
        roles: ["scooployee"],
        description:
          "Explore career connect for upcoming career opportunities.",
        link: "https://rit-csm.symplicity.com/students/app/jobs/discover",
      },
      {
        title: "Practice Coding",
        roles: ["scooployee"],
        description:
          "An important part of keeping competetive! Leetcode is only one of the many practice websites that will help with technical interviews.",
        link: "https://leetcode.com/problemset/",
      },
    ],
  },
  {
    title: "Admin",
    steps: [
      {
        title: "Manage Users",
        roles: ["scoopdinator"],
        description: "Review current user details and statuses.",
        link: process.env.NEXT_PUBLIC_URL_BASE_PATH+"/scoopdinator/scooployees",
      },
      {
        title: "Manage Semester Groups",
        roles: ["scoopdinator"],
        description: "Manage current and upcoming semester groups.",
        link: process.env.NEXT_PUBLIC_URL_BASE_PATH+"/scoopdinator/semestergroups",
      },
    ],
  },
  {
    title: "Scooployees",
    steps: [
      {
        title: "Review Applications",
        roles: ["scoopdinator"],
        description: "Approve or reject scooployee applications.",
        link: process.env.NEXT_PUBLIC_URL_BASE_PATH+"/scoopdinator/applications",
      },
      {
        title: "View All Scooployees",
        roles: ["scoopervisor"],
        description: "Review current scooployee details and statuses.",
        link: process.env.NEXT_PUBLIC_URL_BASE_PATH+"/scoopervisor/scooployees",
      },
      {
        title: "View My Scooployees",
        roles: ["scoopervisor"],
        description: "View your hired scooployees.",
        link: process.env.NEXT_PUBLIC_URL_BASE_PATH+"/scoopervisor/scooployees/",
      },
    ],
  },
  {
    title: "Teams",
    steps: [
      /** 
       * SCOOPdinators should only have the ability to view and modify existing scoop teams in the future.
       * But for now, they will have the ability to fully manage them because they act as SCOOPversior too.
       */
      {
        title: "Manage Teams",
        roles: ["scoopdinator"],
        description: "View and modify existing scoop teams and project assignments.",
        link: process.env.NEXT_PUBLIC_URL_BASE_PATH+"/scoopdinator/teams",
      },
      {
        title: "Manage Teams",
        roles: ["scoopervisor"],
        description: "Create, edit, and archive project teams",
        link: process.env.NEXT_PUBLIC_URL_BASE_PATH+"/scoopervisor/teams/manage",
      },
      {
        title: "Team Reports",
        roles: ["scoopervisor"],
        description: "Review and respond to team communications.",
        link: process.env.NEXT_PUBLIC_URL_BASE_PATH+"/scoopervisor/teams/communication/reports",
      },
      {
        title: "Provide Feedback",
        roles: ["scoopervisor"],
        description: "Submit team-wide feedback to project teams.",
        link: process.env.NEXT_PUBLIC_URL_BASE_PATH+"/scoopervisor/teams/communication/feedback",
      },
    ],
  },
  {
    title: "Projects",
    steps: [
      {
        title: "Manage Projects",
        roles: ["scoopdinator"],
        description: "Create, edit, and archive scoop projects.",
        link: process.env.NEXT_PUBLIC_URL_BASE_PATH+"/scoopdinator/projects",
      },
      {
        title: "Review Project Proposals",
        roles: ["scoopdinator"],
        description: "Review project proposals submitted by scoopervisors.",
        link: process.env.NEXT_PUBLIC_URL_BASE_PATH+"/scoopdinator/projectproposals",
      },
      {
        title:"Manage Project Proposals",
        roles: ["scoopervisor"],
        description: "Propose projects for teams to work on.",
        link: process.env.NEXT_PUBLIC_URL_BASE_PATH+"/scoopervisor/projectproposals"
      },
    ],
  },
  {
    title: "Resources",
    steps: [
      {
        title: "Contact Advisors",
        roles: ["scoopdinator","scoopervisor","scooployee"],
        description: "Get in touch with academic advisors.",
        link: "https://www.rit.edu/computing/academic-advising",
      },
      {
        title: "Contact Co-op Coordinators",
        roles: ["scoopdinator","scoopervisor","scooployee"],
        description: "Communicate with coordinators for co-op management and advising.",
        link: "https://www.rit.edu/careerservices/contacts/coordinators-by-college",
      },
      {
        title: "Manage Co-op Reports",
        roles: ["scoopdinator","scoopervisor"],
        description: "Review and manage reports related to co-op experiences.",
        link: process.env.NEXT_PUBLIC_URL_BASE_PATH+"/scoopdinator/administrative/reports",
      },
      {
        title: "CO-OP Report",
        roles: ["scooployee"],
        description: "Report Your CO-OP For The Term.",
        link: "https://rit-csm.symplicity.com/students/index.php?s=profile&ss=coop",
      },
      {
        title: "Student Work Report",
        roles: ["scooployee"],
        description: "Review CO-OP Reports From Your Scoopervisor.",
        link: "https://coopeval.rit.edu/student/evaluations",
      },
      {
        title: "Open Communications Journal",
        roles: ["scoopdinator","scoopervisor","scooployee","advisor"],
        description:
          "View your past communications with others and leave notes.",
        link: process.env.NEXT_PUBLIC_URL_BASE_PATH+"/journal",
      },
    ],
  },
];

/**
 * Renders the content for the Scoopdinator's Dashboard
 * @returns {JSX.Element}
 */
export default function WorkflowDashboard() {
    const [filteredWorkflows, setfilteredWorkflows] = useState([]);
    const { user } = useUser();

  useEffect(() => {
    async function fetchTeammates() {
      if (user == null || user.fname == null) {
        return;
      }
      const filteredWorkflows = workflows
        .map((workflow) => {
          const filteredSteps = workflow.steps.filter((step) => step.roles.includes(user.type));
          if (filteredSteps.length > 0) {
            return {
              ...workflow,
              steps: filteredSteps,
            };
          }
          return null;
        })
        .filter(Boolean);
      setfilteredWorkflows(filteredWorkflows);
    }
    fetchTeammates();
  }, [user]);

  return (
    <Box
      sx={{
        fontFamily: '"Helvetica Neue", Helvetica, Roboto, Arial, sans-serif',
        backgroundColor: (theme) => theme.palette.grey[100],
        minHeight: '100vh',
      }}
    >
      <Header /> 
      <Container maxWidth="lg" sx={{ py: 4, maxWidth: "1280px" }}>
        <Typography
          variant="h1"
          sx={{
            mb: 3,
            color: (theme) => theme.palette.text.primary,
          }}
        >
          Dashboard
        </Typography>

        <Grid container spacing={4} direction="column">
          {filteredWorkflows.map((workflow) => (
            <Grid item xs={12} key={workflow.title}>
              <Paper elevation={1} sx={{ p: 3, borderRadius: 0, border: (theme) => `1px solid ${theme.palette.divider}`, backgroundColor: (theme) => theme.palette.background.paper }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 700,
                    mb: 3,
                    borderBottom: (theme) => `2px solid ${theme.palette.primary.main}`,
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
                          bgcolor: (theme) => theme.palette.primary.main,
                          color: (theme) => theme.palette.common.white,
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
                            color: (theme) => theme.palette.text.secondary,
                            whiteSpace: "normal",
                          }}
                        >
                          {step.description}
                        </Typography>
                      </Box>

                      <Button
                        href={step.link}
                        variant="contained"
                        color="primary"
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
          bgcolor: (theme) => theme.palette.grey[900],
          color: (theme) => theme.palette.common.white,
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