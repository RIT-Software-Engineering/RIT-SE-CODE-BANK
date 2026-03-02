import { Accordion, Button, Card, Form } from "react-bootstrap"
import { CMTFetch } from "../../../utils/api"
import { useState } from "react"
import { CheckmarkActionRenderer, GenericActionRenderer } from "./GenericActionRenderer"
import { StatusIcon } from "../Statuses/StatusIcons"
import { StatusCard } from "../Statuses/StatusCards"
import { metadataObjectToState } from "../../../utils/workflows"

export function CardActionRenderer({ actionWithContext, data, refresh }) {
    if (
        actionWithContext.action.actionType === "complex"
        || actionWithContext.action.actionType === "workflow"
    ) 
        return <ComplexCardActionRenderer
            data={data}
            actionWithContext={actionWithContext}
            refresh={refresh}
        />
    else if (actionWithContext.action.actionType === "simple")
        return <SimpleCardActionRenderer 
            data={data}
            actionWithContext={actionWithContext}
            refresh={refresh}
        />
    else
        throw Error(`Unrecognized action type ${actionWithContext.action.actionType}`)
}

function ComplexCardActionRenderer({ actionWithContext, data, refresh }) {
    return (<>
        <Accordion.Item eventKey={actionWithContext.action.id}>
            <Accordion.Header>
                <div className="flex items-center mr-8 justify-between w-full">
                    <div>
                        <p className='text-2xl mb-0'>{actionWithContext.action.name}</p>
                        <p className='text-gray-600 mb-0'>{actionWithContext.action.description}</p>
                    </div>
                    <StatusIcon stateType={actionWithContext.actionState.stateType} />
                </div>
            </Accordion.Header>
            <Accordion.Body>
                <div className="flex flex-col gap-4">
                    {actionWithContext.action.childActionsWithContext.map(childActionWithContext => (
                        <CardActionRenderer
                            data={data}
                            key={childActionWithContext.action.id}
                            actionWithContext={childActionWithContext}
                            refresh={refresh}
                        />
                    ))}
                </div>
            </Accordion.Body>
        </Accordion.Item>
    </>)
}

function SimpleCardActionRenderer({ actionWithContext, data, refresh }) {
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

    const isCheckbox = 
        actionWithContext.action.metadata.code === "CHECKBOX"
        || actionWithContext.action.metadata.code.includes("SESSION_")

    return (<>
        <Card>
            <Card.Body>
                <div className="flex justify-between">
                    <div>
                        <p className='text-2xl mb-0'>{actionWithContext.action.name}</p>
                        <p className='text-gray-600 mb-4'>{actionWithContext.action.description}</p>
                        {/* If its a checkmark-only action, then skip the normal form stuff and have it update the action whenever clicked. */}
                        {isCheckbox
                            ? <div className="-mt-4"><CheckmarkActionRenderer actionWithContext={actionWithContext} refresh={refresh} /></div>
                            : <Form onSubmit={submitAction}  className='flex gap-4'>
                                <GenericActionRenderer
                                    metadata={actionWithContext.action.metadata}
                                    outputValues={outputValues}
                                    setOutputValues={setOutputValues}
                                />
                                <Button type='submit' variant={submitButtonVariant}>
                                    {submitButtonName}
                                </Button>
                            </Form>
                        }
                    </div>
                    <StatusCard stateType={actionWithContext.actionState.stateType} />
                </div>
            </Card.Body>
        </Card>
    </>)
}
