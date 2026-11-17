export function codeOf(workflowChild){
    const row = workflowChild?.action?.metadata?.find(
        item => item.key === 'code'
    );
    return row ? JSON.parse(row.value) : null;
}

export function findStartChild(state){
    return state?.baseActionState?.children?.find(
        child => codeOf(child) === 'START_COURSE'
    );
}

export function isStarted(state){
    return findStartChild(state)?.stateType === 'completed';
}
