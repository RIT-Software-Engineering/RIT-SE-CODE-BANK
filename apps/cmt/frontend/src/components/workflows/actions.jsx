import { Accordion, Button, Card, Form } from "react-bootstrap"
import { StatusCard, StatusIcon } from "./misc.jsx"

/**
 * @import { ActionContainerProps, ActionEditFormProps, CancellableEditActionFormProps, EditableActionViewProps } from '@se-code-bank/workflows-ecosystem'
 */

/**
 * @param {ActionContainerProps} props 
 */
export function ComplexCardContainer(props) {
	let possibleSessionAction = props.actionWithContexts.processedAction.childActions.find(awc => /SESSION_\d+/.test(awc?.metadata?.code));
	return (
		<Accordion.Item eventKey={props.actionWithContexts.processedAction.id}>
			<Accordion.Header>
				<div className='flex items-center mr-8 justify-between w-full'>
					<div>
						<p className='text-2xl mb-0'>
							{props.actionWithContexts.processedAction.name} {' '}
							({props.actionWithContexts.processedAction.childActionsWithContexts.filter(awc => awc.actionState.stateType === "completed").length}/
							{props.actionWithContexts.processedAction.childActions.length})
							</p>
						<p className='text-gray-600 mb-0'>{props.actionWithContexts.processedAction.description}</p>
					</div>
					<StatusCard stateType={props.actionWithContexts.actionState.stateType} />
				</div>
			</Accordion.Header>
			<Accordion.Body>
				{possibleSessionAction ?
				<div className="min-w-2/3 w-4/5 flex mb-3">
					<div>{possibleSessionAction?.description}</div>
					
					<div><Button 
					onClick={() => 
					document.getElementById('sessions')?.scrollIntoView({ behavior: "smooth" })}
					>
						Jump
					</Button></div>
				</div> : <></>}
				<div className={`flex gap-4 w-full
					${!possibleSessionAction ? 'flex-col' : 'flex-wrap'}`}>
					{props.children}
				</div>
			</Accordion.Body>
		</Accordion.Item>
	)
}

/**
 * @param {ActionContainerProps} props 
 */
export function SimpleCardContainer(props) {
	let possibleSessionAction = props.actionWithContexts.processedAction?.parsedMetadata?.code.startsWith("SESSION_");
	return (
		<Card className={possibleSessionAction ? 'min-w-1/6 w-1/6' : ''}>
			<Card.Body>
				<div className='flex justify-between w-full flex-wrap'>
					<div className={`${possibleSessionAction ? 'w-full' : 'w-4/5'}`}>
						<p className='text-xl mb-0'>{props.actionWithContexts.processedAction.name}</p>
						<p className='text-gray-600 mb-2'>{possibleSessionAction? '' : props.actionWithContexts.processedAction.description}</p>
						<div className='pr-10'>
							{!possibleSessionAction ? props.children : <></>}
						</div>
					</div>
					<div>
					{possibleSessionAction ? 
					<StatusIcon stateType={props.actionWithContexts.actionState.stateType} /> 
					: <StatusCard stateType={props.actionWithContexts.actionState.stateType} />}
					</div>
					
				</div>
			</Card.Body>
		</Card>
	)
}

/**
 * @param {ActionEditFormProps} props
 */
export function ActionEditForm(props) {
	return (
		<Form className='flex items-center gap-6 pl-2' onSubmit={props.onSubmit}>
			<div className='flex gap-4'>
				{props.children}
			</div>
			<Button type='submit'>
				Submit
			</Button>
		</Form>
	)
}

/**
 * @param {CancellableEditActionFormProps} props
 */
export function CancellableEditActionForm(props) {
	return (
		<Form className='flex items-center gap-6 pl-2' onSubmit={props.onSubmit}>
			<div className='flex gap-4'>
				{props.children}
			</div>
			<Button
				variant='danger'
				type='reset'
				onClick={props.onCancel}
			>
				Cancel
			</Button>
			<Button variant='success' type='submit'>
				Submit
			</Button>
		</Form>
	)
}

/**
 * @param {EditableActionViewProps} props
 */
export function EditableActionView(props) {
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