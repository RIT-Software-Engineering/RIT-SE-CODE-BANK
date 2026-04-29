/**
 * @import { ActionContainerProps, ActionEditFormProps, CancellableEditActionFormProps, CheckmarkActionProps, CheckmarkOutputProps, EditableActionViewProps, FetchToCallback, IsCheckmark, NavigateButtonProps, NumberOutputProps, OnNavigateFactory, OutputContainerProps, OutputViewProps, PreviousValues, Renderer, SelectOutputProps, TextOutputProps, WorkflowContainerProps } from '../../types/components.js'
 * @import { WorkflowsWorkflow } from '../../types/workflows.js'
 * @import { ActionWithContexts } from '../../types/contexts.js'
 * @import { CardActionRenderers } from './Actions.jsx'
 */

import { CardAction } from './Actions.jsx'

/**
 * @typedef {{ 
 *      renderers: {
 *          WorkflowContainer: Renderer<WorkflowContainerProps>,
 *          CardActionRenderers: CardActionRenderers['renderers']
 *      }}
 * } WorkflowRenderers
 */
/**
 * @template T
 * @param {{
 *  workflow: WorkflowsWorkflow
 *  actionsWithContexts: (ActionWithContexts & { action: { metadata: T }})[],
 *  previousValues: PreviousValues & Record<keyof T, any>,
 *  refresh: () => void,
 *  fetchToCallback: FetchToCallback,
 *  isCheckmark: IsCheckmark,
 *  onNavigateFactory: OnNavigateFactory
 * }
 * & WorkflowRenderers
 * } props
 */
export function Workflow(props) {
    const { actionsWithContexts, renderers, workflow } = props

    return (
        <renderers.WorkflowContainer workflow={workflow} actionsWithContexts={actionsWithContexts}>
            {actionsWithContexts.map(
                actionWithContexts => <CardAction key={actionWithContexts.processedAction.id} {...props} renderers={renderers.CardActionRenderers} actionWithContexts={actionWithContexts} />
            )}
        </renderers.WorkflowContainer>
    )
}

/**
 * @typedef {{
 *      WorkflowContainer: Renderer<WorkflowContainerProps>,
 *      SimpleCardContainer: Renderer<ActionContainerProps>,
 *      ComplexCardContainer: Renderer<ActionContainerProps>,
 *      CheckmarkAction: Renderer<CheckmarkActionProps>,
 *      NavigateButton: Renderer<NavigateButtonProps>,
 *      ActionEditForm: Renderer<ActionEditFormProps>,
 *      CancellableEditActionForm: Renderer<CancellableEditActionFormProps>,
 *      EditableActionView: Renderer<EditableActionViewProps>,
 *      OutputView: Renderer<OutputViewProps>,
 *      OutputContainer: Renderer<OutputContainerProps>,
 *      NumberOutput: Renderer<NumberOutputProps>,
 *      TextOutput: Renderer<TextOutputProps>,
 *      SelectOutput: Renderer<SelectOutputProps>,
 *      CheckmarkOutput: Renderer<CheckmarkOutputProps>
 *      SelectMultiOutput: Renderer<CheckmarkOutputProps>
 * }} WorkflowRendererMap
 */
/**
 * Creates the nested renderer structure consumed by {@link Workflow} from a flat object
 *
 * @param {WorkflowRendererMap} renderers
 */
export function createWorkflowRenderers(renderers) {
    const {
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
        SelectMultiOutput,
    } = renderers

    const outputRenderers = {
        OutputContainer,
        NumberOutputRenderers: {
            NumberOutput,
        },
        TextOutputRenderers: {
            TextOutput,
        },
        SelectOutputRenderers: {
            SelectOutput,
        },
        CheckmarkOutputRenderers: {
            CheckmarkOutput,
        },
        SelectMultiOutputRenderers: {
            SelectMultiOutput,
        }
    }

    const actionContentRenderers = {
        NavigateButton,
        OutputRenderers: outputRenderers,
    }

    return {
        WorkflowContainer,
        CardActionRenderers: {
            SimpleCardContainer,
            ComplexCardContainer,
            CheckmarkActionRenderers: {
                CheckmarkAction,
                NavigateButton,
            },
            FormActionRenderers: {
                ActionEditForm,
                ActionContentRenderers: actionContentRenderers,
            },
            ViewEditActionRenderers: {
                CancellableEditActionForm,
                EditableActionView,
                OutputView,
                ActionContentRenderers: actionContentRenderers,
            },
        },
    }
}
