import React, { useCallback, useRef, useState } from 'react'
import { Output } from './Outputs.jsx'
import { metadataObjectToState } from '../utils.jsx'

/**
 * @import { ActionContainerProps, ActionEditFormProps, CancellableEditActionFormProps, CheckmarkActionProps, EditableActionViewProps, FetchToCallback, IsCheckmark, NavigateButtonProps, OnNavigateFactory, OutputValidatorRegistry, OutputViewProps, PreviousValues, Renderer } from '../../types/components.js'
 * @import { ActionWithContexts } from '../../types/contexts.js'
 * @import { CardActionRenderers } from './Actions.jsx'
 */


/**
 * @template T
 * @typedef {{
 *  actionWithContexts: ActionWithContexts & { processedAction: { metadata: T } },
 *  previousValues: PreviousValues & Record<keyof T, any>,
 *  refresh: () => void,
 *  fetchToCallback: FetchToCallback,
 *  onNavigateFactory?: OnNavigateFactory
 * }} ActionProps
 */

/**
 * @typedef {{ 
 *      renderers: {
 *          SimpleCardContainer: Renderer<ActionContainerProps>
 *          ComplexCardContainer: Renderer<ActionContainerProps>
 *          CheckmarkActionRenderers: CheckmarkActionRenderers['renderers']
 *          FormActionRenderers: FormActionRenderers['renderers']
 *          ViewEditActionRenderers: ViewEditActionRenderers['renderers']
 *      }}
 * } CardActionRenderers
 */
/**
 * @template T
 * @param { ActionProps<T> & CardActionRenderers & { isCheckmark: IsCheckmark } } props
 */
export function CardAction(props) {
    const { actionWithContexts, renderers, isCheckmark, previousValues, refresh, fetchToCallback, onNavigateFactory } = props
    const { processedAction, actionState } = actionWithContexts
    const actionProps = { actionWithContexts, previousValues, refresh, fetchToCallback, onNavigateFactory }

    if (processedAction.actionType === 'complex' || processedAction.actionType === 'workflow') {
        return (
            <renderers.ComplexCardContainer actionWithContexts={actionWithContexts}>
                {processedAction.childActionsWithContexts?.map(childActionWithContexts => (
                    <CardAction key={childActionWithContexts.processedAction.id} {...props} actionWithContexts={childActionWithContexts} />
                ))}
            </renderers.ComplexCardContainer>
        )
    }
    if (processedAction.actionType === 'simple') {
        let form

        if (processedAction.parsedMetadata?.code && isCheckmark(processedAction.parsedMetadata.code)) form = <CheckmarkAction {...actionProps} renderers={renderers.CheckmarkActionRenderers} />
        else if (actionState.stateType === 'completed') form = <ViewEditAction {...actionProps} renderers={renderers.ViewEditActionRenderers} />
        else form = <FormAction {...actionProps} renderers={renderers.FormActionRenderers} />

        return <renderers.SimpleCardContainer actionWithContexts={actionWithContexts}> {form} </renderers.SimpleCardContainer>
    } else {
        throw Error(`Unknown action type: ${processedAction.actionType}`)
    }
}

/**
 * @typedef {{ 
 *      renderers: {
 *          CancellableEditActionForm: Renderer<CancellableEditActionFormProps>
 *          EditableActionView: Renderer<EditableActionViewProps>
 *          OutputView: Renderer<OutputViewProps>
 *          ActionContentRenderers: ActionContentRenderers['renderers']
 *      }}
 *  } ViewEditActionRenderers
 */
/**
 * @template T
 * @param { ActionProps<T> & ViewEditActionRenderers } props
 */
export function ViewEditAction(props) {
    const { renderers, actionWithContexts, previousValues, refresh, fetchToCallback, onNavigateFactory } = props

    const [outputValues, setOutputValues] = useState(metadataObjectToState(actionWithContexts.processedAction.parsedMetadata, previousValues))

    const validatorRegistry = useRef(/** @type {OutputValidatorRegistry} */ ({}))
    const [submitted, setSubmitted] = useState(false)

    async function onSubmit(e) {
        e.preventDefault()

        setSubmitted(true)
        const allValid = Object.entries(validatorRegistry.current).every(([key, validateFn]) => {
            const value = outputValues[key]
            return validateFn(value) === null
        })
        if (!allValid) return

        await fetchToCallback(actionWithContexts.callback, outputValues)
        await refresh()
        setIsEditing(false)
    }

    const [isEditing, setIsEditing] = useState(false)
    return isEditing ? (
        <renderers.CancellableEditActionForm
            onSubmit={onSubmit}
            onCancel={() => {
                setIsEditing(false)
                setSubmitted(false)
            }}
        >
            <ActionContent
                actionWithContexts={actionWithContexts}
                onNavigateFactory={onNavigateFactory}
                renderers={renderers.ActionContentRenderers}
                outputValues={outputValues}
                setOutputValues={setOutputValues}
                submitted={submitted}
                validatorRegistry={validatorRegistry}
            />
        </renderers.CancellableEditActionForm>
    ) : (
        <renderers.EditableActionView onEdit={() => setIsEditing(true)}>
            {actionWithContexts.processedAction.parsedMetadata.outputs.map(output => (
                <renderers.OutputView key={output.key} output={output} previousValue={previousValues[output.key]} />
            ))}
        </renderers.EditableActionView>
    )
}

/**
 * @typedef {{
 *      renderers: {
 *          ActionEditForm: Renderer<ActionEditFormProps> 
 *          ActionContentRenderers: ActionContentRenderers['renderers']
 *      }}
 *  } FormActionRenderers
 */
/**
 * @template T
 * @param { ActionProps<T> & FormActionRenderers } props
 */
export function FormAction(props) {
    const { renderers, actionWithContexts, previousValues, refresh, fetchToCallback, onNavigateFactory } = props

    const [outputValues, setOutputValues] = useState(metadataObjectToState(actionWithContexts.processedAction.parsedMetadata, previousValues))

    const validatorRegistry = useRef(/** @type {OutputValidatorRegistry} */ ({}))
    const [submitted, setSubmitted] = useState(false)

    async function onSubmit(e) {
        e.preventDefault()

        setSubmitted(true)
        const allValid = Object.entries(validatorRegistry.current).every(([key, validateFn]) => {
            const value = outputValues[key]
            return validateFn(value) === null
        })
        if (!allValid) return

        await fetchToCallback(actionWithContexts.callback, outputValues)
        refresh()
    }

    return (
        <renderers.ActionEditForm onSubmit={onSubmit}>
            <ActionContent
                actionWithContexts={actionWithContexts}
                onNavigateFactory={onNavigateFactory}
                renderers={renderers.ActionContentRenderers}
                outputValues={outputValues}
                setOutputValues={setOutputValues}
                submitted={submitted}
                validatorRegistry={validatorRegistry}
            />
        </renderers.ActionEditForm>
    )
}

/**
 * @typedef {{
 *      renderers: {
 *          NavigateButton: Renderer<NavigateButtonProps>
 *          CheckmarkAction: Renderer<CheckmarkActionProps>
 *      }}
 *  } CheckmarkActionRenderers
 */
/**
 * @param {{
 *  actionWithContexts: ActionWithContexts,
 *  fetchToCallback: FetchToCallback
 *  onNavigateFactory?: OnNavigateFactory,
 *  refresh: () => void
 *  disabled?: boolean
 * } & CheckmarkActionRenderers } props
 */
export function CheckmarkAction({ actionWithContexts, onNavigateFactory, fetchToCallback, renderers, refresh, disabled }) {
    const checked = actionWithContexts.actionState.stateType === 'completed'

    const [loading, setLoading] = useState(false)

    const submit = useCallback(newChecked => {
        setLoading(true)
        void fetchToCallback(actionWithContexts.callback, { checked: newChecked }).then(() => { setLoading(false); refresh() })
    }, [actionWithContexts.callback, fetchToCallback, refresh])

    const code = actionWithContexts.processedAction?.parsedMetadata?.code
    const onNavigate = code && onNavigateFactory && onNavigateFactory(code)

    return onNavigate ? (
        <renderers.NavigateButton actionWithContexts={actionWithContexts} onClick={onNavigate}></renderers.NavigateButton>
    ) : (
        <renderers.CheckmarkAction
            onClick={e => {
                e.stopPropagation()
                submit(!checked)
            }}
            checked={checked}
            loading={loading}
            disabled={disabled || actionWithContexts.processedAction.isFrozen}
            actionWithContexts={actionWithContexts}
        />
    )
}

/**
 * @typedef {{
 *      renderers: {
 *          NavigateButton: Renderer<NavigateButtonProps>
 *          OutputRenderers: import('./Outputs.jsx').OutputRenderers['renderers']
 *      }}
 * } ActionContentRenderers
 */
/**
 * @param {{
 *  actionWithContexts: ActionWithContexts,
 *  outputValues: Object,
 *  setOutputValues: React.Dispatch<React.SetStateAction<Object>>,
 *  submitted: boolean,
 *  validatorRegistry: React.RefObject<OutputValidatorRegistry>,
 *  onNavigateFactory?: OnNavigateFactory,
 * } & ActionContentRenderers } props
 */
export function ActionContent({ actionWithContexts, outputValues, setOutputValues, submitted, validatorRegistry, onNavigateFactory, renderers }) {
    if (!actionWithContexts.processedAction.parsedMetadata.outputs) {
        throw Error(`This ActionContent component is rendering without any outputs! This will break it. The actionWithContexts that has been fed into this component does not have any outputs. Did you mean to include this actions code in your isCheckmark function? ActionWithContexts: ${JSON.stringify(actionWithContexts)}`)
    }
    
    const onNavigate = onNavigateFactory && onNavigateFactory(actionWithContexts.processedAction.parsedMetadata.code)
    return onNavigate ? (
        <renderers.NavigateButton actionWithContexts={actionWithContexts} onClick={onNavigate}></renderers.NavigateButton>
    ) : (
        <>
            {actionWithContexts.processedAction.parsedMetadata.outputs.map(output => {
                let defaultValue = outputValues[output.key]
                if (output.type === 'multiselect' && !defaultValue){
                    defaultValue = new Array(output.validation.options.length).fill(false);
                }
                return <Output
                    key={output.key}
                    output={output}
                    value={defaultValue}
                    setValue={value => setOutputValues(prevValues => ({ ...prevValues, [output.key]: value }))}
                    submitted={submitted}
                    validatorRegistry={validatorRegistry}
                    renderers={renderers.OutputRenderers}
                    disabled={actionWithContexts.processedAction.isFrozen}
                />
            })}
        </>
    )
}
