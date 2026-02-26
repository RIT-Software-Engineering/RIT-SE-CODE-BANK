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

export function makeMetadataSafeForWorkflows(metadata) {
    let safeMetadata = {}
    Object.entries(metadata).forEach(([key, value]) => {
    safeMetadata[key] = JSON.stringify(value)
    })
    return safeMetadata
}