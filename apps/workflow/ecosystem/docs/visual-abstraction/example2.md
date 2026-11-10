Back to [Visual Abstraction Overview](./visual-abstraction.md)

# Visual Abstraction Example 2

Here is a more complex example used in the Workflows Components system. It should follow the same recipie as the first, but now with more cases to consider.

Here is the unabstracted top-level Workflow Renderer, with the branch points/arrays already identified.
```jsx
export function Workflow({
    workflow, actionsWithContexts, previousValues, refresh, 
    fetchToCallback, isCheckmark, onNavigateFactory 
}) {
    const firstIncompleteAction = props.actionsWithContexts.find(awc => awc.actionState.stateType !== "completed")

    return (
        <Accordion
            defaultActiveKey={firstIncompleteAction?.action?.id}
            flush
        >
            <div className='flex flex-col'>
                <p className='text-2xl mb-0'>{workflow.baseAction.name}</p>
                <p className='text-gray-600 text-lg'>{workflow.baseAction.description}</p>
                {actionsWithContexts.map(actionWithContexts => {                                  // ARRAY
                    return (
                        <div className='p-2 flex gap-10' key={actionWithContexts.processedAction.id}>
                            <div className="grow">
                                <CardAction
                                    previousValues={previousValues}
                                    actionWithContexts={actionWithContexts}
                                    refresh={refresh}
                                    fetchToCallback={fetchToCallback}
                                    isCheckmark={isCheckmark}
                                    onNavigateFactory={onNavigateFactory}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </Accordion>
    )
}
```

So, we will parameterize everything down until the array. Or will we? In example 1, there was a form, which requires a lot of state management and buttons that can't really be avoided. But in this case, almost everything we show the user is entirely cosmetic, and not neccesarily needed for the component to function.

The general rule is to force as little as possible onto the consumer. This leads us to the following renderer/logic component pair:

```jsx

export function Workflow({
    workflow, actionsWithContexts, previousValues, refresh, 
    fetchToCallback, isCheckmark, onNavigateFactory 
}) {
    return (
        <WorkflowRenderer
            actionsWithContexts={actionsWithContexts}
            workflow={workflow}
        >
            {actionsWithContexts.map(actionWithContexts => {
                return (
                    <div className='p-2 flex gap-10' key={actionWithContexts.processedAction.id}>
                        <div className="grow">
                            <CardAction
                                previousValues={previousValues}
                                actionWithContexst={actionWithContexts}
                                refresh={refresh}
                                fetchToCallback={fetchToCallback}
                                isCheckmark={isCheckmark}
                                onNavigateFactory={onNavigateFactory}
                            />
                        </div>
                    </div>
                )
            })}
        </WorkflowRenderer>
    )
}

function WorkflowRenderer(props) {
    const firstIncompleteAction = props.actionsWithContexts.find(awc => awc.actionState.stateType !== "completed")

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
}
```

Now, the Workflow component lets the WorkflowRenderer show cosmetic information. The Workflow component does depend on the WorkflowRenderer to use the given `children` prop somewhere in it.

> But wait! The Workflow component isn't abstract! It has divs!
>
> When consulting the current implementation of the abstracted version of this component, I found that those divs were removed. Assuming they weren't, the best way to handle those divs would be to move them inside the CardAction component. I won't actually include them when we look at the CardAction but just know you could.

We can make this look a lot better by using prop spreading. In reality, these components are thoroughly typed, but we don't want to worry about types yet, so I'll just show what the components look like using prop spreading.

(I'll also get rid of the divs.)

```jsx
export function Workflow(props) {
    const { actionsWithContexts, workflow } = props

    return (
        <WorkflowRenderer
            actionsWithContexts={actionsWithContexts}
            workflow={workflow}
        >
            {actionsWithContexts.map(actionWithContexts => <CardAction {...props}/>})}
        </WorkflowRenderer>
    )
}

function WorkflowRenderer(props) {
    const firstIncompleteAction = props.actionsWithContexts.find(awc => awc.actionState.stateType !== "completed")

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
}
```

Cool! Now, CardAction is another component, and while it isn't a good example for this tutorial, we can still do talk about it.

But before then, there is a bigger question. How will Workflow get WorkflowRenderer? Most visually abstracted components are stored in a library, and they can't just import one renderer. They have to support all renderers! The renderer that a logic component uses cannot be static, and so it cannot be imported. Instead, it must be a parameter.

That parameter exists as `props.renderers`, which contains the renderers a logic component needs. Now is about a good time to get types involved.

```jsx
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
            {actionsWithContexts.map(actionWithContexts => 
                    <CardAction
                        {...props}
                        renderers={renderers.CardActionRenderers}
                    />
            )}
        </renderers.WorkflowContainer>
    )
}
```

This may look a bit different because I've copy-pasted this from what was currently in the Workflows Components system.

The JSDoc immediately above the function says that `props` is a combination of a whole bunch of stuff, as well as `& WorkflowRenderers`. For now we will focus on that.

Immediately above that JSDoc comment is another JSDoc comment that defines what `WorkflowRenderers` is, which is an object with the WorkflowContainer renderer, and then another object with renderers.

Looking at the Workflow component, you can see how the `WorkflowContaine`r renderer is accessed and called with some information, just like in the previous snippet.

We can see that the `CardAction` is passed a renderers object. Specifically, the `CardActionRenderers` specified in the `WorkflowRenderers` type. This is because every logic component that contains other logic components must pass down the renderers for those logic components.

Basically, the WorkflowRenderers type can be determined by:
1. Adding a renderer in the type for each renderer used (`WorkflowContainer: Renderer<WorkflowContainerProps>`)
2. Adding an object of renderers of any logic components used (`CardActionRenderers: CardActionRenderers['renderers']`)

In this case, we use one renderer, and one logic component, and so we have one of each. What exactly is in the CardActionRenderers type is not important and is up for the CardRenderer to decide. This process recurses all the way down until the lowest level logic component is reached.

To revisit the props type, we also see a bunch of other props that aren't renderers. Those can be whatever, and are either used for logic inside the logic components, or for cosmetics/logic inside the renderers. The component's usage documentation will have more information on the most common high level information props.

For further reading, you can check out the Workflows Components! A good way to learn how the types work is to start at an Output logic oomponent and see how the `renderers` object type gets built up as you advance up the tree. Also note how as a logic component traverses down its tree, different information is passed at each step. Sometimes, like in the case of the Outputs, functions and important information are passed down. This is an example of how logic components can still be controlled components.