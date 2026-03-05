import { useState, useRef } from 'react'
import { CMTFetch } from '../../../utils/api'
import { GenericActionRenderer } from './GenericActionRenderer'
import { Button, Form } from 'react-bootstrap'
import { Check, Edit, X } from 'lucide-react'
import { metadataObjectToState } from '../../../utils/workflows'

//TODO: complex inline action renderer?

/**
 *
 * @param {{ actionWithContext: object, data: object, refresh: function }} args
 * Data is the object that contains the same keys as the action's metadata.
 *
 */
export function InlineActionRenderer({ actionWithContext, data, refresh }) {
    const [outputValues, setOutputValues] = useState(metadataObjectToState(actionWithContext.action.metadata, data))
    
    const validatorRegistry = useRef({})
    const [submitted, setSubmitted] = useState(false)

    function submitAction(e) {
        e.preventDefault()

        setSubmitted(true)
        const allValid = Object.values(validatorRegistry.current).every(validateFn => {
            const value = outputValues[validateFn.key]
            return validateFn(value) === null
        })
        if (!allValid)
            return
        
        CMTFetch('PUT', actionWithContext.callback, outputValues).then(() => {
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
                            <GenericActionRenderer
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
                    <div className="flex gap-4">
                        {actionWithContext.action.metadata.outputs.map(output => (
                                <p className='text-xl my-2'>
                                    {output.name}: {data[output.key] ?? 'TBD'}
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
