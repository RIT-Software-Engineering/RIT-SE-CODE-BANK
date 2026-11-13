import { workflowsFetch } from "@se-code-bank/cmt-shared-utilities";
import { createAction, makeMetadataSafeForWorkflows } from "./workflows/api.js";

export const NOTE_CODE = 'NOTE_TO_SELF';
const NOTE_STATE_TO_STATUS = {open: 'notStarted', done: 'completed', archived: 'hidden'};

export function isNoteAction(action){
    try{
        return JSON.parse(action?.metadata?.code) === NOTE_CODE;
    } catch(error){
        console.error("Failed to check if action is a note:", error);
        return false;
    }
}

// gets one metadata value from a workflow-state child
function metaOf(child, key){
    const row = child?.action?.metadata?.find(item => item.key === key);
    return row ? JSON.parse(row.value) : null;
}

function toNote(child){
    const status = child.stateType === 'completed' ? 'done' : child.stateType === 'hidden' ? 'archived' : 'open';
    
    return {
        id: child.id,
        text: child.action?.description ?? '',
        status: status,
        createdAt: metaOf(child, "createdAt"),
        lastUpdatedAt: metaOf(child, "updatedAt"),
        dueAt: metaOf(child, "dueAt"),
    }
}

export async function createNote(course, userId, text, dueAt=null){
    const created = await createAction(
        userId, "Note to Self", text, 'simple',
        {code: NOTE_CODE, ownerId: userId, courseId: course.id,
            createdAt: new Date().toISOString(), 
            updatedAt: new Date().toISOString(), dueAt
        }, null);

    try{
        const actions = await workflowsFetch('GET', `actions?workflowId=${course.execWorkflowId}`);
        const lastAction = actions.filter(action => action.id !== created.id).pop();

        await workflowsFetch('PUT', `actions/${lastAction.id}`, {nextActionId: created.id});

        const synced = await workflowsFetch('PUT', `states/workflow/${course.execWorkflowStateId}`, {});
        const child = synced?.baseActionState?.children?.find(child => child.actionId === created.id);

        if(!child){
            throw new Error("The new note did not get a state after syncing.");
        }

        return {...toNote(child), text};

    } catch(error){
        await workflowsFetch('DELETE', `actions/${created.id}`).catch(() => {});
        throw error;
    }
}

export async function editNote(execStateId, userId, stateId, {text, dueAt}){
    const state = await workflowsFetch('GET', `states/workflow/${execStateId}`);
    const child = state?.baseActionState?.children?.find(child => child.id === stateId);
    if (!child || metaOf(child, 'code') !== NOTE_CODE || metaOf(child, 'ownerId') !== userId) return null;

    const metadata = Object.fromEntries(child.action.metadata.map(row => [row.key, JSON.parse(row.value)]));
    metadata.updatedAt = new Date().toISOString();
    if (dueAt !== undefined) metadata.dueAt = dueAt;

    await workflowsFetch('PUT', `actions/${child.actionId}`, {
        ...(text !== undefined ? {description: text} : {}),
        metadata: makeMetadataSafeForWorkflows(metadata),
    });

    return {
        ...toNote(child),
        text: text ?? child.action.description,
        dueAt: metadata.dueAt ?? null,
        lastUpdatedAt: metadata.updatedAt,
    };
}

export async function listNotes(execStateId, userId, includeArchived=false){
    const state = await workflowsFetch('GET', `states/workflow/${execStateId}`);
    const children = state?.baseActionState?.children ?? [];
    return children
        .filter(child => metaOf(child, 'code') === NOTE_CODE && metaOf(child, 'ownerId') === userId)
        .map(toNote).filter(note => includeArchived || note.status !== 'archived')
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function setNoteStatus(execStateId, userId, stateId, status){
    const stateType = NOTE_STATE_TO_STATUS[status];
    if (!stateType) return null;

    const state = await workflowsFetch('GET', `states/workflow/${execStateId}`);
    const child = state?.baseActionState?.children?.find(c => c.id === stateId);
    const isMine = metaOf(child, 'code') === NOTE_CODE && metaOf(child, 'ownerId') === userId;

    if (!child ||!isMine) return null;

    await workflowsFetch('PUT', `states/action/${stateId}`, {stateType});
    return {...toNote(child), status};
}