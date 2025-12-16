'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Header from '@components/Header';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const monthKey = (value) => {
  if (!value) return 'unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'unknown';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (key) => {
  if (!key || key === 'unknown') return 'Unknown Month';
  const [year, month] = key.split('-').map((num) => parseInt(num, 10));
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const sortValueForMonth = (key) => {
  if (!key || key === 'unknown') return -Infinity;
  const [year, month] = key.split('-').map((num) => parseInt(num, 10));
  return year * 12 + month;
};

const formatDateTime = (value) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function WorkflowSubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [workflowsById, setWorkflowsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const workflowsApiUrl = process.env.NEXT_PUBLIC_WORKFLOWS_API_URL;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      if (!workflowsApiUrl) {
        setError('Workflows API URL is not configured.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const statesPromise = fetch(`${workflowsApiUrl}/states/workflow`);
        const workflowsPromise = fetch(`${workflowsApiUrl}/workflows`);
        const usersPromise = apiBaseUrl
          ? fetch(`${apiBaseUrl}/api/users`)
          : null;

        const [statesRes, workflowsRes, usersRes] = await Promise.all([
          statesPromise,
          workflowsPromise,
          usersPromise,
        ]);

        if (!statesRes.ok) throw new Error('Failed to load workflow states');
        const workflowStates = await statesRes.json();

        const workflowsData = workflowsRes?.ok ? await workflowsRes.json() : [];
        const workflowLookup = {};
        workflowsData.forEach((wf) => {
          workflowLookup[wf.id] =
            wf.baseAction?.name || wf.name || 'Untitled Workflow';
        });
        setWorkflowsById(workflowLookup);

        if (usersRes?.ok) {
          const users = await usersRes.json();
          const userLookup = {};
          (users || []).forEach((u) => {
            userLookup[u.id] = u;
          });
          setUsersById(userLookup);
        }

        const collected = [];
        workflowStates.forEach((state) => {
          const workflowName =
            workflowLookup[state.workflowId] || 'Unknown Workflow';

          (state.actionStates || []).forEach((actionState) => {
            const actionName = actionState.action?.name || 'Untitled Action';

            (actionState.submissions || []).forEach((submission) => {
              const submittedAt =
                submission.completedAt || submission.createdAt || null;

              collected.push({
                ...submission,
                actionName,
                workflowName,
                workflowId: state.workflowId,
                submittedAt,
              });
            });
          });
        });

        collected.sort((a, b) => {
          const aTime = a.submittedAt
            ? new Date(a.submittedAt).getTime()
            : 0;
          const bTime = b.submittedAt
            ? new Date(b.submittedAt).getTime()
            : 0;
          return bTime - aTime;
        });

        setSubmissions(collected);
      } catch (err) {
        console.error('Failed to load submissions:', err);
        setError(
          err.message || 'Something went wrong while loading submissions.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiBaseUrl, workflowsApiUrl]);

  const groupedSubmissions = useMemo(() => {
    const groups = {};
    submissions.forEach((submission) => {
      const key = monthKey(submission.submittedAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(submission);
    });
    return groups;
  }, [submissions]);

  const sortedMonths = useMemo(
    () =>
      Object.keys(groupedSubmissions).sort(
        (a, b) => sortValueForMonth(b) - sortValueForMonth(a)
      ),
    [groupedSubmissions]
  );

  const displayNameForUser = (userId) => {
    if (!userId) return 'Unknown user';
    const user = usersById[userId];
    if (!user) return userId.slice(0, 8);
    const fullName = [user.fname, user.lname].filter(Boolean).join(' ').trim();
    return fullName || user.email || userId;
  };

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ pb: 6 }}>
        <Box
          sx={{
            mt: 4,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Workflow Submissions
            </Typography>
            <Typography color="text.secondary">
              View submissions by action, grouped by the month they were filed.
            </Typography>
          </Box>
          <Chip
            label="Scoopdinator"
            color="primary"
            sx={{ fontWeight: 700, backgroundColor: '#F76902', color: '#fff' }}
          />
        </Box>

        {loading && (
          <Paper
            elevation={1}
            sx={{
              p: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              border: '1px solid #F76902',
            }}
          >
            <CircularProgress size={28} color="primary" />
            <Typography>Loading submissions...</Typography>
          </Paper>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <>
            {submissions.length === 0 ? (
              <Paper
                sx={{
                  p: 4,
                  textAlign: 'center',
                  border: '1px dashed #F76902',
                  backgroundColor: '#000',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  No submissions yet
                </Typography>
                <Typography color="text.secondary">
                  When actions are completed, they will be listed here by month.
                </Typography>
              </Paper>
            ) : (
              sortedMonths.map((month) => (
                <Paper
                  key={month}
                  sx={{
                    mb: 3,
                    border: '1px solid #F76902',
                    backgroundColor: '#000',
                  }}
                  elevation={0}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 3,
                      py: 2,
                      backgroundColor: '#fdf6f0',
                      borderBottom: '1px solid #F76902',
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {monthLabel(month)}
                      </Typography>
                      <Typography color="text.secondary">
                        {groupedSubmissions[month].length} submission
                        {groupedSubmissions[month].length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                    <Chip
                      icon={<InsertDriveFileIcon />}
                      label={`${groupedSubmissions[month].filter((s) => s.fileData).length
                        } with files`}
                      variant="outlined"
                      sx={{ borderColor: '#F76902', color: '#F76902' }}
                    />
                  </Box>
                  <Divider />
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#fafafa' }}>
                        <TableCell>Submitted On</TableCell>
                        <TableCell>Submitted By</TableCell>
                        <TableCell>Workflow</TableCell>
                        <TableCell>Action</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Files</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {groupedSubmissions[month].map((submission) => {
                        const user = usersById[submission.userId];
                        return (
                          <TableRow key={submission.id}>
                            <TableCell>{formatDateTime(submission.submittedAt)}</TableCell>
                            <TableCell>
                              <Typography fontWeight={600}>
                                {displayNameForUser(submission.userId)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {user?.email || submission.userId}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography fontWeight={600}>
                                {submission.workflowName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {workflowsById[submission.workflowId]
                                  ? submission.workflowId.slice(0, 6)
                                  : 'Untracked'}
                              </Typography>
                            </TableCell>
                            <TableCell>{submission.actionName}</TableCell>
                            <TableCell>
                              <Chip
                                label={submission.completed ? 'Completed' : 'In progress'}
                                color={submission.completed ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              {submission.fileData ? (
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  justifyContent="flex-end"
                                >
                                  <Button
                                    variant="outline-orange"
                                    size="small"
                                    component="a"
                                    href={submission.fileData}
                                    download={submission.fileName || 'submission'}
                                    startIcon={<DownloadIcon />}
                                  >
                                    Download
                                  </Button>
                                  <Button
                                    variant="solid-orange"
                                    size="small"
                                    component="a"
                                    href={submission.fileData}
                                    target="_blank"
                                    rel="noreferrer"
                                    startIcon={<VisibilityIcon />}
                                  >
                                    View
                                  </Button>
                                </Stack>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No file
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Paper>
              ))
            )}
          </>
        )}
      </Container>
    </>
  );
}
