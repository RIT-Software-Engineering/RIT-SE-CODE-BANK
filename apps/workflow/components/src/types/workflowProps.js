export {}

/**
 * Shared workflow data types consumed by generic workflow renderers.
 */

/**
 * @typedef {{ action: ProcessedAction, callback?: string, actionState: WorkflowsActionState }} ActionWithContexts
 *
 * @typedef { WorkflowsAction & { metadata: ParsedMetadata, childActionsWithContext: ActionWithContexts[] }} ProcessedAction
 * Used in all Workflows Components in favor of WorkflowsActions. {@link actionToActionWithContext} should be used to create these. Requires the
 * action's metadata to be in the correct format, described in {@link ParsedMetadata}
 *
 * @typedef {{
 *  code: string
 *  outputs: {
 *     key: string
 *     name: string
 *     isRequired: boolean
 *     placeholder: any
 *     initialValue: any
 *     type: "number" | "text" | "select" | "checkmark" | "file"
 *     validation: {[index: string]: any}
 *  }[]
 * } & {[index: string]: any}} ParsedMetadata
 */

/**
 * @typedef {(callback: string, outputValues: any) => Promise<Response>} FetchToCallback
 * @typedef {(code: string) => boolean} IsCheckmark
 * @typedef {any} PreviousValues
 * @typedef {(code: string) => (() => void) | null} OnNavigateFactory
 * If this function is provided to an action renderer, the form that would be presented to the user is instead replaced with a button that the user can
 * click on to be navigated to the correct place to complete the action.
 * 
 * This function will receive the code of the action as a string. How that string is used is up to you, but here are reccomendations:
 * 1. For in-page navigation, use the code to find an element by its ID, then use window.scroll or something similar to show it to the user.
 * 2. For out-of-page navigation, use the code to get the url that the user should be redirected to.
 */

/**
 * Types defined by the workflows backend/domain model.
 *
 * @typedef {any} WorkflowsActionState
 * @typedef {any} WorkflowsAction
 * @typedef {any} WorkflowsWorkflow
 */
