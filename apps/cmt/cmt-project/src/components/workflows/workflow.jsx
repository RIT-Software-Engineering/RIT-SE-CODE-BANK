import { useCallback, useEffect, useState } from 'react'
import { Accordion } from 'react-bootstrap'
import { useParams } from 'react-router-dom'
import { CMTJsonFetch } from '../../utils/api'
import { createWorkflowRenderers, Workflow } from '@se-code-bank/workflows-components'
import { ActionEditForm, CancellableEditActionForm, ComplexCardContainer, EditableActionView, SimpleCardContainer } from './actions'
import { CheckmarkAction, NavigateButton } from './misc'
import { UseCMTOnNavigateFactory } from '../../utils/workflows'
import { OutputView, OutputContainer, NumberOutput, TextOutput, SelectOutput, CheckmarkOutput } from './outputs'

/**
 * @import { WorkflowContainerProps, ActionWithContexts, WorkflowsWorkflow, FetchToCallback, IsCheckmark } from '@se-code-bank/workflows-components'
 */

export function CMTWorkflow() {
	const { id } = useParams()
  
	const [course, setCourse] = useState(null)
	/** @type [ActionWithContexts[], function] */
	const [actionsWithContexts, setActionsWithContexts] = useState([])
	/** @type [WorkflowsWorkflow, function] */
	const [workflow, setWorkflow] = useState(null)

	const update = useCallback(async () => {
		return CMTJsonFetch('GET', `course/${id}`).then(async response => {
			const data = await response.json()
			setCourse(data.course)
			setActionsWithContexts(data.actionsWithContext)
			setWorkflow(data.workflow)
		})
	}, [id])
	useEffect(() => void update(), [id, update])

	/** @type FetchToCallback */
	const fetchToCallback = useCallback(
		(callback, outputValues) => CMTJsonFetch('PUT', callback, outputValues),
		[]
	)

	/** @type IsCheckmark */
	const isCheckmark = useCallback(
		code => code.includes("CHECKMARK") || code.includes("SESSION_"),
		[]
	)

	if (course === null || workflow === null) return <p> Loading </p>

	const workflowRenderers = createWorkflowRenderers({
		WorkflowContainer,
		SimpleCardContainer,
		ComplexCardContainer,
		CheckmarkAction,
		NavigateButton,
		ActionEditForm,
		CancellableEditActionForm,
		EditableActionView,
		OutputView,
		OutputContainer,
		NumberOutput,
		TextOutput,
		SelectOutput,
		CheckmarkOutput,
	})

  	return (
		<Workflow
			workflow={workflow}
			actionsWithContexts={actionsWithContexts}
			previousValues={course}
			refresh={update}
			fetchToCallback={fetchToCallback}
			isCheckmark={isCheckmark}
			onNavigateFactory={UseCMTOnNavigateFactory}
			renderers={workflowRenderers}
		/>
  )
}

/**
 * @param {WorkflowContainerProps} props
 */
export function WorkflowContainer(props) {
	const firstIncompleteAction = props.actionsWithContexts.find(awc => awc.actionState.stateType !== "completed")

	return (
		<Accordion
			defaultActiveKey={firstIncompleteAction?.action?.id}
			flush
		>
			<div className='flex flex-col'>
				<p className='text-2xl mb-0'>{props.workflow.baseAction.name}</p>
				<p className='text-gray-600 text-lg'>{props.workflow.baseAction.description}</p>
				{props.children}
			</div>
		</Accordion>
	)
}