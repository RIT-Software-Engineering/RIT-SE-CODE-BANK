import express from 'express'
import { cloneWorkflowState, objectToNewWorkflow } from '../utils/workflows/api.js'
import { CMTActionToActionWithContexts } from '../utils/workflows/context.js'
import { compressedMetadataToObject } from '@se-code-bank/workflows-ecosystem'
import { PrismaClient } from '../prisma/generated/client/index.js'
import { findActionsByCode } from '../utils/workflows/api.js';
import { CMTError, workflowsFetch } from '@se-code-bank/cmt-shared-utilities'

/**
 * @import { WorkflowsAction } from '@se-code-bank/workflows-ecosystem'
 */

const router = express.Router()
export default router

const prisma = new PrismaClient();

/**
 * GET /api/cmt/course
 * Get all courses from a professor
 */
router.get('/', async (req, res) => {
    const profId = req.user.uid;
    const {isTemplate, isActive} = req.query;
    const where = {
         professorId: profId, 
         isTemplate: Boolean(isTemplate),
    };
    if (isActive)
        where.active = Boolean(isActive)
    const courses = await prisma.course.findMany({
        include: { professors: true },
        where: where,
        orderBy: {id: "desc"}
    })
    res.json(courses)
})

/**
 * GET /course/templates
 * Gets all the templates that have been published via the associated workflows with our special tag
 */
router.get('/templates', async (_, res) => {
    try {
    const templateWorkflows = await workflowsFetch("GET", "/workflows?tags=TangledUpInLiesImAWorkflony");
    const availTemplates = Promise.all(templateWorkflows.map(async workflow => ( 
        await prisma.course.findFirst({
            where: {workflowId: workflow.id, active: true},
            include: {professors: true},
        })
    )));
    res.status(200).json(await availTemplates)
    }
    catch (error) {
        res.status(500).json({ error: error.message })
    }
});

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
    // TODO: check perms/if prof owns course
    const course = await prisma.course.findUnique({
        where: { id: parseInt(req.params.id), professorId: req.user.uid },
        include: {sessions: true}
    })

    if (!course) 
        throw new CMTError({ userFacingMessage: "Course not found. This course may not exist or you may not have access to it." });

    const workflow = await workflowsFetch('GET', `workflows/${course.workflowId}`)
    /** @type {WorkflowsAction[]} */
    const actions = await workflowsFetch('GET', `actions?workflowId=${course.workflowId}`)
    const workflowState = await workflowsFetch('GET', `states/workflow/${course.workflowStateId}`)
    
    const actionsWithContexts = actions.map(action => CMTActionToActionWithContexts(action, workflowState, course.id, req.user.uid)) 

    res.json({ course, workflow, actionsWithContexts, actionStates: workflowState })
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

        let metaCourseWorkflow
        let sessionActions;
        const response = await workflowsFetch("GET", `workflows/metadata?key=code&value=${JSON.stringify('Course Creation Workflow')}`,)
        const workflowBase = response.length > 0 ? response[0] : null;
        if (!workflowBase)
            throw new CMTError({ userFacingMessage: "Unable to find the standard course creation template. Please contact Kenn Martinez so that it can be set." })
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
            throw new CMTError({ userFacingMessage: "Course creation workflow must have at least one simple action. Please contact Kenn Martinez so that one can be added." })
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
        throw new CMTError({ userFacingMessage: 'Failed to create course', cause: error })
    }
})

/**
 * POST /api/cmt/course/:templateId
 * Create course workflow and course db entity based off of a template
 * Returns an object of the following format
 * ```
 * {
 *  course: CMT course object
 * }
 * ```
 */
router.post('/:templateId', async (req, res) => {
    try {
        const professorId = req.user.uid;
        const {templateId} = req.params;
        const {color, workflowId, name, code, toBeTemplate} = req.body;

        let sessionActions;
        let workflow;
        let actionResponse;
        // We use the specific workflow chosen from the template
        await workflowsFetch("GET", `workflows/${workflowId}`).then(async response => {
            const workflowBase = response;
            let actions;
            if (workflowBase.rootActionId){
                actionResponse = await workflowsFetch("GET", `/actions?workflowId=${workflowBase.id}`);
                function parseMetadata(action) {
                    action.metadata = compressedMetadataToObject(action.metadata)
                    if (action.childActions) for (action of action.childActions) parseMetadata(action)
                }
                actionResponse.forEach(action => parseMetadata(action))
                if (!toBeTemplate)
                    actionResponse = actionResponse?.filter(action => (action?.metadata?.code !== 'PUBLISH_TEMPLATE')); // Remove the publish template action
                else if (!actionResponse?.find(action => (action?.metadata?.code === 'PUBLISH_TEMPLATE')))
                    actionResponse.push({
                        name: 'Publish Your Template',
                        description: "Once you're done, press the button to publish your template for public use.\
                        In the Workflow Builder, you can add some keywords to the tags so searches are more relevant.",
                        actionType: 'simple',
                        metadata: {
                            code: 'PUBLISH_TEMPLATE',
                        },
                    })
                actions = actionResponse 
            }
            else
                throw new Error("Workflows and complex actions within the template must have at least one simple action.")
            const baseAction = workflowBase.baseAction;
            // TODO: baseAction is an empty object 
            workflow = {
                name: baseAction.name,
                description: baseAction.description,
                tags: workflowBase.tags?.filter(tag => tag !== "WorkflonyFirstTheRestNowhere_CMT_Template"),
                childActions: actions
            };
            sessionActions = findActionsByCode(workflow.childActions, "SESSION", new RegExp(`^SESSION_.*`));
        });

        // templates are technically courses, so we get all the sessions, session material, and resources from it
        const course = await prisma.course.findUnique({
            where: {id: parseInt(templateId)},
            include: {
                sessions: {
                    include: {
                        material: true
                    }
                },
                Resource: true
            }
        });

        // Do everything in a transaction so if one thing fails it reverts the DB
        await prisma.$transaction(async () => {
            const createdWorkflow = await objectToNewWorkflow(workflow, professorId)
            
            const createdState = await workflowsFetch('POST', 'states/workflow', { userId: professorId, workflowId: createdWorkflow.id }) // Create state
            console.log(`Created workflow action state with id ${createdState.id}`)
            
            // We only want to clone the workflow state if we're not creating a template
            if (!toBeTemplate) {
                // the created workflow doesn't return all the child actions so we have to get them here
                const fullCreatedWorkflow = await workflowsFetch("GET", `/actions/?workflowId=${createdWorkflow.id}`);
                await cloneWorkflowState(actionResponse, fullCreatedWorkflow);
            }

            // create the course using the same data as the template
            const newCourse = await prisma.course.create({
                data: {
                    classId: code ?? course.classId,
                    name: name ?? course.name,
                    color: color,
                    season: course.season ?? 'Fall',
                    year: toBeTemplate ? null : course.year,
                    students: toBeTemplate ? null : course.students,
                    section: toBeTemplate ? null : course.section,
                    professors: { connect: { id: professorId } },
                    workflowId: createdWorkflow.id,
                    workflowStateId: createdState.id,
                    isTemplate: toBeTemplate ?? false,
                    syllabusName: course.syllabusName,
                    startDate: course.startDate,
                    days: course.days,
                },
            });

            // If we have sessions in our meta-workflow, we autopopulate them in the new course
            const sessionData = sessionActions?.map(action => ({
                sessionNum: parseInt(action.metadata.outputs[0].validation.sessionNum),
                courseId: Number(newCourse.id)
            }));

            // copy the resourcs to the course and add them to an object as pairs for later
            const resourcePromise = course.Resource.map(async resource => {
                if (!(toBeTemplate && resource.isSyllabus)) {
                    const newResource = await req.prisma.resource.create({
                        data: {
                            name: resource.name.replace(/\..+$/, ""),
                            filename: resource.filename,
                            mimeType: resource.mimeType,
                            filePath: resource.filePath,
                            courseId: Number(newCourse.id),
                            isSyllabus: resource.isSyllabus,
                        },
                    });
                    return {old: resource.id, new: newResource.id}
                }
            });

            const resourcePairs = await Promise.all(resourcePromise);

            // Upload the sessions and mark the extra ones as status complete
            for (let i=0; i < Math.max(course.sessions?.length, sessionData.length); i++){
                const session = await prisma.session.create({
                    data: {
                        sessionNum: i+1,
                        completed: toBeTemplate ? false : course?.sessions[i]?.completed,
                        courseId: Number(newCourse.id)
                    },
                });
            
                // Go through all of the session materials now and upload them
                if (course.sessions[i]?.material.length > 0){
                    course.sessions[i]?.material.forEach(async material => {
                        let actualLabel = material.label;
                        let actualBody = material.body;
                        
                        // We have to check if we have any resources in both our label and body
                        let labelResourceMatches = material.label?.match(/\/api\/cmt\/resources\/download\/.{36}/g);
                        let bodyResourceMatches = material.body?.match(/\/api\/cmt\/resources\/download\/.{36}/g);

                        // if we have any resources in our label, we go through each one and update them to the new link
                        labelResourceMatches?.forEach(match => {
                            const newResourceId = resourcePairs.find(resource => match.match(resource?.old))?.new;
                            actualLabel = actualLabel.replace(match, `/api/cmt/resources/download/${newResourceId}`);
                        });

                        // if we have any resources in our body, we go through each one and update them to the new link
                        bodyResourceMatches?.forEach(match => {
                            const newResourceId = resourcePairs.find(resource => match.match(resource?.old))?.new;
                            actualBody = actualBody.replace(match, `/api/cmt/resources/download/${newResourceId}`);
                        });

                        await prisma.sessionMaterial.create({
                            data: {
                                sessionNum: i,
                                sessionId: session.id,
                                type: material.type,
                                body: actualBody,
                                label: actualLabel,
                                active: material.active
                            }
                        })
                    })
                }
            }


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
        ),
        ...(updateData.active !== undefined
            && {active: updateData.active}
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
})

/**
 * DELETE /api/cmt/course/:id
 * Delete a course and all related data (events, enrollments, etc.)
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params

        console.log('DELETE /api/cmt/course/:id called with:', Number(id))

        // Then delete the course
        await prisma.course.update({
            where: { id: parseInt(id) },
            data: {active: false}
        })

        res.json({
            success: true,
            message: 'Course archived.',
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
