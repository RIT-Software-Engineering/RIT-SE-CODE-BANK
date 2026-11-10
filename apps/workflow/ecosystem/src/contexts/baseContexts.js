// This file contains multiple transformation functions, but they are so linearly called that they probably should not be exported.

import { compressedMetadataToObject, recurseThroughActionWithContexts } from "./utils.js"

/**
 * @import { ActionWithContexts, ActionWithContextsShell } from "../types/contexts.js"
 * @import { WorkflowsAction } from "../types/workflows.js"
 */

/**
 * Applies a few of the baseline functions that are always needed. Only exists to simplify usage.
 *
 * @param {WorkflowsAction} action
 * @returns {ActionWithContexts}
 */
export function scaffoldBaseContexts(action) {
  return parseMetadata(scaffoldContextContainers(action))
}

/**
 * First thing that should be called on an action. Scaffolds the processedAction structure. To skip some steps, see {@link scaffoldBaseContexts}
 * @param {WorkflowsAction} action
 * @returns {ActionWithContextsShell}
 */
function scaffoldContextContainers(action) {
  if (action.actionType === "simple") {
    return {
      actionType: action.actionType,
      processedAction: action
    }
  }

  return {
    actionType: action.actionType,
    processedAction: {
      ...action,
      childActionsWithContexts: (action.childActions || []).map(
        childAction => scaffoldContextContainers(childAction)
      )
    }
  }
}

/**
 * The second thing that should be called on an action. decompresses all metadata. To skip some steps, see {@link scaffoldBaseContexts}
 * @param {ActionWithContextsShell} partialActionWithContexts
 * @returns {ActionWithContexts}
 */
function parseMetadata(partialActionWithContexts) {
  
  return recurseThroughActionWithContexts(partialActionWithContexts,
    partialAWC => ({
      processedAction: {
        ...partialAWC.processedAction,
        parsedMetadata: compressedMetadataToObject(partialAWC.processedAction.metadata)
      }
    })
  )
}
