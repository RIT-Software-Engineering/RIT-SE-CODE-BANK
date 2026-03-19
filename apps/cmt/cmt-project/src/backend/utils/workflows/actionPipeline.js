/**
 * The mostly definitive representation of actions for the frontend.
 * Makes the following transformations:
 *  * Parses metadata in-place (`action.metadata`)
 *  * Creates a `callback` field with the callback URL to complete the action
 *  * Creates a `state` field with `userId`'s action state
 * 
 * This could be extended to add a teamState object perhaps, that contains all the stuff relating to teams you might need.
 * This function is CMT-specific, but highly abstractable. it is really just a series of transformations the action goes through
 * to make it convenient for the frontend.
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
 * @param {Map} flattenedWorkflowState flattened map of the workflow state
 * @param {number|string} courseId the CMT course ID for building callback URLs
 * @param {string} userId the user ID for building callback URLs
 * @returns action with context including callback for simple actions
 */
export function actionToActionWithContext(action, flattenedWorkflowState, courseId, userId) {

  // Parse metadata from array to object (workflows API returns it as array)
  if (action.metadata) {
    action.metadata = parseMetadata(action.metadata)
  }

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

  return {
    action: {
      ...action,
      childActionsWithContext,
    },
    actionState,
  }
}

/**
 * CMT-Specific function, this maps action codes to callback URLs.
 * The point of this is so that an action with a code COURSE_SECTION will send the user's input to the POST endpoint for the course.
 * If this isn't neccesary, than all codes can point to the same endpoint.
 * 
 * Note that the ASID query parameter is important, since it lets the endpoint know what action got completed. The endpoint
 * must mark the action as completed.
 * 
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
export function parseMetadata(metadataArray) {
  // If its not an array, such as the case of empty metadata, which is somehow an object, return a blank object.
  if (!metadataArray.reduce) return {}

  return metadataArray.reduce((metadata, entry) => {
    return { ...metadata, [entry.key]: JSON.parse(entry.value) }
  }, {})
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