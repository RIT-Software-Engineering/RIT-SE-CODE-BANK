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
        const response = await fetch(fullURL, { ...options, credentials: 'include'})
        if (!response.ok) {
            console.error(`🐘 Error status ${response.status} received: ${await response.json()} from url ${fullURL} with body ${bodyJSON} and headers ${headersJSON} and method ${method}`)
            throw Error(`🐘 Error status ${response.status} received: ${await response.json()} from url ${fullURL} with body ${bodyJSON} and headers ${headersJSON} and method ${method}`)
        }
        return await response.json()
    } catch (error) {
        console.error(`🥕 Error when fetching to url ${fullURL}: ${error} with body ${bodyJSON} and headers ${headersJSON} and method ${method}`)
        throw Error(`🐦‍🔥 Error when fetching to url ${fullURL}: ${error} with body ${bodyJSON} and headers ${headersJSON} and method ${method}`)
    }
}

/**
 * Helper to create action
 * @param {string} userId 
 * @param {string} name 
 * @param {string} description 
 * @param {string} actionType 
 * @param {object} metadata 
 * @param {*} parentId 
 * @returns response from /action
 */
export async function createAction(userId, name, description, actionType, metadata, parentId){
  return await workflowsFetch("POST", "actions", {
    userId: userId,
    name: name || 'New Action',
    description: description || 'No description provided.',
    actionType: actionType || 'simple',
    metadata: metadata || {},
    parentActionId: parentId
  })
}

/**
 * Turns the object (JSON) representation of a workflow into a workflow.
 * 
 * This is intended to work alongside {@link workflowToObject}
 * 
 * After making a workflow, make sure you create a state for whoever will be completing it!
 * 
 * ## Only supports simple actions TODO: support more
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
 *  rootAction: {
 *    name: "Action 1",
 *    actionType: "simple",
 *    nextAction: {
 *      name: "Action 2",
 *      description: "Electric Boogalo"
 *      nextAction: {
 *        name: "Action 3",
 *        description: "The workflowigy"
 *      }  
 *    }
 *  }
 * }
 * ```
 * 
 * @param {Object} workflow The whole workflow, as shown above.
 * @param {string} ownerId The userId that will be recorded as the workflow's and actions' creator.
 * @returns the response from the "/workflows" POST endpoint
 */
export async function objectToNewWorkflow(workflow, ownerId) {
  if (!workflow.rootAction) {
    throw Error(`Cannot create workflow from object ${workflow}: no rootAction defined. Workflows must have at least 1 action.`)
  }
  if (workflow.rootAction.parentActionId) {
    throw Error(`Cannot create workflow from object ${workflow}: parentActionId is specified in the root action. It should not be!`)
  }
  if (workflow.userId || workflow.rootAction.userId) {
    throw Error(`Cannot create workflow from object ${workflow}: userId is specified either in the workflow or root action. It should not be!`)
  }
  if (!ownerId) {
    throw Error(`Cannot create workflow from object ${workflow}: Missing ownerId argument! If you are specifying ownerId in the object, instead pass it as a second argument to this function.`)
  }

  console.log(workflow)
  const rootAction = await workflowsFetch("POST", "actions", {
    ...workflow.rootAction, 
    userId: ownerId,
    metadata: workflow.rootAction.metadata ? makeMetadataSafeForWorkflows(workflow.rootAction.metadata) : {},
  })

  let currentAction = workflow.rootAction.nextAction
  let lastAction = rootAction
  while (currentAction !== undefined) {
    const action = await workflowsFetch("POST", "actions", { 
      ...currentAction,
      userId: ownerId,
      metadata: currentAction.metadata ? makeMetadataSafeForWorkflows(currentAction.metadata) : {},
      parentActionId: lastAction.id, // TODO: not neccesary for simple actions
    })

    if (lastAction)
      await workflowsFetch("PUT", `actions/${lastAction.id}`, { nextActionId: action.id })

    lastAction = action
    currentAction = currentAction.nextAction
  }

  const createdWorkflow = await workflowsFetch("POST", "workflows", {
    userId: ownerId,
    name: workflow.name,
    description: workflow.description,
    metadata: workflow.metadata ? makeMetadataSafeForWorkflows(workflow.metadata) : {},
    rootActionId: rootAction.id,
  })

  return createdWorkflow
}

/**
 * Turns the result of a Workflows API "/workflows" GET call into an object.
 * 
 * 
 * 
 * @param {Object} workflow 
 * @returns 
 */
export async function workflowToObject(workflow) {
  return {
    ...workflow,
    baseActionId: undefined, // Remove these since baseAction/rootAction exists and also has an id field
    rootActionId: undefined,
  }
}

/**
 * The Workflows API calls .toString on every value of the metadata object passed in.
 * This function converts an arbitrary metadata object into an object where each value is a JSON object, so that .toString doesnt wreck it.
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