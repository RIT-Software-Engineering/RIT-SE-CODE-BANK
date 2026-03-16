import { useState, useRef } from 'react'
import { CMTJsonFetch } from '../../../utils/api'
import { AbstractActionRenderer } from './GenericActionRenderer'
import { Button, Form } from 'react-bootstrap'
import { Check, Edit, X } from 'lucide-react'
import { metadataObjectToState } from '../../../utils/workflows'

//TODO: complex inline action renderer?

/** @import { ActionRendererProps } from "./GenericActionRenderer" */

/**
 * Renders an action as a card. Supports simple actions.
 * @template T
 * @param {ActionRendererProps<T>} props
 */
export function InlineActionRenderer({ actionWithContext, previousValues, refresh }) {
    const [outputValues, setOutputValues] = useState(metadataObjectToState(actionWithContext.action.metadata, previousValues))

    const validatorRegistry = useRef({})
    const [submitted, setSubmitted] = useState(false)

    function submitAction(e) {
        e.preventDefault()

        setSubmitted(true)
        const allValid = Object.values(validatorRegistry.current).every(validateFn => {
            const value = outputValues[validateFn.key]
            return validateFn(value) === null
        })
        if (!allValid) return

        CMTJsonFetch('PUT', actionWithContext.callback, outputValues).then(() => {
            setTimeout(async () => {
                await refresh()
                setIsEditing(false)
                setSubmitted(false)
            }, 500)
        })
    }

    const [isEditing, setIsEditing] = useState(false)
    return (
        <>
            {isEditing ? (
                <div>
                    <Form className='flex items-center gap-6 pl-2' onSubmit={submitAction}>
                        <div className='flex gap-4'>
                            <AbstractActionRenderer
                                metadata={actionWithContext.action.metadata}
                                outputValues={outputValues}
                                setOutputValues={setOutputValues}
                                submitted={submitted}
                                validatorRegistry={validatorRegistry}
                            />
                        </div>
                        <Button
                            variant='outline-danger'
                            type='reset'
                            onClick={() => {
                                setIsEditing(false)
                                setSubmitted(false)
                            }}
                        >
                            <X />
                        </Button>
                        <Button variant='outline-success' type='submit'>
                            <Check />
                        </Button>
                    </Form>
                </div>
            ) : (
                <div className='flex items-center hover:bg-gray-200 group pl-2'>
                    <div className='flex gap-4'>
                        {actionWithContext.action.metadata.outputs.map(output => (
                            <p className='my-2'>
                                {output.name}: {previousValues[output.key] ?? 'TBD'}
                            </p>
                        ))}
                    </div>
                    <div className='hidden group-hover:block ml-10'>
                        <Button size='sm' title='Edit' variant='outline-secondary' onClick={() => setIsEditing(true)}>
                            <Edit size={24} />
                        </Button>
                    </div>
                </div>
            )}
        </>
    )
}
