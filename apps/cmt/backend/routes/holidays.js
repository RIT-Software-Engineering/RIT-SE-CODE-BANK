import express from "express";

import { PrismaClient } from '../prisma/generated/client/index.js'
import { workflowsFetch } from "@se-code-bank/cmt-shared-utilities"
import { notifyOfHoliday, hasStarted, updateNotification, getReminderDate, deleteNotification, validateSendDate } from "../utils/notifier.js";
import { latestNotifyTime } from "../utils/courseClock.js";

const prisma = new PrismaClient();

const router = express.Router();
export default router


/** GET /api/cmt/holidays/:courseId
 * Gets all the holidays for a course, including the holiday name, start date, and end date
 * When successful, returns an array of holidays for the course
 */
router.get("/:courseId", async(req, res) => {
    const { courseId } = req.params;
    const holidays = await prisma.holiday.findMany({
        where: {courseId: parseInt(courseId)}
    });
    
    res.json({
        holidays: holidays,
    })
});

/** POST /api/cmt/holidays/
 * Makes a new holiday in the DB and returns an object of the format:
 * ```
 * {
 *  holiday: CMT holiday object
 *  change: Type of holiday change ('add' | 'update')
 *  notifyPrompt: Boolean of whether the notify prompt should be displayed
 * }
 * ```
 */
router.post("/", async (req, res) => {
    const { name, date, endDate, id } = req.body;
    const holiday = await prisma.holiday.create({
        data: {
            name: name,
            date: new Date(date),
            endDate: endDate ? new Date(endDate) : null,
            course: {connect: {id: parseInt(id)}}
        }
    });
    const course = await prisma.course.findUnique({
        where: {id: parseInt(id)}
    })
    const started = await hasStarted(course);

    res.json({ holiday, change: 'add', notifyPrompt: started })
});

/**
 * POST /api/cmt/holidays/:holidayId/notify
 * Create notification for the specific holiday, which can be sent now or later
 */
router.post('/:holidayId/notify', async (req, res) => {
    const {holidayId} = req.params;
    const {change, notify, sendAt} = req.body;
    let notified = null;
    let when = null;
    const holiday = await prisma.holiday.findUnique({
        where: {id: parseInt(holidayId)},
        include: {course: true}
    })

    if (!holiday){
        return res.status(404).json({success: false, message: "Holiday not found"});
    }
    if (holiday.course.professorId !== req.user.uid){
        return res.status(403).json({success: false, message: "Unauthorized access"});
    }

    if (!await hasStarted(holiday.course)){
        return res.status(400).json({success: false});
    }

    if (notify !== 'now' && notify !== 'later'){
        return res.json({success: true})
    }

    const event = (change === 'add') ? 'holiday' : 'holiday_update'

    if (notify === 'later'){
        const check = validateSendDate(sendAt, latestNotifyTime(holiday.date));
        if (check.error){
            return res.status(400).json({error: {userFacingMessage: check.error}});
        }
        when = check.whenToSend;
    }

    try{
        notified = await notifyOfHoliday(req.user, holiday, event, holiday?.course, when);
        return res.json({success: true, notified: when ? null : notified, scheduled: when != null});
    } catch(error){
        console.error('Notification failed:', error.message, error.cause);
        return res.json({success: true, notified: false});
    }
});

/**
 * PUT /api/cmt/holidays/course/:courseId
 * Creates a new holiday for a course through the holiday action
 */
router.put("/course/:courseId", async (req, res) => {
    const { courseId } = req.params;
    const { holidayName, date, endDate } = req.body;
    const { asid: actionStateId } = req.query;

    await prisma.holiday.create({
        data: {
            name: holidayName, 
            date: new Date(date),
            endDate: endDate ? new Date(endDate) : null, 
            course: {connect: {id: parseInt(courseId)}}
        }
    })

    if (actionStateId){
        await workflowsFetch('POST', '/states/handleSubmit', {actionStateId, stateType: 'completed'})
    }

    res.sendStatus(200)
})

/** PUT /api/cmt/holidays/:holidayId
 * Updates holiday in the DB and returns an object of the format:
 * ```
 * {
 *  holiday: Updated CMT holiday object
 *  change: Type of holiday change ('add' | 'update')
 *  notifyPrompt: Boolean of whether the notify prompt should be displayed
 * }
 * ```
 */ 
router.put("/:holidayId", async (req, res) => {
    const {holidayId} = req.params;
    const {name, date, endDate} = req.body;

    const updatedHoliday = await prisma.holiday.update({
        where: {id: Number(holidayId)},
        data: {
            name: name,
            date: date ? new Date(date) : null,
            endDate: endDate ? new Date(endDate) : null
        },
        include: {course: true}
    });
    const started = await hasStarted(updatedHoliday.course)

    const pendingNotice = await prisma.notification.findFirst({
        where: {courseId: updatedHoliday.courseId, triggerId: updatedHoliday.id, event: 'holiday', status: 'SCHEDULED'},
    })

    if (pendingNotice){
        await updateNotification(pendingNotice.id, {
            context: {...pendingNotice.context, 
                holidayName: updatedHoliday.name, 
                date: updatedHoliday.date.toISOString().split('T')[0], 
                endDate: updatedHoliday.endDate ? updatedHoliday.endDate.toISOString().split('T')[0] : null
            },
            sendAt: getReminderDate(updatedHoliday)
        });
    }
    
    res.json({ holiday: updatedHoliday, change: 'update', notifyPrompt: started && !pendingNotice})
});

/** DELETE /api/cmt/holidays/:courseId/:holidayId
 * Deletes a holiday from the DB and returns it so we can update the UI
 */ 
router.delete("/:holidayId", async (req, res) => {
    const {holidayId} = req.params;
    const holiday = await prisma.holiday.delete({
        where: {id: parseInt(holidayId)}
    });

    const pendingNotice = await prisma.notification.findMany({
        where: {courseId: holiday.courseId, triggerId: holiday.id, event: {in: ['holiday', 'holiday_update']}, status: 'SCHEDULED'}
    })

    for (const notice of pendingNotice){
        await deleteNotification(notice.id);
    }

    res.json({ holiday })
});