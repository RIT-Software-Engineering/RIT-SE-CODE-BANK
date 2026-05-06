import { useState } from "react";

/**
 * Component for top-level workflows
 * This component has a modal that can act as both a creation modal and editing modal
 * Since different projects have different needs, extra data can be passed in 
 * This also means that custom functions to submit and edit need to be passed in
 *
 * @param {Object} props
 * @param {Boolean} props.isOpen - whether the modal is open or not
 * @param {(isOpen: Boolean) => void} props.setIsOpen - state setter for the modal being open
 * @param {Array} props.workflows - the top-level workflows 
 * @param {(workflows: Array) => void} props.setWorkflows - state setter for the top-level workflows
 * @param {Function} props.WorkflowSubmit - function to submit the workflow
 * @param {Object} props.curWorkflow - the current workflow, used for editing purposes. null if not editing
 * @param {Boolean} props.isEdit - whether the user is currently editing
 * @param {(isEdit: Boolean) => void} props.setIsEdit - state setter for whether the user is editing
 * @param {Function} props.workflowEditSubmit - function to edit the workflow
 * @param {Object} props.extraData - any extra data that may need to be passed in when submitting
 * @param {() => void} props.clearFunction - function to clear any extra data when exiting the modal
 * @param {() => void} props.loadFunction - function to load any extra data when loading the modal while editing
 * @param {Object} props.renderers - Renderers. For usage info, see examples or documentation.
 * @param {*} props.children - customizable part of the form for any extra data
 */
export function WorkflowModal( {isOpen, setIsOpen, workflows, setWorkflows, 
    WorkflowSubmit, curWorkflow ,isEdit, setIsEdit, 
    workflowEditSubmit, extraData, loadFunction, clearFunction, children, renderers} ){

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [error, setError] = useState('');

    // Called when finished submitting or exiting the modal
    function clearForm(){
        setName('');
        setDescription('');
        setTags('');
        setIsEdit(false);
        setError('');
        clearFunction();
    }

    // Loads data from the current workflow. Only called on edit.
    function loadForm(){
        setName(curWorkflow.name?.trim());
        setDescription(curWorkflow.description?.trim());
        setTags(curWorkflow.tags?.join(", "));
        loadFunction();
    }

    async function submitWorkflow(){
        // Splits the tags by commas (and the spaces if there are any)
        const uploadTags = tags ? tags.split(/, ?/).map(tag => tag.trim()) : [];
        const submission = await WorkflowSubmit(name, description, uploadTags, workflows, setWorkflows, extraData, setError);
        // Only clear the form and close the modal if we succeeded in our submission
        if (submission === "Good"){
            clearForm();
            setIsOpen(false);
        }
    }

    async function editWorkflow(){
        // Splits the tags by commas (and the spaces if there are any)
        const uploadTags = tags ? tags?.split(/, ?/).map(tag => tag.trim()) : [];
        const submission = await workflowEditSubmit(name, description, uploadTags, workflows, setWorkflows, extraData, setError, curWorkflow);
        // Only clear the form and close the modal if we succeeded in our edit
        if (submission === "Good"){
            clearForm();
            setIsOpen(false);
        }
    }

    return (<>
    <renderers.WorkflowModalRenderer
        isOpen={isOpen}
        isEdit={isEdit}
        onShow={() => { if (isEdit) loadForm() }}
        onHide={() => { setIsOpen(false); clearForm() }}
        onExit={() => { setIsOpen(false); clearForm() }}

        onSubmit={(e) => {
            e.preventDefault();
            if (isEdit) editWorkflow()
            else submitWorkflow()
        }}

        onNameChange={(e) => setName(e.target.value) }
        nameDefaultValue={isEdit ? curWorkflow.name : ""}

        onDescriptionChange={(e) => setDescription(e.target.value)}
        descriptionDefaultValue={isEdit ? curWorkflow.description : ""}

        onTagsChange={(e) => setTags(e.target.value)}
        tagsDefaultValue={isEdit ? curWorkflow.tags : ""}

        extraRendering={children}
    >
        {error ? 
        <renderers.ErrorRenderer error={error}/>
        : <></>}
    </renderers.WorkflowModalRenderer>
    </>)
}

/**
 * Component for all things actions. Works for simple, complex, and workflow actions (branching actions are not supported.)
 * This component has a modal that can act as both a creation modal and an editing modal
 * Since different projects have different needs, extra data can be passed in
 * This also mean that custom functions to submit and edit need to be passed in
 * 
 * @param {Object} props
 * @param {Boolean} props.isOpen - whether the modal is open or not
 * @param {(isOpen: Boolean) => void} props.setIsOpen - state setter for the modal being open
 * @param {Number} props.index - the current top-level workflow the user is working in
 * @param {Array} props.workflows - the top-level workflows
 * @param {(workflows: Array) => void} props.setWorkflows - state setter for the top-level workflows
 * @param {string} props.parentId - the ID of the parent where the action is being created (may be null)
 * @param {Number} props.depthLevel - the depth level of the action being created. Needed to prevent too many layers and going too deep into a workflow
 * @param {(depthLevel: Number) => void} props.setDepthLevel - state setter for the depth level
 * @param {Boolean} props.isEdit - whether the user is currently editing
 * @param {(isEdit: Boolean) => void} props.setIsEdit - state setter for whether the user is editing
 * @param {Object} props.curAction - the current action. Used for editing purposes, will be null if not editing.
 * @param {() => void} props.refresh - a function to refresh the page. Can be used to avoid tricky logic and rely on the API
 * @param {Function} props.addAction - function to submit a simple or complex action
 * @param {Function} props.editAction - function to edit a simple or complex action
 * @param {() => void} props.loadFunction - function to load any extra data when loading the modal while editing
 * @param {() => void} props.clearFunction - function to clear any extra data when exiting the modal
 * @param {Object} props.extraData - any extra data that may need to be passed in when submitting
 * @param {Object} props.renderers - Renderers. For usage info, see examples or documentation.
 * @param {*} props.children - customizable part of the form for any extra data
 */
export function ActionModal({isOpen, setIsOpen, index, workflows, setWorkflows, parentId, 
    depthLevel, setDepthLevel, isEdit, setIsEdit, curAction, refresh,
    addAction, editAction, loadFunction, clearFunction, extraData, children, renderers}){

    const [actionType, setActionType] = useState("simple");
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false); // Used to prevent double-submitting for actions that may take longer to submit
    const [error, setError] = useState('');

    // Called when finished submitting or exiting the modal
    function clearForm(){
        setName('');
        setDescription('');
        setActionType('simple');
        setDepthLevel(depthLevel-1); // Remove a depth layer of one since we're done in the modal
        setError('');
        clearFunction();
    }

    /** Loads data from the current action. Only called on edit. */
    function loadForm(){
        setName(curAction.name);
        setDescription(curAction.description);
        setActionType(curAction.actionType);
        loadFunction();
    }


    async function addStandardAction(e){
        e.preventDefault();
        setLoading(true);
        // TODO maybe make more generic so it's an almost empty function being passed?
        const submission = await addAction(index, workflows, setWorkflows, name, description, actionType, parentId, extraData, setError, refresh);
        setLoading(false);
        if (submission === "Good"){
            clearForm();
            setIsOpen(false);
        }
    }

    async function editStandardAction(e){
        e.preventDefault();
        setLoading(true);
        // TODO maybe make more generic so it's an almost empty function being passed?
        const submission = await editAction(name, description, curAction, extraData, setError, refresh);
        setLoading(false);
        if (submission === "Good"){
            clearForm();
            setIsOpen(false);
        }
    }

    return (<>
    <renderers.ActionModalRenderer 
        isOpen={isOpen}
        isEdit={isEdit} 
        disabled={depthLevel > 6} // it's tested you can make up to 7 children before the workflows API fails to return.
        loading={loading}
        actionType={actionType}

        onShow={() => { if (isEdit) loadForm() }}
        onHide={() => { setIsOpen(false); clearForm(); setIsEdit(false) }}
        onExit={() => { setIsOpen(false); clearForm(); setIsEdit(false) }}

        onSubmit={(e) => isEdit ? editStandardAction(e) : addStandardAction(e) }

        onNameChange={(e) => setName(e.target.value) }
        nameDefaultValue={isEdit ? curAction.name : ""}

        onDescriptionChange={(e) => setDescription(e.target.value)}
        descriptionDefaultValue={isEdit ? curAction.description : ""}

        onActionTypeChange={(e) => setActionType(e.target.value)}

        extendedSimpleRender={children}
    >
        {error ? 
        <renderers.ErrorRenderer error={error}/>
        : <></>}
    </renderers.ActionModalRenderer>
    </>)
}

/**
 * Component to delete workflows and actions. 
 * It can be a top level workflow or a workflow action, this modal can delete them all!
 * Functions for the deletion need to be passed in.
 *
 * @param {Object} props
 * @param {Boolean} props.isOpen - whether the modal is open or not
 * @param {(isOpen: Boolean) => void} props.setIsOpen - state setter for the modal being open
 * @param {Object} props.action - the action that will be deleted
 * @param {Array} props.workflows - the top-level workflows
 * @param {(workflows: Array) => void} props.setWorkflows - state setter for the top-level workflows 
 * @param {Function} props.actionDelete - function to delete simple or complex actions
 * @param {Function} props.workflowDelete - function to delete workflows/workflow actions
 * @param {Object} props.renderers - Renderers. For usage info, see examples or documentation.
 * @param {() => void} props.refresh - a function to refresh the page. Can be used to avoid tricky logic and rely on the API
 * 
 */
export function DeleteModal({isOpen, setIsOpen, action, workflows, setWorkflows, actionDelete, workflowDelete, renderers, refresh }){
    const [error, setError] = useState(null)

    async function deleteAction(){
        // Top level workflows don't actually have the actionType key/value pair, so we can also check if it's undefined.
        if (action.actionType === 'workflow' || !action.actionType){
            const deleteResult = await workflowDelete(workflows, setWorkflows, action, refresh, setError)
            if (deleteResult === "Good") {
                setIsOpen(false)
            }
        }
        else {
            const deleteResult = await actionDelete(action, refresh, setError)
            if (deleteResult === "Good") {
                setIsOpen(false)
            }
        }
    }

    return (
    <renderers.DeleteModalRenderer 
        isOpen={isOpen}
        action={action}
        onHide={()=>setIsOpen(false)}
        onExit={()=>setIsOpen(false)}
        onOpen={()=>setError(null)}
        error={error}

        onCancel={() => setIsOpen(false)}
        onSubmit={() => deleteAction()}
    />
    )
}

/**
 * The component that renders all of the actions and workflows! 
 * Starts with the top level workflows and its' actions then builds down recursively through {@link ComplexRenderer}
 *
 * @param {Object} props 
 * @param {Number} props.index - the index of the top-level workflow in the giant top-level workflows array
 * @param {Array} props.workflows - an array of the top-level workflows
 * @param {(isOpen: Boolean) => void} props.setIsOpen - state setter for the action modal for creating/editing actions being open
 * @param {Boolean} props.loading - whether all workflows stuff is being loaded. We have this to prevent display errors and to prevent the user from creating a workflow when still getting
 * @param {(parentId: string) => void} props.setParentId - sets the parent ID. We do this for workflows too, even though they aren't actually parents. There should be logic in the action adders to address this
 * @param {Number} props.depthLevel - the depth level of the selected action. Needed to prevent too many layers and going too deep into a workflow
 * @param {(depthLevel: Number) => void} props.setDepthLevel - state setter for the depth level
 * @param {(isEdit: Boolean) => void} props.setIsEdit - state setter for whether or not things are edits
 * @param {(curAction: Object) => void} props.setCurAction - state setter to set the current action. Used mainly for edits
 * @param {() => void} props.setWorkflowModalEdit - function to open the workflow modal as an edit. We do this since it's one less thing to pass in
 * @param {(deleteOpen: Boolean) => void} props.setDeleteOpen - state setter for whether the deletion modal is open or not
 * @param {Object} props.renderers - Renderers. For usage info, see examples or documentation.
 */
export function WorkflowComponent({index, workflows, setIsOpen, loading, 
    setParentId, depthLevel, setDepthLevel, setIsEdit, 
    setCurAction, setWorkflowModalEdit, setDeleteOpen, renderers}){

    if (loading)
        return <><h1>Loading...</h1></> // Here so a lot of stuff just doesn't break while it loads everything

    else
    return (<>
    <renderers.WorkflowComponentRenderer 
        workflow={workflows[index]}
        
        onWorkflowEdit={ (e) => {
            e.stopPropagation();
            setCurAction(workflows[index]);
            setWorkflowModalEdit();
        }}
        onWorkflowDelete={(e) => {
            e.stopPropagation();
            setCurAction(workflows[index]);
            setDeleteOpen(true);
        }}

        onAddActionRoot={()=>{
            setIsOpen(true);
            setParentId(null);
            setDepthLevel(depthLevel+1);
            setCurAction(null);
        }}
    >
        {(workflows[index].actions || []).map(actionWithContexts => {
            const action = actionWithContexts?.processedAction;
            if (!action || action.parentActionId)
                return null;

            let value;
            switch (action.actionType) {
                case "simple":
                    value = 
                    <renderers.SimpleActionRenderer 
                        key={action.id}
                        name={action.name}
                        description={action.description}
                        action={action}

                        setCurAction={setCurAction}
                        onActionEdit={() => {
                            setCurAction(action);
                            setIsOpen(true);
                            setIsEdit(true);
                        }}
                        onActionDelete={()=> {
                            setCurAction(action);
                            setDeleteOpen(true);
                        }}
                    />
                    break;
                case "workflow": // basically the same as a complex action
                case "complex":
                    value = 
                    <renderers.ComplexActionRenderer 
                        key={action.id}
                        action={action}
                        name={action.name}
                        description={action.description}
                        depthLevel={depthLevel+1}

                        setCurAction={setCurAction}
                        setDepthLevel={setDepthLevel}
                        setParentId={setParentId}

                        onActionEdit={() => {
                            setIsOpen(true);
                            setIsEdit(true);
                        }}
                        onActionDelete={() => {
                            setDeleteOpen(true);
                        }}

                        onAddActionChild={() => {
                            setIsOpen(true);
                            setCurAction(null);
                        }}
                    >
                    </renderers.ComplexActionRenderer>
                    break;
                default:
                    value = <p>Unknown Type {action.actionType}</p>
                    break;
            }
            return value;
        })}
    </renderers.WorkflowComponentRenderer>
    </>);
}
