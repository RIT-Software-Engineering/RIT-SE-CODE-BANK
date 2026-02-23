import { metadataArrayToObject } from '../../utils/workflows'
import { ArrowBigDown, PlusIcon } from 'lucide-react'
import { StatusCardCompleted, StatusCardInProgress, StatusCardNotStarted } from './StatusCards'
import { FormActionRenderer } from './ActionRenderers'

export function WorkflowRenderer({ workflow, actionsWithCallbacks, workflowState, refresh }) {
    return (
        <>
            <div className='flex flex-col'>
                <p className='text-xl'>{workflow.baseAction.name}</p>
                <p className='text-lg'>{workflow.baseAction.description}</p>
                {actionsWithCallbacks.map(actionWithCallback => {

                    // Determine whether there will be arrows between the actions to represent sequential actions (simple)
                    // or if there will be plus signs to represent complex actions
                    let connectingElement
                    if (actionWithCallback.action.nextActionId) {
                        //TODO: i dont know how complex actions actually work
                        if (actionWithCallback.action.actionType === 'simple') {
                            connectingElement = <ArrowBigDown />
                        } else if (actionWithCallback.action.actionType === 'complex') {
                            connectingElement = <PlusIcon />
                        }
                    }

                    let statusElement
                    const actionState = workflowState.baseActionState.children.find(actionState => actionState.actionId === actionWithCallback.action.id)
                    if (actionState.stateType === "notStarted") {
                        statusElement = <StatusCardNotStarted />
                    } else if (actionState.stateType === "inProgress") {
                        statusElement = <StatusCardInProgress />
                    } else if (actionState.stateType === "completed") {
                        statusElement = <StatusCardCompleted />
                    }

                    return (
                        <>
                            <div className='p-2 flex gap-10' key={actionWithCallback.action.actionId}>
                                <div className="grow">
                                    <FormActionRenderer
                                        actionWithCallback={actionWithCallback}
                                        metadata={metadataArrayToObject(actionWithCallback.action.metadata)}
                                        refresh={refresh}
                                    />
                                </div>
                                {statusElement}
                            </div>
                            <div className='flex justify-center'>{connectingElement}</div>
                        </>
                    )
                })}
            </div>
        </>
    )
}

