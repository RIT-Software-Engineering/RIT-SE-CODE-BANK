import { Check, CheckCircle2, MinusCircle, Pencil, X, XCircle } from "lucide-react"
import { Button, Card } from "react-bootstrap"

/**
 * @import { CheckmarkActionProps, NavigateButtonProps } from '@se-code-bank/workflows-components'
 */

export function BasicStatusIcon({ stateType }) {
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
 * @param {CheckmarkActionProps} props
 */
export function CheckmarkAction(props) {
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
export function NavigateButton(props) {
	return <Button
		onClick={props.onClick}
	>
		{props.children}
	</Button>
}



export function BasicStatusCard({ stateType }) {
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