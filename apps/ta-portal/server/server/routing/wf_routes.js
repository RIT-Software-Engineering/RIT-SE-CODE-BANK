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

// Configuration for workflow service
const WORKFLOW_SERVICE_URL = process.env.WORKFLOWS_URL || "http://localhost:3001";
const WORKFLOW_API_BASE = `${WORKFLOW_SERVICE_URL}/api`;

console.log('=== WORKFLOW SERVICE CONFIG ===');
console.log('WORKFLOW_SERVICE_URL:', WORKFLOW_SERVICE_URL);
console.log('WORKFLOWS_URL env var:', process.env.WORKFLOWS_URL);
console.log('================================');

// Middleware to handle workflow service errors
const handleWorkflowError = (error, res) => {
  console.error("Workflow service error:", {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
    url: error.config?.url,
    method: error.config?.method
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

// Middleware to transform username to userId
const transformUsernameToId = async (req, res, next) => {
  // Store original username before we modify the request object
  const originalUsername = (req.query && req.query.username) || (req.body && req.body.username);
  
  try {
    // Debug logging for request object
    console.log("Request debugging:", {
      hasQuery: !!req.query,
      hasBody: !!req.body,
      queryUsername: req.query?.username,
      bodyUsername: req.body?.username,
      originalUsername: originalUsername
    });
    
    // Check both query parameters and body for username
    const username = originalUsername;
    
    if (username) {
      console.log("Transforming username to ID for:", username);
      
      // Add database connection check
      if (!prisma) {
        console.error("Prisma client is not initialized");
        return res.status(500).json({
          message: "Database connection error",
          details: "Database client not available"
        });
      }

      console.log("Attempting to find user in database...");
      console.log("Prisma client status:", typeof prisma, !!prisma.user);
      
      let user;
      try {
        // First check if we can connect to the database at all
        await prisma.$connect();
        console.log("Database connection successful");
        
        user = await prisma.user.findUnique({
          where: { username: username },
          select: { uid: true, username: true }
        });
        console.log("Database query result:", user);
      } catch (dbError) {
        console.error("Database query failed:", {
          error: dbError.message,
          code: dbError.code,
          stack: dbError.stack,
          prismaVersion: dbError.clientVersion
        });
        
        // Provide more specific error handling
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
        console.warn(`User not found: ${username}`);
        return res.status(404).json({ 
          message: "User not found",
          details: `No user found with username: ${username}`
        });
      }
      
      // Transform the request to use userId instead of username  
      // The workflow service expects userId as the actual user identifier
      // In TA Portal, the 'username' field is actually the userID (e.g., 'aa1234')
      const transformedUserId = username; // Use the userID directly, don't transform it
      
      // Store transformed parameters for the route handler to use
      // Since req.query is read-only, we'll attach the transformed params to req
      const transformedQuery = { ...req.query };
      const transformedBody = req.body ? { ...req.body } : {};
      
      if (req.query && req.query.username) {
        transformedQuery.userId = transformedUserId;
        delete transformedQuery.username;
        console.log("Created transformed query params:", transformedQuery);
      }
      
      if (req.body && req.body.username) {
        transformedBody.userId = transformedUserId;
        delete transformedBody.username;
        console.log("Created transformed body params:", transformedBody);
      }
      
      // Attach transformed params to the request object for route handlers to use
      req.workflowParams = transformedQuery;
      req.workflowBody = transformedBody;
      
      console.log("Successfully transformed username to userId:", {
        originalUsername: originalUsername || 'undefined',
        userIdInWorkflowService: transformedUserId || 'undefined',
        userDbId: user?.uid || 'undefined'
      });
      
      console.log("Original req.query:", req.query);
      console.log("Transformed workflow params:", req.workflowParams);
      console.log("About to call next() - transformation complete");
    } else {
      console.log("No username parameter found, checking if userId already provided");
      
      // Validate userId format if provided
      const userId = req.query.userId || req.body.userId;
      if (userId && !userId.match(/^user\d+$/)) {
        console.warn(`Invalid userId format: ${userId}. Expected format: user<number>`);
        return res.status(400).json({
          message: "Invalid userId format",
          details: "userId should be in format 'user<number>' (e.g., 'user1', 'user123')"
        });
      }
    }
    
    console.log("Calling next() to continue to next middleware");
    next();
  } catch (error) {
    console.error("Error transforming username to ID:", {
      error: error.message,
      stack: error.stack,
      username: originalUsername
    });
    
    // Provide a fallback transformation to prevent complete failure
    const username = originalUsername;
    if (username) {
      console.log("Attempting fallback transformation for:", username);
      
      // Use the username directly as userId since in TA Portal, username IS the userID
      const fallbackUserId = username;
      
      // Set userId based on where we originally found the username
      if (req.query && !req.query.userId) {
        req.query.userId = fallbackUserId;
      }
      
      if (req.body && !req.body.userId) {
        req.body.userId = fallbackUserId;
      }
      
      console.log("Using fallback userId:", fallbackUserId);
      console.log("⚠️  WARNING: Database connection issue - using fallback transformation");
      console.log("   This may cause issues if the workflow service doesn't recognize this userId");
      
      // Continue with warning
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
    // Remove /api prefix as workflow service doesn't use it
    const url = `${WORKFLOW_SERVICE_URL}${endpoint}`;
    
    console.log(`Proxying ${method.toUpperCase()} request to:`, {
      url,
      method,
      params: req.query,
      body: req.body
    });
    
    const response = await axios({
      method,
      url,
      params: req.query,
      data: req.body
    });
    
    console.log('Workflow service response:', {
      status: response.status,
      data: response.data
    });
    
    res.json(response.data);
  } catch (error) {
    console.error(`Error proxying ${req.method} ${endpoint}:`, {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      params: error.config?.params,
      body: error.config?.data
    });
    handleWorkflowError(error, res);
  }
};

// =============================================================================
// HEALTH CHECK AND DEBUG ROUTES
// =============================================================================

// Health check route to test workflow service connectivity
router.get("/health", async (req, res) => {
  let dbStatus = 'unknown';
  let dbError = null;
  
  // Test database connectivity
  try {
    console.log('Testing database connectivity...');
    const testUser = await prisma.user.findFirst({
      select: { uid: true, username: true }
    });
    dbStatus = 'connected';
    console.log('Database test result:', testUser ? 'Found users' : 'No users found');
  } catch (error) {
    console.error('Database connectivity test failed:', error.message);
    dbStatus = 'error';
    dbError = error.message;
  }

  // Test workflow service connectivity
  try {
    console.log('Testing workflow service connectivity...');
    const response = await axios.get(`${WORKFLOW_SERVICE_URL}/workflows`, {
      timeout: 5000,
      params: { userId: 'user1' } // Test with a sample user ID that matches the seed data
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
 * Extract actions from the new workflow structure to match frontend expectations
 * @param {Object} workflow - The workflow object from the new API
 * @returns {Array} Array of actions with status information
 */
const extractActionsFromWorkflow = (workflow) => {
  const actions = [];
  
  // If workflow has a rootAction, traverse it to get all actions
  if (workflow.rootAction) {
    actions.push(...traverseActions(workflow.rootAction, 0));
  }
  

  
  return actions;
};

/**
 * Recursively traverse actions to build a flat list
 * @param {Object} action - The action object
 * @param {number} order - The order/index of the action
 * @returns {Array} Array of flattened actions
 */
const traverseActions = (action, order = 0) => {
  const actions = [];
  
  if (!action) return actions;
  
  // Add the current action
  actions.push({
    id: action.id,
    name: action.name,
    description: action.description || '',
    status: getActionStatus(action),
    order: order + 1,
    actionType: action.actionType || 'simple'
  });
  
  // Handle child actions (for complex/branching actions)
  if (action.childActions && Array.isArray(action.childActions)) {
    action.childActions.forEach((childAction, index) => {
      actions.push(...traverseActions(childAction, order + index + 1));
    });
  }
  
  // Handle next action in sequence
  if (action.nextAction) {
    actions.push(...traverseActions(action.nextAction, order + 1));
  }
  
  return actions;
};

/**
 * Determine the status of an action based on available information
 * @param {Object} action - The action object
 * @returns {string} The status of the action
 */
const getActionStatus = (action) => {
  // Check if the action has associated state information
  if (action.actionStates && action.actionStates.length > 0) {
    // Use the most recent state
    const latestState = action.actionStates[action.actionStates.length - 1];
    switch (latestState.stateType) {
      case 'completed': return 'completed';
      case 'inProgress': return 'in-progress';
      case 'notStarted': return 'pending';
      case 'hidden': return 'hidden';
      default: return 'pending';
    }
  }
  
  // Check metadata for status
  if (action.metadata && action.metadata.status) {
    return action.metadata.status;
  }
  
  // Default to pending if no state information available
  return 'pending';
};

// =============================================================================
// WORKFLOW ROUTES
// =============================================================================

console.log("Loading workflow routes...");

// Test route without username transformation for debugging
router.get("/test", async (req, res) => {
  try {
    console.log('=== TEST WORKFLOW REQUEST (NO USERNAME TRANSFORMATION) ===');
    console.log('Request query params:', req.query);
    
    // Use a default test userId if none provided, or try several known userIds from seed data
    const testUserIds = ['user1', 'user2', 'user3'];
    const testUserId = req.query.userId || testUserIds[0];
    console.log('Using test userId:', testUserId);
    console.log('Available test userIds from seed data:', testUserIds);
    
    const response = await axios.get(`${WORKFLOW_SERVICE_URL}/workflows`, {
      params: { userId: testUserId },
      timeout: 10000
    });
    
    console.log('Workflow service response status:', response.status);
    console.log('Workflow service response data:', response.data);
    
    res.json({
      message: 'Test successful',
      userId: testUserId,
      workflows: response.data
    });
  } catch (error) {
    console.error('Test workflow request failed:', error.message);
    handleWorkflowError(error, res);
  }
});

// Get all workflows or filtered by parameters
router.get("/", transformUsernameToId, async (req, res) => {
  try {
    console.log('=== WORKFLOW REQUEST DEBUG ===');
    console.log('Original request params:', req.query);
    console.log('Transformed workflow params:', req.workflowParams);
    console.log('Workflow service URL:', WORKFLOW_SERVICE_URL);
    console.log('Full request URL:', `${WORKFLOW_SERVICE_URL}/workflows`);
    
    // Use the transformed params from the middleware
    const workflowParams = req.workflowParams || req.query;
    console.log('Params being sent to workflow service:', workflowParams);
    
    const response = await axios.get(`${WORKFLOW_SERVICE_URL}/workflows`, {
      params: workflowParams,
      timeout: 10000 // 10 second timeout
    });
    
    console.log('Workflow service response status:', response.status);
    console.log('Workflow service response data:', response.data);
    
    // Transform the new workflow structure to match frontend expectations
    const transformedWorkflows = response.data.map(workflow => {
      return {
        id: workflow.id,
        name: workflow.baseAction?.name || 'Unnamed Workflow',
        description: workflow.baseAction?.description || '',
        tags: workflow.tags || [],
        // Extract actions from the workflow structure
        actions: extractActionsFromWorkflow(workflow)
      };
    });
    
    console.log('Transformed workflows:', transformedWorkflows);
    console.log('=== END WORKFLOW REQUEST DEBUG ===');
    
    res.json(transformedWorkflows);
  } catch (error) {
    console.error('=== WORKFLOW ERROR DEBUG ===');
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      params: error.config?.params,
      timeout: error.config?.timeout
    });
    console.error('=== END WORKFLOW ERROR DEBUG ===');
    
    handleWorkflowError(error, res);
  }
});

// Get a specific workflow
router.get("/:id", async (req, res) => {
  try {
    const response = await axios.get(`${WORKFLOW_SERVICE_URL}/workflows/${req.params.id}`);
    
    // Transform the single workflow to match frontend expectations
    const workflow = response.data;
    const transformedWorkflow = {
      id: workflow.id,
      name: workflow.baseAction?.name || 'Unnamed Workflow',
      description: workflow.baseAction?.description || '',
      tags: workflow.tags || [],
      actions: extractActionsFromWorkflow(workflow)
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

// Get all actions for a user (flattened from all workflows)
router.get("/actions", transformUsernameToId, async (req, res) => {
  try {
    console.log('Getting all actions for user:', req.query.userId);
    
    // First get all workflows for the user
    const workflowsResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/workflows`, {
      params: req.query,
      timeout: 10000
    });
    
    // Extract all actions from all workflows
    const allActions = [];
    workflowsResponse.data.forEach(workflow => {
      const workflowActions = extractActionsFromWorkflow(workflow);
      allActions.push(...workflowActions);
    });
    
    console.log(`Found ${allActions.length} actions for user:`, req.query.userId);
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

// Handle action submission (complete action)
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

    console.log('Getting or creating workflow state:', { userId, workflowId });

    // First, try to get existing workflow state
    try {
      const existingStatesResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/states/workflow`, {
        params: { userId, workflowId }
      });

      if (existingStatesResponse.data && existingStatesResponse.data.length > 0) {
        console.log('Found existing workflow state:', existingStatesResponse.data[0]);
        return res.json(existingStatesResponse.data[0]);
      }
    } catch (getError) {
      console.log('No existing workflow state found, will create new one');
    }

    // If no existing state, create a new one
    const createResponse = await axios.post(`${WORKFLOW_SERVICE_URL}/states/workflow`, {
      userId,
      workflowId
    });

    console.log('Created new workflow state:', createResponse.data);
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
    
    // The response should include the full workflow state with nested action states
    res.json(response.data);
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// Update action state (mark as inProgress or completed)
router.put("/actions/states/:actionStateId/updateState", async (req, res) => {
  try {
    const { actionStateId } = req.params;
    const { stateType } = req.body;

    // Validate stateType
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
// EXPORTS
// =============================================================================

module.exports = router;