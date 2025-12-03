/**
 * Workflow Notification Helper
 * 
 * Sends notifications when workflow actions are completed
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4000/api/notifications';
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
async function sendNotification({ userId, role, context }) {
    try {
        const response = await axios.post(
            `${NOTIFICATION_SERVICE_URL}/dispatch/${APP_ID}`,
            {
                userId,
                event: 'workflow_action_completed',
                role,
                context
            },
            { timeout: 5000, headers: { 'Content-Type': 'application/json' } }
        );

        return response.data;
    } catch (error) {
        // Check if notification service is available
        if (error.code === 'ECONNREFUSED') {
            console.warn('[workflow-notifications] Notification service not available');
        } else {
            console.error('[workflow-notifications] Notification error:', error.message);
        }
        throw error;
    }
}

/**
 * Send notification when a timecard is submitted
 * @param {Object} timecard - Timecard data with employee and admin info
 * @param {string} workflowId - ID of the created workflow
 */
async function notifyTimecardSubmitted(timecard, workflowId) {
    try {
        console.log(`[workflow-notifications] Sending timecard submission notification`);

        const employee = timecard.employee;
        const admin = timecard.admin;
        const weekStart = new Date(timecard.weekStartDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        };

        // Build context for notification
        const context = {
            appName: 'TA Portal',
            item: {
                id: timecard.timecardWeeklyHistoryId.toString(),
                title: `Timecard - ${employee.fname} ${employee.lname} - Week of ${formatDate(weekStart)}`,
                timecardId: timecard.timecardWeeklyHistoryId.toString(),
                weekStartDate: weekStart.toISOString(),
                courseCode: timecard.courseCode
            },
            status: {
                new: 'SUBMITTED',
                action: 'Timecard Submitted'
            },
            cta: {
                url: `${PORTAL_BASE_URL}/Workflows/${admin.username}?workflowId=${workflowId}`
            },
            recipient: {
                name: `${admin.fname} ${admin.lname}`,
                email: admin.email
            },
            submitter: {
                name: `${employee.fname} ${employee.lname}`,
                email: employee.email
            }
        };

        // Send notification to admin
        await sendNotification({
            userId: admin.username,
            role: 'admin',
            context
        });

        console.log(`[workflow-notifications] Timecard notification sent to admin ${admin.username}`);
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
        console.log(`[workflow-notifications] Sending workflow action completed notification to ${recipient.username}`);

        const metadata = workflow.metadata || {};
        const workflowType = metadata.workflowType || 'workflow';
        
        // Determine workflow title based on type
        let workflowTitle = 'Workflow';
        if (workflowType === 'timecard_approval') {
            workflowTitle = `Timecard - ${metadata.employeeName} - ${metadata.courseCode}`;
        } else if (workflowType === 'hiring_process') {
            workflowTitle = `${metadata.jobTitle} - ${metadata.candidateName}`;
        }

        // Build context for notification
        const context = {
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

        // Send notification
        await sendNotification({
            userId: recipient.username,
            event: 'workflow_action_completed',
            role: recipient.role,
            context
        });

        console.log(`[workflow-notifications] Workflow notification sent to ${recipient.username}`);
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
