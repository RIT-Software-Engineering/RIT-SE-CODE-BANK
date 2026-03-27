import { Accordion, Button, Card, Form } from "react-bootstrap"
import { StatusCard, StatusIcon } from "./misc"

/**
 * @import { ActionContainerProps, ActionEditFormProps, CancellableEditActionFormProps, EditableActionViewProps } from '@se-code-bank/workflows-components'
 */

/**
 * @param {ActionContainerProps} props 
 */
export function ComplexCardContainer(props) {
	return (
		<Accordion.Item eventKey={props.actionWithContexts.action.id}>
			<Accordion.Header>
				<div className='flex items-center mr-8 justify-between w-full'>
					<div>
						<p className='text-2xl mb-0'>{props.actionWithContexts.action.name}</p>
						<p className='text-gray-600 mb-0'>{props.actionWithContexts.action.description}</p>
					</div>
					<StatusIcon stateType={props.actionWithContexts.actionState.stateType} />
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
export function SimpleCardContainer(props) {
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
					<StatusCard stateType={props.actionWithContexts.actionState.stateType} />
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
			<Button variant='outline-success' type='submit'>
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