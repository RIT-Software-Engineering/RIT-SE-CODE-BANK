// Workflows API Service
// Handles all communication with the Workflows API

const WORKFLOWS_API_BASE = "http://localhost:5001";

// TODO: Replace with actual user ID from authentication
const TEMP_USER_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

/**
 * Create a new workflow for a course's onboarding
 */
export const createOnboardingWorkflow = async (course, actions) => {
  try {
    // Step 1: Create the workflow
    const workflowResponse = await fetch(`${WORKFLOWS_API_BASE}/workflows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: TEMP_USER_ID,
        name: `${course.name} - Student Onboarding`,
        description: `Onboarding checklist for ${course.name} (${course.semester})`,
        tags: ["onboarding", course.id, course.semester],
        metadata: {
          courseId: course.id,
          courseName: course.name,
          type: "student-onboarding",
        },
      }),
    });

    if (!workflowResponse.ok) {
      throw new Error("Failed to create workflow");
    }

    const workflow = await workflowResponse.json();
    console.log("Workflow created:", workflow);

    // Step 2: Create actions and link them
    const createdActions = [];
    let previousActionId = null;

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];

      // Create the action
      const actionResponse = await fetch(`${WORKFLOWS_API_BASE}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: TEMP_USER_ID,
          name: action.title,
          description: action.description || "",
          metadata: {
            order: i + 1,
            courseId: course.id,
          },
        }),
      });

      if (!actionResponse.ok) {
        throw new Error(`Failed to create action: ${action.title}`);
      }

      const createdAction = await actionResponse.json();
      createdActions.push(createdAction);

      // Link to previous action (creating the chain)
      if (previousActionId) {
        await fetch(`${WORKFLOWS_API_BASE}/actions/${previousActionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nextActionId: createdAction.id,
          }),
        });
      }

      previousActionId = createdAction.id;
    }

    // Step 3: Set the first action as the root action of the workflow
    if (createdActions.length > 0) {
      await fetch(`${WORKFLOWS_API_BASE}/workflows/${workflow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rootActionId: createdActions[0].id,
        }),
      });
    }

    return {
      success: true,
      workflowId: workflow.id,
      workflow: workflow,
      actions: createdActions,
    };
  } catch (error) {
    console.error("Error creating onboarding workflow:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Update an existing workflow's actions
 */
export const updateOnboardingWorkflow = async (workflowId, course, actions) => {
  try {
    // For now, we'll delete old actions and create new ones
    // In a production app, you'd want to be smarter about this

    // Get existing workflow actions
    const existingActionsResponse = await fetch(
      `${WORKFLOWS_API_BASE}/actions?workflowId=${workflowId}`
    );
    const existingActions = await existingActionsResponse.json();

    // Delete old actions
    for (const action of existingActions) {
      await fetch(`${WORKFLOWS_API_BASE}/actions/${action.id}`, {
        method: "DELETE",
      });
    }

    // Create new actions (same logic as create)
    const createdActions = [];
    let previousActionId = null;

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];

      const actionResponse = await fetch(`${WORKFLOWS_API_BASE}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: TEMP_USER_ID,
          name: action.title,
          description: action.description || "",
          metadata: {
            order: i + 1,
            courseId: course.id,
          },
        }),
      });

      const createdAction = await actionResponse.json();
      createdActions.push(createdAction);

      if (previousActionId) {
        await fetch(`${WORKFLOWS_API_BASE}/actions/${previousActionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nextActionId: createdAction.id,
          }),
        });
      }

      previousActionId = createdAction.id;
    }

    // Update workflow root action
    if (createdActions.length > 0) {
      await fetch(`${WORKFLOWS_API_BASE}/workflows/${workflowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rootActionId: createdActions[0].id,
        }),
      });
    }

    return {
      success: true,
      workflowId: workflowId,
      actions: createdActions,
    };
  } catch (error) {
    console.error("Error updating onboarding workflow:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get workflow actions for a course
 */
export const getWorkflowActions = async (workflowId) => {
  try {
    const response = await fetch(
      `${WORKFLOWS_API_BASE}/actions?workflowId=${workflowId}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch workflow actions");
    }

    const actions = await response.json();

    // Convert to our format
    return actions.map((action, index) => ({
      id: action.id,
      title: action.name,
      description: action.description || "",
      order: index + 1,
    }));
  } catch (error) {
    console.error("Error fetching workflow actions:", error);
    return [];
  }
};

/**
 * Delete a workflow
 */
export const deleteWorkflow = async (workflowId) => {
  try {
    const response = await fetch(
      `${WORKFLOWS_API_BASE}/workflows/${workflowId}`,
      {
        method: "DELETE",
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Error deleting workflow:", error);
    return false;
  }
};
