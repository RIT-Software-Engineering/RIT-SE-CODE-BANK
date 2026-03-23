export const WORKFLOWS_API = (process.env.WORKFLOWS_API_URL || 'http://localhost:3001').replace(/\/$/, '')

/**
 * Based off of CMTFetch, but is simplified for server usage.
 * Throws when a non-ok status is received.
 * 
 * @param {string} method 
 * @param {string} url url of resource within workflows endpoint. the given url is appended to the workflows api base url.
 * @param {object} body 
 * @param {object} headers 
 * @returns 
 */
export async function workflowsFetch(method, url, body, headers) {
  const fullURL = `${WORKFLOWS_API}/${url.startsWith("/") ? url.substring(1) : url}` // Remove leading '/' if present
  const bodyJSON = JSON.stringify(body)
  const fullHeaders = { ...headers, "Content-Type": "application/json", }
  const headersJSON = JSON.stringify(fullHeaders)

  console.log(`fetching to url ${fullURL} with body ${bodyJSON} and headers ${headersJSON} and method ${method}`)

  try {
    const options = { method, headers: fullHeaders }
    if (bodyJSON !== undefined) options.body = bodyJSON
    const response = await fetch(fullURL, { ...options, credentials: 'include' })
    if (!response.ok) {
      console.error(`🐘 Error status ${response.status} received: ${await response.json()} from url ${fullURL} with body ${bodyJSON} and headers ${headersJSON} and method ${method}`)
      throw Error(`🐘 Error status ${response.status} received: ${await response.json()} from url ${fullURL} with body ${bodyJSON} and headers ${headersJSON} and method ${method}`)
    }
    return await response.json()
  } catch (error) {
    console.error(`🥕 Error when fetching to url ${fullURL}: ${error} ${error.message} with body ${bodyJSON} and headers ${headersJSON} and method ${method}`)
    throw Error(`🐦‍🔥 Error when fetching to url ${fullURL}: ${error} ${error.message} with body ${bodyJSON} and headers ${headersJSON} and method ${method}`)
  }
}

/**
 * Helper to create action
 * @param {string} userId 
 * @param {string} name 
 * @param {string} description 
 * @param {string} actionType 
 * @param {object} metadata 
 * @param {*|null} parentId 
 * @returns response from /action
 */
export async function createAction(userId, name, description, actionType, metadata, parentId) {
  return await workflowsFetch("POST", "actions", {
    userId: userId,
    name: name || 'New Action',
    description: description || 'No description provided.',
    actionType: actionType || 'simple',
    metadata: makeMetadataSafeForWorkflows(metadata) || {},
    parentActionId: parentId
  })
}

/**
 * Updates an action with relevant data.
 * Either name and description should be filled in or nextActionId.
 *
 * @param {string|null} name 
 * @param {string|null} description 
 * @param {*|null} nextActionId 
 * @param {*} actionId 
 * @returns response from /action 
 */
export async function updateAction(name, description, nextActionId, actionId){
  return await workflowsFetch("PUT", `actions/${actionId}`, {name, description, nextActionId});
}

/**
 * Turns the object (JSON) representation of a workflow into a workflow.
 * 
 * This is intended to work alongside {@link workflowToObject}
 * 
 * After making a workflow, make sure you create a state for whoever will be completing it!
 * 
 * ## Supports simple, complex, and branching actions
 * 
 * ### Warning
 * This is not intended for editing workflows, and will result in indeterminate behavior.
 * To edit a workflow using its object representation, ensure it follows the format given by
 * `WorkflowToObject`, then provide the object to `differentfunction` TODO: fill this in
 * 
 * ## Data Format
 * Fields will mostly match up exactly with the workflows API, with a couple rules:
 * * There should be no IDs in this object, since it is making a _new_ workflow. Each field that is an ID should be replaced by its full representation.
 *   * This means that the `rootAction` value will have a `nextAction` field with an object representation of the next action. **This recurses**!
 * * While the POST for actions accepts a parent id, any given here will be ignored, since the structure of the object implies parenthood.
 * * While the POST for actions and workflows require user ids, to reduce duplication, this function takes in userId as a parameter. userIds inside of `object` will be ignored.
 * * Because this function uses {@link makeMetadataSafeForWorkflows}, you are free to put arbitrarily complex objects in the workflow or action metadata.
 *   * In order to put the information back into an object upon retrieval, use //TODO: link function
 * 
 * 
 * ### Simple example
 * This would create a workflow with 3 actions, actions 1, 2, and 3, in that order.
 * ```
 * {
 *  userId: "uuidfromyourbackend",
 *  name: "Workflow",
 *  description: "I am Workflow, completer of Actions",
 *  metadata: { key: value },
 *  actions: [
 *    { name: "Action 1", actionType: "simple" },
 *    { name: "Action 2", actionType: "simple" },
 *    { name: "Action 3", actionType: "simple" }
 *  ]
 * }
 * ```
 * 
 * ### Nested workflow example
 * This creates a workflow with an embedded sub-workflow. The nested workflow's actions
 * will be inlined when the workflow is fetched via getFullActionTree.
 * ```
 * {
 *  userId: "uuidfromyourbackend",
 *  name: "Parent Workflow",
 *  actions: [
 *    { name: "First Step", actionType: "simple" },
 *    { 
 *      name: "Nested Sub-Workflow", 
 *      actionType: "workflow",
 *      actions: {
 *        name: "Child Workflow",
 *        actions: [
 *          { name: "Child Step 1", actionType: "simple" },
 *          { name: "Child Step 2", actionType: "simple" }
 *        ]
 *      }
 *    },
 *    { name: "After Nested", actionType: "simple" }
 *  ]
 * }
 * ```
 * 
 * @param {Object} workflow The whole workflow, as shown above.
 * @param {string} ownerId The userId that will be recorded as the workflow's and actions' creator.
 * @returns the response from the "/workflows" POST endpoint
 */
export async function objectToNewWorkflow(workflow, ownerId) {
  if (!workflow.childActions)
    throw new Error(`There was a workflow action with no simple action attached. Please contact Kenn Martinez to have this addressed. Action name: ${workflow.name}`)
  if (workflow.childActions.length !== 0) {
    if (workflow.childActions[0].parentActionId) {
      throw Error(`Cannot create workflow from object ${workflow}: parentActionId is specified in the root action. It should not be!`)
    }
    if (workflow.userId || workflow.childActions[0].userId) {
      throw Error(`Cannot create workflow from object ${workflow}: userId is specified either in the workflow or root action. It should not be!`)
    }
  }
  if (!ownerId) {
    throw Error(`Cannot create workflow from object ${workflow}: Missing ownerId argument: ${ownerId}! If you are specifying ownerId in the object, instead pass it as a second argument to this function.`)
  }

  // Create actions
  let rootActionId;
  let previousActionId
  // Start from the end of the list so we can associate each action with the one after it
  for (let index = workflow.childActions.length - 1; index >= 0; index--) {
    const action = workflow.childActions[index]

    const createdAction = await objectToNewAction(action, ownerId, null)

    if (index === 0) rootActionId = createdAction.id

    if (previousActionId) 
      await workflowsFetch("PUT", `actions/${createdAction.id}`, { nextActionId: previousActionId })

    previousActionId = createdAction.id
  }

  // Create workflow
  const createdWorkflow = await workflowsFetch("POST", "workflows", {
    userId: ownerId,
    name: workflow.name,
    description: workflow.description,
    metadata: workflow.metadata ? makeMetadataSafeForWorkflows(workflow.metadata) : {},
    rootActionId: rootActionId,
    tags: workflow.tags
  })

  return createdWorkflow;
}

/**
 * Basically the same as the function above but for the Workflow builder.
 * The Workflow Builder never starts with any actions so all that code is cut out.
 * Created so that we can create a workflow without actions unlike when creating a course.
 *
 * @export
 * @async
 * @param {Object} workflow The whole workflow, as shown above.
 * @param {string} ownerId The userId that will be recorded as the workflow's and actions' creator.
 * @returns the response from the "/workflows" POST endpoint
 */
export async function newBuilderWorkflow(workflow, ownerId){
  if (!ownerId) {
    throw Error(`Cannot create workflow from object ${workflow}: Missing ownerId argument: ${ownerId}! If you are specifying ownerId in the object, instead pass it as a second argument to this function.`)
  }

  const createdWorkflow = await workflowsFetch("POST", "workflows", {
    userId: ownerId,
    name: workflow.name,
    description: workflow.description,
    metadata: workflow.metadata ? makeMetadataSafeForWorkflows(workflow.metadata) : {},
    rootActionId: null,
    tags: workflow.tags
  })

  return createdWorkflow;
}

/**
 * Turns the result of a Workflows API "/workflows" GET call into an object.
 * // TODO: make this include all nested things. Unless workflows/
 * @param {Object} workflow 
 * @returns 
 */
export async function workflowToObject(workflow) {
  return {
    ...workflow,
    baseActionId: workflow.id, // Remove these since baseAction/rootAction exists and also has an id field
    rootActionId: null,
  }
}

/**
 * The Workflows API calls .toString on every value of the metadata object passed in.
 * This function converts an arbitrary metadata object into an object where each value is a JSON object, so that .toString doesnt wreck it.
 * Convert back with {@link metadataArrayToObject}
 * 
 * @param {Object} metadata 
 * @return Metadata object ready to be sent to the Workflows API
 */
export function makeMetadataSafeForWorkflows(metadata) {
  let safeMetadata = {}
  Object.entries(metadata).forEach(([key, value]) => {
    safeMetadata[key] = JSON.stringify(value)
  })
  return safeMetadata
}

export async function getWorkflowActions(workflowId){
  let action;
  await workflowsFetch("GET", `workflows/action/${workflowId}`).then(async response => {
    if (response.rootAction?.id){
      action = await combineActionWorkflow(response);
      if (response.rootAction.actionType === "workflow"){
        action.actions = [await getWorkflowActions(response.rootAction.id)]
      }
      else{
        action.actions = [response.rootAction];
        console.log('My actions are the root actions')
        if (response.rootAction.metadata){
          if (response.rootAction.metadata?.outputs){
            action.metadata.outputs = JSON.parse(action.metadata.outputs)
          }
        }
        else {
          action.actions[0].metadata = {};
        }
      }
      
    }
    else {
      console.log("Nothing at", response.baseActionId)
      action = await combineActionWorkflow(response);
      console.log(action)
    }
  })
  return action
}

export async function combineActionWorkflow(workflow){
  const baseAction = workflow.baseAction;
  return {
    id: baseAction.id,
    attributeId: workflow.id,
    name: baseAction.name,
    description: baseAction.description,
    actionType: "workflow",
    actions: []
  }
}

/**
 * Recursively creates an action and its children.
 * Supports simple, complex, branching, and nested workflow actions
 * 
 * @param {Object} action - Action object
 * @param {string} ownerId - The userId for the action creator
 * @param {string|null} parentActionId - The parent action ID (null for root actions)
 * @returns The created action (or nested workflow's baseAction for workflow actions)
 */
export async function objectToNewAction(action, ownerId, parentActionId) {

  if (action.actionType === "workflow") {
    const nestedWorkflow = await objectToNewWorkflow(action, ownerId)
    
    // If the workflow action is a step in a complex action
    await workflowsFetch("PUT", `actions/${nestedWorkflow.baseActionId}`, { 
      parentActionId: parentActionId 
    })
    
    // Just as a complex action represents its children, the workflows base action represents its children too.
    // But in this case, getting the base action ID isnt as simple, so we format it more nicely
    return { id: nestedWorkflow.baseActionId, workflow: nestedWorkflow }
  }

  // Create simple or complex action
  const createdAction = await workflowsFetch("POST", "actions", {
    ...action,
    userId: ownerId,
    metadata: action.metadata ? makeMetadataSafeForWorkflows(action.metadata) : {},
    parentActionId: parentActionId,
  })

  // Link complex action's children
  if (action.actionType === 'complex'){
    if (action.childActions.length > 0) {
      for (const childAction of action.childActions.toReversed()) {
        await objectToNewAction(childAction, ownerId, createdAction.id)
      }
    }
    else {
      throw new Error(`There was a complex action with no simple actions attached. Please contact Kenn Martinez to have this addressed. Action name: ${action.name}`)
    }
  }


  return createdAction
}
