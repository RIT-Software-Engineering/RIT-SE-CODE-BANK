'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TableSortLabel,
  Drawer,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Checkbox
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  OpenInNew as OpenInNewIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { getWorkflowsByRole } from '@/services/workflow-apis';
import { useAuth } from '@/contexts/AuthContext';

export default function AllWorkflowsPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [workflows, setWorkflows] = useState([]);
  const [filteredWorkflows, setFilteredWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [username, setUsername] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('progress');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterType, setFilterType] = useState('all');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [progressFilter, setProgressFilter] = useState('all');
  const [sortExpanded, setSortExpanded] = useState(true);
  const [typeExpanded, setTypeExpanded] = useState(true);
  const [progressExpanded, setProgressExpanded] = useState(true);

  useEffect(() => {
    if (currentUser && currentUser.username) {
      setUsername(currentUser.username);
      fetchWorkflows(currentUser.username);
    } else {
      setError('User not authenticated');
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    let filtered = [...workflows];

    // Apply search filter
    if (searchTerm !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(workflow => {
        const nameMatch = workflow.name?.toLowerCase().includes(searchLower);
        const descMatch = workflow.description?.toLowerCase().includes(searchLower);
        const candidateMatch = workflow.metadata?.candidateName?.toLowerCase().includes(searchLower);
        const employerMatch = workflow.metadata?.employerName?.toLowerCase().includes(searchLower);
        return nameMatch || descMatch || candidateMatch || employerMatch;
      });
    }

    // Apply type filter
    if (filterType !== 'all') {
      if (filterType === 'hiring') {
        filtered = filtered.filter(w => w.metadata?.workflowType === 'hiring_process');
      } else if (filterType === 'other') {
        filtered = filtered.filter(w => w.metadata?.workflowType !== 'hiring_process');
      }
    }

    // Apply progress filter
    if (progressFilter !== 'all') {
      filtered = filtered.filter(w => {
        const progress = getWorkflowProgress(w);
        switch (progressFilter) {
          case 'completed':
            return progress === 100;
          case 'inprogress':
            return progress > 0 && progress < 100;
          case 'notstarted':
            return progress === 0;
          default:
            return true;
        }
      });
    }



    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'progress':
          aValue = getWorkflowProgress(a);
          bValue = getWorkflowProgress(b);
          break;
        case 'type':
          aValue = a.metadata?.workflowType || '';
          bValue = b.metadata?.workflowType || '';
          break;
        case 'users':
          aValue = (a.metadata?.candidateName || a.metadata?.employerName || '').toLowerCase();
          bValue = (b.metadata?.candidateName || b.metadata?.employerName || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredWorkflows(filtered);
  }, [searchTerm, workflows, sortBy, sortOrder, filterType, progressFilter]);

  const fetchWorkflows = async (username) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWorkflowsByRole(username);
      
      // Check if user has permission to view spreadsheet (only ADMIN and EMPLOYER)
      if (data.userRole !== 'ADMIN' && data.userRole !== 'EMPLOYER') {
        router.push(`/Workflows/${username}`);
        return;
      }
      
      setWorkflows(data.workflows || []);
      setFilteredWorkflows(data.workflows || []);
      setUserRole(data.userRole);
      setUsername(data.username);
    } catch (err) {
      console.error('Failed to fetch workflows by role:', err);
      setError('Failed to load workflows.');
    } finally {
      setLoading(false);
    }
  };

  const getWorkflowProgress = (workflow) => {
    const actions = workflow.actions || [];
    const totalActions = actions.length;
    if (totalActions === 0) return 0;
    const completedActions = actions.filter(a => a.status === 'completed').length;
    return (completedActions / totalActions) * 100;
  };

  const getActionCounts = (workflow) => {
    const actions = workflow.actions || [];
    return {
      total: actions.length,
      completed: actions.filter(a => a.status === 'completed').length,
      inProgress: actions.filter(a => a.status === 'in-progress').length,
      pending: actions.filter(a => a.status === 'pending').length
    };
  };

  const handleViewWorkflow = (workflowId) => {
    // Navigate to the workflows page with the specific workflow ID as a query parameter
    router.push(`/Workflows/${username}?workflowId=${workflowId}`);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setProgressFilter('all');
    setSortBy('progress');
    setSortOrder('desc');
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'EMPLOYER':
        return 'Professor/Employer';
      case 'CANDIDATE':
        return 'Candidate';
      default:
        return role;
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'You can view all workflows in the system';
      case 'EMPLOYER':
        return 'You can view all workflows where you are involved';
      case 'CANDIDATE':
        return 'You can view your personal workflows';
      default:
        return 'You can view your accessible workflows';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          component={Link}
          href={`/Workflows/${username}`}
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          sx={{ minWidth: 'auto' }}
        >
          Back to Workflows
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" component="h1" fontWeight="600">
            All Workflows
          </Typography>
          {userRole && (
            <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {getRoleDescription(userRole)}
              </Typography>
              <Chip 
                label={getRoleDisplayName(userRole)} 
                size="small" 
                color="primary"
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Workflows Table */}
      {!loading && !error && (
        <>
          {/* Search and Filter Controls */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Search workflows by name, description, or user names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ backgroundColor: 'background.paper' }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setFilterDrawerOpen(true)}
              sx={{ 
                minWidth: 140, 
                whiteSpace: 'nowrap',
                height: 56 // Match TextField height
              }}
            >
              Filter & Sort
            </Button>
          </Box>

          {/* Filter & Sort Drawer */}
          <Drawer
            anchor="right"
            open={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
            PaperProps={{
              sx: { width: 350, p: 0 }
            }}
          >
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight="600">
                Filter & Sort
              </Typography>
              <IconButton onClick={() => setFilterDrawerOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            <Box sx={{ p: 2 }}>
              {/* Sort Section */}
              <Box sx={{ mb: 3 }}>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => setSortExpanded(!sortExpanded)}
                  endIcon={sortExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ justifyContent: 'space-between', mb: 1 }}
                >
                  <Typography variant="subtitle1" fontWeight="600">Sort</Typography>
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {sortBy === 'progress' ? 'Progress' : sortBy === 'type' ? 'Type' : sortBy === 'users' ? 'Users' : 'Progress'}
                </Typography>
                <Collapse in={sortExpanded}>
                  <RadioGroup
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                  >
                    <FormControlLabel value="progress-desc" control={<Radio />} label="Progress: High to Low" />
                    <FormControlLabel value="progress-asc" control={<Radio />} label="Progress: Low to High" />
                    <FormControlLabel value="type-asc" control={<Radio />} label="Type: A to Z" />
                    <FormControlLabel value="users-asc" control={<Radio />} label="Users: A to Z" />
                  </RadioGroup>
                </Collapse>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Workflow Type Section */}
              <Box sx={{ mb: 3 }}>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => setTypeExpanded(!typeExpanded)}
                  endIcon={typeExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ justifyContent: 'space-between', mb: 1 }}
                >
                  <Typography variant="subtitle1" fontWeight="600">Workflow Type</Typography>
                </Button>
                <Collapse in={typeExpanded}>
                  <RadioGroup
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <FormControlLabel value="all" control={<Radio />} label="All Types" />
                    <FormControlLabel value="hiring" control={<Radio />} label="Hiring Process" />
                    <FormControlLabel value="other" control={<Radio />} label="Other Types" />
                  </RadioGroup>
                </Collapse>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Progress Section */}
              <Box sx={{ mb: 3 }}>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => setProgressExpanded(!progressExpanded)}
                  endIcon={progressExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ justifyContent: 'space-between', mb: 1 }}
                >
                  <Typography variant="subtitle1" fontWeight="600">Progress</Typography>
                </Button>
                <Collapse in={progressExpanded}>
                  <RadioGroup
                    value={progressFilter}
                    onChange={(e) => setProgressFilter(e.target.value)}
                  >
                    <FormControlLabel value="all" control={<Radio />} label="All Progress Levels" />
                    <FormControlLabel value="completed" control={<Radio />} label="Completed (100%)" />
                    <FormControlLabel value="inprogress" control={<Radio />} label="In Progress (1-99%)" />
                    <FormControlLabel value="notstarted" control={<Radio />} label="Not Started (0%)" />
                  </RadioGroup>
                </Collapse>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Clear Filters Button */}
              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                onClick={clearAllFilters}
                sx={{ mt: 2 }}
              >
                Clear All Filters
              </Button>
            </Box>
          </Drawer>

          {filteredWorkflows.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                {searchTerm ? 'No workflows match your search' : 'No workflows found'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {!searchTerm && userRole === 'ADMIN' && 'There are no workflows in the system yet.'}
                {!searchTerm && userRole === 'EMPLOYER' && 'You are not involved in any workflows yet.'}
                {!searchTerm && userRole !== 'ADMIN' && userRole !== 'EMPLOYER' && 'You do not have any workflows yet.'}
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                      <TableSortLabel
                        active={sortBy === 'name'}
                        direction={sortBy === 'name' ? sortOrder : 'asc'}
                        onClick={() => handleSort('name')}
                        sx={{ 
                          color: 'white !important',
                          '& .MuiTableSortLabel-icon': { color: 'white !important' }
                        }}
                      >
                        Workflow Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                      <TableSortLabel
                        active={sortBy === 'type'}
                        direction={sortBy === 'type' ? sortOrder : 'asc'}
                        onClick={() => handleSort('type')}
                        sx={{ 
                          color: 'white !important',
                          '& .MuiTableSortLabel-icon': { color: 'white !important' }
                        }}
                      >
                        Type
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                      <TableSortLabel
                        active={sortBy === 'users'}
                        direction={sortBy === 'users' ? sortOrder : 'asc'}
                        onClick={() => handleSort('users')}
                        sx={{ 
                          color: 'white !important',
                          '& .MuiTableSortLabel-icon': { color: 'white !important' }
                        }}
                      >
                        Users
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                      <TableSortLabel
                        active={sortBy === 'progress'}
                        direction={sortBy === 'progress' ? sortOrder : 'asc'}
                        onClick={() => handleSort('progress')}
                        sx={{ 
                          color: 'white !important',
                          '& .MuiTableSortLabel-icon': { color: 'white !important' }
                        }}
                      >
                        Progress
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Actions</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">View</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredWorkflows.map((workflow, index) => {
                    const progress = getWorkflowProgress(workflow);
                    const actionCounts = getActionCounts(workflow);
                    const isHiringWorkflow = workflow.metadata?.workflowType === 'hiring_process';

                    return (
                      <TableRow 
                        key={workflow.id}
                        sx={{ 
                          '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                          '&:hover': { backgroundColor: 'action.selected' }
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">
                            {workflow.name}
                          </Typography>
                          {workflow.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {workflow.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {isHiringWorkflow ? (
                            <Chip label="Hiring" size="small" color="info" />
                          ) : (
                            <Chip label="Other" size="small" color="default" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {workflow.metadata?.candidateName && (
                              <Chip 
                                label={workflow.metadata.candidateName}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            )}
                            {workflow.metadata?.employerName && (
                              <Chip 
                                label={workflow.metadata.employerName}
                                size="small"
                                variant="outlined"
                                color="secondary"
                              />
                            )}
                            {!workflow.metadata?.candidateName && !workflow.metadata?.employerName && (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ minWidth: 200 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={progress} 
                                sx={{ 
                                  height: 8, 
                                  borderRadius: 4,
                                  backgroundColor: 'grey.300',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: progress === 100 ? 'success.main' : 'primary.main'
                                  }
                                }}
                              />
                            </Box>
                            <Typography variant="caption" fontWeight="600" sx={{ minWidth: 35 }}>
                              {Math.round(progress)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            {actionCounts.completed}/{actionCounts.total} complete
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {actionCounts.inProgress} in progress
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip 
                            title={
                              workflow.metadata?.currentStatus === 'REJECTED' 
                                ? 'Application rejected - workflow not accessible' 
                                : 'View workflow details'
                            }
                          >
                            <span>
                              <IconButton 
                                color={workflow.metadata?.currentStatus === 'REJECTED' ? 'default' : 'primary'}
                                onClick={() => {
                                  if (workflow.metadata?.currentStatus !== 'REJECTED') {
                                    handleViewWorkflow(workflow.id);
                                  }
                                }}
                                size="small"
                                disabled={workflow.metadata?.currentStatus === 'REJECTED'}
                                sx={{
                                  cursor: workflow.metadata?.currentStatus === 'REJECTED' ? 'not-allowed' : 'pointer'
                                }}
                              >
                                {workflow.metadata?.currentStatus === 'REJECTED' ? '🚫' : <OpenInNewIcon />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Summary Footer */}
          {filteredWorkflows.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredWorkflows.length} of {workflows.length} workflows
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredWorkflows.filter(w => getWorkflowProgress(w) === 100).length} completed • {' '}
                {filteredWorkflows.filter(w => {
                  const prog = getWorkflowProgress(w);
                  return prog > 0 && prog < 100;
                }).length} in progress • {' '}
                {filteredWorkflows.filter(w => getWorkflowProgress(w) === 0).length} not started
              </Typography>
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
