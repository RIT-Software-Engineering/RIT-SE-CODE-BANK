import { Check, CheckCircle2, MinusCircle, Pencil, X, XCircle } from "lucide-react"
import { Button, Card } from "react-bootstrap"

/**
 * @import { CheckmarkActionProps, NavigateButtonProps } from '@se-code-bank/workflows-components'
 */

export function StatusIcon({ stateType }) {
	if (stateType === 'completed') {
		return (
			<div className='flex items-center gap-2'>
				<CheckCircle2 className='text-green-500' />
				<p className='mb-0 text-green-500'>Completed!</p>
			</div>
		)
	}

	if (stateType === 'inProgress') {
		return (
			<div className='flex items-center gap-2'>
				<MinusCircle className='text-yellow-500' />
				<p className='mb-0 text-yellow-500'>In Progress</p>
			</div>
		)
	}

	return (
		<div className='flex items-center gap-2'>
			<XCircle className='text-red-500' />
			<p className='mb-0 text-red-500'>Not Started</p>
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



export function StatusCard({ stateType }) {
	if (stateType === 'completed') {
		return (
			<Card>
				<Card.Body className='bg-green-500 text-white flex items-center'>
					<div className='flex flex-col items-center gap-2'>
						<Check size={20} />
						<p className='my-0'>Completed!</p>
					</div>
				</Card.Body>
			</Card>
		)
	}

	if (stateType === 'inProgress') {
		return (
			<Card>
				<Card.Body className='bg-yellow-500 text-white flex items-center'>
					<div className='flex flex-col items-center gap-2'>
						<Pencil size={20} />
						<p className='my-0'>In Progress</p>
					</div>
				</Card.Body>
			</Card>
		)
	}

	return (
		<Card>
			<Card.Body className='bg-red-500 text-white flex items-center'>
				<div className='flex flex-col items-center gap-2'>
					<X size={20} />
					<p className='my-0'>Not Started</p>
				</div>
			</Card.Body>
		</Card>
	)
}
