Back to [Ecosystem Overview](../README.md)

# Integration Overview

This is probably the quickest way to integrate the Workflows Ecosystem into your project. Code is included but the source files and example code of already-integrated projects can be useful.

## JSDoc Types
JSDocs and Typescript are great ways to check your work. To avoid issues, please at least try setting up Typescript. Assuming your setup is correct, copy-pasting the tsconfig.json in the workflows folder into your project should work. 

See examples for usage of JSDocs. A lot of the syntax is unintuitive but very easy to copy-paste.

## 1. Build Workflow
The builder or another workflow-authoring path creates workflow data in the Workflows API. A lot more information for this exists in the builder's documentation, which is linked in the Ecosystem Overview.

## 2. Fetch Workflow Data
When displaying that workflow, the following is usually fetched on the server:
- the workflow
- the workflow's actions
- the current user's action states
- any project-specific extra data it wants to attach

These will be shown again in the next step.

## 3. Attach Context To Actions
Raw workflow actions are not enough for rendering. The frontend needs at least:
- action metadata
- the current user's action state
- a callback URL or callback context
- optionally extra project-specific context


At a minimum, your transformation step should produce:
- `processedAction` (Just the action, but with metadata parsed and child actions also contextualized)
- `actionState`, which is the actionState of the associated action for the user who will view the workflow
- `callback` for simple actions

The provided utility functions in this package currently cover this with minimal custom code needed.

Here is an example of what your project's custom code might look like.

```jsx
// workflowsFetch is a utility from CMT, and works like how you'd expect (makes a call with the given method).
const actions = await workflowsFetch('GET', `actions?workflowId=${workflowId}`)
// Note that workflowStateId is implicitly associated with a user, meaning that anywhere else this workflowState goes, the user will be associated with it.
// In CMT's case, we directly query a Professor's Course's associated workflowStateId and feed it here.
const workflowState = await workflowsFetch('GET', `states/workflow/${workflowStateId}`)

const actionsWithContexts = actions.map(action => genericActionToActionWithContexts(action, workflowState))

function genericActionToActionWithContexts(action, actionStates) {
    const baseActionsWithContexts = scaffoldBaseContexts(action)
    const actionsWithActionStateContexts = addActionStateContext(baseActionsWithContexts, actionStates)
    const actionsWithCallbackContexts = addCallbackContext(actionsWithActionStateContexts, actionStates, determineCallback)

    return actionsWithCallbackContexts
}

// Your determineCallback function can also just have a single URL that is always returned, like 'api/completeAction?asid={actionStateId}`
// The critical part is the actionStateId part, since it will tell your backend which action to check off.
function determineCallback(code, actionStateId) {
	if (code === "RESOURCE1") return `api/resource1?asid=${actionStateId}`
	if (code === "RESOURCE2") return `api/resource2?asid=${actionStateId}`
	else throw Error(`code ${code} not recognized. Add it in determineCallback`)
}
```

### Custom Contexts

If you want to add custom contexts, you should look at the implementation of a function like `addActionStateContext` and copy-paste it. If it is a function that would reasonably be used by other projects, it may be worth adding it inside the ecosystem's package's source code.

## 4. Return The Context-Enriched Actions To The Frontend
Once your backend has turned raw workflow data into `ActionWithContexts`, return that to the frontend **along with any top-level workflow data and any project record used for previous values**.

## 5. Supply Project Hooks
The `Workflow` component still needs a few project-owned functions:
- `fetchToCallback`: how the frontend actually sends user output to the callback URL. If you don't see a reason for this, you can have it always return the same URL. But, you should still include the action state id (asid) in your URL in some form, like a query parameter, so you know what action should be marked as complete.
- `isCheckmark`: whether a simple action should render through the specialized checkmark path. This is optional and can always return false.
- `refresh`: how to refetch data after an action changes state.
- `onNavigateFactory`: optional project navigation behavior for code-driven navigation actions.

Examples:

### fetchToCallback
```jsx
function fetchToCallback(callback, outputValues) {
	// CMTJsonFetch is a utility function from CMT, but all it does is make a PUT to `callback`, with a body of the jsonified `outputValues`
	return CMTJsonFetch('PUT', callback, outputValues)
}
```

### isCheckmark
```jsx
// Typical
function isCheckmark() {
	return code.includes("CHECKMARK") || code.includes("SESSION_")
}

// Alternatively,
function isCheckmark() {
	return false
}
```

### refresh
```jsx
function refresh() {
	return CMTJsonFetch('GET', `course/${id}`).then(async json => {
		setCourse(json.course)
		setActionsWithContexts(json.actionsWithContexts)
		setWorkflow(json.workflow)
	})
}
```

### onNavigateFactory
```jsx
function useOnNavigateFactory(code) {
    const navigate = useNavigate()
    let getElement;

	// This ones a little weirder. Basically there are two options, scroll, or link.

	// Scroll. Build up this kinda weird function so that when the user clicks the navigate button, we look for the element and scroll to it. The element ID we use here is entirely arbitrary and only needs to match an ID of one of your elements.
    if (code.includes("SESSION_")) getElement = () => document.getElementById(`WORKFLOW_JUMPPOINT_${code}`) 
    
	
	// Link. This ones easier. When navigating, it just sends the user to a page. Because navigation is a hook, we need to name the function accordingly by prefixing it with "Use"
	if (code === "CHECKMARK_PUBLISH_SITE" || code === "CHECKMARK_COLUMN_VISIBILITIES") return () => navigate("/coursewebsite")

    if (getElement) return () => getElement()?.scrollIntoView({ behavior: "smooth" })

    return null
}

// Alternatively,
function onNavigateFactory() {
	return null
}
```

`fetchToCallback` and `refresh` are the two important ones. I reccomend that whatever state that your refresh function updates is also the same state that the rest of your page goes off of. Then you won't need to worry about stale state.

## 6. Supply Renderers

When instantiating the Workflow logic component, Typescript autofill may give you a very big and scary object type for the renderers. This is because the logic components have a big tree of renderers they need.

Use `createWorkflowRenderers` from [../src/components/components/Workflows.jsx](../src/components/components/Workflows.jsx) to provide a flat renderer map instead of constructing the full nested tree manually.

The most useful way to learn how to create the renderers is to go off of the examples here:
- [../src/components/examples/ReactBootstrapExample.jsx](../src/components/examples/ReactBootstrapExample.jsx)
- [../src/components/examples/MaterialUIExample.jsx](../src/components/examples/MaterialUIExample.jsx)

If you want a better understanding of what is actually happening, check out the [visual abstraction tutorial](./visual

If you find yourself writing a renderer function and want autofill on the `props` parameter, then add a JSDoc comment for your function that specifies `prop` to be of the corresponding type.

Type names for props are intentionally guessable:
- `NavigateButton` -> `NavigateButtonProps`
- `CancellableEditActionForm` -> `CancellableEditActionFormProps`
- `WorkflowContainer` -> `WorkflowContainerProps`

This is what the end instantiation should look like.

```jsx
<Workflow
	// workflows API derived
	workflow={workflow}
	actionsWithContexts={actionsWithContexts}

	// domain derived
	previousValues={previousValues}

	// frontend logic
	refresh={refresh}
	fetchToCallback={fetchToCallback}
	isCheckmark={isCheckmark}
	onNavigateFactory={onNavigateFactory}

	// rendering
	renderers={createWorkflowRenderers({
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
	})}
/>
```

## Metadata conventions!

While that is technically everything you need, there are a couple important things about metadata.

Simple actions have a field in their metadata called "outputs". This field is an array, where each element is an object with a couple fields. The most important of these fields is "key". This field is **super important** and determines what object the frontend will get when the logic component calls `fetchToCallback`, and is also what the logic components look for inside the `previousValues` object you pass in.

A quick example:

Here is an example course. The closer this object is to its database representation the better! The code here is copy-pasted practically directly from CMT.
```jsx
const course = {
	name: "Incomplete Nam",
	students: 40
}
```

We'll assume that this information is currently in the database. So, we fetch it
```jsx
const course = await prisma.course.findUnique({
	where: { id: parseInt(req.params.id) },
})
```

And then return it.
```jsx
res.json({ course, ... })
```

In the frontend, we receive it!
```jsx
CMTJsonFetch('GET', `course/${id}`).then(async json => {
	setCourse(data.json)
	...
})
```

Then, we give it to the logic component.
```jsx
<Workflow
	previousValues={course}
	...
/>
```

Then. For every output the workflow component renders, it will check if the output's key exists on `previousValues`. If it does, then it will "hydrate" the form with that value. This is pretty important for letting the user know what they last entered on a form! 

While that part is optional, something that is less optional is how an output's keys inform `fetchToCallback`. While console.log troubleshooting would certainly work, I'll give it a shot at saving you the effort.

We are rendering an action with two outputs:
```jsx
const processedAction.parsedMetadata.outputs = [
	{
		name: "Course Name",
		type: "string",
		key: "name"
	},
	{
		name: "Number of Students",
		type: "number",
		key: "students"
	}
]
```

The user fills these out, and then presses submit. This is what happens inside the logic component:

```jsx
async function onSubmit(e) {
	e.preventDefault()

	// Validation + Render state logic...

	await fetchToCallback(actionWithContexts.callback, outputValues)
	refresh()
}
```

Assuming the user has entered `"Swen-101"` and `30` for these outputs, this will be the value of `outputValues`:
```json
{
	"name": "Swen-101",
	"students": 30
}
```

To reiterate, the keys of an action's output's inform both how `previousValues` is read for form hydration, and also how `outputValues` are passed to your given `fetchToCallback` function.

### Note on Files

Files introduce a bit of an edge case. Read more about them in the components maintenance file.