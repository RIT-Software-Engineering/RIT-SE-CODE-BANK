Back to [Visual Abstraction Overview](./visual-abstraction.md)

# Visual Abstraction Example 1

Here is the component that we will visually abstract. Being a form, there isn't a lot of wiggle room for rendering. This limits the usefulness of the example, but it is a good way to show how to apply abstraction to a boring and long component.

```jsx
export function WorkflowModal({ 
    isOpen, setIsOpen, workflows, setWorkflows, 
    WorkflowSubmit, curWorkflow, isEdit, setIsEdit, 
    workflowEditSubmit, extraData, loadFunction, clearFunction, children 
}){

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [error, setError] = useState('');

    // Called when finished submitting or exiting the modal
    function clearForm(){ /* state management */}
    // Loads data from the current workflow. Only called on edit.
    function loadForm() { /* State management */ }
    async function submitWorkflow() {/* Logic and state management */}
    async function editWorkflow() {/* logic and state management */}

    return (
        <Modal
            size="lg"
            centered
            show={isOpen}
            onShow={() => { if (isEdit) loadForm() }}
            onHide={() => { setIsOpen(false); clearForm()}}
            onExit={() => { setIsOpen(false); clearForm()}}
        >
            <Modal.Header closeButton>{isEdit ? 'Edit': 'New'} Workflow</Modal.Header>
            <Modal.Body>
                {error
                    ? <div className="alert alert-danger"> {error} </div>
                    : <></>
                }
                <Form>
                    <div>
                        <Form.Label>Workflow Name</Form.Label>
                        <Form.Control
                            required
                            onChange={e=>setName(e.target.value)}
                            defaultValue={isEdit ? curWorkflow.name : ""}
                        />
                        <Form.Label>Workflow Description</Form.Label>
                        <Form.Control
                            required
                            onChange={e=>setDescription(e.target.value)}
                            defaultValue={isEdit ? curWorkflow.description : ""}
                        />
                        <Form.Label>Workflow Tags (Seperate by commas)</Form.Label>
                        <Form.Control
                            required
                            onChange={e=>setTags(e.target.value)}
                            defaultValue={isEdit ? curWorkflow.tags : ""}
                        />
                        {children}
                    </div>
                    
                    <div className="flex pt-2 justify-end">
                        <Button type="submit" onClick={(e) => {
                            e.preventDefault()
                            if (isEdit) editWorkflow()
                            else submitWorkflow()
                        }}>{isEdit ? "Submit" : "Add Workflow"}</Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    )
```

What a big scary component, visually abstracting this must be super difficult!

Well, all it takes is one trick, which is identifying branches.

---

### What is a branch?

A branch in our context is a literal code branch (if statement/ternary expression) or a .map or similar function. These matter because they are the hardest parts of a component to expect a consumer to replicate.

Conceptually, the only other kinds of code that exist in a component are either functions, or are cosmetic. If we didn't have branches to worry about, visually abstracting a component would be as simple as giving a bunch of functions to a renderer and asking it nicely to call them all. If that doesn't make since, then stick with me.

Here is the example from before, with "// BRANCH" on branch points.

```jsx
export function WorkflowModal({ 
    isOpen, setIsOpen, workflows, setWorkflows, 
    WorkflowSubmit, curWorkflow, isEdit, setIsEdit, 
    workflowEditSubmit, extraData, loadFunction, clearFunction 
}){

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [error, setError] = useState('');

    // Called when finished submitting or exiting the modal
    function clearForm(){ /* state management */}
    // Loads data from the current workflow. Only called on edit.
    function loadForm() { /* State management */ }
    async function submitWorkflow() {/* Logic and state management */}
    async function editWorkflow() {/* logic and state management */}

    return (
        <Modal
            size="lg"
            centered
            show={isOpen}
            onShow={() => { if (isEdit) loadForm() }}
            onHide={() => { setIsOpen(false); clearForm()}}
            onExit={() => { setIsOpen(false); clearForm()}}
        >
            <Modal.Header closeButton>
                {isEdit ? 'Edit': 'New'}                                                    // BRANCH
                Workflow
            </Modal.Header>
            <Modal.Body>
                {error                                                                      // BRANCH
                    ? <div className="alert alert-danger"> {error} </div>
                    : <></>
                }
                <Form>
                    <div>
                        <Form.Label>Workflow Name</Form.Label>
                        <Form.Control
                            required
                            onChange={e=>setName(e.target.value)}
                            defaultValue={isEdit ? curWorkflow.name : ""}
                        />
                        <Form.Label>Workflow Description</Form.Label>
                        <Form.Control
                            required
                            onChange={e=>setDescription(e.target.value)}
                            defaultValue={isEdit ? curWorkflow.description : ""}
                        />
                        <Form.Label>Workflow Tags (Seperate by commas)</Form.Label>
                        <Form.Control
                            required
                            onChange={e=>setTags(e.target.value)}
                            defaultValue={isEdit ? curWorkflow.tags : ""}
                        />
                    </div>
                    
                    <div className="flex pt-2 justify-end">
                        <Button type="submit" onClick={(e) => {
                            e.preventDefault()
                            if (isEdit) editWorkflow()
                            else submitWorkflow()
                        }}>
                            {isEdit ? "Submit" : "Add Workflow"}                            // BRANCH
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    )
```

The branch points here are pretty simple! Because they are so simple, one may consider ignoring them. For the sake of the tutorial, We will ignore the `isEdit` ternaries and not ignore the `error` ternary.

### Here we go!

1. Take the JSX element in your component UP UNTIL ANY BRANCHES and put it in a different function.

```jsx
export function WorkflowModal({ 
    isOpen, setIsOpen, workflows, setWorkflows, 
    WorkflowSubmit, curWorkflow, isEdit, setIsEdit, 
    workflowEditSubmit, extraData, loadFunction, clearFunction 
}){

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [error, setError] = useState('');

    // Called when finished submitting or exiting the modal
    function clearForm(){ /* state management */}
    // Loads data from the current workflow. Only called on edit.
    function loadForm() { /* State management */ }
    async function submitWorkflow() {/* Logic and state management */}
    async function editWorkflow() {/* logic and state management */}

    return (
        {error
            ? <div className="alert alert-danger"> {error} </div>
            : <></>
        }    
    )

function WorkflowModalRenderer() {
    return (
        <Modal
            size="lg"
            centered
            show={isOpen}
            onShow={() => { if (isEdit) loadForm() }}
            onHide={() => { setIsOpen(false); clearForm()}}
            onExit={() => { setIsOpen(false); clearForm()}}
        >
            <Modal.Header closeButton>
                {isEdit ? 'Edit': 'New'}
                Workflow
            </Modal.Header>
            <Modal.Body>

                // This is where the error ternary used to be

                <Form>
                    <div>
                        <Form.Label>Workflow Name</Form.Label>
                        <Form.Control
                            required
                            onChange={e=>setName(e.target.value)}
                            defaultValue={isEdit ? curWorkflow.name : ""}
                        />
                        <Form.Label>Workflow Description</Form.Label>
                        <Form.Control
                            required
                            onChange={e=>setDescription(e.target.value)}
                            defaultValue={isEdit ? curWorkflow.description : ""}
                        />
                        <Form.Label>Workflow Tags (Seperate by commas)</Form.Label>
                        <Form.Control
                            required
                            onChange={e=>setTags(e.target.value)}
                            defaultValue={isEdit ? curWorkflow.tags : ""}
                        />
                    </div>
                    
                    <div className="flex pt-2 justify-end">
                        <Button type="submit" onClick={(e) => {
                            e.preventDefault()
                            if (isEdit) editWorkflow()
                            else submitWorkflow()
                        }}>{isEdit ? "Submit" : "Add Workflow"}</Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    )
}
```

2. Wrap the branch point in your new renderer function

```jsx
export function WorkflowModal({ 
    isOpen, setIsOpen, workflows, setWorkflows, 
    WorkflowSubmit, curWorkflow, isEdit, setIsEdit, 
    workflowEditSubmit, extraData, loadFunction, clearFunction 
}){

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [error, setError] = useState('');

    // Called when finished submitting or exiting the modal
    function clearForm(){ /* state management */}
    // Loads data from the current workflow. Only called on edit.
    function loadForm() { /* State management */ }
    async function submitWorkflow() {/* Logic and state management */}
    async function editWorkflow() {/* logic and state management */}

    return (
        <WorkflowModalRenderer>
            {error
                ? <div className="alert alert-danger"> {error} </div>
                : <></>
            }    
        </WorkflowModalRenderer>
    )
```

3. Take every function and variable in your renderer function, and make it a parameter. At the same time, move those functions to the arguments of your renderer

```jsx
export function WorkflowModal({ 
    isOpen, setIsOpen, workflows, setWorkflows, 
    WorkflowSubmit, curWorkflow, isEdit, setIsEdit, 
    workflowEditSubmit, extraData, loadFunction, clearFunction 
}){

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [error, setError] = useState('');

    // Called when finished submitting or exiting the modal
    function clearForm(){ /* state management */}
    // Loads data from the current workflow. Only called on edit.
    function loadForm() { /* State management */ }
    async function submitWorkflow() {/* Logic and state management */}
    async function editWorkflow() {/* logic and state management */}

    return (
        <WorkflowModalRenderer
            isOpen={isOpen}
            onShow={() => { if (isEdit) loadForm() }}
            onHide={() => { setIsOpen(false); clearForm()}}
            onExit={() => { setIsOpen(false); clearForm()}}
            
            onSubmit={(e) => {
                e.preventDefault()
                if (isEdit) editWorkflow()
                else submitWorkflow()
            }}

            onNameChange={e=>setName(e.target.value)}
            nameDefaultValue={isEdit ? curWorkflow.name : ""}

            onDescriptionChange={e=>setDescription(e.target.value)}
            descriptionDefaultValue={isEdit ? curWorkflow.description : ""}

            onTagsChange={e=>setTags(e.target.value)}
            tagsDefaultValue={isEdit ? curWorkflow.tags : ""}
        >
            {error
                ? <div className="alert alert-danger"> {error} </div>
                : <></>
            }    
        </WorkflowModalRenderer>  
    )

function WorkflowModalRenderer(props) {
    return (
        <Modal
            size="lg"
            centered
            show={props.isOpen}
            onShow={props.onShow}
            onHide={props.onHide}
            onExit={props.onExit}
        >
            <Modal.Header closeButton>
                {isEdit ? 'Edit': 'New'}
                Workflow
            </Modal.Header>
            <Modal.Body>

                // This is where the error ternary used to be

                <Form>
                    <div>
                        <Form.Label>Workflow Name</Form.Label>
                        <Form.Control
                            required
                            onChange={props.onNameChange}
                            defaultValue={props.nameDefaultValue}
                        />
                        <Form.Label>Workflow Description</Form.Label>
                        <Form.Control
                            required
                            onChange={props.onDescriptionChange}
                            defaultValue={props.descriptionDefaultValue}
                        />
                        <Form.Label>Workflow Tags (Seperate by commas)</Form.Label>
                        <Form.Control
                            required
                            onChange={props.onTagsChange}
                            defaultValue={props.tagsDefaultValue}
                        />
                    </div>
                    
                    <div className="flex pt-2 justify-end">
                        <Button type="submit" onClick={props.onSubmit}>{isEdit ? "Submit" : "Add Workflow"}</Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    )
}
```

> The `required` attributes on the form controls are technically variables, but an important thing to keep in mind is that anyone using a visually abstract component will have yours to go off of. You can expect a consumer to copy anything important. The goal isn't to be foolproof, it's to save code. That being said, I can see the argument for having it be parameterized. Just know it's debatable.

4. Now, use `props.children` to slot in that branch point

```jsx
function WorkflowModalRenderer(props) {
    return (
        <Modal
            size="lg"
            centered
            show={props.isOpen}
            onShow={props.onShow}
            onHide={props.onHide}
            onExit={props.onExit}
        >
            <Modal.Header closeButton>
                {isEdit ? 'Edit': 'New'}
                Workflow
            </Modal.Header>
            <Modal.Body>

                {props.children}

                <Form>
                    ...
                </Form>
            </Modal.Body>
        </Modal>
    )
}
```

5. We have this renderer done, but in the logic component, we still have this pesky error:

```jsx
export function WorkflowModal({ 
    isOpen, setIsOpen, workflows, setWorkflows, 
    WorkflowSubmit, curWorkflow, isEdit, setIsEdit, 
    workflowEditSubmit, extraData, loadFunction, clearFunction 
}){

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [error, setError] = useState('');

    // Called when finished submitting or exiting the modal
    function clearForm(){ /* state management */}
    // Loads data from the current workflow. Only called on edit.
    function loadForm() { /* State management */ }
    async function submitWorkflow() {/* Logic and state management */}
    async function editWorkflow() {/* logic and state management */}

    return (
        <WorkflowModalRenderer>
            {error
                ? <div className="alert alert-danger"> {error} </div>               // Yikes!
                : <></>
            }    
        </WorkflowModalRenderer>
    )
```

This can be factored out as another renderer, like so

```jsx
export function WorkflowModal({ 
    isOpen, setIsOpen, workflows, setWorkflows, 
    WorkflowSubmit, curWorkflow, isEdit, setIsEdit, 
    workflowEditSubmit, extraData, loadFunction, clearFunction 
}){

    ...

    return (
        <WorkflowModalRenderer>
            {error
                ? <ErrorRenderer error={error} />
                : <></>
            }    
        </WorkflowModalRenderer>
    )
```

And then one would provide a second renderer for the error. As stated before, this error ternary could have very well been included as part of the renderer.

Something you may notice is that the logic component is forced to import the renderers, which disallows dynamic renderers to be provided. This caveat is explored in example 2.

Otherwise, this could be considered done! Using only a couple lines of code per parameter, you have mostly decoupled the rendering of a component. And this was a random component I took from something my coworker was doing. See [Example 2](./example2.md) for a more complete use case from the Workflows Components package. It also covers typing.