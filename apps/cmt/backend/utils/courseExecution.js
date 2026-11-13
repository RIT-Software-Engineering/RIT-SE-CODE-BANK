import { workflowsFetch } from "../../shared-utilities/cmtFetch.js";

export function codeOf(workflowChild){
    const row = workflowChild?.action?.metadata?.find(
        item => item.key === 'code'
    );
    return row ? JSON.parse(row.value) : null;
}

export function findChildByCode(state, code){
    return searchChildren(state?.baseActionState?.children, code);
}

export function searchChildren(children, code){
    if (!children) return
    
    for (const child of children){
        if (codeOf(child) === code){
            return child;
        } else{
            const found = searchChildren(child.children, code);
            if (found) return found;
        }
    }
    return null;
}

export function isStarted(state){
    return findChildByCode(state, 'START_COURSE')?.stateType === 'completed';
}

export const actionCodeForEvent = {
    'holiday': 'SEND_HOLIDAY_NOTICE',
    'holiday_update': 'SEND_HOLIDAY_CHANGE',
    'class_cancelled': 'SEND_CANCELLED_CLASS',
    'content_moved': 'SEND_MOVED_CONTENT',
    'course_started': 'SEND_WELCOME',
    'material_changed': 'SEND_MATERIAL_CHANGE'
}

export async function completeAction(course, code){
    const child = await getActionState(course, code);

    if (!child || child.stateType === 'completed') return;

    await workflowsFetch('POST', `states/handleSubmit`, {actionStateId: child.id, stateType: 'completed'});
}

export async function getActionState(course, code){
    if (!course.execWorkflowStateId) return;
    const state = await workflowsFetch('GET', `states/workflow/${course.execWorkflowStateId}`);

    return findChildByCode(state, code);
}

export function eventsForCode(code){
    return Object.keys(actionCodeForEvent).filter(event => actionCodeForEvent[event] === code);
}
