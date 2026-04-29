export {}

/**
 * @import { ParentWorkflowsAction, SimpleWorkflowsAction, WorkflowsActionState } from "./workflows.js"
 */

/**
 * Next smallest type: ParsedActionWithContextsShell
 * @typedef {(
 *   | {
 *      actionType: "simple",
 *      processedAction: Omit<SimpleWorkflowsAction & {
 *          parsedMetadata: ParsedMetadata
 *       }, "action">
 *   }
 *   | {
 *       actionType: "complex" | "workflow",
 *       processedAction: Omit<ParentWorkflowsAction & {
 *         parsedMetadata: ParsedMetadata,
 *         childActionsWithContexts: ActionWithContexts[]
 *       }, "action">
 *     }
 * ) & {
 *   actionState: WorkflowsActionState,
 *   callback: string
 * } & Record<string, any>} ActionWithContexts
 */

/**
 * Next smallest type: ActionWithContextsShell
 * @typedef {(
 *   | {
 *       actionType: "simple",
 *       processedAction: SimpleWorkflowsAction & {
 *          parsedMetadata: ParsedMetadata
 *       }
 *   }
 *   | {
 *       actionType: "complex" | "workflow",
 *       processedAction: ParentWorkflowsAction & {
 *         parsedMetadata: ParsedMetadata,
 *         childActionsWithContexts: ParsedActionWithContextsShell[]
 *       }
 *   }
 * )} ParsedActionWithContextsShell
 */

/**
 * Smallest type
 * @typedef {(
 *      | {
 *          actionType: "simple",
 *          processedAction: SimpleWorkflowsAction
 *      }
 *      | {
 *          actionType: "complex" | "workflow",
 *          processedAction: ParentWorkflowsAction & {
 *              childActionsWithContexts: ActionWithContextsShell[]
 *          }
 *      }
 * )} ActionWithContextsShell
 */

/**
 * @typedef {{
 *  code?: string
 *  outputs?: {
 *     key: string
 *     name: string
 *     isRequired: boolean
 *     placeholder: any
 *     initialValue: any
 *     type: "number" | "text" | "select" | "checkmark" | "file" | "multiselect"
 *     validation: {[index: string]: any}
 *  }[]
 * } & {[index: string]: any}} ParsedMetadata
 * Used in all Workflows Components in favor of plain metadata. When putting metadata in an action, {@link makeMetadataSafeForWorkflows} should be used.
 *
 * After retriving an action, to turn the returned plain metadata object to a ParsedMetadata object, use {@link actionToActionWithContexts} as described in {@link ProcessedAction}
 * If for some reason you don't want the rest of the action to be processed, you could also use {@link compressedMetadataToObject}.
 *
 * A short explanation of each field:
 * * Code: an action's code will map directly to it's callback URL. An example is CMT's {@link determineCallback} function
 * * Outputs: an array, each one indicating the user will need to enter one value.
 *      * key: the internal name of the value, which should be respected across any associated {@link previousValues} and callback-targeted endpoints
 *      * name: the external label for the value
 *      * isRequired: whether or not validation will require the user to fill out this output
 *      * placeholder: the value that will be shown as the html placeholder for the element
 *      * initialValue: the value that will be initially populated into the form if none existed in previousValues
 *      * type: the form type, which usually matches with html form types.
 *      * validation: an object with validation details. Keys vary between type. Check the various {@link OutputRenderer}s for the exact keys that are supported.
 * * [index: string: any]: this means that other information can potentially exist alongside these values, but that Workflows Components don't rely on them.
 */

/**
 * @typedef {(code: string, actionStateId: string) => string} DetermineCallback
 * Given an actions code and the relevant user's action state ID, this function should return a callback URL.
 * 
 * If you don't see how different URLs for different codes is useful for you, then have every code go to the same URL. What is important is that you include the action state ID in some way (probably query params), since the endpoint you return here will be responsible for checking the user off on that action.
 * 
 * You can see CMT's determine callback function and associated endpoint for an example.
 */