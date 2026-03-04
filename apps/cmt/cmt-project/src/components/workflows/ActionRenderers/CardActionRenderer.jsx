import { Accordion, Card } from "react-bootstrap"
import { CheckmarkActionRenderer } from "./GenericActionRenderer"
import { StatusIcon } from "../Statuses/StatusIcons"
import { StatusCard } from "../Statuses/StatusCards"
import { InlineActionRenderer } from "./InlineActionRenderer"
import { FormActionRenderer } from "./FormActionRenderer"

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
    
    const isCheckbox = 
        actionWithContext.action.metadata.code === "CHECKBOX"
        || actionWithContext.action.metadata.code.includes("SESSION_")

    const isCompleted = actionWithContext.actionState.stateType === "completed"

    return (<>
        <Card>
            <Card.Body>
                <div className="flex justify-between">
                    <div className="grow">
                        <p className='text-2xl mb-0'>{actionWithContext.action.name}</p>
                        <p className='text-gray-600 mb-4'>{actionWithContext.action.description}</p>
                        <div className="pr-10">
                        {isCheckbox // If its a checkmark-only action, then skip the normal form stuff and have it update the action whenever clicked.
                            ? <div className="-mt-4"><CheckmarkActionRenderer actionWithContext={actionWithContext} refresh={refresh} /></div>
                            :
                        isCompleted // If the action is already completed, then use a less visually strong renderer
                            ? <InlineActionRenderer
                                actionWithContext={actionWithContext}
                                data={data}
                                refresh={refresh}
                            />
                            : <FormActionRenderer
                                actionWithContext={actionWithContext}
                                data={data}
                                refresh={refresh}
                                />
                        }
                        </div>
                    </div>
                    <StatusCard stateType={actionWithContext.actionState.stateType} />
                </div>
            </Card.Body>
        </Card>
    </>)
}
