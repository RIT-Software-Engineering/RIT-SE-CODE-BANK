import { Accordion, Button, Form, Card } from 'react-bootstrap'
import { CheckCircle2, Check, MinusCircle, Pencil, XCircle, X } from 'lucide-react'
import { Workflow, createWorkflowRenderers } from '../components/Workflows'
import { placeholderActionWithContexts, placeholderCourse, placeholderWorkflow } from './data'

/**
 * @import { IsCheckmark, FetchToCallback } from '../types/workflowProps'
 * @import { ActionContainerProps, NavigateButtonProps, ActionEditFormProps, CancellableEditActionFormProps, CheckmarkActionProps, EditableActionViewProps, NumberOutputProps, OutputContainerProps, OutputViewProps, SelectOutputProps, TextOutputProps, WorkflowContainerProps, CheckmarkOutputProps } from '../types/baseComponentProps'
 */

/** @type {FetchToCallback} */
const fetchToCallback = async (_callback, _outputValues) => new Response(null, { status: 204 })

/** @type {IsCheckmark} */
const isCheckmark = code => code.includes('CHECKMARK') || code.includes('SESSION_')

function onNavigateFactory(_code) {
	return null
}

export function BasicExample() {
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
			workflow={placeholderWorkflow}
			actionsWithContexts={placeholderActionWithContexts}
			previousValues={placeholderCourse}
			refresh={() => {}}
			fetchToCallback={fetchToCallback}
			isCheckmark={isCheckmark}
			onNavigateFactory={onNavigateFactory}
			renderers={workflowRenderers}
		/>
  )
}

/**
 * @param {CheckmarkActionProps} props
 */
function CheckmarkAction(props) {
	return <Button
		variant={props.checked ? 'outline-secondary' : 'primary'}
		onClick={props.onClick}
	>
		{props.checked ? 'Mark as Incomplete' : 'Mark as Complete'}
	</Button>
}

/**
 * @param {NavigateButtonProps} props 
 */
function NavigateButton(props) {
	return <Button
		onClick={props.onClick}
	>
		{props.children}
	</Button>
}

/**
 * @param {ActionContainerProps} props 
 */
function ComplexCardContainer(props) {
	return (
		<Accordion.Item eventKey={props.actionWithContexts.action.id}>
			<Accordion.Header>
				<div className='flex items-center mr-8 justify-between w-full'>
					<div>
						<p className='text-2xl mb-0'>{props.actionWithContexts.action.name}</p>
						<p className='text-gray-600 mb-0'>{props.actionWithContexts.action.description}</p>
					</div>
					<BasicStatusIcon stateType={props.actionWithContexts.actionState.stateType} />
				</div>
			</Accordion.Header>
			<Accordion.Body>
				<div className='flex flex-col gap-4'>
					{props.children}
				</div>
			</Accordion.Body>
		</Accordion.Item>
	)
}

/**
 * @param {ActionContainerProps} props 
 */
function SimpleCardContainer(props) {
	return (
		<Card>
			<Card.Body>
				<div className='flex justify-between'>
					<div className='grow'>
						<p className='text-2xl mb-0'>{props.actionWithContexts.action.name}</p>
						<p className='text-gray-600 mb-2'>{props.actionWithContexts.action.description}</p>
						<div className='pr-10'>
							{props.children}
						</div>
					</div>
					<BasicStatusCard stateType={props.actionWithContexts.actionState.stateType} />
				</div>
			</Card.Body>
		</Card>
	)
}

function BasicStatusCard({ stateType }) {
	const stylesByState = {
		completed: {
			cardClassName: 'bg-green-500 text-white',
			icon: <Check size={20} />,
			label: 'Completed!',
		},
		inProgress: {
			cardClassName: 'bg-yellow-500 text-white',
			icon: <Pencil size={20} />,
			label: 'In Progress',
		},
		notStarted: {
			cardClassName: 'bg-red-500 text-white',
			icon: <X size={20} />,
			label: 'Not Started',
		},
	}

	const status = stylesByState[stateType] ?? stylesByState.notStarted

	return (
		<Card>
			<Card.Body className={status.cardClassName}>
				<div className='flex w-32 items-center gap-2'>
					{status.icon}
					<p className='my-0'>{status.label}</p>
				</div>
			</Card.Body>
		</Card>
	)
}

function BasicStatusIcon({ stateType }) {
	const stylesByState = {
		completed: {
			icon: <CheckCircle2 className='text-green-500' />,
			label: 'Completed!',
			textClassName: 'text-green-500',
		},
		inProgress: {
			icon: <MinusCircle className='text-yellow-500' />,
			label: 'In Progress',
			textClassName: 'text-yellow-500',
		},
		notStarted: {
			icon: <XCircle className='text-red-500' />,
			label: 'Not Started',
			textClassName: 'text-red-500',
		},
	}

	const status = stylesByState[stateType] ?? stylesByState.notStarted

	return (
		<div className='flex items-center gap-2'>
			{status.icon}
			<p className={`mb-0 ${status.textClassName}`}>{status.label}</p>
		</div>
	)
}

/**
 * @param {ActionEditFormProps} props
 */
function ActionEditForm(props) {
	return (
		<Form className='flex items-center gap-6 pl-2' onSubmit={props.onSubmit}>
			<div className='flex gap-4'>
				{props.children}
			</div>
			<Button variant='outline-success' type='submit'>
				Submit
			</Button>
		</Form>
	)
}

/**
 * @param {CancellableEditActionFormProps} props
 */
function CancellableEditActionForm(props) {
	return (
		<Form className='flex items-center gap-6 bg-indigo-300 pl-2' onSubmit={props.onSubmit}>
			<div className='flex gap-4'>
				{props.children}
			</div>
			<Button
				variant='outline-danger'
				type='reset'
				onClick={props.onCancel}
			>
				Cancel
			</Button>
			<Button variant='outline-success' type='submit'>
				Submit
			</Button>
		</Form>
	)
}

/**
 * @param {EditableActionViewProps} props
 */
function EditableActionView(props) {
	return (
		<div className='flex items-center hover:bg-gray-200 group pl-2'>
			<div className='flex gap-4'>
				{props.children}
			</div>
			<div className='hidden group-hover:block ml-10'>
				<Button size='sm' title='Edit' variant='outline-secondary' onClick={props.onEdit}>
					Edit
				</Button>
			</div>
		</div>
	)
}

/**
 * @param {OutputViewProps} props
 */
function OutputView(props) {
	return (
		<p className='my-2'>
			{props.output.name}: {props.previousValue ?? 'TBD'}
		</p>
	)
}

/**
 * @param {WorkflowContainerProps} props
 */
function WorkflowContainer(props) {
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

/**
 * @param {OutputContainerProps} props 
 */
function OutputContainer(props) {
	return (
		<Form.Group className='flex gap-2 items-center'>
			<Form.Label className='w-max mb-0' htmlFor={props.output.key}>
				{props.output.name}
			</Form.Label>
			{props.children}
		</Form.Group>
	)
}

/**
 * @param {TextOutputProps} props
 */
const TextOutput = ({ value, onChange, onBlur, required, placeholder, isInvalid, error }) => {
    return (
        <div className='shrink'>
            <Form.Control
                type='text'
                required={required ?? false}
                value={value}
                placeholder={placeholder}
                onChange={onChange}
                onBlur={onBlur}
                isInvalid={isInvalid}
            />
            <Form.Control.Feedback type='invalid'>{error}</Form.Control.Feedback>
        </div>
    )
}

/**
 * @param {NumberOutputProps} props
 */
const NumberOutput = ({ value, onChange, onBlur, required, placeholder, isInvalid, error }) => {
    return (
        <div className='shrink'>
            <Form.Control
                type='number'
                required={required ?? false}
                value={value}
                placeholder={placeholder}
                onChange={onChange}
                onBlur={onBlur}
                isInvalid={isInvalid}
            />
            <Form.Control.Feedback type='invalid'>{error}</Form.Control.Feedback>
        </div>
    )
}

/**
 * @param {SelectOutputProps} props
 */
const SelectOutput = ({ output, value, onChange, onBlur, required, isInvalid, error }) => {
    return (
        <div className='shrink'>
            <Form.Select
                required={required ?? false}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                isInvalid={isInvalid}
            >
                <option value=''>Select...</option>
                {output.validation?.options?.map(option => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </Form.Select>
            <Form.Control.Feedback type='invalid'>{error}</Form.Control.Feedback>
        </div>
    )
}

/**
 * @param {CheckmarkOutputProps} props
 */
const CheckmarkOutput = ({ value, onChange, required }) => {
    return (
        <div className='shrink'>
            <Form.Check 
                type='checkbox' 
                required={required ?? false} 
                checked={value} 
                onChange={onChange} 
            />
        </div>
    )
}
