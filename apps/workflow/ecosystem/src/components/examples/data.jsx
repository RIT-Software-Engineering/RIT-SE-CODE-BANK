/**
 * @import { ActionWithContexts, WorkflowsWorkflow } from '../types/workflowProps'
 */

const professorId = 'demo-professor'
const courseId = 42

/**
 * @param {string} id
 * @param {string} actionId
 * @param {'completed' | 'inProgress' | 'notStarted'} stateType
 */
function createActionState(id, actionId, stateType) {
	return {
		id,
		actionId,
		stateType,
	}
}

/**
 * @param {{
 *  id: string,
 *  name: string,
 *  description: string,
 *  code: string,
 *  actionState: ReturnType<typeof createActionState>,
 *  outputs?: any[]
 * }} config
 * @returns {ActionWithContexts}
 */
function createSimpleActionWithContexts({ id, name, description, code, actionState, outputs = [] }) {
	return {
		action: {
			id,
			name,
			description,
			actionType: 'simple',
			metadata: {
				code,
				outputs,
			},
		},
		callback: code.includes('CHECKMARK') || code.includes('SESSION_')
			? `workflow/editCheckmarkAction?uid=${professorId}&asid=${actionState.id}`
			: `course/${courseId}?uid=${professorId}&asid=${actionState.id}`,
		actionState,
	}
}

export const placeholderCourse = {
	id: courseId,
	classId: 'SWEN-999',
	name: 'Advanced Workflow Systems',
	section: '01',
	students: 24,
	year: 2028,
	season: 'Fall',
	color: '#0ea5e9',
	workflowId: 'workflow-create-course',
	workflowStateId: 'workflow-state-create-course',
}

/** @type {WorkflowsWorkflow} */
export const placeholderWorkflow = {
	id: 'workflow-create-course',
	name: 'Create Course',
	description: 'Default course creation template',
	baseAction: {
		id: 'base-action-create-course',
		name: 'Create Course',
		description: 'Default course creation template',
		actionType: 'workflow',
	},
}

/** @type {ActionWithContexts[]} */
export const placeholderActionWithContexts = [
	{
		action: {
			id: 'action-course-details',
			name: 'Course Details',
			description: 'Enter your course details',
			actionType: 'complex',
			childActionsWithContexts: [
				createSimpleActionWithContexts({
					id: 'action-course-section',
					name: 'Course Section',
					description: 'Enter your course section',
					code: 'COURSE_SECTION',
					actionState: createActionState('asid-course-section', 'action-course-section', 'completed'),
					outputs: [
						{
							name: 'Course Section',
							key: 'section',
							type: 'text',
							isRequired: true,
							placeholder: '01',
							validation: {
								maxLength: 30,
							},
						},
					],
				}),
				createSimpleActionWithContexts({
					id: 'action-number-students',
					name: 'Number of Students',
					description: 'Enter the number of students enrolled in your course',
					code: 'NUMBER_STUDENTS',
					actionState: createActionState('asid-number-students', 'action-number-students', 'completed'),
					outputs: [
						{
							name: 'Number of Students',
							key: 'students',
							type: 'number',
							isRequired: true,
							placeholder: 20,
							validation: {
								min: 1,
								max: 999,
							},
						},
					],
				}),
				createSimpleActionWithContexts({
					id: 'action-course-semester',
					name: 'Section Semester',
					description: 'Enter the semester the section will take place in',
					code: 'COURSE_SEMESTER',
					actionState: createActionState('asid-course-semester', 'action-course-semester', 'notStarted'),
					outputs: [
						{
							name: 'Year',
							key: 'year',
							type: 'select',
							isRequired: true,
							validation: {
								options: [2027, 2028, 2029, 2030],
							},
						},
						{
							name: 'Season',
							key: 'season',
							type: 'select',
							isRequired: true,
							validation: {
								options: ['Fall', 'Spring', 'Summer 1', 'Summer 2'],
							},
						},
					],
				}),
			],
		},
		actionState: createActionState('asid-course-details', 'action-course-details', 'inProgress'),
	},
	{
		action: {
			id: 'action-create-sessions',
			name: 'Create Sessions',
			description: 'Create sessions for your course',
			actionType: 'workflow',
			childActionsWithContexts: Array.from({ length: 5 }, (_, index) =>
				createSimpleActionWithContexts({
					id: `action-session-${index + 1}`,
					name: `Create session ${index + 1}`,
					description: 'Create a session. In the workflow editor, more specific details could be given for certain sessions, like if a session should have an exam.',
					code: `SESSION_${index}`,
					actionState: createActionState(
						`asid-session-${index + 1}`,
						`action-session-${index + 1}`,
						index < 2 ? 'completed' : index === 2 ? 'notStarted' : 'notStarted'
					),
				})
			),
		},
		actionState: createActionState('asid-create-sessions', 'action-create-sessions', 'inProgress'),
	},
	{
		action: {
			id: 'action-publish-course-website',
			name: 'Publish Course Website',
			description: 'Navigate to the course generation page and publish your website!',
			actionType: 'workflow',
			childActionsWithContexts: [
				createSimpleActionWithContexts({
					id: 'action-set-column-visibilities',
					name: 'Set Column Visibilities',
					description: 'Hide columns that contain internal information',
					code: 'CHECKMARK',
					actionState: createActionState('asid-set-column-visibilities', 'action-set-column-visibilities', 'notStarted'),
				}),
				createSimpleActionWithContexts({
					id: 'action-publish-website',
					name: 'Publish Course Website',
					description: "You're all ready to publish!",
					code: 'CHECKMARK',
					actionState: createActionState('asid-publish-website', 'action-publish-website', 'notStarted'),
				}),
			],
		},
		actionState: createActionState('asid-publish-course-website', 'action-publish-course-website', 'notStarted'),
	},
]
