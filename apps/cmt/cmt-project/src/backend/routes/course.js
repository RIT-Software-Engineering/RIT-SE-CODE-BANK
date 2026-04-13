import express from 'express'
import { objectToNewWorkflow, workflowsFetch } from '../utils/workflows/api.js'
import { actionToActionWithContext, flattenActionStates as flattenWorkflowState } from '../utils/workflows/actionPipeline.js'
import { PrismaClient } from "@prisma/client";
import { findActionsByCode } from '../utils/workflows/api.js';

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
            where: { id: parseInt(req.params.id) },
        })

        const workflow = await workflowsFetch('GET', `workflows/${course.workflowId}`)
        const actions = await workflowsFetch('GET', `actions?workflowId=${course.workflowId}`)
        const workflowState = await workflowsFetch('GET', `states/workflow/${course.workflowStateId}`)
        
        const flattenedWorkflowState = flattenWorkflowState(workflowState)
        const actionsWithContext = actions.map(action => 
            actionToActionWithContext(action, flattenedWorkflowState, course.id, req.user?.uid)
        )

        res.json({ course, workflow, actionsWithContext, actionStates: workflowState })
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
            console.log(response)
            const workflowBase = response.length > 0 ? response[0] : null;
            if (!workflowBase)
                throw new Error("Unable to find the standard course creation template. Please contact Kenn Martinez so that it can be set.")
            let actions = [];
            if (workflowBase.rootActionId){
                const actionResponse = await workflowsFetch("GET", `/actions?workflowId=${workflowBase.id}`);
                actions = actionResponse.map(action => actionToActionWithContext(action, null, null, req.user?.uid)?.action);
            }
            else
                throw new Error("Course creation workflow must have at least one simple action. Please contact Kenn Martinez so that one can be added.")
            const baseAction = workflowBase.baseAction;
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
            sessionActions?.forEach(async action => {
               await prisma.session.create({
                    data: {
                        sessionNum: parseInt(action.metadata.outputs[0].validation.sessionNum),
                        course: {connect: {id: Number(newCourse.id)}}
                    }
               });
            });

            // For simplicity of the frontend, return minimal information, since the GET for courses will contain all the info needed, and will be called much more often.
            res.json({ course: newCourse })
        });

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
                && !isNaN(parseInt(updateData.section))
                && { section: parseInt(updateData.section) }
            ),
        }

        const updatedCourse = await prisma.course.update({
            where: { id: Number(id) },
            data: mappedData
        })

        console.log('Course updated successfully:', updatedCourse)

        const { uid: userId, asid: actionStateId } = req.query
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

/**
 * POST /api/cmt/course/create-with-workflow
 * Create a course with template and calendar events in one transaction
 * This is the multi-step workflow endpoint
 */
router.post('/create-with-workflow', async (req, res) => {
    try {
        const { course, templateId, calendarEvents } = req.body

        // Validate course data
        /* TODO: verify if these need to exist or can be deleted with workflow's own validation
    var missingField = "";
    if (!course.classId) {missingField += " Class ID ";}
    if (!course.name) {missingField += " Class Name ";}
    if (!course.semester) {missingField += "Semester ";}
    if (!course.color) {missingField += " Color ";}

    if (
      !course ||
      missingField
    ) {
      return res.status(400).json({
        success: false,
        error: `Missing required course fields: ${missingField}`,
      });
    }*/

        // Step 1: Get or create professor
        let professorId = course.professorId

        if (!professorId) {
            // Try to get professorId from authenticated user
            if (req.user && req.user.professorId) {
                professorId = req.user.professorId
                console.log(`✅ Using authenticated professorId: ${professorId}`)
            } else {
                // Fallback: Try to get the first professor, or create a default one
                let professor = await prisma.professor.findFirst()

                if (!professor) {
                    console.log('⚠️ No professor found, creating default professor...')
                    professor = await prisma.professor.create({
                        data: {
                            fname: 'Default',
                            lname: 'Professor',
                            email: 'professor@example.com',
                        },
                    })
                }

                professorId = professor.id
                console.log(`✅ Using professorId: ${professorId}`)
            }
        }

        // Step 2: Create the course
        const newCourse = await prisma.course.create({
            data: {
                classId: course.classId,
                name: course.name,
                season: course.season,
                year: parseInt(course.year),
                color: course.color,
                students: !course.students ? null : parseInt(course.students),
                section: !course.section ? null : parseInt(course.section),
                professors: { connect: { id: course.professorId } },
            },
        })

        console.log(`✅ Course created: ${newCourse.id}`)

        // Step 3: Apply template if selected
        let templateItems = []
        if (templateId) {
            try {
                const template = await prisma.courseTemplate.findUnique({
                    where: { id: parseInt(templateId) },
                    include: { templateItems: true },
                })

                if (template) {
                    templateItems = template.templateItems
                    console.log(`✅ Template loaded: ${template.name} (${templateItems.length} items)`)
                }
            } catch (error) {
                console.error('⚠️ Failed to load template:', error)
                // Continue without template - don't fail the entire request
            }
        }

        // Step 4: Create calendar events from template items + custom events
        const allEvents = []

        // Convert template items to events
        templateItems.forEach(item => {
            if (item.dueDate) {
                allEvents.push({
                    title: item.name,
                    date: item.dueDate,
                    description: item.description || '',
                    type: item.type.toLowerCase(), // 'assignment', 'exam', 'lab', 'project'
                })
            }
        })

        // Add custom calendar events
        if (calendarEvents && calendarEvents.length > 0) {
            calendarEvents.forEach(event => {
                allEvents.push({
                    title: event.title,
                    date: event.date,
                    time: event.time || '00:00',
                    description: event.description || '',
                    type: 'lecture', // default type for custom events
                })
            })
        }

        // Filter valid events
        const validEvents = allEvents.filter(event => event.title && event.date)

        if (validEvents.length > 0) {
            try {
                // Transform events for database
                const eventsToCreate = validEvents.map(event => {
                    const dateTime =
                        event.date instanceof Date ? event.date : new Date(event.date + (event.time ? `T${event.time}` : 'T00:00:00'))

                    // Map type to EventType enum
                    let eventType = 'lecture'
                    if (['exam', 'assignment', 'lab', 'office_hours', 'meeting'].includes(event.type)) {
                        eventType = event.type
                    }

                    return {
                        title: event.title,
                        date: dateTime,
                        time: event.time || '00:00',
                        description: event.description || '',
                        courseId: newCourse.id,
                        professorId: professorId, // ✅ FIXED: Added professorId to events
                        type: eventType,
                        location: '',
                        importance: 'Medium',
                    }
                })

                console.log(`✅ Created ${eventsToCreate.length} calendar events`)
            } catch (error) {
                console.error('⚠️ Failed to create calendar events:', error)
                console.error('Error details:', error.message)
                // Continue - don't fail the entire request
            }
        }

        // Step 5: Return success
        return res.status(201).json({
            success: true,
            data: {
                course: newCourse,
                eventsCreated: validEvents.length,
                templateApplied: !!templateId,
            },
        })
    } catch (error) {
        console.error('❌ Error creating course with workflow:', error)

        // If course creation failed, return error
        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                error: 'A course with this ID already exists',
            })
        }

        return res.status(500).json({
            success: false,
            error: 'Failed to create course',
        })
    }
})
