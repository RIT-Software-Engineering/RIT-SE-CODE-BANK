// Workflow APIs Service - Frontend service layer for workflow operations
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:3300/api';

// Generic API request handler with error handling
async function apiRequest(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Get all workflows for a specific user
export async function getUserWorkflows(username) {
  if (!username) {
    throw new Error('Username is required');
  }
  return await apiRequest(`/workflows?username=${encodeURIComponent(username)}`);
}

// Get all actions for a specific user
export async function getUserActions(username) {
  if (!username) {
    throw new Error('Username is required');
  }
  return await apiRequest(`/workflows/actions?username=${encodeURIComponent(username)}`);
}

// Complete a specific action
export async function completeAction(username, actionId, actionData = {}) {
  if (!username || !actionId) {
    throw new Error('Username and actionId are required');
  }
  return await apiRequest(`/workflows/user/${encodeURIComponent(username)}/actions/${actionId}/complete`, {
    method: 'POST',
    body: JSON.stringify(actionData),
  });
}

// Update the state of a specific action
export async function updateActionState(username, actionId, newState) {
  if (!username || !actionId || !newState) {
    throw new Error('Username, actionId, and newState are required');
  }
  return await apiRequest(`/workflows/user/${encodeURIComponent(username)}/actions/${actionId}/state`, {
    method: 'PUT',
    body: JSON.stringify({ state: newState }),
  });
}

// Create a new action
export async function createAction(username, actionData) {
  if (!username || !actionData) {
    throw new Error('Username and actionData are required');
  }
  return await apiRequest(`/workflows/user/${encodeURIComponent(username)}/actions`, {
    method: 'POST',
    body: JSON.stringify(actionData),
  });
}

// Create a new workflow
export async function createWorkflow(username, workflowData) {
  if (!username || !workflowData) {
    throw new Error('Username and workflowData are required');
  }
  return await apiRequest(`/workflows/user/${encodeURIComponent(username)}/workflows`, {
    method: 'POST',
    body: JSON.stringify(workflowData),
  });
}

// Get all workflow states for a user
export async function getUserWorkflowStates(username) {
  if (!username) {
    throw new Error('Username is required');
  }
  return await apiRequest(`/workflows/user/${encodeURIComponent(username)}/workflow-states`);
}

// Create a new workflow state
export async function createWorkflowState(username, workflowId, stateData = {}) {
  if (!username || !workflowId) {
    throw new Error('Username and workflowId are required');
  }
  return await apiRequest(`/workflows/user/${encodeURIComponent(username)}/workflows/${workflowId}/state`, {
    method: 'POST',
    body: JSON.stringify(stateData),
  });
}

// Get or create workflow state for a user
export async function getOrCreateWorkflowState(username, workflowId) {
  if (!username || !workflowId) {
    throw new Error('Username and workflowId are required');
  }
  return await apiRequest(`/workflows/user/${encodeURIComponent(username)}/workflows/${workflowId}/state`, {
    method: 'POST',
  });
}

// Get workflow state with all associated actions
export async function getWorkflowStateWithActions(username, workflowId) {
  if (!username || !workflowId) {
    throw new Error('Username and workflowId are required');
  }
  return await apiRequest(`/workflows/user/${encodeURIComponent(username)}/workflows/${workflowId}/state-with-actions`);
}

// Get workflow state for a user
export async function getWorkflowState(username, workflowId) {
  if (!username || !workflowId) {
    throw new Error('Username and workflowId are required');
  }
  return await apiRequest(`/workflows/user/${encodeURIComponent(username)}/workflows/${workflowId}/state`);
}

// Get a specific workflow by ID
export async function getWorkflow(workflowId) {
  if (!workflowId) {
    throw new Error('WorkflowId is required');
  }
  return await apiRequest(`/workflows/${workflowId}`);
}

// Get all available workflows (not user-specific)
export async function getAllWorkflows() {
  return await apiRequest('/workflows');
}

// Get action details by ID
export async function getAction(actionId) {
  if (!actionId) {
    throw new Error('ActionId is required');
  }
  return await apiRequest(`/workflows/actions/${actionId}`);
}

// Health check for workflow service connectivity
export async function getWorkflowHealth() {
  return await apiRequest('/workflows/health');
}

// Submit an action (different from complete)
export async function submitAction(username, actionData) {
  if (!username || !actionData) {
    throw new Error('Username and actionData are required');
  }
  return await apiRequest(`/workflows/user/${encodeURIComponent(username)}/actions/submit`, {
    method: 'POST',
    body: JSON.stringify(actionData),
  });
}