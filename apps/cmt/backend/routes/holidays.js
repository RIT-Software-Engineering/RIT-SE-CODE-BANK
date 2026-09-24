import express from "express";

import { PrismaClient } from '../prisma/generated/client/index.js'

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
 * Makes a new holiday in the DB and returns it so we can use its id
 */
router.post("/", async (req, res) => {
    const holiday = await prisma.holiday.create({
        data: {
            name: req.body.name,
            date: req.body.date,
            endDate: req.body.endDate,
            course: {connect: {id: Number(req.body.id)}}
        }
    });

    res.json({ holiday })
});

/** PUT /api/cmt/holidays/:holidayId
 * Updates holiday in the DB and returns it so we can use its id
 */ 
router.put("/:holidayId", async (req, res) => {
    const {holidayId} = req.params;
    const {name, date, endDate} = req.body;

    const updatedHoliday = await prisma.holiday.update({
        where: {id: Number(holidayId)},
        data: {
            name,
            date,
            endDate
        }
    });
    
    res.json({ holiday: updatedHoliday })
});

/** DELETE /api/cmt/holidays/:courseId/:holidayId
 * Deletes a holiday from the DB and returns it so we can update the UI
 */ 
router.delete("/:holidayId", async (req, res) => {
    const {holidayId} = req.params;
    const holiday = await prisma.holiday.delete({
        where: {id: parseInt(holidayId)}
    });

    res.json({ holiday })
});