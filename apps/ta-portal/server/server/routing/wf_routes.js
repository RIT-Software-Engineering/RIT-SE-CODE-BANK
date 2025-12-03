// server/server/routing/wf_routes.js

/**
 * =============================================================================
 * Workflow Service Interface Router
 * 
 * This file serves as a proxy interface to the Workflow microservice, handling
 * user identity translation between ta-portal (username) and workflow service (userId)
 * =============================================================================
 */

"use strict";

const express = require("express");
const router = express.Router();
const axios = require("axios");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { notifyWorkflowActionCompleted } = require('../utils/workflow-notifications');

// Configuration for workflow service
const WORKFLOW_SERVICE_URL = process.env.WORKFLOWS_URL || "http://localhost:3001";
const WORKFLOW_API_BASE = WORKFLOW_SERVICE_URL;

// Middleware to handle workflow service errors
const handleWorkflowError = (error, res) => {
  console.error("Workflow service error:", {
    message: error.message,
    status: error.response?.status,
    url: error.config?.url
  });
  
  if (error.response) {
    return res.status(error.response.status).json({
      message: "Workflow service error",
      details: error.response.data,
      status: error.response.status
    });
  }
  
  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({ 
      message: "Workflow service unavailable",
      details: "Cannot connect to workflow service. Please check if it's running."
    });
  }
  
  return res.status(500).json({ 
    message: "Workflow service error",
    details: error.message 
  });
};

/**
 * Helper function to determine recipients for workflow notifications
 * @param {Object} workflow - The workflow object with metadata
 * @param {string} actorUsername - Username of the person who performed the action
 * @returns {Promise<Array>} Array of recipient objects {username, fname, lname, email, role}
 */
async function getWorkflowNotificationRecipients(workflow, actorUsername) {
  const recipients = [];
  const metadata = workflow.baseAction?.metadata || {};
  const workflowType = metadata.workflowType;

  try {
    if (workflowType === 'timecard_approval') {
      // For timecard workflows, notify admin when employee submits, and employee when admin approves
      const employeeUsername = metadata.employeeId;
      const adminUsername = metadata.adminId;

      if (actorUsername === employeeUsername && adminUsername) {
        // Employee submitted, notify admin
        const admin = await prisma.user.findUnique({
          where: { username: adminUsername },
          select: { username: true, fname: true, lname: true, email: true }
        });
        if (admin) recipients.push({ ...admin, role: 'admin' });
      } else if (actorUsername === adminUsername && employeeUsername) {
        // Admin approved, notify employee
        const employee = await prisma.user.findUnique({
          where: { username: employeeUsername },
          select: { username: true, fname: true, lname: true, email: true }
        });
        if (employee) recipients.push({ ...employee, role: 'employee' });
      }
    } else if (workflowType === 'hiring_process') {
      // For hiring workflows, notify relevant parties based on who acted
      const candidateUsername = metadata.candidateUsername;
      const employerUsername = metadata.employerUsername;
      const adminUsername = 'aa1234'; // Default admin - could make this dynamic

      // Notify candidate when employer or admin acts
      if (actorUsername !== candidateUsername && candidateUsername) {
        const candidate = await prisma.user.findUnique({
          where: { username: candidateUsername },
          select: { username: true, fname: true, lname: true, email: true }
        });
        if (candidate) recipients.push({ ...candidate, role: 'candidate' });
      }

      // Notify employer when candidate or admin acts
      if (actorUsername !== employerUsername && employerUsername) {
        const employer = await prisma.user.findUnique({
          where: { username: employerUsername },
          select: { username: true, fname: true, lname: true, email: true }
        });
        if (employer) recipients.push({ ...employer, role: 'employer' });
      }

      // Optionally notify admin (only on certain actions to avoid spam)
      // Uncomment if you want admin notifications for all hiring workflow updates
      /*
      if (actorUsername !== adminUsername && adminUsername) {
        const admin = await prisma.user.findUnique({
          where: { username: adminUsername },
          select: { username: true, fname: true, lname: true, email: true }
        });
        if (admin) recipients.push({ ...admin, role: 'admin' });
      }
      */
    }
  } catch (error) {
    console.error('[getWorkflowNotificationRecipients] Error determining recipients:', error);
  }

  return recipients;
}

// Middleware to transform username to userId
const transformUsernameToId = async (req, res, next) => {
  const originalUsername = (req.query && req.query.username) || (req.body && req.body.username);
  
  try {
    const username = originalUsername;
    
    if (username) {
      if (!prisma) {
        console.error("Prisma client is not initialized");
        return res.status(500).json({
          message: "Database connection error",
          details: "Database client not available"
        });
      }
      
      let user;
      try {
        await prisma.$connect();
        
        user = await prisma.user.findUnique({
          where: { username: username },
          select: { uid: true, username: true }
        });
      } catch (dbError) {
        console.error("Database query failed:", dbError.message);
        
        if (dbError.code === 'P1001') {
          return res.status(500).json({
            message: "Database connection failed",
            details: "Cannot reach database server. Please check if the database is running."
          });
        } else if (dbError.code === 'P2021') {
          return res.status(500).json({
            message: "Database table not found",
            details: "User table does not exist. Please run database migrations."
          });
        } else {
          return res.status(500).json({
            message: "Database query failed",
            details: dbError.message
          });
        }
      }
      
      if (!user) {
        return res.status(404).json({ 
          message: "User not found",
          details: `No user found with username: ${username}`
        });
      }
      
      const transformedUserId = String(user.uid);
      const transformedQuery = { ...req.query };
      const transformedBody = req.body ? { ...req.body } : {};
      
      if (req.query && req.query.username) {
        transformedQuery.userId = transformedUserId;
        delete transformedQuery.username;
      }
      
      if (req.body && req.body.username) {
        transformedBody.userId = transformedUserId;
        delete transformedBody.username;
      }
      
      req.workflowParams = transformedQuery;
      req.workflowBody = transformedBody;
    } else {
      const userId = req.query.userId || req.body.userId;
      if (userId && !userId.match(/^user\d+$/)) {
        return res.status(400).json({
          message: "Invalid userId format",
          details: "userId should be in format 'user<number>' (e.g., 'user1', 'user123')"
        });
      }
    }
    
    next();
  } catch (error) {
    console.error("Error transforming username to ID:", error.message);
    
    const username = originalUsername;
    if (username) {
      const fallbackUserId = username;
      
      if (req.query && !req.query.userId) {
        req.query.userId = fallbackUserId;
      }
      
      if (req.body && !req.body.userId) {
        req.body.userId = fallbackUserId;
      }
      
      next();
    } else {
      res.status(500).json({ 
        message: "Database error during username transformation",
        details: error.message
      });
    }
  }
};

// =============================================================================
// PROXY ROUTES
// =============================================================================

// Generic proxy middleware to forward requests to workflow service
const proxyRequest = async (req, res, endpoint) => {
  try {
    const method = req.method.toLowerCase();
    const url = `${WORKFLOW_SERVICE_URL}${endpoint}`;
    
    const response = await axios({
      method,
      url,
      params: req.query,
      data: req.body
    });
    
    res.json(response.data);
  } catch (error) {
    console.error(`Error proxying ${req.method} ${endpoint}:`, error.message);
    handleWorkflowError(error, res);
  }
};

// =============================================================================
// HEALTH CHECK ROUTES
// =============================================================================

// Health check route to test workflow service connectivity
router.get("/health", async (req, res) => {
  let dbStatus = 'unknown';
  let dbError = null;
  
  try {
    const testUser = await prisma.user.findFirst({
      select: { uid: true, username: true }
    });
    dbStatus = 'connected';
  } catch (error) {
    console.error('Database connectivity test failed:', error.message);
    dbStatus = 'error';
    dbError = error.message;
  }

  try {
    const response = await axios.get(`${WORKFLOW_SERVICE_URL}/workflows`, {
      timeout: 5000,
      params: { userId: 'user1' }
    });
    
    res.json({
      status: 'healthy',
      database: {
        status: dbStatus,
        error: dbError
      },
      workflowService: {
        url: WORKFLOW_SERVICE_URL,
        responsive: true,
        statusCode: response.status
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Workflow service health check failed:', error.message);
    
    res.status(503).json({
      status: 'unhealthy',
      database: {
        status: dbStatus,
        error: dbError
      },
      workflowService: {
        url: WORKFLOW_SERVICE_URL,
        responsive: false,
        error: error.message,
        code: error.code,
        statusCode: error.response?.status
      },
      timestamp: new Date().toISOString()
    });
  }
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Synchronize action state changes across all users in a hiring workflow
 */
async function synchronizeHiringWorkflowAction(workflowId, actionId, newStateType) {
  try {
    const allStatesResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/states/workflow`, {
      params: { workflowId }
    });
    
    const allWorkflowStates = Array.isArray(allStatesResponse.data) ? allStatesResponse.data : [allStatesResponse.data];
    
    for (let i = 0; i < allWorkflowStates.length; i++) {
      const workflowState = allWorkflowStates[i];
      
      if (!workflowState || !workflowState.id) {
        continue;
      }
      
      try {
        const detailedStateResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/states/workflow/${workflowState.id}`);
        const detailedWorkflowState = detailedStateResponse.data;
        
        const targetActionState = detailedWorkflowState.actionStates?.find(as => as.actionId === actionId);
        
        if (!targetActionState) {
          continue;
        }
        
        if (targetActionState.stateType !== newStateType) {
          // Properly start and complete the action through the workflow service
          if (newStateType === 'completed') {
            // Start if not started
            if (targetActionState.stateType === 'notStarted') {
              await axios.post(`${WORKFLOW_SERVICE_URL}/states/handleStart`, {
                actionStateId: targetActionState.id
              });
            }
            // Then complete
            await axios.post(`${WORKFLOW_SERVICE_URL}/states/handleSubmit`, {
              actionStateId: targetActionState.id
            });
          } else if (newStateType === 'inProgress') {
            if (targetActionState.stateType === 'notStarted') {
              await axios.post(`${WORKFLOW_SERVICE_URL}/states/handleStart`, {
                actionStateId: targetActionState.id
              });
            }
          } else {
            // Direct state update for other state types
            await axios.put(`${WORKFLOW_SERVICE_URL}/states/action/${targetActionState.id}`, {
              stateType: newStateType
            });
          }
        }
      } catch (updateError) {
        console.error(`[synchronizeHiringWorkflowAction] Could not update action state for workflow state ${workflowState.id}:`, updateError.message);
      }
    }
  } catch (error) {
    console.error('[synchronizeHiringWorkflowAction] Error synchronizing hiring workflow action:', error.message);
    throw error;
  }
}

/**
 * Extract actions from the workflow structure to match frontend expectations
 */
const extractActionsFromWorkflow = async (workflow, userId = null) => {
  const actions = [];
  
  try {
    const actionsResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/actions`, {
      params: { workflowId: workflow.id }
    });
    
    if (actionsResponse.data && Array.isArray(actionsResponse.data)) {
      const actionMap = new Map();
      
      // Fetch actual action states from workflow service if userId is provided
      let actionStates = new Map();
      if (userId) {
        try {
          const statesResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/states/workflow`, {
            params: { workflowId: workflow.id, userId: userId }
          });
          
          const workflowStates = Array.isArray(statesResponse.data) ? statesResponse.data : [statesResponse.data];
          
          // Get detailed workflow state with action states
          if (workflowStates.length > 0 && workflowStates[0]?.id) {
            const detailedStateResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/states/workflow/${workflowStates[0].id}`);
            const detailedState = detailedStateResponse.data;
            
            if (detailedState?.actionStates) {
              detailedState.actionStates.forEach(actionState => {
                // Map stateType to status format expected by frontend
                let status = 'pending';
                if (actionState.stateType === 'completed') {
                  status = 'completed';
                } else if (actionState.stateType === 'inProgress') {
                  status = 'in-progress';
                } else if (actionState.stateType === 'notStarted') {
                  status = 'pending';
                }
                actionStates.set(actionState.actionId, status);
              });
            }
          }
        } catch (stateError) {
          console.error('Error fetching action states:', stateError.message);
          // Fall back to metadata-based status if state fetch fails
        }
      }
      
      const metadata = workflow.metadata || workflow.baseAction?.metadata || {};
      const completedActions = parseInt(metadata.completedActions) || 0;
      const inProgressActionIndex = metadata.inProgressActionIndex ? parseInt(metadata.inProgressActionIndex) : null;
      
      const processAction = (actionData, index) => {
        // Use actual action state if available, otherwise fall back to metadata
        let status = actionStates.get(actionData.id) || 'pending';
        
        // If no action state, use metadata-based status
        if (!actionStates.has(actionData.id)) {
          if (index < completedActions) {
            status = 'completed';
          } else if (index === inProgressActionIndex - 1) {
            status = 'in-progress';
          }
        }
        
        const action = {
          id: actionData.id,
          name: actionData.name,
          description: actionData.description,
          status: status,
          actionType: actionData.actionType,
          parentActionId: actionData.parentActionId,
          childActions: [],
          assignedUserId: actionData.metadata?.assignedUserId || null,
          order: index,
          deadline: actionData.metadata?.deadline || metadata.deadline || null,
          isTeamAction: actionData.metadata?.isTeamAction || false,
          teamMembers: actionData.metadata?.teamMembers || []
        };
        
        if (actionData.childActions && actionData.childActions.length > 0) {
          action.childActions = actionData.childActions.map((childData, childIdx) => 
            processAction(childData, index + childIdx + 1)
          );
        }
        
        return action;
      };
      
      actionsResponse.data.forEach((actionData, index) => {
        const action = processAction(actionData, index);
        actionMap.set(action.id, action);
        actions.push(action);
      });
      
      actions.forEach(action => {
        if (action.parentActionId) {
          const parent = actionMap.get(action.parentActionId);
          if (parent) {
            parent.childActions.push(action);
          }
        }
      });
      
      return actions.filter(action => !action.parentActionId);
    }
  } catch (error) {
    // Actions not available
  }
  
  return actions;
};

// =============================================================================
// WORKFLOW ROUTES
// =============================================================================

// Get all workflows or filtered by parameters
router.get("/", transformUsernameToId, async (req, res) => {
  try {
    const workflowParams = req.workflowParams || req.query;
    
    const response = await axios.get(`${WORKFLOW_SERVICE_URL}/workflows`, {
      params: workflowParams,
      timeout: 10000
    });
    
    const userWorkflows = [];
    
    for (const workflow of response.data) {
      const hasPermission = workflow.baseAction?.permissions?.some(permission => 
        permission.userId === workflowParams.userId
      );
      
      let hasWorkflowState = false;
      try {
        const stateResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/states/workflow`, {
          params: { 
            userId: workflowParams.userId, 
            workflowId: workflow.id 
          },
          timeout: 5000
        });
        hasWorkflowState = stateResponse.data && (
          Array.isArray(stateResponse.data) ? stateResponse.data.length > 0 : !!stateResponse.data.id
        );
      } catch (stateError) {
        // State check failed, rely on permissions only
      }
      
      if (hasPermission || hasWorkflowState) {
        userWorkflows.push(workflow);
      }
    }

    const transformedWorkflows = await Promise.all(userWorkflows.map(async workflow => {
      return {
        id: workflow.id,
        name: workflow.baseAction?.name || 'Unnamed Workflow',
        description: workflow.baseAction?.description || '',
        tags: workflow.tags || [],
        actions: await extractActionsFromWorkflow(workflow, workflowParams.userId)
      };
    }));
    
    res.json(transformedWorkflows);
  } catch (error) {
    console.error('Workflow request error:', error.message);
    handleWorkflowError(error, res);
  }
});

// Get a specific workflow
router.get("/:id", async (req, res) => {
  try {
    const response = await axios.get(`${WORKFLOW_SERVICE_URL}/workflows/${req.params.id}`);
    
    const workflow = response.data;
    const transformedWorkflow = {
      id: workflow.id,
      name: workflow.baseAction?.name || 'Unnamed Workflow',
      description: workflow.baseAction?.description || '',
      tags: workflow.tags || [],
      actions: await extractActionsFromWorkflow(workflow, null)
    };
    
    res.json(transformedWorkflow);
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// Create a new workflow
router.post("/", async (req, res) => {
  try {
    const response = await axios.post(`${WORKFLOW_SERVICE_URL}/workflows`, req.body);
    res.json(response.data);
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// Update a workflow
router.put("/:id", async (req, res) => {
  try {
    const response = await axios.put(
      `${WORKFLOW_SERVICE_URL}/workflows/${req.params.id}`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// Delete a workflow
router.delete("/:id", async (req, res) => {
  try {
    const response = await axios.delete(`${WORKFLOW_SERVICE_URL}/workflows/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// =============================================================================
// WORKFLOW STATE ROUTES
// =============================================================================

// Get workflow states
router.get("/states", transformUsernameToId, async (req, res) => {
  try {
    const response = await axios.get(`${WORKFLOW_SERVICE_URL}/states/workflow`, {
      params: req.query
    });
    res.json(response.data);
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// Get specific workflow state
router.get("/states/:id", async (req, res) => {
  try {
    const response = await axios.get(
      `${WORKFLOW_SERVICE_URL}/states/workflow/${req.params.id}`
    );
    res.json(response.data);
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// Create workflow state
router.post("/states", async (req, res) => {
  try {
    const response = await axios.post(`${WORKFLOW_SERVICE_URL}/states/workflow`, req.body);
    res.json(response.data);
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// Update workflow state
router.put("/states/:id", async (req, res) => {
  try {
    const response = await axios.put(
      `${WORKFLOW_SERVICE_URL}/states/workflow/${req.params.id}`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// =============================================================================
// ACTIONS ROUTES
// =============================================================================

// Get all actions for a user
router.get("/actions", transformUsernameToId, async (req, res) => {
  try {
    const workflowsResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/workflows`, {
      params: req.query,
      timeout: 10000
    });
    
    const allActions = [];
    for (const workflow of workflowsResponse.data) {
      const workflowActions = await extractActionsFromWorkflow(workflow, req.query.userId);
      allActions.push(...workflowActions);
    }
    
    res.json(allActions);
  } catch (error) {
    console.error('Error getting user actions:', error.message);
    handleWorkflowError(error, res);
  }
});

// =============================================================================
// ACTION STATE ROUTES
// =============================================================================

// Get action states
router.get("/actions/states", async (req, res) => {
  try {
    const response = await axios.get(`${WORKFLOW_SERVICE_URL}/states/action`, {
      params: req.query
    });
    res.json(response.data);
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// Update action state
router.put("/actions/states/:id", async (req, res) => {
  try {
    const response = await axios.put(
      `${WORKFLOW_SERVICE_URL}/states/action/${req.params.id}`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// Handle action submission
router.post("/actions/submit", async (req, res) => {
  try {
    const response = await axios.post(
      `${WORKFLOW_SERVICE_URL}/states/handleSubmit`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// Create a new action
router.post("/actions", async (req, res) => {
  try {
    const response = await axios.post(`${WORKFLOW_SERVICE_URL}/actions`, req.body);
    res.json(response.data);
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// Get specific action
router.get("/actions/:id", async (req, res) => {
  try {
    const response = await axios.get(`${WORKFLOW_SERVICE_URL}/actions/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// Update action
router.put("/actions/:id", async (req, res) => {
  try {
    const response = await axios.put(
      `${WORKFLOW_SERVICE_URL}/actions/${req.params.id}`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// Delete action
router.delete("/actions/:id", async (req, res) => {
  try {
    const response = await axios.delete(`${WORKFLOW_SERVICE_URL}/actions/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// Get first incomplete step in a workflow
router.get("/states/:workflowStateId/findStep", async (req, res) => {
  try {
    const response = await axios.get(
      `${WORKFLOW_SERVICE_URL}/states/workflow/${req.params.workflowStateId}/findStep`
    );
    res.json(response.data);
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// =============================================================================
// ENHANCED WORKFLOW STATE MANAGEMENT
// =============================================================================

// Get or create workflow state for a user
router.post("/states/getOrCreate", transformUsernameToId, async (req, res) => {
  try {
    const { workflowId } = req.body;
    const userId = req.body.userId || req.query.userId;

    if (!userId || !workflowId) {
      return res.status(400).json({ 
        message: "Missing required parameters",
        details: "Both userId and workflowId are required"
      });
    }

    try {
      const existingStatesResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/states/workflow`, {
        params: { userId, workflowId }
      });

      if (existingStatesResponse.data && existingStatesResponse.data.length > 0) {
        return res.json(existingStatesResponse.data[0]);
      }
    } catch (getError) {
      // No existing state, will create new
    }

    const createResponse = await axios.post(`${WORKFLOW_SERVICE_URL}/states/workflow`, {
      userId,
      workflowId
    });

    res.json(createResponse.data);
  } catch (error) {
    console.error('Error in getOrCreate workflow state:', error.message);
    handleWorkflowError(error, res);
  }
});

// Get workflow state with full action states
router.get("/states/:workflowStateId/full", async (req, res) => {
  try {
    const { workflowStateId } = req.params;
    
    const response = await axios.get(`${WORKFLOW_SERVICE_URL}/states/workflow/${workflowStateId}`);
    res.json(response.data);
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// Update action state
router.put("/actions/states/:actionStateId/updateState", async (req, res) => {
  try {
    const { actionStateId } = req.params;
    const { stateType } = req.body;

    const validStates = ['notStarted', 'inProgress', 'completed', 'hidden'];
    if (!validStates.includes(stateType)) {
      return res.status(400).json({
        message: "Invalid state type",
        details: `State type must be one of: ${validStates.join(', ')}`
      });
    }

    const response = await axios.put(`${WORKFLOW_SERVICE_URL}/states/action/${actionStateId}`, {
      stateType
    });

    res.json(response.data);
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// =============================================================================
// RESTFUL URL PATTERNS
// =============================================================================

// Get or create workflow state
router.post("/user/:username/workflows/:workflowId/state", async (req, res) => {
  try {
    const { username, workflowId } = req.params;

    if (!username || !workflowId) {
      return res.status(400).json({ 
        message: "Missing required parameters",
        details: "Both username and workflowId are required"
      });
    }

    let userId;
    try {
      const user = await prisma.user.findUnique({
        where: { username: username },
        select: { uid: true, username: true }
      });

      if (!user) {
        return res.status(404).json({
          message: "User not found",
          details: `No user found with username: ${username}`
        });
      }

      userId = String(user.uid);
    } catch (dbError) {
      console.error('Database error during user lookup:', dbError);
      return res.status(500).json({
        message: "Database error",
        details: "Failed to lookup user"
      });
    }

    try {
      const existingStatesResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/states/workflow`, {
        params: { userId, workflowId }
      });

      if (existingStatesResponse.data && existingStatesResponse.data.length > 0) {
        return res.json(existingStatesResponse.data[0]);
      }
    } catch (getError) {
      // No existing state
    }

    const createResponse = await axios.post(`${WORKFLOW_SERVICE_URL}/states/workflow`, {
      userId,
      workflowId
    });

    res.json(createResponse.data);
  } catch (error) {
    console.error('Error in getOrCreate workflow state (RESTful route):', error.message);
    handleWorkflowError(error, res);
  }
});

// Get workflow state
router.get("/user/:username/workflows/:workflowId/state", async (req, res) => {
  try {
    const { username, workflowId } = req.params;

    if (!username || !workflowId) {
      return res.status(400).json({ 
        message: "Missing required parameters",
        details: "Both username and workflowId are required"
      });
    }

    let userId;
    try {
      const user = await prisma.user.findUnique({
        where: { username: username },
        select: { uid: true, username: true }
      });

      if (!user) {
        return res.status(404).json({
          message: "User not found",
          details: `No user found with username: ${username}`
        });
      }

      userId = String(user.uid);
    } catch (dbError) {
      console.error('Database error during user lookup:', dbError);
      return res.status(500).json({
        message: "Database error",
        details: "Failed to lookup user"
      });
    }

    const response = await axios.get(`${WORKFLOW_SERVICE_URL}/states/workflow`, {
      params: { userId, workflowId }
    });

    if (response.data && response.data.length > 0) {
      res.json(response.data[0]);
    } else {
      res.status(404).json({ message: "Workflow state not found" });
    }
  } catch (error) {
    console.error('Error getting workflow state (RESTful route):', error.message);
    handleWorkflowError(error, res);
  }
});

// Get workflow state with all associated actions
router.get("/user/:username/workflows/:workflowId/state-with-actions", async (req, res) => {
  try {
    const { username, workflowId } = req.params;

    if (!username || !workflowId) {
      return res.status(400).json({ 
        message: "Missing required parameters",
        details: "Both username and workflowId are required"
      });
    }

    let userId;
    try {
      const user = await prisma.user.findUnique({
        where: { username: username },
        select: { uid: true, username: true }
      });

      if (!user) {
        return res.status(404).json({
          message: "User not found",
          details: `No user found with username: ${username}`
        });
      }

      userId = String(user.uid);
    } catch (dbError) {
      console.error('Database error during user lookup:', dbError);
      return res.status(500).json({
        message: "Database error",
        details: "Failed to lookup user"
      });
    }

    const statesResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/states/workflow`, {
      params: { userId, workflowId }
    });

    if (statesResponse.data && statesResponse.data.length > 0) {
      const workflowState = statesResponse.data[0];
      const detailedStateResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/states/workflow/${workflowState.id}`);
      res.json(detailedStateResponse.data);
    } else {
      res.status(404).json({ message: "Workflow state not found" });
    }
  } catch (error) {
    console.error('Error getting workflow state with actions:', error.message);
    handleWorkflowError(error, res);
  }
});

// Complete an action
router.post("/user/:username/actions/:actionStateId/complete", async (req, res) => {
  try {
    const { username, actionStateId } = req.params;
    const actionData = req.body || {};

    if (!username || !actionStateId) {
      return res.status(400).json({ 
        message: "Missing required parameters",
        details: "Both username and actionStateId are required"
      });
    }

    let userId;
    try {
      const user = await prisma.user.findUnique({
        where: { username: username },
        select: { uid: true, username: true }
      });

      if (!user) {
        return res.status(404).json({
          message: "User not found",
          details: `No user found with username: ${username}`
        });
      }

      userId = String(user.uid);
    } catch (dbError) {
      console.error('Database error during user lookup:', dbError);
      return res.status(500).json({
        message: "Database error",
        details: "Failed to lookup user"
      });
    }

    const actionStateResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/states/action/${actionStateId}`);
    const actionState = actionStateResponse.data;
    
    if (!actionState || !actionState.workflowStates || actionState.workflowStates.length === 0) {
      return res.status(404).json({ message: "Action state not found" });
    }
    
    const workflowId = actionState.workflowStates[0].workflowId;
    
    const response = await axios.post(`${WORKFLOW_SERVICE_URL}/states/handleSubmit`, {
      actionStateId: actionStateId
    });
    
    // Check workflow type and synchronize accordingly
    try {
      const workflowResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/workflows/${workflowId}`);
      let workflow = workflowResponse.data;
      
      // Try to get workflow type from multiple possible locations
      const workflowType = workflow.baseAction?.metadata?.workflowType || 
                          workflow.metadata?.find(m => m.key === 'workflowType')?.value;
      
      if (workflowType === 'hiring_process') {
        await synchronizeHiringWorkflowAction(workflowId, actionState.actionId, 'completed');
      } else if (workflowType === 'timecard_approval') {
        // Get metadata from the base action
        const baseActionMetadata = workflow.baseAction?.metadata || {};
        
        const currentCompleted = parseInt(baseActionMetadata.completedActions || '0');
        const totalActions = parseInt(baseActionMetadata.totalActions || '2');
        const newCompleted = currentCompleted + 1;
        
        // Update metadata - need to send the FULL metadata object with all existing fields
        const updatedMetadata = {
          ...baseActionMetadata,  // Keep all existing metadata
          completedActions: String(newCompleted),
          inProgressActionIndex: newCompleted < totalActions ? String(newCompleted + 1) : String(totalActions)
        };
        
        // Use the PUT /workflows/:id endpoint with the metadata field
        await axios.put(`${WORKFLOW_SERVICE_URL}/workflows/${workflowId}`, {
          metadata: updatedMetadata
        });
        
        // Refetch workflow to get updated metadata for notifications
        const updatedWorkflowResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/workflows/${workflowId}`);
        workflow = updatedWorkflowResponse.data;
      }
      
      // Send notifications to relevant parties
      try {
        const actor = await prisma.user.findUnique({
          where: { username },
          select: { username: true, fname: true, lname: true, email: true }
        });

        if (actor) {
          const recipients = await getWorkflowNotificationRecipients(workflow, username);
          const actionName = actionState.action?.name || 'Action';
          const comment = actionData.comment || req.body.comment;

          for (const recipient of recipients) {
            await notifyWorkflowActionCompleted({
              workflowId,
              workflow,
              actor,
              recipient,
              actionName,
              comment
            });
          }
        }
      } catch (notifyError) {
        console.error('[wf_routes] Failed to send workflow notifications:', notifyError);
        // Don't fail the request if notifications fail
      }
    } catch (syncError) {
      console.error('Could not synchronize workflow action:', syncError);
      console.error('Error details:', syncError.response?.data || syncError.message);
    }

    res.json(response.data);
  } catch (error) {
    console.error('Error completing action:', error.message);
    handleWorkflowError(error, res);
  }
});

// Start an action
router.post("/user/:username/actions/:actionStateId/start", async (req, res) => {
  try {
    const { username, actionStateId } = req.params;
    const actionData = req.body || {};

    if (!username || !actionStateId) {
      return res.status(400).json({ 
        message: "Missing required parameters",
        details: "Both username and actionStateId are required"
      });
    }

    let userId;
    try {
      const user = await prisma.user.findUnique({
        where: { username: username },
        select: { uid: true, username: true }
      });

      if (!user) {
        return res.status(404).json({
          message: "User not found",
          details: `No user found with username: ${username}`
        });
      }

      userId = String(user.uid);
    } catch (dbError) {
      console.error('Database error during user lookup:', dbError);
      return res.status(500).json({
        message: "Database error",
        details: "Failed to lookup user"
      });
    }

    const actionStateResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/states/action/${actionStateId}`);
    const actionState = actionStateResponse.data;
    
    if (!actionState || !actionState.workflowStates || actionState.workflowStates.length === 0) {
      return res.status(404).json({ message: "Action state not found" });
    }
    
    const workflowId = actionState.workflowStates[0].workflowId;
    
    const response = await axios.post(`${WORKFLOW_SERVICE_URL}/states/handleStart`, {
      actionStateId: actionStateId
    });
    
    // Check if this is a hiring workflow and synchronize
    try {
      const workflowResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/workflows/${workflowId}`);
      const workflow = workflowResponse.data;
      const isHiringWorkflow = workflow.baseAction?.metadata?.workflowType === 'hiring_process';
      
      if (isHiringWorkflow) {
        await synchronizeHiringWorkflowAction(workflowId, actionState.actionId, 'inProgress');
      }
    } catch (syncError) {
      console.error('Could not synchronize hiring workflow action start:', syncError.message);
    }

    res.json(response.data);
  } catch (error) {
    console.error('Error starting action:', error.message);
    handleWorkflowError(error, res);
  }
});

// =============================================================================
// DYNAMIC WORKFLOW CREATION - HIRING PROCESS
// =============================================================================

/**
 * POST /api/workflows/hiring/create
 * Creates a new hiring process workflow
 */
router.post("/hiring/create", async (req, res) => {
  try {
    const { 
      candidateUsername, 
      employerUsername, 
      adminUsername, 
      jobTitle, 
      applicationId 
    } = req.body;

    if (!candidateUsername || !employerUsername || !adminUsername || !jobTitle || !applicationId) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["candidateUsername", "employerUsername", "adminUsername", "jobTitle", "applicationId"]
      });
    }

    const [candidate, employer, admin] = await Promise.all([
      prisma.user.findUnique({ where: { username: candidateUsername } }),
      prisma.user.findUnique({ where: { username: employerUsername } }),
      prisma.user.findUnique({ where: { username: adminUsername } })
    ]);

    if (!candidate) {
      return res.status(404).json({ message: `Candidate user not found: ${candidateUsername}` });
    }
    if (!employer) {
      return res.status(404).json({ message: `Employer user not found: ${employerUsername}` });
    }
    if (!admin) {
      return res.status(404).json({ message: `Admin user not found: ${adminUsername}` });
    }

    const workflowTemplate = {
      name: `Hiring Process - ${jobTitle}`,
      description: `Complete hiring workflow for ${jobTitle} position (Application #${applicationId})`,
      userId: employer.uid.toString(),
      metadata: {
        jobTitle: jobTitle,
        applicationId: applicationId,
        candidateUserId: candidate.uid.toString(),
        candidateUsername: candidate.username,
        candidateName: `${candidate.fname} ${candidate.lname}`,
        employerUserId: employer.uid.toString(),
        employerUsername: employer.username,
        employerName: `${employer.fname} ${employer.lname}`,
        adminUserId: admin.uid.toString(),
        workflowType: 'hiring_process',
        createdAt: new Date().toISOString()
      }
    };

    const response = await axios.post(`${WORKFLOW_API_BASE}/workflows`, workflowTemplate);
    const createdWorkflow = response.data;

    // Create hiring process actions
    const createdActions = [];

    const appliedAction = await axios.post(`${WORKFLOW_API_BASE}/actions`, {
      name: "Applied",
      description: "Candidate has submitted their job application",
      actionType: "simple",
      userId: candidate.uid.toString(),
      metadata: {
        requiredRole: 'CANDIDATE',
        allowedUserIds: [candidate.uid.toString()],
        autoComplete: true
      }
    });
    createdActions.push(appliedAction.data);

    const interviewAction = await axios.post(`${WORKFLOW_API_BASE}/actions`, {
      name: "Interview", 
      description: "Conduct technical and behavioral interviews with candidate",
      actionType: "simple",
      userId: employer.uid.toString(),
      metadata: {
        requiredRole: 'EMPLOYER',
        allowedUserIds: [employer.uid.toString()]
      }
    });
    createdActions.push(interviewAction.data);

    await axios.put(`${WORKFLOW_API_BASE}/actions/${appliedAction.data.id}`, {
      nextActionId: interviewAction.data.id
    });

    const offerAction = await axios.post(`${WORKFLOW_API_BASE}/actions`, {
      name: "Offer",
      description: "Extend job offer to successful candidate", 
      actionType: "simple",
      userId: employer.uid.toString(),
      metadata: {
        requiredRole: 'EMPLOYER',
        allowedUserIds: [employer.uid.toString()]
      }
    });
    createdActions.push(offerAction.data);

    await axios.put(`${WORKFLOW_API_BASE}/actions/${interviewAction.data.id}`, {
      nextActionId: offerAction.data.id
    });

    const acceptedAction = await axios.post(`${WORKFLOW_API_BASE}/actions`, {
      name: "Accepted",
      description: "Candidate has accepted the job offer",
      actionType: "simple", 
      userId: candidate.uid.toString(),
      metadata: {
        requiredRole: 'CANDIDATE',
        allowedUserIds: [candidate.uid.toString()]
      }
    });
    createdActions.push(acceptedAction.data);

    await axios.put(`${WORKFLOW_API_BASE}/actions/${offerAction.data.id}`, {
      nextActionId: acceptedAction.data.id
    });

    const hiredAction = await axios.post(`${WORKFLOW_API_BASE}/actions`, {
      name: "Hired",
      description: "Complete onboarding process and official hiring",
      actionType: "simple",
      userId: admin.uid.toString(),
      metadata: {
        requiredRole: 'ADMIN',
        allowedUserIds: [admin.uid.toString()]
      }
    });
    createdActions.push(hiredAction.data);

    await axios.put(`${WORKFLOW_API_BASE}/actions/${acceptedAction.data.id}`, {
      nextActionId: hiredAction.data.id
    });

    await axios.put(`${WORKFLOW_API_BASE}/workflows/${createdWorkflow.id}`, {
      rootActionId: createdActions[0].id
    });

    createdWorkflow.actions = createdActions;

    // Create workflow states for all users
    const stateCreationPromises = [
      axios.post(`${WORKFLOW_API_BASE}/states/workflow`, {
        workflowId: createdWorkflow.id,
        userId: candidate.uid.toString()
      }),
      axios.post(`${WORKFLOW_API_BASE}/states/workflow`, {
        workflowId: createdWorkflow.id,
        userId: employer.uid.toString()
      }),
      axios.post(`${WORKFLOW_API_BASE}/states/workflow`, {
        workflowId: createdWorkflow.id,
        userId: admin.uid.toString()
      })
    ];

    const stateResponses = await Promise.all(stateCreationPromises);

    // Give workflow service a moment to process state creation
    await new Promise(resolve => setTimeout(resolve, 500));

    // Auto-complete the "Applied" action
    try {
      await synchronizeHiringWorkflowAction(createdWorkflow.id, appliedAction.data.id, 'completed');
    } catch (autoCompleteError) {
      console.error('[Hiring Workflow] Could not auto-complete Applied action:', autoCompleteError.message);
    }

    res.status(201).json({
      message: "Hiring workflow created successfully",
      workflow: createdWorkflow,
      states: stateResponses.map(r => r.data),
      accessibleBy: [candidateUsername, employerUsername, adminUsername],
      note: "Individual workflow states created for each user with automatic synchronization"
    });

  } catch (error) {
    console.error('Error creating hiring workflow:', error);
    handleWorkflowError(error, res);
  }
});

/**
 * GET /api/workflows/hiring/permissions
 * Check what actions a user is allowed to perform on a hiring workflow
 */
router.get("/hiring/permissions", async (req, res) => {
  try {
    const { workflowId, username } = req.query;

    if (!workflowId || !username) {
      return res.status(400).json({ 
        message: 'Missing required parameters',
        required: ['workflowId', 'username']
      });
    }

    const user = await prisma.user.findUnique({
      where: { username: username }
    });

    if (!user) {
      return res.status(404).json({ message: `User not found: ${username}` });
    }

    const workflowResponse = await axios.get(`${WORKFLOW_API_BASE}/workflows/${workflowId}`);
    const workflow = workflowResponse.data;

    const actionsResponse = await axios.get(`${WORKFLOW_API_BASE}/actions?workflowId=${workflowId}`);
    const workflowActions = actionsResponse.data || [];

    const userRole = user.role;
    const allowedActions = [];
    const allowedActionIds = [];

    const isHiringWorkflow = workflow.baseAction?.metadata?.workflowType === 'hiring_process' ||
                            workflow.name?.includes('Hiring Process');

    for (const action of workflowActions) {
      let canPerform = false;

      // Check assignedUserId in metadata first, then fall back to direct field
      const assignedUserId = action.metadata?.assignedUserId || action.assignedUserId;

      if (isHiringWorkflow) {
        if (assignedUserId && assignedUserId === user.uid.toString()) {
          canPerform = true;
        }
      } else {
        if (userRole === 'ADMIN') {
          canPerform = true;
        }

        if (!canPerform && assignedUserId && assignedUserId === user.uid.toString()) {
          canPerform = true;
        }

        if (!canPerform && action.permissions && action.permissions.some(p => p.userId === user.uid.toString() && p.permissionType === 'creator')) {
          canPerform = true;
        }
      }

      if (action.metadata) {
        let requiredRole, allowedUserIds;
        if (Array.isArray(action.metadata)) {
          const requiredRoleMetadata = action.metadata.find(m => m.key === 'requiredRole');
          const allowedUserIdsMetadata = action.metadata.find(m => m.key === 'allowedUserIds');
          requiredRole = requiredRoleMetadata?.value;
          allowedUserIds = allowedUserIdsMetadata?.value;
        } else {
          requiredRole = action.metadata.requiredRole;
          allowedUserIds = action.metadata.allowedUserIds;
        }

        if (requiredRole === userRole) canPerform = true;
        if (allowedUserIds && !canPerform) {
          const idList = typeof allowedUserIds === 'string' ? [allowedUserIds] : allowedUserIds;
          if (idList && idList.includes(String(user.uid))) canPerform = true;
        }
        if (requiredRole === 'CANDIDATE' && !canPerform) {
          const cand = await prisma.candidate.findUnique({ where: { username: user.username } });
          if (cand) canPerform = true;
        }
      }

      if (canPerform) {
        allowedActions.push(action.name);
        allowedActionIds.push(action.id);
      }
    }

    res.json({
      userRole,
      allowedActions,
      allowedActionIds,
      username,
      workflowId
    });
  } catch (error) {
    console.error('Error checking hiring workflow permissions:', error);
    res.status(500).json({ 
      message: 'Failed to check permissions', 
      error: error.message 
    });
  }
});

/**
 * GET /api/workflows/hiring/permissions/:workflowId/:username
 * Check permissions (path params version)
 */
router.get("/hiring/permissions/:workflowId/:username", async (req, res) => {
  try {
    const { workflowId, username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username: username }
    });

    if (!user) {
      return res.status(404).json({ message: `User not found: ${username}` });
    }

    const workflowResponse = await axios.get(`${WORKFLOW_API_BASE}/workflows/${workflowId}`);
    const workflow = workflowResponse.data;

    const actionsResponse = await axios.get(`${WORKFLOW_API_BASE}/actions?workflowId=${workflowId}`);
    const workflowActions = actionsResponse.data || [];

    const userRole = user.role;
    const allowedActions = [];
    const allowedActionIds = [];

    const isHiringWorkflow = workflow.baseAction?.metadata?.workflowType === 'hiring_process' ||
                            workflow.name?.includes('Hiring Process');

    for (const action of workflowActions) {
      let canPerform = false;

      // Check assignedUserId in metadata first, then fall back to direct field
      const assignedUserId = action.metadata?.assignedUserId || action.assignedUserId;

      if (isHiringWorkflow) {
        if (assignedUserId && assignedUserId === user.uid.toString()) {
          canPerform = true;
        }
      } else {
        if (userRole === 'ADMIN') {
          canPerform = true;
        }

        if (!canPerform && assignedUserId && assignedUserId === user.uid.toString()) {
          canPerform = true;
        }

        if (!canPerform && action.permissions && action.permissions.some(p => p.userId === user.uid.toString() && p.permissionType === 'creator')) {
          canPerform = true;
        }
      }

      if (action.metadata) {
        let requiredRole, allowedUserIds;
        if (Array.isArray(action.metadata)) {
          const requiredRoleMetadata = action.metadata.find(m => m.key === 'requiredRole');
          const allowedUserIdsMetadata = action.metadata.find(m => m.key === 'allowedUserIds');
          requiredRole = requiredRoleMetadata?.value;
          allowedUserIds = allowedUserIdsMetadata?.value;
        } else {
          requiredRole = action.metadata.requiredRole;
          allowedUserIds = action.metadata.allowedUserIds;
        }

        if (requiredRole === userRole) canPerform = true;
        if (allowedUserIds && !canPerform) {
          const idList = typeof allowedUserIds === 'string' ? [allowedUserIds] : allowedUserIds;
          if (idList && idList.includes(String(user.uid))) canPerform = true;
        }
        if (requiredRole === 'CANDIDATE' && !canPerform) {
          const cand = await prisma.candidate.findUnique({ where: { username: user.username } });
          if (cand) canPerform = true;
        }
      }

      if (canPerform) {
        allowedActions.push(action.name);
        allowedActionIds.push(action.id);
      }
    }

    res.json({
      userRole,
      allowedActions,
      allowedActionIds,
      username,
      workflowId
    });

  } catch (error) {
    console.error('Error checking hiring workflow permissions (path params):', error);
    res.status(500).json({ 
      message: 'Failed to check permissions', 
      error: error.message 
    });
  }
});

// =============================================================================
// ROLE-BASED WORKFLOW VIEWING
// =============================================================================

/**
 * GET /api/workflows/by-role/:username
 * Get workflows based on user's role
 */
router.get("/by-role/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username: username },
      select: { uid: true, username: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ message: `User not found: ${username}` });
    }

    const userId = String(user.uid);
    const userRole = user.role;

    const allWorkflowsResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/workflows`, {
      timeout: 10000
    });

    const allWorkflows = allWorkflowsResponse.data || [];
    let filteredWorkflows = [];

    if (userRole === 'ADMIN') {
      filteredWorkflows = allWorkflows;
    } else if (userRole === 'EMPLOYER') {
      for (const workflow of allWorkflows) {
        const metadata = workflow.metadata || workflow.baseAction?.metadata || {};
        const isHiringWorkflow = metadata.workflowType === 'hiring_process';
        
        if (isHiringWorkflow) {
          const employerUserId = metadata.employerUserId;
          if (employerUserId === userId) {
            filteredWorkflows.push(workflow);
            continue;
          }
        }

        const hasPermission = workflow.baseAction?.permissions?.some(permission => 
          permission.userId === userId
        );

        let hasWorkflowState = false;
        try {
          const stateResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/states/workflow`, {
            params: { 
              userId: userId, 
              workflowId: workflow.id 
            },
            timeout: 5000
          });
          hasWorkflowState = stateResponse.data && (
            Array.isArray(stateResponse.data) ? stateResponse.data.length > 0 : !!stateResponse.data.id
          );
        } catch (stateError) {
          // Continue without state check
        }

        if (hasPermission || hasWorkflowState) {
          filteredWorkflows.push(workflow);
        }
      }
    } else {
      for (const workflow of allWorkflows) {
        const metadata = workflow.metadata || workflow.baseAction?.metadata || {};
        const isHiringWorkflow = metadata.workflowType === 'hiring_process';
        
        if (isHiringWorkflow) {
          const candidateUserId = metadata.candidateUserId;
          if (candidateUserId === userId) {
            filteredWorkflows.push(workflow);
            continue;
          }
        }

        const hasPermission = workflow.baseAction?.permissions?.some(permission => 
          permission.userId === userId
        );

        let hasWorkflowState = false;
        try {
          const stateResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/states/workflow`, {
            params: { 
              userId: userId, 
              workflowId: workflow.id 
            },
            timeout: 5000
          });
          hasWorkflowState = stateResponse.data && (
            Array.isArray(stateResponse.data) ? stateResponse.data.length > 0 : !!stateResponse.data.id
          );
        } catch (stateError) {
          // Continue without state check
        }

        if (hasPermission || hasWorkflowState) {
          filteredWorkflows.push(workflow);
        }
      }
    }

    const transformedWorkflows = await Promise.all(filteredWorkflows.map(async workflow => {
      const metadata = workflow.metadata || workflow.baseAction?.metadata || {};
      
      return {
        id: workflow.id,
        name: workflow.baseAction?.name || 'Unnamed Workflow',
        description: workflow.baseAction?.description || '',
        tags: workflow.tags || [],
        metadata: metadata,
        actions: await extractActionsFromWorkflow(workflow, userId)
      };
    }));

    res.json({
      username,
      userRole,
      workflowCount: transformedWorkflows.length,
      workflows: transformedWorkflows
    });

  } catch (error) {
    console.error('Error getting workflows by role:', error);
    handleWorkflowError(error, res);
  }
});

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = router;
