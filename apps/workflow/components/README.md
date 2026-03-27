# Workflow Components

## Getting started

If you want to skip the reading for now and just mess with code, run `npm run i` and `npm run example` in this package's directory.

If you want to install this package into your own repo, run these commands in this package's directory:
1. `npm i`
2. `npm run build`
3. `npm pack`

This should create a .tgz file in the package root. Then, go to your package and add this line to your list of dependencies:
```
"@se-code-bank/workflows-components": "file:../../workflow/components/se-code-bank-workflows-components-1.0.0.tgz",
```
**NOTE**: You will likely have to change the text after "file:" to match your project's structure. For reference, this line works for the CMT Frontend.

Then, in your project's root, run `npm i` and it should add the package.

## Overview

> Workflow Components are meant to be used alongside Workflows Contexts. More information is below.

The process of rendering a workflow can be complicated! Given a workflow, you have to recursively iterate through all of its actions, render information about those actions, dynamically create forms based off those actions, and then have a submission system that reaches both the Workflows API and your API!

Workflows Components takes care of the iteration, the dynamic forms, and (most of) the submission, meaning its up to YOU to render the actions. This system is meant to make that as easy as possible.

To use a component, you have to provide it two things:
- Information (Usually an ActionWithContext)
- Renderers

Information, generally, is either fed into renderers, or used by the components for interactivity. A component should have a thorough type definition for what information it expects.

Renderers take that information, along with interactivity hooks, and do two things:
- Show the user relevant information
- Allow the user to trigger the interactivity hooks

Examples of this live in `examples/`. Depending on your UI library of choice, you can copy and paste either of them into your project.

A more detailed explanation of both Information and Interactivity hooks are below.


## Types?

This package strongly leverages Typescript, which may sound weird, since its entirely in javascript. But, it is very *very* helpful. VSCode automatically has Typescript installed, all you need to do is configure it. There is a lot to get into when it comes to workspace configs and your VSCode's settings, but the most important part is the config. You can take the `tsconfig.json` that exists in the CMT Frontend and copy it into your frontend's root directory to start. 

Types are not required to use this package, but unless you plan to strictly abide by the example code, it may get you into a nest of hard-to-interpret errors.

> To see if your VSCode is correctly configured, see if this package's example files work. Try hovering over types, or intentionally messing up an object to not meet the type's requirements. Either of these should produce feedback (display type on hover, red squiggly line on incorrect type). If this doesn't work, look into your workspace or VSCode config.

### Type Naming Conventions

As shown in the examples, if you aren't defining your renderers inline, having your renderer functions have types is incredibly helpful, and provides both autocomplete and linting.

If you're using a component you aren't familiar with, you can usually guess the name of the prop's types by just adding "props" to the end (`NavigateButton` -> `NavigateButtonProps`). This will then make it so that if you type `props.` it will show you `onClick`. If you forget to use a property on props, it will possibly affect the component's functionality, but will not warn you! So, having the `props.` autocomplete is a great way to ensure you've used them all. 

If you ever want to know what a type actually is, just put your cursor on top of it > right click > Go To Definition. This is super duper useful! F12 also works.

### Information

A component provides information to the renderer. The quintessential pieces of information passed around are Action(s)WithContexts. To use these components, you will need to process your workflows data. See the Workflows Context system for more information. 

Different projects may have different Action Contexts. For example, CMT doesn't have teams, but a project that does would attach a "teamState" object or similar onto their ActionWithContexts, and then would access it in their renderers.

Here's an example of a information-heavy component:

```
/**
 * @param {ActionContainerProps} props 
 */
function ComplexCardContainer(props) {
	return (
		<Accordion.Item eventKey={props.actionWithContexts.action.id}>
			<Accordion.Header>
				<div className='flex items-center mr-8 justify-between w-full'>
					<div>
						<p className='text-2xl mb-0'>{props.actionWithContexts.action.name}</p>
						<p className='text-gray-600 mb-0'>{props.actionWithContexts.action.description}</p>
					</div>
					<BasicStatusIcon stateType={props.actionWithContexts.actionState.stateType} />
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
```

This component is a mostly information component, and exclusively accesses the actionWithContexts object. The JSDoc comment at the top is very helpful in ensuring you know what is inside the "props" object (See Type Naming Conventions)

To show how to change these components, let's say you want a progress bar to show how many actions in this complex action are completed. Youd iterate through `props.actionWithContexts.action.childActionsWithContexts` and check those action's `actionState.stateType`, and then render a progress bar based on the amount of "completed"s and non-"completed"s, like this:

```
const childActions = props.actionWithContexts.action.childActionsWithContext ?? []
const completedCount = childActions.filter(
	child => child.actionState.stateType === 'completed'
).length
const progress = childActions.length ? (completedCount / childActions.length) * 100 : 0

<ProgressBar now={progress} label={`${completedCount}/${childActions.length}`} />
```

If your ActionToActionWithContexts function gathered information like team progress, you could also access it here and display it, for a team progress bar instead!

### Interactivity Hooks

A component provides interactivity hooks to the renderer. These are what allow the user to take advantage of all that recursion and dynamic form creation that the components do!

For example, a CancellableEditForm is an edit form that is cancellable, and to the renderer it provides 3 arguments:
- onSubmit
- onCancel
- children (not really a hook, but isn't really "information" either.)

This means that the renderer needs to use these 3 arguments somewhere, as in, you need a button that calls onSubmit, one that calls onCancel, and then you need to render the children. Here's an example with code:

```
/**
 * @param {CancellableEditActionFormProps} props
 */
function CancellableEditActionForm(props) {
	return (
		<Form className='flex items-center gap-6 bg-indigo-300 pl-2' onSubmit={props.onSubmit}>
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
```

Because this component is very simple, it doesn't have any information passed to it. Its only job is to add a submit button, a cancel button, and render the children it was given. The JSDoc comment at the top is very helpful in ensuring you correctly use the "props" object (See Type Naming Conventions)

The flexibility of the renderer system is that you can calls these functions absolutely however you'd like. Because renderers are components, you can even put your own custom logic inside of your renderers. (For advanced custom logic, see "Passing Custom Props")

A low-level component, like a Text Output, will only take one or two renderers, but a high-level component like a Workflow will take many. You must provide Workflow with a full tree of renderers, but redundancy can be avoided (see Examples' usage of `CreateWorkflowRenderers`)


## Editing This Package

Because this is an npm package, its not as simple as refreshing the frontend. Whenever a change is made, the following must be done:
1. Increment the version number in this `package.json` (semver, plz)
2. In this directory, run:
	1. `npm run build`
	2. `npm pack`
3. Stop your frontend server
4. Change your project's `package.json` to match the new version number
5. In your project root, run `npm i`
6. Restart your frontend

This may seem cumbersome, especially when faced with the alternative of symlinks. A symlink would allow multiple projects to act as though the Workflows Components files were just another file in the project that could be imported totally normally, but there are some greater concerns there:
1. Changes to the package may break other projects
2. Symlinks are OS specific

Mainly point 1 is the issue. There could definitely be scripts to make this process of updating easier, but it is an important process.


# Advanced

## Adding Components
Adding components is complex, but easy. You can copy/paste everything and get through it probably, but the below guide should aim to create an understanding to help you with your copy/pasting.

A component is a combination of 3 things: information props (like ActionsWithContexts), renderer props, and other components. If you look at the internal Workflow component, you can see the two types of props in the component's props' typedef. If you look inside the component, you can see the other components it uses.

The hardest part of adding a component is keeping your types in order. This is arguably very important, since the bugs that happen when your types are incorrect are much harder to investigate than a red squiggly line in VSCode! Each component follows the same pattern with typing. 

To understand, a good place to start is to look at a low-level component, like NumberOutput, and notice how there is one renderer, and one information type. The information type is factored out for reuse, but the principle is still there. Notice that the renderers definition is also factored out. This will be useful in a moment.

Look at the Output component. It is exactly one level above, and you can see how it requires one new renderer, the output container renderer. Importantly, next to it you can see nested renderer properties. This is why we factored out the renderers definition on the NumberOutput. Any component that uses another component needs to require that component's renderers as a key in it's own renderer object. This pattern is repeatead at every level, and is what gives us the full tree structure of renderers.

This nested tree is great for granularity, allowing a consumer to customize every single component in basically every single state. But, it means that a consumer also needs to write out that huge tree! That stinks, which is why the high-level Workflows component has a utility function to allow a consumer to do a lot less work. Any other high-level components you add should probably have this too.

New components, if possible, should be added to this library.


## Passing Custom Props
You probably won't have to do this! Information props, discussed in the overview, can be customized to give you what you need. You would either have the information contained in your ActionWithContexts object, or create a new component that takes custom information.

If you really need to change these components, first see if it would make sense to modify the components directly. If its a teams/notifications feature, maybe its a good thing to incorporate, even if not all consumers would use it. 

Anyways, passing custom props.
Two ways I see:
- React Contexts
- Renderer factory

React contexts are probably way easier, but a renderer factory is possible for a more clear prop tree. These are just ideas, I haven't done these myself.

## Questions?
The author of this system is Scott Happy (sdh8796@rit.edu). If you have questions, feel free to reach out on Slack until Spring 2027.  