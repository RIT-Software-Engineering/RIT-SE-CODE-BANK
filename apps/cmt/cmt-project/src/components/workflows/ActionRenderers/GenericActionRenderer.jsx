import { useCallback } from 'react'
import { OutputRenderer } from '../OutputRenderer'
import { Button } from 'react-bootstrap'

/**
 * @import { ParsedMetadata, ActionWithContext, FetchToCallback } from "../typedefs"
 * @import { CourseDashboard } from "../../../pages/course/CourseDashboard"
 */

/**
 * A shared type across most action renderers. The actionWithContext's metadata is read and displayed as a form, and the previousValues are used to populate the form, if they exist.
 * Then, on submission, fetchToCallback is called with the callback and user input, and then refresh is called, which should refetch the workflow, actionsWithContext, and the corresponding values for the previousValues object.
 * An example for these functions can be found in {@link CourseDashboard}
 *
 * @template T
 * @typedef {{
 *  actionWithContext: ActionWithContext & { action: { metadata: T } },
 *  previousValues: Record<keyof T, any>,
 *  refresh: () => void,
 *  fetchToCallback: FetchToCallback
 * }} ActionRendererProps
 */

/**
 * Abstract action renderer which lacks a <Form /> element and hence lacks any submit behavior, meant to be extended by other action renderers.
 *
 * This element also takes in a validator registry, which, as far as the consumer is concerned, only needs to be an empty React Ref Object.
 * Internally, each output renderer will register validation functions to the validator which will run prior to form submission. These validators are determined based off of metadata, specifically, the validation field of an output.
 *
 * @param {{
 *  metadata: ParsedMetadata,
 *  outputValues: Object,
 *  setOutputValues: React.Dispatch<React.SetStateAction<Object>>,
 *  submitted: boolean,
 *  validatorRegistry: React.RefObject<Object>
 * }} props
 */
export function AbstractActionRenderer({ metadata, outputValues, setOutputValues, submitted, validatorRegistry }) {
    return (
        <>
            {metadata.outputs.map(output => (
                <OutputRenderer
                    key={output.key}
                    output={output}
                    value={outputValues[output.key]}
                    setValue={value => setOutputValues(prevValues => ({ ...prevValues, [output.key]: value }))}
                    submitted={submitted}
                    validatorRegistry={validatorRegistry}
                />
            ))}
        </>
    )
}

/**
 * A slight exception from the standard Action Renderer. Checkmark actions, in order to be as flexible as possible, don't have any keys in their metadata. Since there's no form, there are also no outputs, or any related fields.
 * This means they aren't tied to a consumer and are tracked entirely in the Workflows API. the "fetchToCallback" function given to this renderer should actually expect a boolean as the value.
 * @template T
 * @param {Omit<ActionRendererProps<T>, "previousValues">} props
 */
export function CheckmarkActionRenderer({ actionWithContext, refresh, fetchToCallback }) {
    const checked = actionWithContext.actionState.stateType === 'completed'

    const submit = useCallback(
        newChecked => void fetchToCallback(actionWithContext.callback, { checked: newChecked }).then(refresh),
        [actionWithContext.callback, fetchToCallback, refresh],
    )

    return (
        <Button
            variant={checked ? 'outline-secondary' : 'primary'}
            onClick={e => {
                e.stopPropagation()
                submit(!checked)
            }}
        >
            {checked ? 'Mark as Incomplete' : 'Mark as Complete'}
        </Button>
    )
}
