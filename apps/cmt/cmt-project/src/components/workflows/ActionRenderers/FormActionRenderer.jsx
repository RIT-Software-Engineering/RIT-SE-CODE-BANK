import { useState } from "react"
import { CMTFetch } from "../../../utils/api"
import { metadataObjectToState } from "../../../utils/workflows"
import { Button, Form } from "react-bootstrap"
import { GenericActionRenderer } from "./GenericActionRenderer"

export function FormActionRenderer({ actionWithContext, data, refresh }) {
    const [outputValues, setOutputValues] = useState(metadataObjectToState(actionWithContext.action.metadata, data))

    const [submitButtonName, setSubmitButtonName] = useState('Submit')
    const [submitButtonVariant, setSubmitButtonVariant] = useState('primary')

    function submitAction(e) {
        e.preventDefault()
        CMTFetch('PUT', actionWithContext.callback, outputValues).then(() => {
            setSubmitButtonName('Submitted!')
            setSubmitButtonVariant('success')
            setTimeout(async () => {
                await refresh()
                setSubmitButtonName('Submit')
                setSubmitButtonVariant('primary')
            }, 500)
        })
    }

    return (
        <Form onSubmit={submitAction}  className='flex gap-4'>
            <GenericActionRenderer
                metadata={actionWithContext.action.metadata}
                outputValues={outputValues}
                setOutputValues={setOutputValues}
            />
            <Button type='submit' variant={submitButtonVariant}>
                {submitButtonName}
            </Button>
        </Form>
    )
}