import { addActionStateContext, addCallbackContext, scaffoldBaseContexts } from "@se-code-bank/workflows-ecosystem"

export function CMTActionToActionWithContexts(action, actionStates, courseId, userId) {
    const baseActionsWithContexts = scaffoldBaseContexts(action)
    const actionsWithActionStateContexts = actionStates ? addActionStateContext(baseActionsWithContexts, actionStates) : baseActionsWithContexts
    const actionsWithCallbackContexts = (courseId && userId) ? addCallbackContext(actionsWithActionStateContexts, actionStates, CMTDetermineCallbackFactory(courseId, userId)) : actionsWithActionStateContexts

    return actionsWithCallbackContexts
}

/**
 * @param {number|string} courseId the CMT course ID for building callback URLs
 * @param {string} userId the user ID for building callback URLs
 * @returns callback URL string
 */
function CMTDetermineCallbackFactory(courseId, userId) {
    return (code, asid) => {
        if (code === 'COURSE_SECTION') {
            return `course/${courseId}?uid=${userId}&asid=${asid}`
        } if (code === 'NUMBER_STUDENTS') {
            return `course/${courseId}?uid=${userId}&asid=${asid}`
        } if (code === 'COURSE_SEMESTER') {
            return `course/${courseId}?uid=${userId}&asid=${asid}`
        } if (code.includes('CHECKMARK') || code.includes("SESSION_")) {
            return `workflow/editCheckmarkAction?uid=${userId}&asid=${asid}`
        }
        throw Error('Unrecognized action metadata code ' + code)
    }
}