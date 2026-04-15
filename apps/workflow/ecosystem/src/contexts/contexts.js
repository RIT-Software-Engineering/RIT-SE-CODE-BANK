export { compressedMetadataToObject } from "./utils.js"

/**
 * @import { ActionWithContexts, DetermineCallback } from "../types/contexts.js"
 */

import { flattenActionStates, recurseThroughActionWithContexts } from "./utils.js"

/**
 * Neccesary in most cases when planning to use Workflows Components. Associates each action state with its corresponding action and adds it at the top level.
 * @param {ActionWithContexts} partialActionWithContexts
 * @param {object} actionStates the user's action states as returned by a GET to the states/workflows/:workflowStateId endpoint of the Workflows API
 */
export function addActionStateContext(partialActionWithContexts, actionStates) {
  const flattenedActionStates = flattenActionStates(actionStates)

  return recurseThroughActionWithContexts(partialActionWithContexts,
    actionWithContexts => ({
      actionState: flattenedActionStates.get(actionWithContexts.processedAction.id)
    })
  )
}

/**
 * Neccesary in most cases when planning to use Workflows Components. Based on the actions code and associated action state, allows you to generate a callback URL which is then attached at the top level.
 * @param {ActionWithContexts} partialActionWithContexts 
 * @param {object} actionStates the user's action states as returned by a GET to the states/workflows/:workflowStateId endpoint of the Workflows API
 * @param {DetermineCallback} determineCallback 
 * @returns 
 */
export function addCallbackContext(partialActionWithContexts, actionStates, determineCallback) {
  const flattenedActionStates = flattenActionStates(actionStates)
  console.log("partial", partialActionWithContexts)
  return recurseThroughActionWithContexts(partialActionWithContexts,
    currentNode => ({
      callback: (
        currentNode.processedAction.parsedMetadata.code
        && determineCallback(
          currentNode.processedAction.parsedMetadata.code,
          flattenedActionStates.get(currentNode.processedAction.id).id
        )
      ) ?? undefined
    })
  )
}

