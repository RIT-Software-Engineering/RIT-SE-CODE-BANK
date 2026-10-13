import {dispatchTemplated} from './notifications.js'
import {PrismaClient} from '../prisma/generated/client/index.js'
import {workflowsFetch} from '../../shared-utilities/cmtFetch.js';
import courseNow from './courseClock.js';

const prisma = new PrismaClient();

/**
 * Creates a new notification field in the database
 * 
 * @param {*} courseId 
 * @param {*} details - the information surrounding the notification
 */
export async function addNotification(courseId, details){
    await prisma.notification.create({
        data: {
            courseId: parseInt(courseId),
            event: details.event,
            triggerId: details.triggerId,
            context: details.context, // shape depends on template. maybe have a check in the future to ensure it matches the expected format
            note: details.note,
            recipients: details.recipients,
            sendAt: details.sendAt
        }
    })
}

/**
 * Updates an existing notification
 * 
 * @param {*} id - notification id
 * @param {*} changed_details - the updated information for the notification
 */
export async function updateNotification(id, changed_details){
    await prisma.notification.updateMany({
        where: {id, status: 'SCHEDULED'},
        data: {
            context: changed_details.context,
            note: changed_details.note,
            recipients: changed_details.recipients,
            sendAt: changed_details.sendAt
        }
    })
}

/**
 * Sets a notification to cancelled
 * 
 * @param {*} id 
 */
export async function deleteNotification(id){
    await prisma.notification.updateMany({
        where: {id, status: 'SCHEDULED'},
        data: {status: 'CANCELLED'}
    })
}

export async function sendDueNotifications(userId, courseId){
    courseId = parseInt(courseId);
    const notifs = await prisma.notification.findMany({
        where: {courseId: courseId, status: 'SCHEDULED', sendAt: {lte: courseNow()} } 
    })
    
    const course = await prisma.course.findUnique({where: {id: courseId}})

    const execStateId = course.execWorkflowStateId;
    if (!execStateId) return;
    const state = await workflowsFetch('GET', `states/workflow/${execStateId}`) 
    if (state.baseActionState.stateType === 'notStarted') return; // course hasn't started yet

    for (const notif of notifs){
        try{
            if (!Array.isArray(notif.recipients)) notif.recipients = [notif.recipients];
            for (const recipient of notif.recipients){
                await dispatchTemplated(userId, {
                    event: notif.event,
                    context: (notif.context && typeof notif.context === 'object') ? {...notif.context, note: notif.note} : notif.note ? {note: notif.note} : undefined, // make the type checker happy by ensuring notif.context is explicitely an object
                    role: 'student',
                    subject: notif.context.subject,
                    userEmail: recipient
                })
            }

            await prisma.notification.update({
                where: {id: notif.id},
                data: {status: 'SENT'}
            })
        } catch(error){
            await prisma.notification.update({
                where: {id: notif.id},
                data: {status: 'FAILED'}
            })
            console.error('Failed to send notification:', error.message);
        }
    }
}