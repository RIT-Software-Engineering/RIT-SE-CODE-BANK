import { useState } from "react"
import { Button, Card, Form } from "react-bootstrap"
import { CMTFetch } from "../../utils/api"
import { OutputRenderer } from "./OutputRenderers"

export function WorkflowRenderer({ actionsWithCallbacks, workflowState, workflow, refresh }) {
    const nextActionState = workflowState.baseActionState.children.find(actionState => actionState.stateType === "notStarted")
    if (!nextActionState) return <h1> All Done! </h1>
    
    const nextActionWithCallback = actionsWithCallbacks.find(awc => awc.action.id === nextActionState.actionId)
    return <ActionRenderer actionWithCallback={nextActionWithCallback} refresh={refresh} />
}

export function ActionRenderer({ actionWithCallback, refresh }) {
    // Flatten array of objects to simplify later usage
    let metadata = {};
    Object.keys(actionWithCallback.action.metadata).forEach(key => {
        console.log(actionWithCallback.action.metadata[key])
        metadata[key] = JSON.parse(actionWithCallback.action.metadata[key])
    })
    
    const [outputValues, setOutputValues] = useState(Object.fromEntries(metadata.outputs.map(output => [output.key, output.initialValue]))) // Initialize with array of the Workflows specified initial (or default) values
    
    const [submitButtonName, setSubmitButtonName] = useState("Submit")
    const [submitButtonVariant, setSubmitButtonVariant] = useState("primary")
    
    function submitAction (e) {
        e.preventDefault()
        CMTFetch("PUT", actionWithCallback.callback, outputValues).then(() => {
            setSubmitButtonName("Submitted!")
            setSubmitButtonVariant("success")
            setTimeout(refresh, 500)
        })
    }

    return (<>
        <Card className="w-fit">
            <Card.Body>
                <p className="text-2xl">{actionWithCallback.action.name}</p>
                <Form onSubmit={submitAction} className="flex gap-4">
                    {metadata.outputs.map((output, i) =>
                        <OutputRenderer
                        output={output}
                        value={outputValues[i]}
                        setValue={value => setOutputValues(prevValues => ({ ...prevValues, [output.key]: value }))}
                        />
                    )}
                    <Button type="submit" variant={submitButtonVariant}>{submitButtonName}</Button>
                </Form>
            </Card.Body>
        </Card>
    </>)
}
