import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Button,
	Card,
	CardContent,
	Checkbox,
	Chip,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	TextField,
	Typography,
} from '@mui/material'
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

/**
 * This is AI generated and doesnt look good but it is material UI yay
 */
export function MaterialUIExample() {
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
	return (
		<Button variant={props.checked ? 'outlined' : 'contained'} onClick={props.onClick}>
			{props.checked ? 'Mark as Incomplete' : 'Mark as Complete'}
		</Button>
	)
}

/**
 * @param {NavigateButtonProps} props
 */
function NavigateButton(props) {
	return (
		<Button variant='contained' onClick={props.onClick}>
			{props.children}
		</Button>
	)
}

/**
 * @param {ActionContainerProps} props
 */
function ComplexCardContainer(props) {
	return (
		<Accordion disableGutters sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
			<AccordionSummary sx={{ alignItems: 'center' }}>
				<Stack direction='row' spacing={2} sx={{ width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
					<Box>
						<Typography variant='h6'>{props.actionWithContexts.processedAction.name}</Typography>
						<Typography variant='body2' color='text.secondary'>
							{props.actionWithContexts.processedAction.description}
						</Typography>
					</Box>
					<ActionStateChip stateType={props.actionWithContexts.actionState.stateType} />
				</Stack>
			</AccordionSummary>
			<AccordionDetails>
				<Stack spacing={2}>
					{props.children}
				</Stack>
			</AccordionDetails>
		</Accordion>
	)
}

/**
 * @param {ActionContainerProps} props
 */
function SimpleCardContainer(props) {
	return (
		<Card variant='outlined' sx={{ borderRadius: 3 }}>
			<CardContent>
				<Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
					<Stack spacing={2} sx={{ flex: 1 }}>
						<Typography variant='h6'>{props.actionWithContexts.processedAction.name}</Typography>
						<Typography variant='body2' color='text.secondary'>
							{props.actionWithContexts.processedAction.description}
						</Typography>
						{props.children}
					</Stack>
					<ActionStateChip stateType={props.actionWithContexts.actionState.stateType} />
				</Stack>
			</CardContent>
		</Card>
	)
}

/**
 * @param {ActionEditFormProps} props
 */
function ActionEditForm(props) {
	return (
		<Box component='form' onSubmit={props.onSubmit}>
			<Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ alignItems: { lg: 'flex-start' } }}>
				<Stack spacing={1.5} sx={{ flex: 1 }}>
					{props.children}
				</Stack>
				<Button variant='contained' type='submit' sx={{ minWidth: 120 }}>
					Submit
				</Button>
			</Stack>
		</Box>
	)
}

/**
 * @param {CancellableEditActionFormProps} props
 */
function CancellableEditActionForm(props) {
	return (
		<Box
			component='form'
			onSubmit={props.onSubmit}
			sx={{
				p: 2,
				borderRadius: 2,
				bgcolor: 'grey.100',
				border: '1px solid',
				borderColor: 'divider',
			}}
		>
			<Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ alignItems: { lg: 'flex-start' } }}>
				<Stack spacing={1.5} sx={{ flex: 1 }}>
					{props.children}
				</Stack>
				<Stack direction='row' spacing={1}>
					<Button variant='text' type='reset' onClick={props.onCancel}>
						Cancel
					</Button>
					<Button variant='contained' type='submit'>
						Submit
					</Button>
				</Stack>
			</Stack>
		</Box>
	)
}

/**
 * @param {EditableActionViewProps} props
 */
function EditableActionView(props) {
	return (
		<Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
			<Stack spacing={0.5} sx={{ flex: 1 }}>{props.children}</Stack>
			<Button variant='outlined' size='small' onClick={props.onEdit}>
				Edit
			</Button>
		</Stack>
	)
}

/**
 * @param {OutputViewProps} props
 */
function OutputView(props) {
	return (
		<Box>
			<Typography variant='caption' color='text.secondary' sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
				{props.output.name}
			</Typography>
			<Typography variant='body1'>{formatOutputValue(props.previousValue)}</Typography>
		</Box>
	)
}

/**
 * @param {WorkflowContainerProps} props
 */
function WorkflowContainer(props) {
	return (
		<Stack spacing={2}>
			<Box sx={{ mb: 1 }}>
				<Typography variant='h4' sx={{ fontWeight: 600 }}>
					{props.workflow.baseAction.name}
				</Typography>
				<Typography variant='body1' color='text.secondary'>
					{props.workflow.baseAction.description}
				</Typography>
			</Box>
			<Stack spacing={2}>{props.children}</Stack>
		</Stack>
	)
}

/**
 * @param {OutputContainerProps} props
 */
function OutputContainer(props) {
	return (
		<Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'flex-start' } }}>
			<Box sx={{ minWidth: { md: 180 }, pt: 1 }}>
				<Typography variant='body2' sx={{ fontWeight: 600 }}>
					{props.output.name}
				</Typography>
			</Box>
			<Box sx={{ flex: 1 }}>{props.children}</Box>
		</Stack>
	)
}

function ActionStateChip({ stateType }) {
	const colorByState = {
		completed: 'success',
		inProgress: 'warning',
		notStarted: 'default',
	}

	return (
		<Chip
			size='small'
			label={stateType}
			color={colorByState[stateType] ?? 'default'}
			variant={stateType === 'completed' ? 'filled' : 'outlined'}
			sx={{ textTransform: 'capitalize' }}
		/>
	)
}

/**
 * @param {TextOutputProps} props
 */
const TextOutput = ({ value, onChange, onBlur, required, placeholder, isInvalid, error }) => {
	return (
		<TextField
			size='small'
			fullWidth
			required={required ?? false}
			value={value ?? ''}
			placeholder={placeholder}
			onChange={onChange}
			onBlur={onBlur}
			error={Boolean(isInvalid)}
			helperText={isInvalid ? error : ' '}
		/>
	)
}

/**
 * @param {NumberOutputProps} props
 */
const NumberOutput = ({ value, onChange, onBlur, required, placeholder, isInvalid, error }) => {
	return (
		<TextField
			size='small'
			fullWidth
			type='number'
			required={required ?? false}
			value={value ?? ''}
			placeholder={placeholder}
			onChange={onChange}
			onBlur={onBlur}
			error={Boolean(isInvalid)}
			helperText={isInvalid ? error : ' '}
		/>
	)
}

/**
 * @param {SelectOutputProps} props
 */
const SelectOutput = ({ output, value, onChange, onBlur, required, isInvalid, error }) => {
	const inputId = `${output.key}-select`

	return (
		<FormControl fullWidth size='small' error={Boolean(isInvalid)} required={required ?? false}>
			<InputLabel id={`${inputId}-label`}>Select</InputLabel>
			<Select
				labelId={`${inputId}-label`}
				id={inputId}
				value={value ?? ''}
				label='Select'
				displayEmpty
				onChange={onChange}
				onBlur={onBlur}
			>
				<MenuItem value=''>
					<em>Select...</em>
				</MenuItem>
				{output.validation?.options?.map(option => (
					<MenuItem key={option} value={option}>
						{option}
					</MenuItem>
				))}
			</Select>
			<Box sx={{ minHeight: 20, px: 1.75, pt: 0.5, fontSize: 12, color: 'error.main' }}>
				{isInvalid ? error : ''}
			</Box>
		</FormControl>
	)
}

/**
 * @param {CheckmarkOutputProps} props
 */
const CheckmarkOutput = ({ value, onChange, required }) => {
	return <Checkbox required={required ?? false} checked={Boolean(value)} onChange={onChange} />
}

function formatOutputValue(value) {
	if (value === null || value === undefined || value === '') return 'TBD'
	if (typeof value === 'boolean') return value ? 'Yes' : 'No'
	return String(value)
}
