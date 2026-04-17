import { Check, CheckCircle2, MinusCircle, Pencil, X, XCircle } from "lucide-react"
import { Button, Card } from "react-bootstrap"

/**
 * @import { CheckmarkActionProps, NavigateButtonProps } from "@se-code-bank/workflows-ecosystem"
 */

export function StatusIcon({ stateType }) {
	if (stateType === 'completed') {
		return (
			<div className='flex items-center gap-2 text-wrap'>
				<CheckCircle2 className='text-green-500' />
				<p className='mb-0 text-green-500'>Completed!</p>
			</div>
		)
	}

	if (stateType === 'inProgress') {
		return (
			<div className='flex items-center gap-2 text-wrap'>
				<MinusCircle className='text-yellow-500' />
				<p className='mb-0 text-yellow-500'>In Progress</p>
			</div>
		)
	}

	return (
		<div className='flex items-center gap-2 text-wrap'>
			<XCircle className='text-red-500' />
			<p className='mb-0 text-red-500'>Not Started</p>
		</div>
	)
}

/**
 * @param {CheckmarkActionProps} props
 */
export function CheckmarkAction(props) {
	let variantIncomplete;
	let variantComplete; 
	let labelComplete;
	let labelIncomplete; 
	switch (props.actionWithContexts.processedAction?.parsedMetadata?.code) {
		case 'PUBLISH_TEMPLATE':
			labelIncomplete = "Publish";
			labelComplete = "Published";
			break;
	
		default:
			variantIncomplete = 'primary';
			variantComplete = 'outline-seconary';
			labelComplete = 'Mark as Incomplete';
			labelIncomplete = "Mark as Completed"; 
			break;
	}
	return <Button
		variant={props.checked ? variantComplete : variantIncomplete}
		onClick={props.onClick}
		disabled={props.disabled}
	>
		{props.checked ? labelComplete : labelIncomplete}
	</Button>
}

/**
 * @param {NavigateButtonProps} props 
 */
export function NavigateButton(props) {
	let label = "Navigate";
	switch (true){
		case /SESSION_\d+/.test(props.actionWithContexts.processedAction?.parsedMetadata?.code):
			label = "Jump";
			break;
		case /CHECKMARK_PUBLISH_SITE/.test(props.actionWithContexts.processedAction?.parsedMetadata?.code):
			label = "Jump to Site Generation Page";
			break;
		default:
			label = "Navigate";
			break;
	}
	return <Button
		onClick={props.onClick}
	>
		{label}
	</Button>
}



export function StatusCard({ stateType }) {
	if (stateType === 'completed') {
		return (
			<Card className="justify-end min-h-full">
				<Card.Body className='bg-green-500 text-white flex items-center'>
					<div className='flex flex-col items-center gap-2 w-full text-center'>
						<Check size={20} />
						<p className='my-0'>Completed!</p>
					</div>
				</Card.Body>
			</Card>
		)
	}

	if (stateType === 'inProgress') {
		return (
			<Card className="justify-end min-h-full">
				<Card.Body className='bg-yellow-500 text-white flex items-center'>
					<div className='flex flex-col items-center gap-2 w-full text-center'>
						<Pencil size={20} />
						<p className='my-0'>In Progress</p>
					</div>
				</Card.Body>
			</Card>
		)
	}

	return (
		<Card className="justify-end min-h-full">
			<Card.Body className='bg-red-500 text-white flex items-center'>
				<div className='flex flex-col items-center gap-2 w-full text-center'>
					<X size={20} />
					<p className='my-0'>Not Started</p>
				</div>
			</Card.Body>
		</Card>
	)
}
