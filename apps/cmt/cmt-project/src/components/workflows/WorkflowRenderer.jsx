import { useState } from "react"
import { Button, Form } from "react-bootstrap"
import { CMTFetch } from "../../utils/api"
import { WorkflowActionOutputRenderer } from "./OutputRenderers"

export function WorkflowRenderer({ actionsWithCallbacks, workflowState, workflow, refresh }) {
    const nextActionState = workflowState.baseActionState.children.find(actionState => actionState.stateType === "notStarted")
    if (!nextActionState) return <h1> All Done! </h1>
    
    const nextActionWithCallback = actionsWithCallbacks.find(awc => awc.action.id === nextActionState.actionId)
    return <SimpleWorkflowActionFormRenderer actionWithCallback={nextActionWithCallback} refresh={refresh} />
}

function SimpleWorkflowActionFormRenderer({ actionWithCallback, refresh }) {
    // Flatten array of objects to simplify later usage
    let metadata = {};
    Object.keys(actionWithCallback.action.metadata).forEach(key => {
        console.log(actionWithCallback.action.metadata[key])
        metadata[key] = JSON.parse(actionWithCallback.action.metadata[key])
    })
    
    const [outputValues, setOutputValues] = useState(Object.fromEntries(metadata.outputs.map(output => [output.name, output.initialValue]))) // Initialize with array of the Workflows specified initial (or default) values
    
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
        <Form onSubmit={submitAction}>
            {metadata.outputs.map((output, i) =>
                <WorkflowActionOutputRenderer
                output={output}
                value={outputValues[i]}
                setValue={value => setOutputValues(prevValues => ({ ...prevValues, [output.name]: value }))}
                />
            )}
            <Button type="submit" variant={submitButtonVariant}>{submitButtonName}</Button>
        </Form>
    </>)
}
