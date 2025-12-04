/**
 * Workflow Notification Helper
 * 
 * Sends notifications when workflow actions are completed
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Ensure the notification service URL includes the API path
const baseUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4000';
const NOTIFICATION_SERVICE_URL = baseUrl.includes('/api/notifications') ? baseUrl : `${baseUrl}/api/notifications`;
const APP_ID = 'ta-portal';
const PORTAL_BASE_URL = process.env.PORTAL_BASE_URL || 'https://localhost:3300';

/**
 * Send notifications when a workflow action is completed
 * @param {string} actionName - Name of the completed action (e.g., "Applied", "Interview")
 * @param {Object} app - Application object with candidate and employer info
 * @param {string} workflowId - ID of the workflow
 */
async function notifyActionCompleted(actionName, app, workflowId) {
    try {
        console.log(`[workflow-notifications] Sending notifications for action "${actionName}"`);

        const candidateUser = app.candidate.user;
        const employerUser = app.jobPosition.employer.user;
        const jobTitle = `${app.jobPosition.course.name} - ${app.jobPosition.course.courseCode}`;

        // Get admin users
        const adminUsers = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { uid: true, username: true, fname: true, lname: true, email: true }
        });

        // Build context for notifications
        const baseContext = {
            appName: 'TA Portal',
            item: {
                id: app.id.toString(),
                title: jobTitle,
                applicationId: app.id.toString(),
                jobPositionId: app.jobPosition.id.toString()
            },
            status: {
                new: app.jobApplicationStatus,
                action: actionName
            }
        };

        // Determine who to notify based on the action
        const notifications = [];

        switch (actionName) {
            case 'Applied':
                // Notify employer and admin that candidate applied
                notifications.push({
                    userId: employerUser.username,
                    role: 'employer',
                    context: {
                        ...baseContext,
                        cta: {
                            url: `${PORTAL_BASE_URL}/Applications/Employer/${employerUser.username}?applicationId=${app.id}`
                        },
                        recipient: {
                            name: `${employerUser.fname} ${employerUser.lname}`,
                            email: employerUser.email
                        },
                        candidate: {
                            name: `${candidateUser.fname} ${candidateUser.lname}`,
                            email: candidateUser.email
                        }
                    }
                });
                adminUsers.forEach(admin => {
                    notifications.push({
                        userId: admin.username,
                        role: 'admin',
                        context: {
                            ...baseContext,
                            recipient: {
                                name: `${admin.fname} ${admin.lname}`,
                                email: admin.email
                            },
                            candidate: {
                                name: `${candidateUser.fname} ${candidateUser.lname}`,
                                email: candidateUser.email
                            }
                        }
                    });
                });
                break;

            case 'Interview':
                // Notify candidate and admin that interview was completed
                notifications.push({
                    userId: candidateUser.username,
                    role: 'candidate',
                    context: {
                        ...baseContext,
                        cta: {
                            url: `${PORTAL_BASE_URL}/Applications/Candidate/${candidateUser.username}?applicationId=${app.id}`
                        },
                        recipient: {
                            name: `${candidateUser.fname} ${candidateUser.lname}`,
                            email: candidateUser.email
                        },
                        employer: {
                            name: `${employerUser.fname} ${employerUser.lname}`,
                            email: employerUser.email
                        }
                    }
                });
                adminUsers.forEach(admin => {
                    notifications.push({
                        userId: admin.username,
                        role: 'admin',
                        context: {
                            ...baseContext,
                            recipient: {
                                name: `${admin.fname} ${admin.lname}`,
                                email: admin.email
                            },
                            candidate: {
                                name: `${candidateUser.fname} ${candidateUser.lname}`,
                                email: candidateUser.email
                            },
                            employer: {
                                name: `${employerUser.fname} ${employerUser.lname}`,
                                email: employerUser.email
                            }
                        }
                    });
                });
                break;

            case 'Offer':
                // Notify candidate and admin that offer was extended
                notifications.push({
                    userId: candidateUser.username,
                    role: 'candidate',
                    context: {
                        ...baseContext,
                        cta: {
                            url: `${PORTAL_BASE_URL}/Applications/Candidate/${candidateUser.username}?applicationId=${app.id}`
                        },
                        recipient: {
                            name: `${candidateUser.fname} ${candidateUser.lname}`,
                            email: candidateUser.email
                        },
                        employer: {
                            name: `${employerUser.fname} ${employerUser.lname}`,
                            email: employerUser.email
                        }
                    }
                });
                adminUsers.forEach(admin => {
                    notifications.push({
                        userId: admin.username,
                        role: 'admin',
                        context: {
                            ...baseContext,
                            recipient: {
                                name: `${admin.fname} ${admin.lname}`,
                                email: admin.email
                            },
                            candidate: {
                                name: `${candidateUser.fname} ${candidateUser.lname}`,
                                email: candidateUser.email
                            },
                            employer: {
                                name: `${employerUser.fname} ${employerUser.lname}`,
                                email: employerUser.email
                            }
                        }
                    });
                });
                break;

            case 'Accepted':
                // Notify employer and admin that candidate accepted offer
                notifications.push({
                    userId: employerUser.username,
                    role: 'employer',
                    context: {
                        ...baseContext,
                        cta: {
                            url: `${PORTAL_BASE_URL}/Applications/Employer/${employerUser.username}?applicationId=${app.id}`
                        },
                        recipient: {
                            name: `${employerUser.fname} ${employerUser.lname}`,
                            email: employerUser.email
                        },
                        candidate: {
                            name: `${candidateUser.fname} ${candidateUser.lname}`,
                            email: candidateUser.email
                        }
                    }
                });
                // Notify admin with link to Ready to Hire tab so they can complete the hiring
                adminUsers.forEach(admin => {
                    const adminNotification = {
                        userId: admin.username,
                        role: 'admin',
                        context: {
                            ...baseContext,
                            cta: {
                                url: `${PORTAL_BASE_URL}/Applications/Admin/${admin.username}?tab=hiring&applicationId=${app.id}`
                            },
                            recipient: {
                                name: `${admin.fname} ${admin.lname}`,
                                email: admin.email
                            },
                            candidate: {
                                name: `${candidateUser.fname} ${candidateUser.lname}`,
                                email: candidateUser.email
                            }
                        }
                    };
                    console.log('[workflow-notifications] Admin notification CTA URL:', adminNotification.context.cta.url);
                    notifications.push(adminNotification);
                });
                break;

            case 'Hired':
                // Notify candidate, employer that hiring is complete
                notifications.push({
                    userId: candidateUser.username,
                    role: 'candidate',
                    context: {
                        ...baseContext,
                        cta: {
                            url: `${PORTAL_BASE_URL}/Applications/Candidate/${candidateUser.username}?applicationId=${app.id}`
                        },
                        recipient: {
                            name: `${candidateUser.fname} ${candidateUser.lname}`,
                            email: candidateUser.email
                        }
                    }
                });
                notifications.push({
                    userId: employerUser.username,
                    role: 'employer',
                    context: {
                        ...baseContext,
                        cta: {
                            url: `${PORTAL_BASE_URL}/Applications/Employer/${employerUser.username}?applicationId=${app.id}`
                        },
                        recipient: {
                            name: `${employerUser.fname} ${employerUser.lname}`,
                            email: employerUser.email
                        },
                        candidate: {
                            name: `${candidateUser.fname} ${candidateUser.lname}`,
                            email: candidateUser.email
                        }
                    }
                });
                // No admin notification for Hired - they already got it after Accepted
                break;

            default:
                console.log(`[workflow-notifications] No notification mapping for action "${actionName}"`);
                return;
        }

        // Send all notifications
        const results = await Promise.allSettled(
            notifications.map(notif => sendNotification(notif))
        );

        // Log results
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                console.log(`[workflow-notifications] Notification sent to ${notifications[index].userId} (${notifications[index].role})`);
            } else {
                console.error(`[workflow-notifications] Failed to send notification to ${notifications[index].userId}:`, result.reason);
            }
        });

    } catch (error) {
        console.error('[workflow-notifications] Error sending notifications:', error.message);
        // Don't throw - notifications are non-critical
    }
}

/**
 * Send a single notification via the notification service
 */
async function sendNotification({ userId, role, context, event, subject }) {
    try {
        const url = `${NOTIFICATION_SERVICE_URL}/dispatch/${APP_ID}`;
        const payload = {
            userId,
            event: event || 'workflow_action_completed',
            role,
            context
        };
        
        // Add subject if provided
        if (subject) {
            payload.subject = subject;
        }
        
        const response = await axios.post(url, payload, { 
            timeout: 5000, 
            headers: { 'Content-Type': 'application/json' } 
        });
        return response.data;
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.warn('[workflow-notifications] ⚠ Notification service not running at', NOTIFICATION_SERVICE_URL);
        } else if (error.response?.status === 404) {
            console.warn('[workflow-notifications] ⚠ Notification endpoint not found:', error.config?.url);
        } else {
            console.error('[workflow-notifications] ✗ Notification failed:', error.message);
            if (error.response) {
                console.error('[workflow-notifications]   Status:', error.response.status);
                console.error('[workflow-notifications]   Data:', error.response.data);
            }
        }
        return null;
    }
}

/**
 * Send notification when a timecard is submitted
 * @param {Object} timecard - Timecard data with employee and admin info
 * @param {string} workflowId - ID of the created workflow
 */
async function notifyTimecardSubmitted(timecard, workflowId) {
    try {
        const employee = timecard.employee;
        const admin = timecard.admin;
        const weekStart = new Date(timecard.weekStartDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        };

        // Build context for notification matching timecard template expectations
        const context = {
            appName: 'TA Portal',
            recipient: {
                name: `${admin.fname} ${admin.lname}`,
                email: admin.email
            },
            employee: {
                name: `${employee.fname} ${employee.lname}`,
                email: employee.email
            },
            job: {
                title: timecard.courseCode,
                courseCode: timecard.courseCode,
                sectionNumber: timecard.sectionNumber || '01'
            },
            timecard: {
                weekStartDate: formatDate(weekStart),
                weekEndDate: formatDate(weekEnd),
                totalHours: timecard.totalHours || '0'
            },
            flags: {
                hasNotes: !!timecard.notes,
                overHours: timecard.totalHours > 10
            },
            cta: {
                url: `${PORTAL_BASE_URL}/Workflows/${admin.username}?workflowId=${workflowId}`
            }
        };

        // Send notification to admin using timecard_submitted template with employer role
        await sendNotification({
            userId: admin.username,
            event: 'timecard_submitted',
            role: 'employer',
            subject: `Timecard Submitted: ${context.employee.name} - ${context.job.title}`,
            context
        });
    } catch (error) {
        console.error('[workflow-notifications] Error sending timecard notification:', error.message);
        // Don't throw - notifications are non-critical
    }
}

/**
 * Send notification when a workflow action is completed
 * @param {Object} params - Notification parameters
 * @param {string} params.workflowId - Workflow ID
 * @param {Object} params.workflow - Workflow object with metadata
 * @param {Object} params.actor - User who completed the action {username, fname, lname, email}
 * @param {Object} params.recipient - User to notify {username, fname, lname, email, role}
 * @param {string} params.actionName - Name of the completed action
 * @param {string} params.comment - Optional comment from the action
 */
async function notifyWorkflowActionCompleted({
    workflowId,
    workflow,
    actor,
    recipient,
    actionName,
    comment
}) {
    try {
        // Get metadata from baseAction.metadata (where workflow sync stores it) or workflow.metadata array
        const metadata = workflow.baseAction?.metadata || 
                        (Array.isArray(workflow.metadata) 
                            ? workflow.metadata.reduce((acc, m) => ({ ...acc, [m.key]: m.value }), {})
                            : workflow.metadata) || {};
        const workflowType = metadata.workflowType || 'workflow';
        
        // Determine workflow title and event based on type
        let workflowTitle = 'Workflow';
        let eventName = 'workflow_action_completed';
        let context = {};
        
        if (workflowType === 'timecard_approval') {
            workflowTitle = `Timecard - ${metadata.employeeName} - ${metadata.courseCode}`;
            // Use timecard_approved event when timecard workflow is completed
            const completedActions = parseInt(metadata.completedActions) || 0;
            const totalActions = parseInt(metadata.totalActions) || 0;
            const isComplete = completedActions === totalActions;
            
            // If timecard workflow is complete, it means it was approved
            if (isComplete) {
                eventName = 'timecard_approved';
                
                // Build timecard-specific context
                const weekStart = new Date(metadata.weekStartDate);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                
                const formatDate = (date) => {
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                };
                
                context = {
                    appName: 'TA Portal',
                    recipient: {
                        name: `${recipient.fname} ${recipient.lname}`,
                        email: recipient.email
                    },
                    employer: {
                        name: `${actor.fname} ${actor.lname}`,
                        email: actor.email,
                        comments: comment || ''
                    },
                    job: {
                        title: metadata.courseCode,
                        courseCode: metadata.courseCode,
                        sectionNumber: '01'
                    },
                    timecard: {
                        weekStartDate: formatDate(weekStart),
                        weekEndDate: formatDate(weekEnd),
                        totalHours: metadata.totalHours || '0'
                    },
                    cta: {
                        url: `${PORTAL_BASE_URL}/Workflows/${recipient.username}?workflowId=${workflowId}`
                    }
                };
            }
        } else if (workflowType === 'hiring_process') {
            workflowTitle = `${metadata.jobTitle} - ${metadata.candidateName}`;
        }
        
        // If no specific context was built, use generic workflow context
        if (Object.keys(context).length === 0) {
            context = {
                appName: 'TA Portal',
                item: {
                    id: workflowId,
                    title: workflowTitle,
                    workflowType
                },
                status: {
                    new: `${metadata.completedActions || 0} / ${metadata.totalActions || 0} Complete`,
                    action: actionName
                },
                cta: {
                    url: `${PORTAL_BASE_URL}/Workflows/${recipient.username}?workflowId=${workflowId}`
                },
                recipient: {
                    name: `${recipient.fname} ${recipient.lname}`,
                    email: recipient.email
                },
                actorName: `${actor.fname} ${actor.lname}`,
                actionName: actionName,
                completedActions: metadata.completedActions || 0,
                totalActions: metadata.totalActions || 0,
                ...(comment && { comment })
            };
        }

        // Generate subject line based on workflow type
        let subject;
        if (workflowType === 'timecard_approval' && eventName === 'timecard_approved') {
            subject = `Timecard Approved: ${context.job?.title || workflowTitle}`;
        }
        
        // Send notification with appropriate event
        await sendNotification({
            userId: recipient.username,
            event: eventName,
            role: recipient.role,
            subject,
            context
        });
    } catch (error) {
        console.error('[workflow-notifications] Error sending workflow notification:', error.message);
        // Don't throw - notifications are non-critical
    }
}

module.exports = {
    notifyActionCompleted,
    notifyTimecardSubmitted,
    notifyWorkflowActionCompleted
};
