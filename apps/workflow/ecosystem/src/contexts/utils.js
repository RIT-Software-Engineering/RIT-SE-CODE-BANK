/**
 * @import { ParsedMetadata } from "../types/contexts.js"
 * @import { ActionWithContextsShell } from "../types/contexts.js"
 */

/**
 * Recursively rebuilds the action tree and shallow-merges additive context
 * fields returned by `transformFunction` onto each node.
 *
 * @template {ActionWithContextsShell} T
 * @param {T} partialActionWithContexts An action-with-contexts node in the pipeline.
 * @param {(partialActionWithContexts: T) => object | void} getFieldToAdd Returns additive fields to merge onto each node.
 * @returns {T & object}
 */
export function recurseThroughActionWithContexts(partialActionWithContexts, getFieldToAdd) {
  if (partialActionWithContexts.actionType === "simple")
    return {
      ...partialActionWithContexts,
      ...(getFieldToAdd(partialActionWithContexts) || {})
    }

  const childActionsWithContexts = partialActionWithContexts.processedAction.childActionsWithContexts
  
  const actionWithProcessedChildren = {
    ...partialActionWithContexts,
    processedAction: {
      ...partialActionWithContexts.processedAction,
      childActionsWithContexts: childActionsWithContexts.map(
        child => recurseThroughActionWithContexts(child, getFieldToAdd)
      )
    }
  }

  return {
    ...actionWithProcessedChildren,
    ...(getFieldToAdd(actionWithProcessedChildren) || {})
  }
}


/**
* Workflows will take the object you give to it as the metadata and turn it into an object with a key and a JSONified value.
* This function goes through each key value pair and turns the value back into an Object instead of a string
* It is meant for usage with {@link makeMetadataSafeForWorkflows} when uploading metadata
*
* @param {any} compressedMetadata  metadata given by the workflows API (and our endpoints)
* @returns {ParsedMetadata}
*/
export function compressedMetadataToObject(compressedMetadata) {
  if (!compressedMetadata) return {}

  return Object.fromEntries(Object.entries(compressedMetadata).map(([key, value]) => {
    return [key, JSON.parse(value)]
  }))
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
