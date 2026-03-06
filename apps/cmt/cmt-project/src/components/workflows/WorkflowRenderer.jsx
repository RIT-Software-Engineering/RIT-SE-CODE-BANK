import { Accordion } from 'react-bootstrap'
import { CardActionRenderer } from './ActionRenderers/CardActionRenderer'

/**
 * @import { WorkflowsWorkflow, ActionWithContext, IsCheckmark, FetchToCallback, PreviousValues } from "../../components/workflows/typedefs"
 */

/**
 * Renders a workflow using card action renderers.
 * 
 * @template T
 * @param {{
 *  workflow: WorkflowsWorkflow
 *  actionsWithContext: (ActionWithContext & { action: { metadata: T }})[],
 *  previousValues: PreviousValues & Record<keyof T, any>,
 *  refresh: () => void,
 *  fetchToCallback: FetchToCallback,
 *  isCheckmark: IsCheckmark
 * }} args
 */
export function WorkflowRenderer({ workflow, actionsWithContext, previousValues, refresh, fetchToCallback, isCheckmark }) {

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
                                    previousValues={previousValues}
                                    actionWithContext={actionWithContext}
                                    refresh={refresh}
                                    fetchToCallback={fetchToCallback}
                                    isCheckmark={isCheckmark}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </Accordion>
    )
}

