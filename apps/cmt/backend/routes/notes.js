import express from 'express'
import { PrismaClient } from '../prisma/generated/client/index.js';
import { createNote, editNote, listNotes, setNoteStatus } from '../utils/notes.js';

const MAX_NOTE_LENGTH = 2000;
const DUE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const router = express.Router();
export default router;

const prisma = new PrismaClient();

// Require that a user is logged in (authMiddleware should set req.user)
function requireUser(req, res) {
    if (!req.user) {
        res.status(401).json({error: "Not authenticated" });
        return null;
    }
    return req.user;
}

async function requireCourse(req, res) {
    const user = requireUser(req, res);
    if (!user) return null;
    const { courseId } = req.params;

    if (!courseId) {
        res.status(400).json({error: "Missing course ID"});
        return null;
    }

    const course = await prisma.course.findFirst({
        where: { id: parseInt(courseId), professorId: user.uid},
    });

    if (!course) {
        res.status(404).json({error: "Course not found"});
        return null;
    }

    if (!course.execWorkflowStateId){
        res.status(400).json({error: "Course does not have an active workflow state"});
        return null;
    }
    return { course, user };
}

/** 
 * GET api/cmt/course/:courseId
 * List all notes for a specific course
 */
router.get('/course/:courseId', async (req, res) => {
    const { archive } = req.query;
    const result = await requireCourse(req, res);
    if (!result) return;
    const { course, user } = result;

    const notes = await listNotes(course.execWorkflowStateId, user.uid, archive === '1');

    res.json({ notes });
});

/**
 * POST api/cmt/course/:courseId
 * Create a new note for a specific course
 */
router.post('/course/:courseId', async (req, res) => {
    const result = await requireCourse(req, res);
    if (!result) return;
    const { course, user } = result;
    const {dueAt} = req.body ?? {};
    const { text } = typeof req.body?.text === 'string' ? { text: req.body.text.trim() } : { text: '' };

    if (!text) {
        return res.status(400).json({error: "Missing text for note"});
    }
    if (text.length > MAX_NOTE_LENGTH) {
        return res.status(400).json({error: "Text for note is too long"});
    }

    if (dueAt != null && !DUE_DATE_PATTERN.test(dueAt)) {
        return res.status(400).json({error: "Invalid due date format"});
    }

    const note = await createNote(course, user.uid, text, dueAt ?? null);

    res.status(201).json({note});
});

/**
 * PATCH api/cmt/course/:courseId/:stateId
 * Update the status of a specific note for a specific course
 */
router.patch('/course/:courseId/:stateId', async (req, res) => {
    const result = await requireCourse(req, res);
    if (!result) return;
    const { course, user } = result;
    const { status } = req.body ?? {};
    const { stateId } = req.params;

    if (!['open', 'done', 'archived'].includes(status)) {
        return res.status(400).json({error: "Invalid status"});
    }

    const note = await setNoteStatus(course.execWorkflowStateId, user.uid, stateId, status);

    if (!note) {
        return res.status(404).json({error: "Note not found"});
    }
    res.json({ note });
})

/**
 * PUT api/cmt/course/:courseId/:stateId
 * Update the text and/or due date of a note for a course
 */
router.put('/course/:courseId/:stateId', async (req, res) => {
    const result = await requireCourse(req, res);
    if (!result) return;
    const { course, user } = result;
    const { text, dueAt } = req.body ?? {};

    if (text === undefined && dueAt === undefined) {
        return res.status(400).json({error: "Nothing to update"});
    }

    let cleanText;
    if (text !== undefined) {
        cleanText = typeof text === 'string' ? text.trim() : '';
        if (!cleanText) return res.status(400).json({error: "Missing text for note"});
        if (cleanText.length > MAX_NOTE_LENGTH) return res.status(400).json({error: "Text for note is too long"});
    }
    
    if (dueAt != null && !DUE_DATE_PATTERN.test(dueAt)) {
        return res.status(400).json({error: "Invalid due date format"});
    }

    const note = await editNote(course.execWorkflowStateId, user.uid, req.params.stateId, {text: cleanText, dueAt});
    if (!note) return res.status(404).json({error: "Note not found"});
    res.json({ note });
});