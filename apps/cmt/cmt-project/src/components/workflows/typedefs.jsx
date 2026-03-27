export {}

/**
 * These imports exist so that the link elements in the typedef descriptions work
 * @import { WorkflowRenderer } from "./WorkflowRenderer"
 * @import { FormActionRenderer } from "./ActionRenderers/FormActionRenderer"
 * @import { makeMetadataSafeForWorkflows } from "../../backend/utils/workflows/api"
 * @import { compressedMetadataToObject, actionToActionWithContext, determineCallback } from "../../backend/utils/workflows/actionPipeline"
 * @import { CheckmarkActionRenderer } from "./ActionRenderers/GenericActionRenderer"
 * @import { OutputRenderer } from "./OutputRenderer"
 */

/**
 * Backend-centric types. In CMT, actions are usually handled with these types in the backend for convenience.
 */

/**
 * @typedef {{ action: ProcessedAction, callback: string, actionState: WorkflowsActionState }} ActionWithContext
 * Used in all Workflows Components. When using Workflows Components, the callback is a URL that will be called via "PUT" to both mark the completion of an action
 * and update your database with the user's input.
 * 
 * {@link actionToActionWithContext} contains information on this process. Also to note is {@link determineCallback}, which is CMT specific, but possibly helpful for new consumers.
 * 
 * 
 * @typedef { WorkflowsAction & { metadata: ParsedMetadata, childActionsWithContext: ActionWithContext[] }} ProcessedAction
 * Used in all Workflows Components in favor of WorkflowsActions. {@link actionToActionWithContext} should be used to create these. Requires the
 * action's metadata to be in the correct format, described in {@link ParsedMetadata}
 * 
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
 * Used in all Workflows Components in favor of plain metadata. When putting metadata in an action, {@link makeMetadataSafeForWorkflows} should be used.
 * 
 * After retriving an action, to turn the returned plain metadata object to a ParsedMetadata object, use {@link actionToActionWithContext} as described in {@link ProcessedAction}
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
 * Frontend-centric types.
 */

/**
 * @typedef {(callback: string, outputValues: any) => Promise<Response>} FetchToCallback
 * Used in places like {@link FormActionRenderer} to make the request to the action's callback.
 * 
 * Typically given the callback URL as a string, and the output values as an object with key-value pairs corresponding to the action's metadata's specified keys, and the user's input.
 * 
 * One exception is with {@link CheckmarkActionRenderer}
 * 
 * 
 * @typedef {(code: string) => boolean} IsCheckmark
 * Used in places like {@link WorkflowRenderer} to decide if an action is a checkbox action or not.
 * 
 * Typically given the value of the "code" key of the {@link ParsedMetadata}, and should return whether or not that code represents a checkbox action
 * 
 * 
 * @typedef {any} PreviousValues
 * Used in most action renderers (such as {@link SimpleCardActionRenderer}) to populate previously entered values for outputs.
 * 
 * For example, many of CMT's actions correspond to fields of our Course objects. This means those action's metadata have keys that correspond to a course's keys.
 * 
 * (e.g.)
 * ```
 *      // this is the shape that the DB schema uses, and how the backend gives it, and how the backend updates it. 
 *      course = { name: "Intro to SE" code: null, year: 2020, season: "Spring" }
 *      // this is an action's metadata, that must also use the same keys!
 *      metadata = {
 *          outputs: [
 *              { key: name, ...},
 *              { key: code, ...}
 *          ]
 *      }
 * ```
 * 
 * In this case, "course" and its fields are previously entered values, and so when passed alongside that action, Workflows Components will use
 * it to populate those previously entered values.
 * 
 * 
 * @typedef {(code: string) => () => void} onNavigateFactory
 * If this function is provided to an action renderer, the form that would be presented to the user is instead replaced with a button that the user can
 * click on to be navigated to the correct place to complete the action.
 * 
 * This function will receive the code of the action as a string. How that string is used is up to you, but here are reccomendations:
 * 1. For in-page navigation, use the code to find an element by its ID, then use window.scroll or something similar to show it to the user.
 * 2. For out-of-page navigation, use the code to get the url that the user should be redirected to.
 * 
 */

/**
 * Types that are already defined in workflows documentation.
 * 
 * @typedef {any} WorkflowsActionState Fields can be found in the Workflows documentation
 * @typedef {any} WorkflowsAction Fields can be found in Workflows documentation
 * @typedef {any} WorkflowsWorkflow Fields can be found in Workflows documentation 
 */