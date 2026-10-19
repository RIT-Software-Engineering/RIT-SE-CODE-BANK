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
    return await prisma.notification.create({
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

function getReminderDate(holiday){
    const reminder_date = new Date(holiday.date.getTime());
    // TODO: update this to a more acceptable reminder date or accommodate professor preference
    reminder_date.setDate(reminder_date.getDate() - 7); 
    return reminder_date;
}

export async function scheduleHolidayReminders(course){
    const courseName = courseLabel(course);
    for (const holiday of course.holidays){
        const exists = await prisma.notification.findFirst({
            where: {courseId: course.id, triggerId: holiday.id, event: 'holiday'}
        })
        if (exists) continue;

        await addNotification(course.id, {
            event: 'holiday',
            triggerId: holiday.id,
            context: {
                subject: `${courseName}: Holiday Reminder`,
                courseName: courseName,
                holidayName: holiday.name,
                date: holiday.date.toISOString().split('T')[0],
                endDate: holiday.endDate ? holiday.endDate.toISOString().split('T')[0] : null
            },
            recipients: ['student@rit.edu'], // TODO: replace with proper class list when we get students in the future
            sendAt: getReminderDate(holiday)
        })
    }
}

export async function notifyOfHoliday(user, holiday, event, course){
    const courseName = courseLabel(course);
    const notifRow = await addNotification(holiday.courseId, {
        event: event,
        triggerId: holiday.id,
        context: {
            subject: event === 'holiday' ? `${courseName}: Holiday Added` : `${courseName}: Holiday Updated`,
            courseName: courseName,
            holidayName: holiday.name,
            date: holiday.date.toISOString().split('T')[0],
            endDate: holiday.endDate ? holiday.endDate.toISOString().split('T')[0] : null
        },
        recipients: ['student@rit.edu'], // TODO: replace this with a class list when we have students in the db
        sendAt: courseNow()
    })

    // TODO: have a case for scheduled notifs
    const results = await sendDueNotifications(user.uid, holiday.courseId);
    return results.some(result => (result.id === notifRow.id) && result.status === 'SENT');
}

export async function notifyOfCancellation(user, session){
    const courseName = courseLabel(session.course);
    const notifRow = await addNotification(session.courseId, {
        event: 'class_cancelled',
        triggerId: session.id,
        context: {
            subject: `${courseName}: Class Cancelled on ${session.date}`,
            courseName: courseName,
            date: session.date
        },
        recipients: ['student@rit.edu'],
        sendAt: courseNow()
    });

    const results = await sendDueNotifications(user.uid, session.courseId);
    return results.some(result => (result.id === notifRow.id) && result.status === 'SENT');
}

export async function notifyOfMovedBlock(user, block, from, to, course){
    const courseName = courseLabel(course);
    const notifRow = await addNotification(course.id, {
        event: "content_moved",
        triggerId: block.id,
        context: {
            subject: `${courseName}: Content Moved in the Schedule`,
            courseName: courseName,
            blockName: block.name,
            from: from.sessionNum,
            fromDate: from.date,
            to: to.sessionNum,
            toDate: to.date,
        },
        recipients: ['student@rit.edu'],
        sendAt: courseNow()
    });

    const results = await sendDueNotifications(user.uid, course.id);
    return results.some(result => (result.id === notifRow.id) && result.status === 'SENT');
}

// returns whether the course has started
export async function hasStarted(course){
    if (!course?.execWorkflowStateId) return false;
    const state = await workflowsFetch('GET', `states/workflow/${course?.execWorkflowStateId}`);
    return state?.baseActionState?.stateType !== "notStarted";
}

export function courseLabel(course){
    return course.section ? `${course.classId}-${course.section}` : course.classId;
}

export async function sendDueNotifications(userId, courseId){
    courseId = parseInt(courseId);
    const notifs = await prisma.notification.findMany({
        where: {courseId: courseId, status: 'SCHEDULED', sendAt: {lte: courseNow()} } 
    })
    
    const notifStatuses = [];
    const course = await prisma.course.findUnique({where: {id: courseId}})
    const started = await hasStarted(course);
    if (!started) return notifStatuses;

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
            notifStatuses.push({id: notif.id, status: 'SENT'});
        } catch(error){
            await prisma.notification.update({
                where: {id: notif.id},
                data: {status: 'FAILED'}
            })
            console.error('Failed to send notification:', error.message, error.cause);
            notifStatuses.push({id: notif.id, status: 'FAILED'});
        }
    }
    return notifStatuses;
}