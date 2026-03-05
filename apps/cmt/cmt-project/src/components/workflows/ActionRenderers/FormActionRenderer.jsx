import { useState, useRef } from 'react'
import { metadataObjectToState } from '../../../utils/workflows'
import { Button, Form } from 'react-bootstrap'
import { AbstractActionRenderer } from './GenericActionRenderer'

/** @import { ActionRendererProps } from "./GenericActionRenderer" */

/**
 * Renders an action as a form. Only supports simple actions.
 *
 * @template T
 * @param {ActionRendererProps<T>} props
 */
export function FormActionRenderer({ actionWithContext, previousValues, refresh, fetchToCallback }) {
    const [outputValues, setOutputValues] = useState(metadataObjectToState(actionWithContext.action.metadata, previousValues))

    const validatorRegistry = useRef({})

    const [submitButtonName, setSubmitButtonName] = useState('Submit')
    const [submitButtonVariant, setSubmitButtonVariant] = useState('primary')
    const [submitted, setSubmitted] = useState(false)

    function submitAction(e) {
        e.preventDefault()

        setSubmitted(true)
        const allValid = Object.values(validatorRegistry.current).every(validateFn => {
            const value = outputValues[validateFn.key]
            return validateFn(value) === null
        })
        if (!allValid) return

        fetchToCallback(actionWithContext.callback, outputValues).then(() => {
            setSubmitButtonName('Submitted!')
            setSubmitButtonVariant('success')
            setTimeout(async () => {
                await refresh()
                setSubmitButtonName('Submit')
                setSubmitButtonVariant('primary')
                setSubmitted(false)
            }, 500)
        })
    }

    return (
        <Form onSubmit={submitAction} className='flex gap-4'>
            <AbstractActionRenderer
                metadata={actionWithContext.action.metadata}
                outputValues={outputValues}
                setOutputValues={setOutputValues}
                submitted={submitted}
                validatorRegistry={validatorRegistry}
            />
            <Button type='submit' variant={submitButtonVariant}>
                {submitButtonName}
            </Button>
        </Form>
    )
}
