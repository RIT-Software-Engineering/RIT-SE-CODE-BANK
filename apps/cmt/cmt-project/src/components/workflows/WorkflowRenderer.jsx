import { Accordion } from 'react-bootstrap'
import { CardActionRenderer } from './ActionRenderers/CardActionRenderer'

/**
 * Renders a workflow using card action renderers.
 */
export function WorkflowRenderer({ workflow, actionsWithContext, data, refresh }) {

    const firstIncompleteAction = actionsWithContext.find(awc => awc.actionState.stateType !== "completed")

    return (
        <Accordion
            defaultActiveKey={firstIncompleteAction?.action?.id}
            flush
        >
            <div className='flex flex-col'>
                <p className='text-2xl mb-0'>{workflow.baseAction.name}</p>
                <p className='text-gray-600 text-lg'>{workflow.baseAction.description}</p>
                {actionsWithContext.map(actionWithContext => {
                    return (
                        <div className='p-2 flex gap-10' key={actionWithContext.action.id}>
                            <div className="grow">
                                <CardActionRenderer
                                    data={data}
                                    actionWithContext={actionWithContext}
                                    refresh={refresh}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </Accordion>
    )
}

