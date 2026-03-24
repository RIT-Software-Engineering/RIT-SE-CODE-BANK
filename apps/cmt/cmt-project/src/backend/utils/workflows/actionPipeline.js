/**
 * The mostly definitive representation of actions for the frontend.
 * Makes the following transformations:
 *  * Parses metadata in-place (`action.metadata`)
 *  * Creates a `callback` field with the callback URL to complete the action
 *  * Creates a `state` field with `userId`'s action state
 * 
 * It is given in the following structure:
 * ```
 * {
 *  action: {
 *    ...all action fields from the API,
 *    childActionsWithContext: {
 *      this whole thing nested
 *    }
 *  } 
 *  callback: "..."
 *  state: {
 *    ...all actionState fields cfrom the API,
 *  }
 * }
 * ```
 * 
 * ### This mutates the given action!
 * 
 * @param {object} action an action as given by the workflows API 
 * @param {Map|null} flattenedWorkflowState flattened map of the workflow state
 * @param {number|string|null} courseId the CMT course ID for building callback URLs
 * @param {string} userId the user ID for building callback URLs
 * @returns action with context including callback for simple actions
 */
export function actionToActionWithContext(action, flattenedWorkflowState, courseId, userId) {

  // Parse metadata from array to object (workflows API returns it as array)
  if (action.metadata) {
      action.metadata = metadataArrayToObject(action.metadata)
  }

  let returnAction;
  if (flattenedWorkflowState && courseId){
    const actionState = flattenedWorkflowState.get(action.id)

    // Base case
    if (action.actionType === "simple") {
      return {
        action,
        callback: determineCallback(action.metadata.code, actionState.id, courseId, userId),
        actionState,
      }
    }

    // Recursive case. Both complex and workflow actions behave the same here
    const childActionsWithContext = action.childActions.map(child =>
      actionToActionWithContext(child, flattenedWorkflowState, courseId, userId)
    ) 

    returnAction = {
    action: {
      ...action,
      childActionsWithContext,
    },
    actionState,
    };
  }

  else { 
    (action.childActions||[]).forEach(child =>
      actionToActionWithContext(child, null, null, userId)
    ) 
    returnAction = {action: {...action}}
  }
  return returnAction
}

/**
 * @param {string} code code from the metadata, so that we can generate the correct callback URL
 * @param {string} asid action state id, so that we can mark the correct action as completed
 * @param {number|string} courseId the CMT course ID for building callback URLs
 * @param {string} userId the user ID for building callback URLs
 * @returns callback URL string
 */
export function determineCallback(code, asid, courseId, userId) {
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

/**
* Workflows will take the object you give to it as the metadata and turn it into an array of key value pairs.
* This makes it very hard to access by key, so this function will take that array and turn it back into an object.
* It is meant for usage with {@link makeMetadataSafeForWorkflows} when uploading metadata 
* 
* @param {any} metadataArray array of metadata given by the workflows API (and our endpoints)
*/
export function metadataArrayToObject(metadataArray) {
  if (!metadataArray) return {}

  return Object.fromEntries(Object.entries(metadataArray).map(([key, value]) => {
    return [key, JSON.parse(value)];
  }));
}

/**
 * Flattens the nested action states returned by states/workflow/:id
 * AI-generated function
 * 
 * @param {object} actionStates action states as given by the states/workflow/:id endpoint
 * @returns {Map} Map of action id to action state
 */
export function flattenActionStates(actionStates) {
  const map = new Map()

  function traverse(children) {
    if (!children) return
    for (const state of children) {
      map.set(state.actionId, state)
      if (state.children) {
        traverse(state.children)
      }
    }
  }

  traverse(actionStates.baseActionState.children)
  return map
}