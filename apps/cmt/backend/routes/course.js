import express from 'express'
import { objectToNewWorkflow, workflowsFetch } from '../utils/workflows/api.js'
import { CMTActionToActionWithContexts } from '../utils/workflows/context.js'
import { compressedMetadataToObject } from '@se-code-bank/workflows-ecosystem'
import { PrismaClient } from '../prisma/generated/client/index.js'
import { findActionsByCode } from '../utils/workflows/api.js';

/**
 * @import { WorkflowsAction } from '@se-code-bank/workflows-ecosystem'
 */

const router = express.Router()
export default router

const prisma = new PrismaClient();

/**
 * GET /api/cmt/course
 * Get all courses from a professor
 * TODO: CHANGE IT SO IT'S BASED ON THE PROFESSOR ID THAT'S CURRENTLY LOGGED IN
 */
router.get('/', async (req, res) => {
    try {
        const profId = req.user.uid;
        const {isTemplate} = req.query;
        const courses = await prisma.course.findMany({
            include: { professors: true },
            where: {
                professorId: profId, 
                isTemplate: Boolean(isTemplate)
            }
        })
        res.json(courses)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

/**
 * GET /api/cmt/course/:id
 * returns an object of the following format:
 * ```
 * {
 *  course: CMT course object
 *  workflow: Workflows workflow object
 *  actionsWithCallbacks: {
 *    action: Workflows action object
 *    callback: CMT callback url to complete action
 *  }
 *  actionStates: Workflows actionStates array
 * }
 * ```
 */
router.get('/:id', async (req, res) => {
    try {
        // TODO: check perms/if prof owns course
        const course = await prisma.course.findUnique({
            where: { id: parseInt(req.params.id), professorId: req.user.uid },
            include: {sessions: true}
        })

        if (!course) 
            throw new Error("Course not found. This course may not exist or you may not have access to it.");

        const workflow = await workflowsFetch('GET', `workflows/${course.workflowId}`)
        /** @type {WorkflowsAction[]} */
        const actions = await workflowsFetch('GET', `actions?workflowId=${course.workflowId}`)
        const workflowState = await workflowsFetch('GET', `states/workflow/${course.workflowStateId}`)
        
        const actionsWithContexts = actions.map(action => CMTActionToActionWithContexts(action, workflowState, course.id, req.user.uid)) 

        res.json({ course, workflow, actionsWithContexts, actionStates: workflowState })
    } catch (err) {
        console.error('course creation failed: ', err)
        res.status(500).json({ error: err.message })
    }
})

/**
 * POST /api/cmt/course
 * Create course workflow and course db entity
 * Returns an object of the following format
 * ```
 * {
 *  course: CMT course object
 * }
 * ```
 */
router.post('/', async (req, res) => {
    try {
        const professorId = req.user.uid;

        const {courseCode, courseName, color, season, isTemplate} = req.body;

        let metaCourseWorkflow;
        let sessionActions;
        await workflowsFetch("GET", `workflows/metadata?key=code&value=${JSON.stringify('Course Creation Workflow')}`,).then(async response => {
            const workflowBase = response.length > 0 ? response[0] : null;
            if (!workflowBase)
                throw new Error("Unable to find the standard course creation template. Please contact Kenn Martinez so that it can be set.")
            let actions;
            if (workflowBase.rootActionId){
                const actionResponse = await workflowsFetch("GET", `/actions?workflowId=${workflowBase.id}`);
                function parseMetadata(action) {
                    action.metadata = compressedMetadataToObject(action.metadata)
                    if (action.childActions) for (action of action.childActions) parseMetadata(action)
                }
                actionResponse.forEach(action => parseMetadata(action))
                actions = actionResponse 
            }
            else
                throw new Error("Course creation workflow must have at least one simple action. Please contact Kenn Martinez so that one can be added.")
            const baseAction = workflowBase.baseAction;
            // TODO: baseAction is an empty object 
            metaCourseWorkflow = {
                name: baseAction.name,
                description: baseAction.description,
                tags: workflowBase.tags?.filter(tag => tag !== "WorkflonyFirstTheRestNowhere_CMT_Template"),
                childActions: actions
            };
            if (isTemplate){ // basically if we're working with templates we append this to the end of our workflow
                metaCourseWorkflow.childActions.push({
                    name: 'Publish Your Template',
                    description: "Once you're done, press the button to publish your template for public use!",
                    actionType: 'simple',
                    metadata: {
                        code: 'PUBLISH_TEMPLATE',
                    },
                })
            }

            // The regex here is basically the same as an .includes
            sessionActions = findActionsByCode(metaCourseWorkflow.childActions, "SESSION", new RegExp(`^SESSION_.*`));
        })

        // Do everything in a transaction so if one thing fails it reverts the DB
        await prisma.$transaction(async () => {
            const createdWorkflow = await objectToNewWorkflow(metaCourseWorkflow, professorId)

            const createdState = await workflowsFetch('POST', 'states/workflow', { userId: professorId, workflowId: createdWorkflow.id }) // Create state
            console.log(`Created workflow action state with id ${createdState.id}`)

            const newCourse = await prisma.course.create({
                data: {
                    classId: courseCode,
                    name: courseName,
                    color: color,
                    season: season ?? null,
                    professors: { connect: { id: professorId } },
                    workflowId: createdWorkflow.id,
                    workflowStateId: createdState.id,
                    isTemplate: isTemplate,
                },
            });

            // If we have sessions in our meta-workflow, we autopopulate them in the new course
            const sessionData = sessionActions?.map(action => ({
                sessionNum: parseInt(action.metadata.outputs[0].validation.sessionNum),
                courseId: Number(newCourse.id)
            }));

            await prisma.session.createMany({
                data: sessionData,
                skipDuplicates: true,
            })
            // For simplicity of the frontend, return minimal information, since the GET for courses will contain all the info needed, and will be called much more often.
            res.json({ course: newCourse })
        }, {timeout: 15000});

    } catch (error) {
        console.error('Error creating meta course workflow/empty course :', error)
        res.status(500).json({
            success: false,
            error: 'Failed to create meta course workflow/empty course',
            details: error.message,
        })
    }
})

/**
 * PUT /api/cmt/course/:id
 * Update course - add workflowId or other fields
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const updateData = req.body

        console.log('PUT /api/cmt/course/:id called with:', id, updateData)

        const mappedData = {
            ...(updateData.courseCode !== undefined 
                && { classId: updateData.courseCode }
            ),
            ...(updateData.courseName !== undefined 
                && { name: updateData.courseName }
            ),
            ...(updateData.year !== undefined 
                && { year: parseInt(updateData.year) }
            ),
            ...(updateData.season !== undefined 
                && { season: updateData.season }
            ),
            ...(updateData.color !== undefined 
                && { color: updateData.color }
            ),
            ...(updateData.students !== undefined 
                && !isNaN(parseInt(updateData.students)) 
                && { students: parseInt(updateData.students) }
            ),
            ...(updateData.section !== undefined 
                && { section: updateData.section }
            ),
            ...(updateData.days !== undefined
                && {days: typeof(updateData.days) !== 'string' ? 
                    updateData.days.filter(day => day !== false).join(', ') :
                    updateData.days}
            ),
            ...(updateData.startDate !== undefined 
                && {startDate: updateData.startDate}
            )
        }

        const updatedCourse = await prisma.course.update({
            where: { id: Number(id) },
            data: mappedData
        })

        console.log('Course updated successfully:', updatedCourse)

        if (updatedCourse.startDate && updatedCourse.days){
            const emptyDaySessions = await prisma.session.findMany({
                where: {date: null, courseId: Number(id)}
            });
            if (emptyDaySessions.length > 0){
                const courseDays = updatedCourse.days.split(", ");
                const courseStartDate = new Date(updatedCourse.startDate);
                const allDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

                // AI - generated code
                let sessionDate = new Date(courseStartDate.setDate(courseStartDate.getDate() + ((allDays.indexOf(courseDays[0]) + 7 - courseStartDate.getDay()) % 7)-1));

                console.log(sessionDate)

                emptyDaySessions.forEach(async session => {
                    sessionDate.setDate(sessionDate.getDate() + 1);

                    while (!courseDays.includes(allDays[sessionDate.getDay()]))
                        sessionDate.setDate(sessionDate.getDate() + 1)

                    await prisma.session.update({
                        where: {id: session.id},
                        data: {date: sessionDate.toISOString().split('T')[0]}
                    })
                })
            }
        }

        const { uid: _userId, asid: actionStateId } = req.query
        if (actionStateId) await workflowsFetch('POST', `/states/handleSubmit`, { actionStateId, stateType: 'completed' })

        res.json({
            success: true,
            data: updatedCourse,
        })
    } catch (error) {
        console.error('Error updating course:', error)
        res.status(500).json({
            success: false,
            error: error.message,
        })
    }
})

/**
 * DELETE /api/cmt/course/:id
 * Delete a course and all related data (events, enrollments, etc.)
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params

        // Had to cast id to a Number so an int is passed instead of a string

        console.log('DELETE /api/cmt/course/:id called with:', Number(id))

        // Then delete the course
        await prisma.course.delete({
            where: { id: Number(id) },
        })

        console.log(`✅ Course deleted: ${id}`)

        res.json({
            success: true,
            message: 'Course and all related events deleted successfully',
        })
    } catch (error) {
        console.error('Error deleting course:', error)

        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                error: 'Course not found',
            })
        }

        res.status(500).json({
            success: false,
            error: error.message,
        })
    }
})
