export {}

/**
 * @import { ActionWithContexts, ParsedMetadata } from "./contexts.js"
 * @import { WorkflowsWorkflow } from "./workflows.js"
 */

// Base

/**
 * @typedef {(callback: string, outputValues: any) => Promise<Response>} FetchToCallback
 * @typedef {(code: string) => boolean} IsCheckmark
 * @typedef {any} PreviousValues
 * @typedef {(code: string) => (() => void) | null} OnNavigateFactory
 *//** @typedef {{ children: React.ReactNode }} ChildrenProps */
/** @typedef {{ actionWithContexts: ActionWithContexts }} ActionWithContextsProps */
/** @typedef {{ workflow: WorkflowsWorkflow }} WorkflowProps */
/** @typedef {{ output: ParsedMetadata["outputs"][number] }} OutputDefinitionProps */
/** @typedef {(value: any) => string | null} OutputValidator */
/** @typedef {Record<string, OutputValidator>} OutputValidatorRegistry */

/**
 * Shared input behavior for text-like outputs.
 * @typedef {{
 *  value: any,
 *  onChange: (e: any) => void,
 *  onBlur?: () => void,
 *  submitted?: boolean,
 *  required?: boolean,
 *  placeholder?: string,
 *  isInvalid?: boolean,
 *  error?: string,
 *  disabled?: boolean
 * } & OutputDefinitionProps
 * } OutputFieldProps
 */

/** @typedef {OutputFieldProps} TextOutputProps */
/** @typedef {OutputFieldProps} NumberOutputProps */
/** @typedef {OutputFieldProps} SelectOutputProps */

// Containers and views

/** @typedef {ChildrenProps & ActionWithContextsProps} ActionContainerProps */
/** @typedef {ChildrenProps & WorkflowProps & { actionsWithContexts: ActionWithContexts[] }} WorkflowContainerProps */
/** @typedef {ChildrenProps & OutputDefinitionProps} OutputContainerProps */

/** @typedef {ChildrenProps & { onSubmit: () => void }} ActionEditFormProps */
/** @typedef {ActionEditFormProps & { onCancel: () => void }} CancellableEditActionFormProps */

/** @typedef {ChildrenProps & { onEdit: () => void }} EditableActionViewProps */
/** @typedef {OutputDefinitionProps & { previousValue: any }} OutputViewProps */

/** 
 * @typedef {OutputDefinitionProps & {
 *  value: any,
 *  onChange: (e: any) => void,
 *  required?: boolean
 *  disabled?: boolean
 * }} CheckmarkOutputProps
 */

/** @typedef {{ actionWithContexts: ActionWithContexts, onClick: (e: React.MouseEvent) => void }} NavigateButtonProps */
/** @typedef {{ actionWithContexts: ActionWithContexts, onClick: () => void, checked: boolean, loading: boolean, disabled: boolean }} CheckmarkActionProps */


// Util

/**
 * @template T
 * @typedef {(props: T) => React.ReactNode} Renderer<T>
 */
