import { Button, Card, Form } from "react-bootstrap"
import { CMTFetch } from "../../utils/api"
import { useState } from "react"
import { metadataObjectToState } from "../../utils/workflows"
import { OutputRenderer } from "./OutputRenderers"

export function GenericActionRenderer({ actionWithCallback, metadata, outputValues, setOutputValues }) {
    return (
        <>
            {metadata.outputs.map((output, i) => (
                <OutputRenderer
                    output={output}
                    value={outputValues[i]}
                    setValue={value => setOutputValues(prevValues => ({ ...prevValues, [output.key]: value }))}
                />
            ))}
        </>
    )
}

export function FormActionRenderer({ actionWithCallback, metadata, refresh }) {
    const [outputValues, setOutputValues] = useState(metadataObjectToState(metadata))

    const [submitButtonName, setSubmitButtonName] = useState('Submit')
    const [submitButtonVariant, setSubmitButtonVariant] = useState('primary')

    function submitAction(e) {
        e.preventDefault()
        CMTFetch('PUT', actionWithCallback.callback, outputValues).then(() => {
            setSubmitButtonName('Submitted!')
            setSubmitButtonVariant('success')
            setTimeout(async () => {
                await refresh()
            }, 500)
        })
    }

    return (
        <>
            <Card>
                <Card.Body>
                    <p className='text-2xl'>{actionWithCallback.action.name}</p>
                    <Form onSubmit={submitAction}  className='flex gap-4'>
                        <GenericActionRenderer
                            actionWithCallback={actionWithCallback}
                            metadata={metadata}
                            outputValues={outputValues}
                            setOutputValues={setOutputValues}
                        />
                        <Button type='submit' variant={submitButtonVariant}>
                            {submitButtonName}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </>
    )
}
