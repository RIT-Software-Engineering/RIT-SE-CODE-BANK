'use client';
import React from 'react';
import {
  Box, Typography, Container, Button, Grid, Paper,
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useUser } from "../../utils/user-context/page";
import UnauthorizedPage from '../../unauthorized/page';

import Header from '../../_components/Header';

const workflows = [
  {
    title: 'Scooployees',
    steps: [
      {
        title: 'Review Applications',
        description: 'Approve or reject scooployee applications.',
        link: '/scoopdinator/applications', // Update with different version or extract applications to non-scoopdinator folder for permissions?
      },
      {
        title: 'View Available Employees',
        description: 'Review available scooployees for team assignment.',
        link: '/scoopdinator/scooployees/view', // Same question as above, but slightly different page mirroring.
      },
      {
        title: 'View My Employees',
        description: 'View your hired scooployees.',
        link: '/scoopdinator/scooployees/assign', // Question above ++
      },
    ],
  },
  {
    title: 'Teams',
    steps: [
      {
        title: 'Create New Team',
        description: 'Create a new team from available scooployees and projects.',
        link: '/scoopervisor/teams/manage/create',
      },
      {
        title: 'Manage Teams',
        description: 'Create, edit, and archive project teams',
        link: '/scoopervisor/teams/manage',
      },
      {
        title: 'Team Reports',
        description: 'Review and respond to team communications.',
        link: '/scoopervisor/teams/communication/reports',
      },
      {
        title: 'Provide Feedback',
        description: 'Submit team-wide feedback to project teams.',
        link: '/scoopervisor/teams/communication/feedback',
      },
    ],
  },
  {
    title: 'Administration',
    steps: [
      {
        title: 'Contact Advisors',
        description: 'Get in touch with academic advisors for student support.',
        link: '/scoopervisor/administrative/contact/advisors',
      },
      {
        title: 'Contact Co-op Coordinators',
        description: 'Communicate with coordinators for co-op management and advertising.',
        link: '/scoopervisor/administrative/contact/coordinators',
      },
      {
        title: 'Manage Co-op Reports',
        description: 'Review and manage reports related to co-op experiences.',
        link: '/scoopervisor/administrative/reports',
      },
      {
        title: 'Open Communications Journal',
        description: 'View your past communications with others and leave notes.',
        link: '/scoopervisor/administrative/journal',
      },
    ],
  },
];

export default function WorkflowDashboard() {
  const { user } = useUser();
  if (!user || user.type !== "coach" && user.type !== "admin") {
      return <UnauthorizedPage />;
    }
  return (
    <Box sx={{ fontFamily: '"Helvetica Neue", Helvetica, Roboto, Arial, sans-serif', color: '#212121' }}>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4, maxWidth: '1280px' }}>
        <Typography variant="h1" sx={{ fontSize: '2rem', fontWeight: 900, mb: 5, color: '#fff' }}>
          Scoopervisor Dashboard
        </Typography>

        <Grid container spacing={4} direction="column">
          {workflows.map((workflow) => (
            <Grid item xs={12} key={workflow.title}>
              <Paper elevation={1} sx={{ p: 3 }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    mb: 3,
                    borderBottom: '2px solid #F76902',
                    pb: 1,
                    maxWidth: 'max-content',
                  }}
                >
                  {workflow.title}
                </Typography>

                <Box>
                  {workflow.steps.map((step, index) => (
                    <Box
                      key={step.title}
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        mb: index !== workflow.steps.length - 1 ? 3 : 0,
                        flexWrap: 'nowrap',
                      }}
                    >
                      <Box
                        sx={{
                          minWidth: 32,
                          minHeight: 32,
                          borderRadius: '50%',
                          bgcolor: '#F76902',
                          color: '#fff',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          userSelect: 'none',
                          fontSize: '1rem',
                          flexShrink: 0,
                        }}
                      >
                        {index + 1}
                      </Box>

                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography
                          variant="h3"
                          sx={{
                            fontSize: '1.25rem',
                            fontWeight: 300,
                            mb: 0.5,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={step.title}
                        >
                          {step.title}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            lineHeight: 1.5,
                            color: '#555',
                            whiteSpace: 'normal',
                          }}
                        >
                          {step.description}
                        </Typography>
                      </Box>

                      <Button
                        href={step.link}
                        variant="contained"
                        sx={{
                          backgroundColor: '#F76902',
                          textTransform: 'none',
                          ml: 2,
                          flexShrink: 0,
                          '&:hover': { backgroundColor: '#d65a00' },
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
          height: '80px',
          bgcolor: '#212121',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
