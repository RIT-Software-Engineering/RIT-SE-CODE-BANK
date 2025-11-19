/**
 * Workflow Sync Utility
 * 
 * This utility synchronizes hiring workflows with job applications in the database.
 * It creates workflows for applications that have progressed beyond the initial APPLIED status
 * but don't yet have an associated workflow.
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const WORKFLOW_SERVICE_URL = process.env.WORKFLOWS_URL || 'http://localhost:3001';

/**
 * Updates workflow progress when an application status changes
 * @param {number} applicationId - The ID of the application that changed status
 * @param {string} newStatus - The new status of the application
 */
// Cache workflow IDs by application ID to avoid repeated lookups
const workflowCache = new Map();

async function updateWorkflowProgress(applicationId, newStatus) {
    console.log(`[updateWorkflowProgress] Called with applicationId=${applicationId}, newStatus=${newStatus}`);
    try {
        // Check if workflow service is available
        try {
            await axios.get(`${WORKFLOW_SERVICE_URL}/workflows`, { timeout: 3000 });
        } catch (error) {
            console.log('[updateWorkflowProgress] Workflow service not available');
            return; // Workflow service not available, skip update
        }

        // Try to get workflow ID from cache first
        let workflowId = workflowCache.get(applicationId.toString());
        let workflow = null;

        if (workflowId) {
            console.log(`[updateWorkflowProgress] Using cached workflow ID: ${workflowId}`);
            // Fetch the specific workflow
            try {
                const workflowResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/workflows/${workflowId}`, { timeout: 10000 });
                workflow = workflowResponse.data;
            } catch (error) {
                console.log('[updateWorkflowProgress] Cached workflow not found, will search all workflows');
                workflowCache.delete(applicationId.toString());
            }
        }

        // If not in cache or cached workflow not found, search all workflows
        if (!workflow) {
            const allWorkflowsResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/workflows`, { timeout: 10000 });
            const allWorkflows = allWorkflowsResponse.data || [];
            
            console.log(`[updateWorkflowProgress] Searching for workflow with applicationId=${applicationId}`);
            console.log(`[updateWorkflowProgress] Total workflows found: ${allWorkflows.length}`);
            
            workflow = allWorkflows.find(w => {
                const baseActionAppId = w.baseAction?.metadata?.applicationId;
                const workflowAppId = w.metadata?.applicationId;
                return baseActionAppId === applicationId.toString() || workflowAppId === applicationId.toString();
            });

            if (workflow) {
                // Cache the workflow ID for future lookups
                workflowCache.set(applicationId.toString(), workflow.id);
                console.log(`[updateWorkflowProgress] Found and cached workflow: ${workflow.id}`);
            }
        }

        if (!workflow) {
            console.log('[updateWorkflowProgress] No workflow found for application');
            return;
        }

        // Get application details
        const app = await prisma.jobPositionApplicationHistory.findUnique({
            where: { id: applicationId },
            include: {
                candidate: { include: { user: true } },
                jobPosition: { 
                    include: { 
                        course: true,
                        employer: { include: { user: true } }
                    }
                }
            }
        });

        if (!app) return;

        // Determine which action should be marked complete based on status
        let actionToComplete = null;
        let userToComplete = null;

        switch (newStatus) {
            case 'APPLIED':
                // Step 1: Application submitted - complete "Applied" action (candidate completes)
                actionToComplete = 'Applied';
                userToComplete = app.candidate.user.username;
                break;
            case 'INTERVIEW':
                // Step 2: Interviewing candidate - complete "Interview" action (professor completes)
                actionToComplete = 'Interview';
                userToComplete = app.jobPosition.employer.user.username;
                break;
            case 'PENDING_OFFER':
                // Step 3: Position offered - complete "Offer" action (professor completes)
                actionToComplete = 'Offer';
                userToComplete = app.jobPosition.employer.user.username;
                break;
            case 'ACCEPTED_OFFER':
                // Step 4: Candidate accepted offer - complete "Accepted" action (candidate completes)
                actionToComplete = 'Accepted';
                userToComplete = app.candidate.user.username;
                break;
            case 'HIRED':
                // Step 5: Admin hires candidate - complete "Hired" action (admin completes)
                actionToComplete = 'Hired';
                // Need to find an admin user
                const adminUsers = await prisma.user.findMany({
                    where: { role: 'ADMIN' },
                    select: { uid: true, username: true },
                    take: 1
                });
                if (adminUsers.length > 0) {
                    userToComplete = adminUsers[0].username;
                } else {
                    console.log('[updateWorkflowProgress] No admin user found for Hired action');
                    return;
                }
                break;
            case 'REJECTED':
                // Complete the entire workflow for rejection
                console.log(`[updateWorkflowProgress] Calling completeEntireWorkflow for terminal state: ${newStatus}`);
                await completeEntireWorkflow(workflow.id, app);
                return;
        }

        if (!actionToComplete || !userToComplete) {
            console.log('[updateWorkflowProgress] No action to complete or no user to complete');
            return;
        }
        console.log(`[updateWorkflowProgress] Action to complete: "${actionToComplete}", User: ${userToComplete}`);

        // Get the user ID
        const user = await prisma.user.findUnique({
            where: { username: userToComplete },
            select: { uid: true }
        });

        if (!user || !user.uid) return;

        // Get the user's workflow state
        const workflowStateResponse = await axios.get(
            `${WORKFLOW_SERVICE_URL}/states/workflow?userId=${user.uid}&workflowId=${workflow.id}`,
            { timeout: 10000 }
        );

        if (!workflowStateResponse.data || workflowStateResponse.data.length === 0) return;

        const workflowState = workflowStateResponse.data[0];
        if (!workflowState || !workflowState.actionStates) return;

        // Get all actions for this workflow
        const actionsResponse = await axios.get(
            `${WORKFLOW_SERVICE_URL}/actions`,
            { params: { workflowId: workflow.id }, timeout: 10000 }
        );

        const actions = actionsResponse.data || [];
        console.log(`[updateWorkflowProgress] Available actions:`, actions.map(a => a.name));
        const targetAction = actions.find(action => action.name === actionToComplete);
        if (!targetAction) {
            console.log(`[updateWorkflowProgress] Target action "${actionToComplete}" not found in workflow actions`);
            return;
        }
        console.log(`[updateWorkflowProgress] Found target action: ${targetAction.id}`);

        // Find the corresponding action state
        const targetActionState = workflowState.actionStates.find(
            as => as.actionId === targetAction.id
        );
        if (!targetActionState) {
            console.log(`[updateWorkflowProgress] Action state not found for action ${targetAction.id}`);
            return;
        }
        console.log(`[updateWorkflowProgress] Found action state: ${targetActionState.id}, current status: ${targetActionState.stateType}`);

        // Check if previous actions need to be completed (when steps are skipped)
        const currentActionIndex = actions.findIndex(a => a.id === targetAction.id);
        console.log(`[updateWorkflowProgress] Current action index: ${currentActionIndex}`);
        
        // Complete all previous actions that haven't been completed yet
        for (let i = 0; i < currentActionIndex; i++) {
            const previousAction = actions[i];
            const previousActionState = workflowState.actionStates.find(as => as.actionId === previousAction.id);
            
            if (previousActionState && previousActionState.stateType !== 'completed') {
                console.log(`[updateWorkflowProgress] Previous action "${previousAction.name}" not completed, completing it now`);
                
                // Start if not started
                if (previousActionState.stateType === 'notStarted') {
                    await axios.post(
                        `${WORKFLOW_SERVICE_URL}/states/handleStart`,
                        { actionStateId: previousActionState.id },
                        { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
                    );
                }
                
                // Complete it
                await axios.post(
                    `${WORKFLOW_SERVICE_URL}/states/handleSubmit`,
                    { actionStateId: previousActionState.id },
                    { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
                );
                console.log(`[updateWorkflowProgress] Completed skipped action "${previousAction.name}"`);
            }
        }

        // If action is not started yet, start it first
        if (targetActionState.stateType === 'notStarted') {
            console.log(`[updateWorkflowProgress] Action not started yet, starting it first`);
            await axios.post(
                `${WORKFLOW_SERVICE_URL}/states/handleStart`,
                { actionStateId: targetActionState.id },
                { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Mark the action as completed
        console.log(`[updateWorkflowProgress] Calling handleSubmit for action state ${targetActionState.id}`);
        await axios.post(
            `${WORKFLOW_SERVICE_URL}/states/handleSubmit`,
            { actionStateId: targetActionState.id },
            { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
        );
        console.log(`[updateWorkflowProgress] Successfully completed action "${actionToComplete}"`);

        // Auto-start the next action in sequence
        const nextActionIndex = currentActionIndex + 1;
        if (nextActionIndex < actions.length) {
            const nextAction = actions[nextActionIndex];
            const nextActionState = workflowState.actionStates.find(as => as.actionId === nextAction.id);
            
            if (nextActionState && nextActionState.stateType === 'notStarted') {
                console.log(`[updateWorkflowProgress] Auto-starting next action: "${nextAction.name}"`);
                try {
                    await axios.post(
                        `${WORKFLOW_SERVICE_URL}/states/handleStart`,
                        { actionStateId: nextActionState.id },
                        { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
                    );
                    console.log(`[updateWorkflowProgress] Successfully started next action "${nextAction.name}"`);
                } catch (startError) {
                    console.log(`[updateWorkflowProgress] Failed to start next action: ${startError.message}`);
                }
            }
        }



        // Update workflow metadata
        try {
            let existingMetadata = {};
            
            try {
                const allWorkflowsResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/workflows`, { timeout: 10000 });
                const freshWorkflows = allWorkflowsResponse.data || [];
                const freshWorkflow = freshWorkflows.find(w => w.id === workflow.id);
                if (freshWorkflow && freshWorkflow.metadata) {
                    existingMetadata = freshWorkflow.metadata;
                }
            } catch (listError) {
                try {
                    const currentWorkflowResponse = await axios.get(
                        `${WORKFLOW_SERVICE_URL}/workflows/${workflow.id}`,
                        { timeout: 10000 }
                    );
                    existingMetadata = currentWorkflowResponse.data?.metadata || 
                                     currentWorkflowResponse.data?.baseAction?.metadata || 
                                     {};
                } catch (fetchError) {
                    existingMetadata = workflow.metadata || {};
                }
            }
            
            // Get updated workflow state
            const allUsersStateResponse = await axios.get(
                `${WORKFLOW_SERVICE_URL}/states/workflow`,
                { params: { workflowId: workflow.id }, timeout: 10000 }
            );

            if (allUsersStateResponse.data && allUsersStateResponse.data.length > 0) {
                const allStates = allUsersStateResponse.data;
                const allActions = actions;
                
                let totalCompleted = 0;
                let inProgressActionIndex = null;
                let currentWorkflowStatus = newStatus;

                // Count completed actions
                for (let i = 0; i < allActions.length; i++) {
                    const action = allActions[i];
                    const isCompleted = allStates.some(state => 
                        state.actionStates && 
                        state.actionStates.some(as => 
                            as.actionId === action.id && as.stateType === 'completed'
                        )
                    );
                    
                    if (isCompleted) {
                        totalCompleted++;
                    } else if (inProgressActionIndex === null) {
                        inProgressActionIndex = i + 1;
                    }
                }

                if (totalCompleted === allActions.length) {
                    inProgressActionIndex = null;
                }

                // Update metadata
                const updatedMetadata = {
                    ...existingMetadata,
                    completedActions: totalCompleted,
                    currentStatus: currentWorkflowStatus,
                    inProgressActionIndex: inProgressActionIndex
                };

                await axios.put(
                    `${WORKFLOW_SERVICE_URL}/workflows/${workflow.id}`,
                    { metadata: updatedMetadata },
                    { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
                );
            }
        } catch (metadataError) {
            console.error('Could not update workflow metadata:', metadataError.message);
        }

    } catch (error) {
        console.error('Error updating workflow progress:', error.message);
    }
}

/**
 * Completes all remaining actions in a workflow when it reaches a terminal state
 * @param {string} workflowId - The ID of the workflow to complete
 * @param {object} app - The application object
 */
async function completeEntireWorkflow(workflowId, app) {
    try {
        // Get all actions for this workflow
        const actionsResponse = await axios.get(
            `${WORKFLOW_SERVICE_URL}/actions`,
            { params: { workflowId }, timeout: 10000 }
        );

        const actions = actionsResponse.data || [];

        // Get all workflow states for all users
        const allUsersStateResponse = await axios.get(
            `${WORKFLOW_SERVICE_URL}/states/workflow`,
            { params: { workflowId }, timeout: 10000 }
        );

        if (!allUsersStateResponse.data || allUsersStateResponse.data.length === 0) return;

        const allStates = allUsersStateResponse.data;

        // Complete all incomplete action states
        for (const state of allStates) {
            if (!state.actionStates) continue;

            for (const actionState of state.actionStates) {
                // Only complete if not already completed
                if (actionState.stateType !== 'completed') {
                    await axios.post(
                        `${WORKFLOW_SERVICE_URL}/states/handleSubmit`,
                        { actionStateId: actionState.id },
                        { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
                    );
                }
            }
        }
    } catch (error) {
        console.error('Error completing entire workflow:', error.message);
    }
}

/**
 * Synchronizes workflows with job applications
 */
async function syncWorkflowsWithApplications() {
    try {
        // Check if workflow service is available with retries
        const maxRetries = 5;
        let retryCount = 0;
        let serviceAvailable = false;
        
        while (retryCount < maxRetries && !serviceAvailable) {
            try {
                await axios.get(`${WORKFLOW_SERVICE_URL}/workflows`, { timeout: 3000, validateStatus: () => true });
                serviceAvailable = true;
            } catch (error) {
                retryCount++;
                if (retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    console.log('Workflow service not available after retries. Skipping sync.');
                    return;
                }
            }
        }

        // Get all workflows
        let allWorkflows = [];
        try {
            const response = await axios.get(`${WORKFLOW_SERVICE_URL}/workflows`, { timeout: 10000 });
            allWorkflows = response.data || [];
            
            // Clean up existing hiring workflows
            const hiringWorkflows = allWorkflows.filter(w => w.baseAction?.metadata?.workflowType === 'hiring_process');
            for (const workflow of hiringWorkflows) {
                try {
                    await axios.delete(`${WORKFLOW_SERVICE_URL}/workflows/${workflow.id}`, { timeout: 5000 });
                } catch (error) {
                    // Ignore deletion errors
                }
            }
            
            // Refresh list
            const freshResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/workflows`, { timeout: 10000 });
            allWorkflows = freshResponse.data || [];
        } catch (error) {
            console.warn('Could not fetch existing workflows:', error.message);
        }

        // Get applications that need workflows
        const applications = await prisma.jobPositionApplicationHistory.findMany({
            where: {
                jobApplicationStatus: {
                    in: ['APPLIED', 'INTERVIEW', 'ACCEPTED_OFFER', 'ONHOLD', 'REJECTED']
                }
            },
            include: {
                candidate: { include: { user: true } },
                jobPosition: {
                    include: {
                        course: true,
                        employer: { include: { user: true } }
                    }
                }
            }
        });

        if (applications.length === 0) return;

        let createdCount = 0;
        let skippedCount = 0;

        for (const app of applications) {
            try {
                // Check if workflow exists
                const existingWorkflow = allWorkflows.find(w => 
                    w.baseAction?.metadata?.applicationId === app.id.toString()
                );

                if (existingWorkflow) {
                    try {
                        const actionsResponse = await axios.get(
                            `${WORKFLOW_SERVICE_URL}/actions`,
                            { params: { workflowId: existingWorkflow.id }, timeout: 5000 }
                        );
                        
                        if (actionsResponse.data && actionsResponse.data.length > 0) {
                            skippedCount++;
                            continue;
                        } else {
                            await axios.delete(
                                `${WORKFLOW_SERVICE_URL}/workflows/${existingWorkflow.id}`,
                                { timeout: 5000 }
                            );
                        }
                    } catch (error) {
                        skippedCount++;
                        continue;
                    }
                }

                // Get user data
                const candidateUser = app.candidate?.user;
                const employerUser = app.jobPosition?.employer?.user;
                
                if (!candidateUser || !employerUser || !candidateUser.uid || !employerUser.uid) {
                    skippedCount++;
                    continue;
                }

                // Find admin user
                const adminUser = await prisma.user.findFirst({
                    where: { role: 'ADMIN' }
                });

                if (!adminUser || !adminUser.uid) {
                    console.warn('No admin user found');
                    break;
                }

                // Determine action statuses
                const statusMap = {
                    'APPLIED': { completed: 1, inProgress: 2 },
                    'INTERVIEW': { completed: 1, inProgress: 2 },
                    'ACCEPTED_OFFER': { completed: 4, inProgress: 5 },
                    'ONHOLD': { completed: 1, inProgress: null }
                };

                const statusInfo = statusMap[app.jobApplicationStatus] || { completed: 0, inProgress: null };

                // Create workflow actions
                const actions = [
                    {
                        name: 'Applied',
                        description: 'Candidate has submitted their job application',
                        assignedTo: candidateUser.uid.toString()
                    },
                    {
                        name: 'Interview',
                        description: 'Conduct technical and behavioral interviews with candidate',
                        assignedTo: employerUser.uid.toString()
                    },
                    {
                        name: 'Offer',
                        description: 'Extend job offer to successful candidate',
                        assignedTo: employerUser.uid.toString()
                    },
                    {
                        name: 'Accepted',
                        description: 'Candidate has accepted the job offer',
                        assignedTo: candidateUser.uid.toString()
                    },
                    {
                        name: 'Hired',
                        description: 'Complete onboarding process and official hiring',
                        assignedTo: adminUser.uid.toString()
                    }
                ];

                // Create workflow
                const workflowData = {
                    userId: adminUser.uid.toString(),
                    name: `Hiring Process - ${app.jobPosition.course.name} - ${app.jobPosition.course.courseCode}`,
                    description: `Complete hiring workflow for ${app.jobPosition.course.name} - ${app.jobPosition.course.courseCode} position (Application #${app.id})`,
                    metadata: {
                        workflowType: 'hiring_process',
                        employerUserId: employerUser.uid.toString(),
                        candidateUserId: candidateUser.uid.toString(),
                        adminUserId: adminUser.uid.toString(),
                        candidateUsername: candidateUser.username,
                        employerUsername: employerUser.username,
                        candidateName: `${candidateUser.fname} ${candidateUser.lname}`,
                        employerName: `${employerUser.fname} ${employerUser.lname}`,
                        jobTitle: `${app.jobPosition.course.name} - ${app.jobPosition.course.courseCode}`,
                        applicationId: app.id.toString(),
                        currentStatus: app.jobApplicationStatus,
                        deadline: app.jobPosition.startDate
                    }
                };

                const workflowResponse = await axios.post(
                    `${WORKFLOW_SERVICE_URL}/workflows`,
                    workflowData,
                    { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
                );

                const createdWorkflow = workflowResponse.data;

                // Create actions
                let previousActionId = null;
                const createdActionIds = [];
                
                for (let i = 0; i < actions.length; i++) {
                    const actionData = {
                        userId: adminUser.uid.toString(),
                        name: actions[i].name,
                        description: actions[i].description,
                        actionType: 'simple',
                        metadata: {
                            deadline: app.jobPosition.startDate,
                            workflowType: 'hiring_process',
                            applicationId: app.id.toString(),
                            assignedUserId: actions[i].assignedTo
                        }
                    };

                    if (i === 0) {
                        actionData.rootActionOfId = createdWorkflow.id;
                    }

                    const actionResponse = await axios.post(
                        `${WORKFLOW_SERVICE_URL}/actions`,
                        actionData,
                        { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
                    );

                    const createdActionId = actionResponse.data.id;
                    createdActionIds.push(createdActionId);
                    
                    if (previousActionId) {
                        await axios.put(
                            `${WORKFLOW_SERVICE_URL}/actions/${previousActionId}`,
                            { nextActionId: createdActionId },
                            { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
                        );
                    }
                    
                    previousActionId = createdActionId;
                }

                // Create workflow states for users
                const usersToCreateStatesFor = [
                    { uid: adminUser.uid.toString(), role: 'admin', username: adminUser.username },
                    { uid: employerUser.uid.toString(), role: 'employer', username: employerUser.username },
                    { uid: candidateUser.uid.toString(), role: 'candidate', username: candidateUser.username }
                ];

                for (const user of usersToCreateStatesFor) {
                    try {
                        await axios.post(
                            `${WORKFLOW_SERVICE_URL}/states/workflow`,
                            { userId: user.uid, workflowId: createdWorkflow.id },
                            { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
                        );
                    } catch (error) {
                        // Ignore state creation errors
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 1000));

                // Mark completed actions
                if (statusInfo.completed > 0) {
                    for (let i = 0; i < Math.min(statusInfo.completed, createdActionIds.length); i++) {
                        const actionId = createdActionIds[i];
                        const assignedUserId = actions[i].assignedTo;
                        const assignedUser = usersToCreateStatesFor.find(u => u.uid === assignedUserId);
                        
                        if (assignedUser) {
                            try {
                                let workflowStateResponse = null;
                                let retryCount = 0;
                                const maxRetries = 3;
                                
                                while (retryCount < maxRetries && !workflowStateResponse) {
                                    try {
                                        workflowStateResponse = await axios.get(
                                            `${WORKFLOW_SERVICE_URL}/states/workflow?userId=${assignedUser.uid}&workflowId=${createdWorkflow.id}`,
                                            { timeout: 10000 }
                                        );
                                    } catch (error) {
                                        retryCount++;
                                        if (retryCount < maxRetries) {
                                            await new Promise(resolve => setTimeout(resolve, 500));
                                        }
                                    }
                                }
                                
                                if (workflowStateResponse && workflowStateResponse.data && workflowStateResponse.data.length > 0) {
                                    const userWorkflowState = workflowStateResponse.data[0];
                                    
                                    if (userWorkflowState.actionStates) {
                                        const actionState = userWorkflowState.actionStates.find(
                                            as => as.actionId === actionId
                                        );
                                        
                                        if (actionState) {
                                            await axios.post(
                                                `${WORKFLOW_SERVICE_URL}/states/handleSubmit`,
                                                { actionStateId: actionState.id },
                                                { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
                                            );
                                        }
                                    }
                                }
                            } catch (error) {
                                // Ignore completion errors
                            }
                        }
                    }
                }

                // Mark in-progress action
                if (statusInfo.inProgress && statusInfo.inProgress <= createdActionIds.length) {
                    const actionIndex = statusInfo.inProgress - 1;
                    const actionId = createdActionIds[actionIndex];
                    const assignedUserId = actions[actionIndex].assignedTo;
                    const assignedUser = usersToCreateStatesFor.find(u => u.uid === assignedUserId);
                    
                    if (assignedUser) {
                        try {
                            let workflowStateResponse = null;
                            let retryCount = 0;
                            const maxRetries = 3;
                            
                            while (retryCount < maxRetries && !workflowStateResponse) {
                                try {
                                    workflowStateResponse = await axios.get(
                                        `${WORKFLOW_SERVICE_URL}/states/workflow?userId=${assignedUser.uid}&workflowId=${createdWorkflow.id}`,
                                        { timeout: 10000 }
                                    );
                                } catch (error) {
                                    retryCount++;
                                    if (retryCount < maxRetries) {
                                        await new Promise(resolve => setTimeout(resolve, 500));
                                    }
                                }
                            }
                            
                            if (workflowStateResponse && workflowStateResponse.data && workflowStateResponse.data.length > 0) {
                                const userWorkflowState = workflowStateResponse.data[0];
                                
                                if (userWorkflowState.actionStates) {
                                    const actionState = userWorkflowState.actionStates.find(
                                        as => as.actionId === actionId
                                    );
                                    
                                    if (actionState) {
                                        await axios.post(
                                            `${WORKFLOW_SERVICE_URL}/states/handleStart`,
                                            { actionStateId: actionState.id },
                                            { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
                                        );
                                    }
                                }
                            }
                        } catch (error) {
                            // Ignore start errors
                        }
                    }
                }
                
                // Update progress metadata
                try {
                    await axios.put(
                        `${WORKFLOW_SERVICE_URL}/workflows/${createdWorkflow.id}`,
                        {
                            metadata: {
                                ...workflowData.metadata,
                                completedActions: statusInfo.completed,
                                totalActions: actions.length,
                                currentStatus: app.jobApplicationStatus,
                                inProgressActionIndex: statusInfo.inProgress || null,
                                deadline: app.jobPosition.startDate
                            }
                        },
                        { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
                    );
                } catch (error) {
                    // Ignore metadata update errors
                }

                createdCount++;

            } catch (error) {
                console.error(`Failed to create workflow for application ${app.id}:`, error.message);
                skippedCount++;
            }
        }

    } catch (error) {
        console.error('Workflow sync error:', error.message);
    }
}

/**
 * Creates a timecard approval workflow
 * @param {number} timecardWeeklyHistoryId - The ID of the submitted timecard
 */
async function createTimecardApprovalWorkflow(timecardWeeklyHistoryId) {
    try {
        // Check if workflow service is available
        try {
            await axios.get(`${WORKFLOW_SERVICE_URL}/workflows`, { timeout: 3000 });
        } catch (error) {
            return null;
        }

        // Get timecard details
        const timecard = await prisma.timecardWeeklyHistory.findUnique({
            where: { id: timecardWeeklyHistoryId },
            include: {
                jobPositionHistory: {
                    include: {
                        employee: { 
                            include: { 
                                candidate: { 
                                    include: { user: true } 
                                } 
                            } 
                        },
                        jobPosition: { 
                            include: { 
                                course: true,
                                employer: { include: { user: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!timecard) return null;

        const employee = timecard.jobPositionHistory.employee.candidate.user;
        const employer = timecard.jobPositionHistory.jobPosition.employer.user;
        const course = timecard.jobPositionHistory.jobPosition.course;
        const weekStart = new Date(timecard.weekStartDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        };

        // Check if workflow exists
        const allWorkflowsResponse = await axios.get(`${WORKFLOW_SERVICE_URL}/workflows`, { timeout: 10000 });
        const allWorkflows = allWorkflowsResponse.data || [];
        
        const existingWorkflow = allWorkflows.find(w => 
            w.baseAction?.metadata?.timecardWeeklyHistoryId === timecardWeeklyHistoryId.toString() ||
            w.metadata?.timecardWeeklyHistoryId === timecardWeeklyHistoryId.toString()
        );

        if (existingWorkflow) {
            return existingWorkflow;
        }

        // Create workflow
        const workflowName = `Timecard Approval - ${employee.fname} ${employee.lname} - Week of ${formatDate(weekStart)}`;
        
        const actions = [
            {
                name: 'Submitted for Review',
                description: `${employee.fname} ${employee.lname} submitted timecard for week ${formatDate(weekStart)} - ${formatDate(weekEnd)}`,
                assignedTo: employee.uid.toString()
            },
            {
                name: 'Review',
                description: `Review and approve timecard for ${employee.fname} ${employee.lname}`,
                assignedTo: employer.uid.toString()
            }
        ];

        const workflowData = {
            userId: employer.uid.toString(),
            name: workflowName,
            description: `Timecard approval workflow for ${employee.fname} ${employee.lname} (${course.courseCode}) - Week ${formatDate(weekStart)} to ${formatDate(weekEnd)}`,
            metadata: {
                workflowType: 'timecard_approval',
                timecardWeeklyHistoryId: timecardWeeklyHistoryId.toString(),
                employeeId: employee.username,
                employeeUserId: employee.uid.toString(),
                employerId: employer.username,
                employerUserId: employer.uid.toString(),
                employeeName: `${employee.fname} ${employee.lname}`,
                employerName: `${employer.fname} ${employer.lname}`,
                courseCode: course.courseCode,
                weekStartDate: timecard.weekStartDate.toISOString(),
                deadline: weekEnd.toISOString()
            }
        };

        const workflowResponse = await axios.post(
            `${WORKFLOW_SERVICE_URL}/workflows`,
            workflowData,
            { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
        );

        const createdWorkflow = workflowResponse.data;

        // Create actions
        const createdActionIds = [];
        
        for (let i = 0; i < actions.length; i++) {
            const actionData = {
                userId: employer.uid.toString(),
                name: actions[i].name,
                description: actions[i].description,
                actionType: 'simple',
                metadata: {
                    deadline: weekEnd.toISOString(),
                    workflowType: 'timecard_approval',
                    timecardWeeklyHistoryId: timecardWeeklyHistoryId.toString(),
                    assignedUserId: actions[i].assignedTo
                }
            };

            if (i === 0) {
                actionData.rootActionOfId = createdWorkflow.id;
            } else {
                actionData.previousActionId = createdActionIds[i - 1];
            }

            const actionResponse = await axios.post(
                `${WORKFLOW_SERVICE_URL}/actions`,
                actionData,
                { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
            );

            createdActionIds.push(actionResponse.data.id);
        }

        // Create workflow states
        const usersToCreateStatesFor = [
            { uid: employee.uid.toString(), role: 'employee', username: employee.username },
            { uid: employer.uid.toString(), role: 'employer', username: employer.username }
        ];

        for (const user of usersToCreateStatesFor) {
            try {
                await axios.post(
                    `${WORKFLOW_SERVICE_URL}/states/workflow`,
                    { userId: user.uid, workflowId: createdWorkflow.id },
                    { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
                );
            } catch (error) {
                // Ignore state creation errors
            }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mark first action as completed
        try {
            const actionId = createdActionIds[0];
            const assignedUser = usersToCreateStatesFor.find(u => u.uid === employee.uid.toString());

            if (assignedUser) {
                const workflowStateResponse = await axios.get(
                    `${WORKFLOW_SERVICE_URL}/states/workflow?userId=${assignedUser.uid}&workflowId=${createdWorkflow.id}`,
                    { timeout: 10000 }
                );

                if (workflowStateResponse.data && workflowStateResponse.data.length > 0) {
                    const workflowState = workflowStateResponse.data[0];
                    
                    if (workflowState.actionStates) {
                        const actionState = workflowState.actionStates.find(
                            as => as.actionId === actionId
                        );
                        
                        if (actionState) {
                            await axios.post(
                                `${WORKFLOW_SERVICE_URL}/states/handleCompletion`,
                                { actionStateId: actionState.id },
                                { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
                            );
                        }
                    }
                }
            }
        } catch (error) {
            // Ignore completion errors
        }

        return createdWorkflow;

    } catch (error) {
        console.error('Timecard workflow creation error:', error.message);
        if (error.response) {
            console.error(`Response status: ${error.response.status}`);
        }
        return null;
    }
}

module.exports = { syncWorkflowsWithApplications, updateWorkflowProgress, createTimecardApprovalWorkflow };
