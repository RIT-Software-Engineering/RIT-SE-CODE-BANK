import {dispatchTemplated} from './notifications.js'
import {PrismaClient} from '../prisma/generated/client/index.js'
import {workflowsFetch} from '../../shared-utilities/cmtFetch.js';
import courseNow from './courseClock.js';
import { actionCodeForEvent, eventsForCode, getActionState, isStarted } from './courseExecution.js';

const prisma = new PrismaClient();
const DEFAULT_RECIPIENTS = ['student1@rit.edu', 'student2@rit.edu'];
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
            sendAt: details.sendAt,
            status: details.status
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
    const row = await prisma.notification.findUnique({
        where: {id}, select: {courseId:true, event:true}
    })

    const result = await prisma.notification.updateMany({
        where: {id, status: {in: ['SCHEDULED', 'FAILED']}},
        data: {status: 'CANCELLED'}
    })

    if (!row) return;
    const course = await prisma.course.findUnique({
        where: {id: row.courseId}
    })

    try{
        await syncActionState(course, actionCodeForEvent[row.event]);
    } catch (error){
        console.error('Failed to update action:', error.message, error.cause);
    }

    return result.count === 1;
}

export function getReminderDate(holiday){
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
            recipients: DEFAULT_RECIPIENTS, // TODO: replace with proper class list when we get students in the future
            sendAt: getReminderDate(holiday)
        })
    }
    try{
        await syncActionState(course, 'SEND_HOLIDAY_NOTICE');
    } catch (error){
        console.error('Failed to update action:', error.message, error.cause);
    }
}

export async function sendNow(user, course, details){
    const started = await hasStarted(course);
    const notifRow = await addNotification(course.id, {
        ...details,
        sendAt: courseNow(),
        status: started ? 'PROCESSING' : 'SCHEDULED'
    });

    if (!started) return false;

    const result = await deliverNotification(notifRow, user.uid, course);
    return result.status === 'SENT';
}

export async function sendOrSchedule(user, course, details, when){
    if (!when) return await sendNow(user, course, details);

    await addNotification(course.id, {...details, sendAt: when});
    try{
        await syncActionState(course, actionCodeForEvent[details.event]);
    }catch(error){
        console.error('Failed to update action:', error.message);
    }

    return 'scheduled';
}

export async function notifyOfHoliday(user, holiday, event, course, when=null){
    const courseName = courseLabel(course);
    const context = {
        subject: event === 'holiday' ? `${courseName}: Holiday Notice` : `${courseName}: Holiday Updated`,
        courseName: courseName,
        holidayName: holiday.name,
        date: holiday.date.toISOString().split('T')[0],
        endDate: holiday.endDate ? holiday.endDate.toISOString().split('T')[0] : null  
    }
    const recipients = DEFAULT_RECIPIENTS; // TODO: replace this with a class list when we have students in the db

    return await sendOrSchedule(user, course, {
        event, triggerId: holiday.id, context, recipients
    }, when);
}

export async function notifyOfCancellation(user, session, when=null){
    const onCancelledDate = session.date ? `on ${session.date}` : '';
    const courseName = courseLabel(session.course);
    const context = {
        subject: `${courseName}: Class Cancelled ${onCancelledDate}`,
        courseName: courseName,
        date: session.date ?? null
    }
    const recipients = DEFAULT_RECIPIENTS; // TODO: replace this with a class list when we have students in the db

    return await sendOrSchedule(user, session.course, {
        event: 'class_cancelled', triggerId: session.id, context, recipients
    }, when);
}

export async function notifyOfMovedBlock(user, block, from, to, course, when=null){
    const courseName = courseLabel(course);
    const context = {
        subject: `${courseName}: Content Moved in the Schedule`,
        courseName: courseName,
        blockName: block.name,
        from: from.sessionNum,
        fromDate: from.date,
        to: to.sessionNum,
        toDate: to.date,
    }
    const recipients = DEFAULT_RECIPIENTS; // TODO: replace this with a class list when we have students in the db

    return await sendOrSchedule(user, course, {
        event: 'content_moved', triggerId: block.id, context, recipients
    }, when);
}

export async function notifyOfCourseStart(user, course){
    const courseName = courseLabel(course);
    const context = {
        subject: `${courseName}: Welcome to the Course`,
        courseName,
        startDate: course.startDate ?? null
    }

    return await sendOrSchedule(user, course, {
        event: 'course_started', triggerId: course.id, context, recipients: DEFAULT_RECIPIENTS
    });
}

function toPlainText(html){
    return String(html ?? '')
        .replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

export async function notifyOfMaterialChange(user, course, change, item){
    const courseName = courseLabel(course);
    const itemType = item.isSyllabus ? 'Syllabus' : 'Course Material';
    const changeLabel = change.charAt(0).toUpperCase() + change.slice(1);
    const context = {
        subject: `${courseName}: ${itemType} ${changeLabel}`,
        courseName,
        changeText: change,
        itemLabel: toPlainText(item.label ?? item.name),
        sessionNum: item.sessionNum ?? null,
        isSyllabus: Boolean(item.isSyllabus)
    }
    const itemId = typeof item.id === 'number' ? item.id : null;

    return await sendOrSchedule(user, course, {
        event: 'material_changed', triggerId: itemId, context, recipients: DEFAULT_RECIPIENTS
    });
}

// returns whether the course has started
export async function hasStarted(course){
    if (!course?.execWorkflowStateId) return false;
    const state = await workflowsFetch('GET', `states/workflow/${course?.execWorkflowStateId}`);
    return isStarted(state);
}

export function courseLabel(course){
    return course.section ? `${course.classId}-${course.section}` : course.classId;
}

export async function syncActionState(course, code){
    if (!code) return;
    const actionState = await getActionState(course, code);

    if (!actionState || actionState.stateType === 'completed') return;

    const rows = await prisma.notification.findMany({
        where: {courseId: course.id, event: {in: eventsForCode(code)}},
        select: {status: true}
    })

    const anySent = rows.some(row => row.status === 'SENT');
    const anyWaiting = rows.some(row => ['SCHEDULED', 'PROCESSING', 'FAILED'].includes(row.status));

    const expectedState = anySent ? 'completed' : anyWaiting ? 'inProgress' : 'notStarted';

    if (expectedState !== actionState.stateType){
        await workflowsFetch('POST', `states/handleSubmit`, {actionStateId: actionState.id, stateType: expectedState});
    }
}

export async function claimNotification(notifId, from='SCHEDULED'){
    const result = await prisma.notification.updateMany({
        where: {id: notifId, status: from},
        data: {status: 'PROCESSING'}
    });
    return result.count === 1;
}

export async function deliverNotification(notif, userId, course){
    if (!Array.isArray(notif.recipients)){
        notif.recipients = [notif.recipients];
    }
        
    const context = (notif.context && typeof notif.context === 'object') 
        ? {...notif.context, note: notif.note} : notif.note 
        ? {note: notif.note} : undefined;

    function toRecipient(entry, userId){
        const recipient = typeof entry === 'string' ? {email: entry} : entry;
        return {...recipient, uid: recipient.uid ?? recipient.email?.split('@')[0] ?? userId};
    }

    for (const entry of notif.recipients){
        const recipient = toRecipient(entry, userId);
        const delivery = await prisma.notificationRecipient.upsert({
            where: {notificationId_userId: {notificationId: notif.id, userId: recipient.uid}},
            create: {notificationId: notif.id, userId: recipient.uid, role: 'student'},
            update: {},
        });

        if (delivery.status === 'SENT' || delivery.status === 'CANCELLED') continue;

        try{
            await dispatchTemplated(recipient.uid, {
                event: notif.event,
                context, 
                role: 'student',
                subject: notif.context?.subject,
                userEmail: recipient.email
            });
        } catch(error){
            // student opted out
            const optedOut = error.status == 422;
            if (!optedOut){
                console.error('Failed to send notification:', error.message, error.cause);
            }
            await prisma.notificationRecipient.update({
                where: {id: delivery.id}, 
                data: {status: optedOut ? 'CANCELLED' : 'FAILED', lastError: optedOut ? null : error.message}
            });
            continue;
        }

        await prisma.notificationRecipient.update({
            where: {id: delivery.id}, 
            data: {status: 'SENT', sentAt: new Date(), lastError: null}
        });
    }

    const deliveries = await prisma.notificationRecipient.findMany({
        where: {notificationId: notif.id},
        select: {status: true}
    });
    const count = (state) => deliveries.filter(delivery => delivery.status === state).length;
    const failed = count('FAILED');
    const sent = count('SENT');
    const skipped = count('CANCELLED');

    const status = failed > 0 ? 'FAILED' : 'SENT';

    await prisma.notification.update({
        where: {id: notif.id}, data: {status: status}
    });

    try{
        await syncActionState(course, actionCodeForEvent[notif.event]);
    } catch(error){
        console.error('Failed to update action:', error.message, error.cause);
    }

    return {id: notif.id, status, sent, skipped, failed};
}

export function validateSendDate(sendAt, latest){
    const whenToSend = new Date(sendAt);
    const latestDate = latest ? new Date(latest) : null;

    if (latestDate && latestDate <= courseNow()){
        return {error: 'It is too late to schedule this. Use "notify now" instead'};
    }
    if (isNaN(whenToSend.getTime())){
        return {error: 'Invalid send time'};
    }

    if (whenToSend <= courseNow()){
        return {error: 'Send time must be in the future'};
    }
    if (latestDate && whenToSend > latestDate){
        return {error: 'Send time must be by 8:00pm Eastern time the day before'};
    }

    return {whenToSend};
}

export async function findDueNotifications(courseId, now=courseNow()){
    return await prisma.notification.findMany({
        where: {courseId, status: 'SCHEDULED', sendAt: {lte: now}},
        orderBy: {sendAt: 'asc'}
    });
}

export async function sendDueNotifications(userId, courseId, now=courseNow()){
    courseId = parseInt(courseId);
    const course = await prisma.course.findUnique({where: {id: courseId}})
    if (!course || !await hasStarted(course)) return [];

    const notifs = await findDueNotifications(courseId, now);
    
    const notifStatuses = [];
    for (const notif of notifs){
        if (!await claimNotification(notif.id)) continue;
        notifStatuses.push(await deliverNotification(notif, userId, course));
    }
    return notifStatuses;
}

export async function runDueNotifications(){
    const now = courseNow()
    const rows = await prisma.notification.findMany({
        where: {status: 'SCHEDULED', sendAt: {lte:now}},
        select: {courseId: true},
        distinct: ['courseId']
    })

    for (const row of rows){
        const course = await prisma.course.findUnique({where: {id: row.courseId}});
        
        if (!course) continue;
        try{
            await sendDueNotifications(course.professorId, row.courseId, now);
        } catch(error){
            console.log('Failed to send due notifications for course:', row.courseId, error.message);
            continue;
        }
    }
}

export async function resetStuckNotifications(){
    const result = await prisma.notification.updateMany({
        where: {status: 'PROCESSING'}, data: {status: 'SCHEDULED'}
    });

    if (result.count > 0){
        console.log(`Reset ${result.count} stuck notifications.`)
    }
}

export async function retryNotification(user, course, notifId){
    if (!await claimNotification(notifId, 'FAILED')) return null;

    const notif = await prisma.notification.findUnique({
        where: {id: notifId}
    });
    const result = await deliverNotification(notif, user.uid, course);
    
    return result.status === 'SENT';
}

export async function previewNotifications(courseId, until, now=courseNow()){
    const notifs = await findDueNotifications(courseId, until);

    return{
        dueNow: notifs.filter(notif => notif.sendAt <= now),
        upcoming: notifs.filter(notif => notif.sendAt > now)
    }
}