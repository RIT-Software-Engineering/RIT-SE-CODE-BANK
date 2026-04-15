import { useCallback } from 'react'
import { Accordion } from 'react-bootstrap'
import { createWorkflowRenderers, Workflow } from '@se-code-bank/workflows-ecosystem/components'
import { ActionEditForm, CancellableEditActionForm, ComplexCardContainer, EditableActionView, SimpleCardContainer } from './actions.jsx'
import { CheckmarkAction, NavigateButton } from './misc.jsx'
import { UseCMTOnNavigateFactory } from '../../utils/workflows.js'
import { OutputView, OutputContainer, NumberOutput, TextOutput, SelectOutput, CheckmarkOutput } from './outputs.jsx'

/**
 * @import { WorkflowContainerProps, IsCheckmark } from '@se-code-bank/workflows-ecosystem'
 */

export function CMTWorkflow({ refresh, fetchToCallback, workflow, actionsWithContexts, course }) {

	/** @type IsCheckmark */
	const isCheckmark = useCallback(
		code => code.includes("CHECKMARK") || code.includes("SESSION_") || code === "PUBLISH_TEMPLATE",
		[]
	)

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
			refresh={refresh}
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