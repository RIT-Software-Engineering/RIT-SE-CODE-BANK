import { Accordion, Card } from 'react-bootstrap'
import { CheckmarkActionRenderer } from './GenericActionRenderer'
import { StatusIcon } from '../Statuses/StatusIcons'
import { StatusCard } from '../Statuses/StatusCards'
import { InlineActionRenderer } from './InlineActionRenderer'
import { FormActionRenderer } from './FormActionRenderer'

/**
 * @import { ActionRendererProps } from "./GenericActionRenderer"
 * @import { IsCheckmark } from "../typedefs"
 */

/**
 * Renders an action as a card. Supports all types except branching.
 * @template T
 * @param {ActionRendererProps<T> & { isCheckmark: IsCheckmark }} props
 */
export function CardActionRenderer({ actionWithContext, previousValues, refresh, fetchToCallback, isCheckmark, onNavigateFactory }) {
    if (actionWithContext.action.actionType === 'complex' || actionWithContext.action.actionType === 'workflow')
        return (
            <ComplexCardActionRenderer
                previousValues={previousValues}
                actionWithContext={actionWithContext}
                refresh={refresh}
                fetchToCallback={fetchToCallback}
                isCheckmark={isCheckmark}
                onNavigateFactory={onNavigateFactory}
            />
        )
    else if (actionWithContext.action.actionType === 'simple')
        return (
            <SimpleCardActionRenderer
                previousValues={previousValues}
                actionWithContext={actionWithContext}
                refresh={refresh}
                fetchToCallback={fetchToCallback}
                checkmark={actionWithContext.action.metadata.code && isCheckmark(actionWithContext.action.metadata.code)}
                onNavigateFactory={onNavigateFactory}
            />
        )
    else throw Error(`Unrecognized action type ${actionWithContext.action.actionType}`)
}

/**
 * @template T
 * @param {ActionRendererProps<T> & { isCheckmark: IsCheckmark }} props
 */
function ComplexCardActionRenderer({ actionWithContext, previousValues, refresh, fetchToCallback, isCheckmark, onNavigateFactory }) {
    return (
        <>
            <Accordion.Item eventKey={actionWithContext.action.id}>
                <Accordion.Header>
                    <div className='flex items-center mr-8 justify-between w-full'>
                        <div>
                            <p className='text-2xl mb-0'>{actionWithContext.action.name}</p>
                            <p className='text-gray-600 mb-0'>{actionWithContext.action.description}</p>
                        </div>
                        <StatusIcon stateType={actionWithContext.actionState.stateType} />
                    </div>
                </Accordion.Header>
                <Accordion.Body>
                    <div className='flex flex-col gap-4'>
                        {actionWithContext.action.childActionsWithContext.map(childActionWithContext => (
                            <CardActionRenderer
                                previousValues={previousValues}
                                key={childActionWithContext.action.id}
                                actionWithContext={childActionWithContext}
                                refresh={refresh}
                                fetchToCallback={fetchToCallback}
                                isCheckmark={isCheckmark}
                                onNavigateFactory={onNavigateFactory}
                            />
                        ))}
                    </div>
                </Accordion.Body>
            </Accordion.Item>
        </>
    )
}

/**
 * @template T
 * @param {ActionRendererProps<T> & { checkmark: boolean | undefined }} props
 */
function SimpleCardActionRenderer({ actionWithContext, previousValues, refresh, fetchToCallback, checkmark, onNavigateFactory }) {
    const isCompleted = actionWithContext.actionState.stateType === 'completed'

    return (
        <>
            <Card>
                <Card.Body>
                    <div className='flex justify-between'>
                        <div className='grow'>
                            <p className='text-2xl mb-0'>{actionWithContext.action.name}</p>
                            <p className='text-gray-600 mb-2'>{actionWithContext.action.description}</p>
                            <div className='pr-10'>
                                {checkmark ? ( // If its a checkmark-only action, then skip the normal form stuff and have it update the action whenever clicked.
                                    <CheckmarkActionRenderer
                                        actionWithContext={actionWithContext}
                                        refresh={refresh}
                                        fetchToCallback={fetchToCallback}
                                        onNavigateFactory={onNavigateFactory}
                                    />
                                ) : isCompleted ? ( // If the action is already completed, then use a less visually strong renderer
                                    <InlineActionRenderer
                                        actionWithContext={actionWithContext}
                                        previousValues={previousValues}
                                        refresh={refresh}
                                        fetchToCallback={fetchToCallback}
                                        onNavigateFactory={onNavigateFactory}
                                    />
                                ) : (
                                    <FormActionRenderer
                                        actionWithContext={actionWithContext}
                                        previousValues={previousValues}
                                        refresh={refresh}
                                        fetchToCallback={fetchToCallback}
                                        onNavigateFactory={onNavigateFactory}
                                    />
                                )}
                            </div>
                        </div>
                        <StatusCard stateType={actionWithContext.actionState.stateType} />
                    </div>
                </Card.Body>
            </Card>
        </>
    )
}
