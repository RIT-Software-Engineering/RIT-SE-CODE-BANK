export {}

/**
 * Types defined by the workflows backend/domain model. These types are a subset of what the API returns.
 *
 * @typedef {any} WorkflowsActionState
 * @typedef {any} WorkflowsWorkflow
 *
 * @typedef {{
 *   name: string,
 *   description: string,
 *   id: string,
 *   actionType: "simple",
 *   metadata: Record<string, any>,
 *   isFrozen: boolean,
 *   childActions?: []
 * }} SimpleWorkflowsAction
 *
 * @typedef {{
 *   name: string,
 *   description: string,
 *   id: string,
 *   actionType: "complex" | "workflow",
 *   metadata: Record<string, any>,
 *   isFrozen: boolean,
 *   childActions?: WorkflowsAction[]
 * }} ParentWorkflowsAction
 *
 * @typedef {SimpleWorkflowsAction | ParentWorkflowsAction} WorkflowsAction
 */