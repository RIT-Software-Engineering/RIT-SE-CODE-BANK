Back to [Ecosystem Overview](../README.md)

# Components Maintenance Guide

There are many reasons to make modifications to the Components system, including:
- Changing what actions of a workflow to show
- Adding new interactivity (Changing how actions are shown)
- Adding Output types (Dates, sliders, other concoctions)

While my advice of choice is to say "copy+paste and Goto Definition", there is some more information here to get people started/discuss some technical challenges in more detail. I do stand by that advice though!

# Note on Visual Genericization

While this library claims visual genericization of workflow rendering, there are some valid points of confusion/concern.

- Why are so many components named after specific UI components, like "CardAction" or "FormAction"?

While these components are indeed visually abstract, the interactivity provided by each varies. The "CardAction" is doing a lot of work, because it both recurses into complex/workflow actions, and also uses different renderers depending on action state and whether or not an action is a checkmark action. While a highly generic component would technically work, it would then put all of that work onto the consumer.

I reccomend looking at the "CardAction" component for more context. Ideally, the example server would also show examples of this. If you don't want the level of granularity defined in CardAction, then you are free to provide identical renderers to both values, which will effectively nullify certain comparisons.

Other components are named after what they should represent. A form action expects its renderer to be like a form, and provides interactivity hooks in accordance. The ViewEditAction expects its renderer to be like an action that can be viewed or edited, and so on. While these names aren't hard requirements (You could use the ViewEditAction and then just hack the interactivity hooks to always have editing to be true so that it is basically a FormAction) they are helpful starting points for implementations.

Still, I think that overall, the naming conventions are weak and subject to improvement.


# Adding New High-level Components
Currently, the only component available that can render multiple actions is the Workflow component. But, imagine a scenario where a consumer only wants to render one action of a workflow, let's say the first incomplete action. This is a simple change. Look at the current code for the Workflow component in `Workflows.jsx`:

```
/**
 * @typedef {{ 
 *      renderers: {...}}
 * } WorkflowRenderers
 */
/**
 * @template T
 * @param {{
 *  ...
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
```

Right now, its rendering all of the actions inside that map. While you could probably do some hack to avoid rendering actions you don't want, there is a much simpler way. Here's the exact same component, but with some small changes:

```
/**
 * @typedef {{ 
 *      renderers: {...}}
 * } WorkflowRenderers
 */
/**
 * @template T
 * @param {{
 *  ...
 * }
 * & WorkflowRenderers
 * } props
 */
export function WorkflowFirstIncomplete(props) {
    const { actionsWithContexts, renderers, workflow } = props

    const firstIncompleteAction = actionsWithContexts.find(awc => awc.actionState.stateType === "completed")

    return (
        <CardAction key={firstIncompleteAction.processedAction.id} {...props} renderers={renderers.CardActionRenderers} actionWithContexts={firstIncompleteAction}
    )
}
```

We have all the same information available as in the top example, but now we selectively render only one action. If you want, you can still include the workflow container renderer.

# Adding New Interactivity

This relates closely to the "note on visual genericization." If you wish that a component had some button to press on it, that would, say, freeze the action, then, you'd just add a button inside your renderer that does that. Most examples that I can think of can be covered by just adding a button and handler inside your renderer.

BUT, if you somehow come up with something you want to change about how actions are rendered that AREN'T covered by changes to the renderer, the place you'd go for that would be `Actions.jsx`. You'd look at `ActionCard` for a reference of a fleshed out component, and look at `ActionContent` for what the most basic Action is.

# Adding New Outputs

If you come up with a new type of output that you would like to render, then you'd add it inside the `Outputs.jsx` file. This might be the hardest place to make changes to, but things are not as abstract as they seem. Most Outputs are just a few important pieces:

- Managing `value`
- Validation
- Passing values to the renderer

I'll be looking at the `TextOutputController`. From the top down, types:
```
/**
 * @typedef {{
 *      renderers: {
 *          TextOutput: Renderer<TextOutputProps>
 *      }
 * }} TextOutputRenderers
 */
/**
 * @param {OutputStateProps & OutputRenderers} props
 */
 function TextOutputController({ output, value, setValue, submitted, validatorRegistry, renderers, disabled }) {
 ```

 The function signature and associated type definitions represent the information and stateful values that are relevant to the form, as well as the renderers to render and provide interactivity to that state.

 Inside of `Outputs.jsx`, you can go find what any of these types means, but for completeness, I'll review them here.

 ```
 type OutputStateProps = {
    value: any;
    setValue: React.Dispatch<any>;
    submitted: boolean;
    validatorRegistry: React.RefObject<OutputValidatorRegistry>;
    disabled?: boolean;
} & OutputDefinitionProps

type OutputDefinitionProps = {
    output: {
        key: string;
        name: string;
        isRequired: boolean;
        placeholder: any;
        initialValue: any;
        type: "number" | "text" | "select" | "checkmark" | "file";
        validation: {
            [index: string]: any;
        };
    };
}
```

`OutputStateProps` are the state that is relevant to forms. Since this form is a "Controlled Component" it is given its value and setValue by the parent. `submitted` and `validatorRegistry` are for validation (more information in the definition for `OutputValidatorRegistry`), and disabled is also given, usually defined by if the action is "frozen", in Workflows terms.

`OutputDefinitionProps` is the information side, and this information should be familiar if you've read the Workflows Ecosystem Integration Guide. It just matches the metadata that can be given for each output, and informs how the user's input is required, validated, named, displayed, etc. We'll see these values used later.

As for the renderers, this system isn't very crucial to creating more outputs. If you want more info, check the visual abstraction guide.

OK, that was the hard part, here's the whole thing:
```
/**
 * @typedef {{
 *      renderers: {
 *          TextOutput: Renderer<TextOutputProps>
 *      }
 * }} TextOutputRenderers
 */
/**
 * @param {OutputStateProps & OutputRenderers} props
 */
function TextOutputController({ output, value, setValue, submitted, validatorRegistry, renderers, disabled }) {
    const [touched, setTouched] = useState(false)

    const getError = useCallback(nextValue => {
        if (output.isRequired && !nextValue && nextValue !== 0) return 'This field is required'
        if (!nextValue) return null

        if (output?.validation?.minLength && nextValue.length < output.validation.minLength)
            return `Must be at least ${output.validation.minLength} characters`
        if (output?.validation?.maxLength && nextValue.length > output.validation.maxLength)
            return `Must be at most ${output.validation.maxLength} characters`
        return null
    }, [output.isRequired, output.validation?.minLength, output.validation?.maxLength])

    useEffect(() => {
        const validators = validatorRegistry.current
        validators[output.key] = getError
        return () => void delete validators[output.key]
    }, [getError, output, validatorRegistry])

    const error = getError(value)
    const showInvalid = error && (touched || submitted)

    return (
        <renderers.TextOutputRenderers.TextOutput
            disabled={disabled}
            output={output}
            submitted={submitted}
            required={output.isRequired ?? false}
            value={value}
            placeholder={output.placeholder}
            onChange={e => setValue(e.target.value)}
            onBlur={() => setTouched(true)}
            isInvalid={showInvalid}
            error={error}
        />
    )
}
```

Everything before the return statement is in service of validation. `getError` reads the output's metadata and applies validation based on that. `nextValue` represents the value the user is trying to enter.

The useEffect is to pass that `getError` function up the component tree, so that when the user presses submit at the Action level, that each Output's validation functions are still called. Passing information up the component tree is inevitably difficult. It's called `ValidatorRegistry` because its a collection of validators (`getError` functions) that each output has to "register" with. If you leave this useEffect out, it means that the user will be able to submit invalid values in some cases, since the validator isn't running on Action submission.

Then, we just pass a ton of things down to the renderer. This is the only case were we pass so much, luckily.

## What if I'm adding a crazy output?

### Default value issues

There are output types that don't neccesarily fit nicely. Take for instance, a series of checkboxes, where the user can mark each one on or off at their choosing, where each box can have its own value. This would be represented by an array of `false | string`, where each element is either false, or the value.

The biggest problem here is that the default value is tough. Normally, `value` is null if the user hasn't entered anything for it. But then what does `null` represent? All values false? Sure, but whose job is it to say that? Is it the component that is "controlling" the form, the OutputController, or the renderer? The choice I made is that this happens inside the component that controls the form. See `ActionContents` or something for more context. I don't know if I like this decision, feel free to change it. 

Other than that, your setValue functions might need to get a bit more complex, since several values are being handled.

Alternatively, we could just show this as a series of checkmark outputs and avoid all of this stuff. Welp! The "multiselect" Output type already exists, so here we are.

### Files

Another example is things going weird is the "date" output type. The value stuff works fine, but when it comes time to submit, the Action component will take each output, read its "key" and current value, then put all of those pairs into an object, and then send that object into the `fetchToCallback` function.

Let's say you have an action with two outputs, a file output and a text output. They have keys "file" and "name" respectively. Once the user fills both of them out and presses submit, this object shape will be given to `fetchToCallback`:
```
{
    file: File,
    name: string
}
```
in the `fetchToCallback` given in the integration guide, we basically do no processing and send the object right over the wire. But this wouldn't work, you can't just send a File object over JSON! But you can with FormData objects.

Really, what we all should've been using from the beginning are FormData objects, but alas, the world loves JSON. So, we need some way to send this to the backend in a way that is predictable, and ideally respects the key system.

Right now, this is unsolved. CMT only needed to have an action with a single file output, and we check for it in a pretty ad-hoc way, and violate the key ststem. You can check out how we do it by searching for "fetchToCallback" inside of the cmt folder and emulate it in the worst case.

If you want a better solution, I'd bite the bullet with base64 encoding and automatically encode all File objects (using `instanceof File`), and then the API can just decode it. This is the simplest, respects keys, but is a little slower and takes a bit more data.