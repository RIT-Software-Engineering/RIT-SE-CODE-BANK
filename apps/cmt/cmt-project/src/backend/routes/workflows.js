// routes/workflows.js
// Handles all workflow-related logic for CMT

const express = require('express');
const router = express.Router();


const WORKFLOWS_API = (process.env.WORKFLOWS_API_URL || 'http://localhost:5001').replace(/\/$/, ''); // Remove trailing slash

/**
 * GET /api/workflows/student/:studentId
 * Returns all workflows with state for a specific student
 * Combines data from CMT database and Workflows API
 */
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const prisma = req.prisma; // Passed from server.js

    console.log(`Fetching workflows for student: ${studentId}`);

    // Step 1: Get all courses with workflows
    const courses = await prisma.course.findMany({
      where: {
        workflowId: {
          not: null
        }
      },
      include: {
        professors: true
      }
    });

    console.log(`Found ${courses.length} courses with workflows`);

    if (courses.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Step 2: Fetch workflow data for each course
    const workflowPromises = courses.map(async (course) => {
      try {
        // Fetch workflow details
        const workflowResponse = await fetch(
          `${WORKFLOWS_API}/workflows/${course.workflowId}`
        );

        if (!workflowResponse.ok) {
          console.error(`Workflow ${course.workflowId} not found`);
          return null;
        }

        const workflow = await workflowResponse.json();

        // Check if workflow has a root action
        if (!workflow.rootActionId) {
          console.warn(`Workflow ${course.workflowId} has no root action (empty workflow)`);
          return null;
        }

        // Fetch workflow actions
        const actionsResponse = await fetch(
          `${WORKFLOWS_API}/actions?workflowId=${course.workflowId}`
        );
        const actions = await actionsResponse.json();

        if (!actions || !Array.isArray(actions) || actions.length === 0) {
          console.warn(`No actions found for workflow ${course.workflowId}`);
          return null;
        }

        // Get or create workflow state for this student
        const state = await getOrCreateWorkflowState(
          course.workflowId,
          studentId
        );

        if (!state || !state.actionStates) {
          console.error(`Invalid workflow state for ${course.name}`);
          return null;
        }

        console.log(`📊 Workflow state for ${course.name}:`);
        console.log(`   Total actions: ${state.actionStates.length}`);
        state.actionStates.forEach((as, idx) => {
          console.log(`   Action ${idx + 1}: ${as.action?.name} - State: ${as.stateType}`);
        });

        // CRITICAL: Merge action metadata into actionStates
        // The state API doesn't include metadata, so we need to merge it from actions array
        state.actionStates = state.actionStates.map(actionState => {
          const fullAction = actions.find(a => a.id === actionState.actionId);
          if (fullAction && fullAction.metadata) {
            // Merge metadata into the action object
            return {
              ...actionState,
              action: {
                ...actionState.action,
                metadata: fullAction.metadata
              }
            };
          }
          return actionState;
        });

        console.log(`✅ Merged metadata for ${course.name}`);

        // Calculate progress
        const completed = state.actionStates.filter(
          s => s.stateType === 'completed'
        ).length;
        const total = state.actionStates.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          course: {
            id: course.id,
            name: course.name,
            semester: course.semester,
            color: course.color,
            students: course.students
          },
          workflow: {
            id: workflow.id,
            name: workflow.name,
            description: workflow.description
          },
          state: {
            id: state.id,
            actionStates: state.actionStates
          },
          progress: {
            completed,
            total,
            percentage: progress
          }
        };
      } catch (error) {
        console.error(`Error loading workflow for ${course.name}:`, error);
        return null;
      }
    });

    const workflowData = await Promise.all(workflowPromises);
    const validWorkflows = workflowData.filter(w => w !== null);

    console.log(`Successfully loaded ${validWorkflows.length} workflows`);

    res.json({
      success: true,
      data: validWorkflows
    });

  } catch (error) {
    console.error('Error in GET /api/workflows/student/:studentId:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load student workflows',
      details: error.message
    });
  }
});

/**
 * PUT /api/workflows/action-state/:actionStateId
 * Updates the state of a specific action (toggle completed/notStarted)
 */
router.put('/action-state/:actionStateId', async (req, res) => {
  try {
    const { actionStateId } = req.params;
    const { stateType } = req.body;

    console.log('='.repeat(60));
    console.log('📝 UPDATE ACTION STATE REQUEST');
    console.log(`Action State ID: ${actionStateId}`);
    console.log(`New State Type: ${stateType}`);
    console.log('='.repeat(60));

    // Validate stateType
    const validStates = ['notStarted', 'inProgress', 'completed', 'hidden'];
    if (!validStates.includes(stateType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid stateType. Must be one of: ${validStates.join(', ')}`
      });
    }

    // Update via Workflows API
    console.log(`🔄 Calling Workflows API: PUT ${WORKFLOWS_API}/states/action/${actionStateId}`);
    const response = await fetch(
      `${WORKFLOWS_API}/states/action/${actionStateId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stateType })
      }
    );

    console.log(`📡 Workflows API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Workflows API Error: ${response.status} - ${errorText}`);
      throw new Error(`Workflows API error: ${response.status} - ${errorText}`);
    }

    const updatedState = await response.json();
    console.log('✅ Workflows API returned:', JSON.stringify(updatedState, null, 2));

    res.json({
      success: true,
      data: updatedState
    });

    console.log('✅ Response sent to frontend');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error updating action state:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update action state',
      details: error.message
    });
  }
});

/**
 * Helper: Get or create workflow state for a user
 * Also transforms the nested structure to a flat actionStates array
 */
async function getOrCreateWorkflowState(workflowId, userId) {
  try {
    console.log(`🔄 Getting workflow state for workflow ${workflowId}, user ${userId}`);
    
    // FIRST: Try to get existing workflow state by querying
    // Check if state already exists before creating new one
    const existingStatesResponse = await fetch(
      `${WORKFLOWS_API}/states/workflow?userId=${userId}&workflowId=${workflowId}`
    );

    let workflowState;

    if (existingStatesResponse.ok) {
      const existingStates = await existingStatesResponse.json();
      if (existingStates && existingStates.length > 0) {
        // Use the first (should be only) existing state
        workflowState = existingStates[0];
        console.log(`✅ Found existing workflow state: ${workflowState.id}`);
      }
    }

    // If no existing state found, create new one
    if (!workflowState) {
      console.log(`📝 No existing state found, creating new workflow state...`);
      const stateResponse = await fetch(`${WORKFLOWS_API}/states/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          workflowId
        })
      });

      if (!stateResponse.ok) {
        const errorText = await stateResponse.text();
        console.error('Failed to create workflow state:', stateResponse.status, errorText);
        throw new Error(`Failed to create workflow state: ${stateResponse.status}`);
      }

      workflowState = await stateResponse.json();
      console.log(`✅ New workflow state created: ${workflowState.id}`);
    }

    // Fetch full state with action states
    const fullStateResponse = await fetch(
      `${WORKFLOWS_API}/states/workflow/${workflowState.id}`
    );

    if (!fullStateResponse.ok) {
      throw new Error('Failed to fetch full workflow state');
    }

    const fullState = await fullStateResponse.json();
    console.log(`📦 Full state received with ${fullState.baseActionState?.children?.length || 0} action states`);

    // Transform structure: baseActionState.children → actionStates
    if (
      !fullState.baseActionState ||
      !fullState.baseActionState.children ||
      !Array.isArray(fullState.baseActionState.children)
    ) {
      console.error('Invalid workflow state structure:', JSON.stringify(fullState, null, 2));
      throw new Error('Invalid workflow state structure - baseActionState.children missing or not an array');
    }

    // Check if children array is empty
    if (fullState.baseActionState.children.length === 0) {
      console.warn('Workflow state has no action states (empty children array)');
      throw new Error('Workflow has no action states');
    }

    // Flatten the structure
    fullState.actionStates = fullState.baseActionState.children;
    
    // Log each action state for debugging
    console.log('📋 Action States Retrieved:');
    fullState.actionStates.forEach((as, idx) => {
      console.log(`   ${idx + 1}. ID: ${as.id}, ActionID: ${as.actionId}, State: ${as.stateType}`);
    });

    return fullState;
  } catch (error) {
    console.error('Error in getOrCreateWorkflowState:', error);
    throw error;
  }
}

/**
 * POST /api/workflows/course/:courseId/onboarding
 * Create or update onboarding workflow for a course
 * Body: { actions: [{ title, description }] }
 */
router.post('/course/:courseId/onboarding', async (req, res) => {
  try {
    const { courseId: courseIdString } = req.params;
    const courseId = parseInt(courseIdString);
    const { actions } = req.body;
    const prisma = req.prisma;

    console.log(`Creating onboarding workflow for course: ${courseId}`);

    // Validate actions
    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one action is required'
      });
    }

    const validActions = actions.filter(a => a.title && a.title.trim() !== '');
    if (validActions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one action with a title is required'
      });
    }

    // Get course from database
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Step 1: Create workflow
    console.log('Creating workflow at:', `${WORKFLOWS_API}/workflows`);
    console.log('Request body:', JSON.stringify({
      userId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      tags: ['onboarding', course.id, course.semester],
      metadata: {
        courseId: course.id,
        courseName: course.name,
        semester: course.semester,
        type: 'student-onboarding'
      }
    }, null, 2));

    const workflowResponse = await fetch(`${WORKFLOWS_API}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '3fa85f64-5717-4562-b3fc-2c963f66afa6', // TODO: Replace with actual professor ID from auth
        tags: ['onboarding', course.id, course.semester],
        metadata: {
          courseId: course.id,
          courseName: course.name,
          semester: course.semester,
          type: 'student-onboarding'
        }
      })
    });

    console.log('Workflow API response status:', workflowResponse.status);

    if (!workflowResponse.ok) {
      const errorText = await workflowResponse.text();
      console.error('Workflows API error creating workflow:', workflowResponse.status, errorText);
      throw new Error(`Failed to create workflow: ${workflowResponse.status} - ${errorText}`);
    }

    const workflow = await workflowResponse.json();
    console.log('Workflow created:', workflow.id);

    // Step 2: Create actions and link them
    const createdActions = [];
    let previousActionId = null;

    for (let i = 0; i < validActions.length; i++) {
      const action = validActions[i];

      // Create the action
      const actionResponse = await fetch(`${WORKFLOWS_API}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '3fa85f64-5717-4562-b3fc-2c963f66afa6', // TODO: Replace with actual professor ID from auth
          name: action.title,
          description: action.description || '',
          actionType: 'simple',
          metadata: {
            order: i + 1,
            courseId: course.id,
            linkType: action.linkType || 'none',
            linkUrl: action.linkUrl || ''
          }
        })
      });

      if (!actionResponse.ok) {
        throw new Error(`Failed to create action: ${action.title}`);
      }

      const createdAction = await actionResponse.json();
      console.log(`Action created: ${createdAction.id}`);
      createdActions.push(createdAction);

      // Link to previous action if exists
      if (previousActionId) {
        await fetch(`${WORKFLOWS_API}/actions/${previousActionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nextActionId: createdAction.id
          })
        });
        console.log(`Linked ${previousActionId} → ${createdAction.id}`);
      }

      previousActionId = createdAction.id;
    }

    // Step 3: Set root action
    if (createdActions.length > 0) {
      await fetch(`${WORKFLOWS_API}/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rootActionId: createdActions[0].id
        })
      });
      console.log(`Set root action: ${createdActions[0].id}`);
    }

    // Step 4: Update course with workflowId
    await prisma.course.update({
      where: { id: courseId },
      data: { workflowId: workflow.id }
    });

    console.log(`Updated course ${courseId} with workflowId: ${workflow.id}`);

    res.json({
      success: true,
      data: {
        workflowId: workflow.id,
        actionsCreated: createdActions.length
      }
    });

  } catch (error) {
    console.error('Error creating onboarding workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create onboarding workflow',
      details: error.message
    });
  }
});

/**
 * GET /api/workflows/course/:courseId/actions
 * Get all actions for a course's onboarding workflow
 */
router.get('/course/:courseId/actions', async (req, res) => {
  try {
    const { courseId: courseIdString } = req.params;
    const courseId = parseInt(courseIdString);
    const prisma = req.prisma;

    console.log(`Getting workflow actions for course: ${courseId}`);

    // Get course with workflowId
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    if (!course.workflowId) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get workflow actions from Workflows API
    const actionsResponse = await fetch(
      `${WORKFLOWS_API}/actions?workflowId=${course.workflowId}`
    );

    if (!actionsResponse.ok) {
      throw new Error('Failed to fetch workflow actions');
    }

    const actions = await actionsResponse.json();

    // Transform to simpler format for frontend
    const transformedActions = actions.map((action, index) => ({
      id: action.id,
      title: action.name,
      description: action.description || '',
      linkType: action.metadata?.linkType || 'none',
      linkUrl: action.metadata?.linkUrl || '',
      order: index + 1
    }));

    res.json({
      success: true,
      data: transformedActions
    });

  } catch (error) {
    console.error('Error getting workflow actions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow actions',
      details: error.message
    });
  }
});

/**
 * DELETE /api/workflows/:workflowId
 * Delete a workflow
 */
router.delete('/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;

    console.log(`Deleting workflow: ${workflowId}`);

    // Delete via Workflows API
    const response = await fetch(`${WORKFLOWS_API}/workflows/${workflowId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete workflow');
    }

    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete workflow',
      details: error.message
    });
  }
});

module.exports = router;