export {}

/**
 * Shared workflow data types consumed by generic workflow renderers.
 */

/**
 * @typedef {{ action: ProcessedAction, callback?: string, actionState: WorkflowsActionState }} ActionWithContexts
 *
 * @typedef { WorkflowsAction & { metadata: ParsedMetadata, childActionsWithContext: ActionWithContexts[] }} ProcessedAction
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
 */

/**
 * Types defined by the workflows backend/domain model.
 *
 * @typedef {any} WorkflowsActionState
 * @typedef {any} WorkflowsAction
 * @typedef {any} WorkflowsWorkflow
 */
