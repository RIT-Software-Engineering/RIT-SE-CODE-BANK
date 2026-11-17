import { randomUUID } from "node:crypto";
import { compressedMetadataToObject } from "@se-code-bank/workflows-ecosystem";
import { workflowsFetch } from "@se-code-bank/cmt-shared-utilities";
import { objectToNewWorkflow } from "./workflows/api.js";
import { ownedSection, remapSectionResources, sectionError } from "./sectionContent.js";
import { refreshSectionSync, teachingWeek } from "./sectionSync.js";

export async function ensureCourseOffering(prisma, courseId, professorId) {
    return prisma.$transaction(async tx => {
        const source = await ownedSection(tx, courseId, professorId);
        if (source.isTemplate) throw sectionError("Templates do not have related sections");
        await tx.$queryRaw`SELECT id FROM Course WHERE id = ${source.id} FOR UPDATE`;
        const course = await tx.course.findUnique({where: {id: source.id}});
        if (!course.offeringId) {
            const offering = await tx.courseOffering.create({data: {
                name: course.name, classId: course.classId, season: course.season, year: course.year,
                startDate: course.startDate, professorId
            }});
            await tx.course.update({where: {id: course.id}, data: {offeringId: offering.id}});
            course.offeringId = offering.id;
        }
        const sessions = await tx.session.findMany({where: {courseId: course.id}, orderBy: {sessionNum: "asc"}});
        const days = course.days?.split(",").filter(day => day.trim()).length || 1;
        for (const session of sessions) {
            await tx.session.update({where: {id: session.id}, data: {
                sharedKey: session.sharedKey || randomUUID(),
                teachingWeek: session.teachingWeek ?? teachingWeek(session, course.startDate) ?? Math.floor((session.sessionNum - 1) / days) + 1
            }});
            for (const model of [tx.sessionBlock, tx.sessionMaterial]) {
                const rows = await model.findMany({where: {sessionId: session.id, sharedKey: null}});
                for (const row of rows) await model.update({where: {id: row.id}, data: {sharedKey: randomUUID()}});
            }
        }
        const resources = await tx.resource.findMany({where: {courseId: course.id, sharedKey: null}});
        for (const resource of resources) await tx.resource.update({where: {id: resource.id}, data: {sharedKey: randomUUID()}});
        return course;
    }, {timeout: 20000});
}

function actionMetadata(metadata) {
    const values = Array.isArray(metadata)
        ? Object.fromEntries(metadata.map(({key, value}) => [key, value]))
        : metadata || {};
    return compressedMetadataToObject(values);
}

function actionDefinition(action) {
    return {
        name: action.name, description: action.description, actionType: action.actionType,
        form: action.form, requireAllParticipants: action.requireAllParticipants,
        requiresSubmission: action.requiresSubmission, submissionMimeTypes: action.submissionMimeTypes,
        metadata: actionMetadata(action.metadata),
        ...(action.childActions && {childActions: action.childActions.map(actionDefinition)})
    };
}

async function copyWorkflowProgress(sourceStateId, targetStateId, copyProgress) {
    const source = await workflowsFetch("GET", `states/workflow/${sourceStateId}`);
    const target = await workflowsFetch("GET", `states/workflow/${targetStateId}`);
    const flatten = (state, path = "") => (state?.children || []).flatMap((child, index) => {
        const metadata = actionMetadata(child.action?.metadata);
        const key = metadata.code || `${path}/${index}:${child.action?.name}`;
        return [{...child, key}, ...flatten(child, key)];
    });
    const oldStates = new Map(flatten(source.baseActionState).map(state => [state.key, state]));
    for (const state of flatten(target.baseActionState)) {
        const old = oldStates.get(state.key);
        if (!old || state.action?.actionType !== "simple") continue;
        const isSession = String(state.key).startsWith("SESSION_");
        if ((!isSession || copyProgress) && ["completed", "inProgress"].includes(old.stateType)) {
            await workflowsFetch("PUT", `states/action/${state.id}`, {stateType: old.stateType});
        }
    }
    // Rebuild through the existing Workflows API so parent statuses reflect copied leaf states.
    await workflowsFetch("PUT", `states/workflow/${targetStateId}`, {});
}

export async function createCourseSection(prisma, professorId, courseId, input) {
    const number = typeof input.section === "string" ? input.section.trim() : "";
    if (!number || number.length > 30) throw sectionError("Enter a section number (up to 30 characters)");
    if (!["reset", "copy"].includes(input.progress || "reset")) throw sectionError("Invalid progress option");
    const course = await ensureCourseOffering(prisma, courseId, professorId);
    if (!course.active) throw sectionError("Restore this course before adding a section");
    const duplicate = await prisma.course.findFirst({where: {offeringId: course.offeringId, section: number}});
    if (duplicate || course.section === number) throw sectionError("This course already has that section number");
    const source = await prisma.course.findUnique({
        where: {id: course.id}, include: {sessions: {include: {blocks: true, material: true}, orderBy: {sessionNum: "asc"}}, Resource: true}
    });
    const definition = await workflowsFetch("GET", `workflows/${source.workflowId}`);
    const actions = await workflowsFetch("GET", `actions?workflowId=${source.workflowId}`);
    let workflow;
    try {
        workflow = await objectToNewWorkflow({
            name: definition.baseAction?.name || source.name,
            description: definition.baseAction?.description || "", childActions: actions.map(actionDefinition)
        }, professorId);
        const state = await workflowsFetch("POST", "states/workflow", {userId: professorId, workflowId: workflow.id});
        const copyProgress = input.progress === "copy";
        await copyWorkflowProgress(source.workflowStateId, state.id, copyProgress);
        const created = await prisma.$transaction(async tx => {
            await tx.$queryRaw`SELECT id FROM CourseOffering WHERE id = ${source.offeringId} FOR UPDATE`;
            const {name, classId, color, season, year, days, startDate, syllabusName, offeringId} = source;
            const section = await tx.course.create({data: {
                name, classId, color, season, year, days, startDate, syllabusName, offeringId, professorId,
                section: number, workflowId: workflow.id, workflowStateId: state.id
            }});
            // Resource rows have independent IDs; immutable uploaded files can be reused.
            for (const resource of source.Resource) {
                const {name, filename, mimeType, filePath, isSyllabus, sharedKey} = resource;
                await tx.resource.create({data: {name, filename, mimeType, filePath, isSyllabus, sharedKey, courseId: section.id}});
            }
            for (const session of source.sessions) {
                const copied = await tx.session.create({data: {
                    courseId: section.id, sessionNum: session.sessionNum, date: session.date,
                    sharedKey: session.sharedKey, teachingWeek: session.teachingWeek,
                    completed: copyProgress && session.completed
                }});
                const blockIds = new Map();
                for (const block of session.blocks) {
                    const createdBlock = await tx.sessionBlock.create({data: {
                        sessionId: copied.id, name: block.name, position: block.position, sharedKey: block.sharedKey,
                        status: copyProgress ? block.status : "NOT_STARTED"
                    }});
                    blockIds.set(block.id, createdBlock.id);
                }
                for (const material of session.material.filter(item => item.type !== "Personal Notes")) {
                    await tx.sessionMaterial.create({data: {
                        sessionId: copied.id, sessionNum: copied.sessionNum - 1,
                        blockId: blockIds.get(material.blockId) || null, sharedKey: material.sharedKey,
                        type: material.type, active: material.active,
                        label: await remapSectionResources(tx, source.id, section.id, material.label),
                        body: await remapSectionResources(tx, source.id, section.id, material.body)
                    }});
                }
            }
            return section;
        }, {timeout: 30000});
        await refreshSectionSync(prisma, created.id);
        return created;
    } catch (error) {
        if (workflow) {
            // Only clean up workflows that have not been attached to a committed section.
            const attached = await prisma.course.findFirst({where: {workflowId: workflow.id}});
            if (!attached) await workflowsFetch("DELETE", `workflows/${workflow.id}`).catch(cleanupError => console.error("Section workflow cleanup failed", cleanupError));
        }
        if (error.code === "P2002") throw sectionError("This course already has that section number", 409);
        throw error;
    }
}
