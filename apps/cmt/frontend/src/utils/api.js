import { LogError } from "./error.jsx";

export const API_BASE = process.env.REACT_APP_BACKEND_URL || "http://localhost:5010/api/cmt";
export const AUTH_BASE = process.env.REACT_APP_AUTH_BASE || "http://localhost:5010";
export const WORKFLOWS_API = (process.env.WORKFLOWS_API_URL || 'http://localhost:3001').replace(/\/$/, '')

class CMTFetchError extends Error {
    constructor(message, response) {
        super(message);
        this.status = response.status;
        this.response = response;
    }
}

/**
 * Utility function for fetching.
 * 
 * A near-copy of this function exists in the backend utils too
 * 
 * ## Examples
 * #### Simple usage
 * ```
 *  CMTFetch("POST", `/course`, course).then(() => {
 *      showSuccessNotification("Course created!")
 *      navigate('/courseView')
 *  })
 * ```
 * #### Complex usage
 * ```
 *  const handleEditCourse = async (courseId, updates) => {
 *      CMTFetch("PUT", `/course/${courseId}`, updates, {}, [409, 429]).then(response => {
 *          showSuccessNotification("Course updated!") // Show notification with central notification system
 *          setCourseData(await response.json()) // Update page with response
 *      }).catch(error => {
 *          // Check for specific error codes. 
 *          // Since we gave [409, 429] as an argument for "allowedErrorCodes", CMTFetch does NOT display errors, giving us the freedom to handle them however we'd like 
 *          if (error.response.status == 409) {
 *              showErrorNotification("Unable to update course due to a server conflict. Refeshing the page...")
 *              setTimeout(() => window.refresh(), 1000)
 *          }
 *          if (error.response.status == 429) {
 *              showErrorNotification("Unable to create course due to rate limiting. Please slow down!")
 *          }
 *      })
 *  }
 * ```
 *
 * @param {string} method 
 * @param {string} url 
 * @param {Object} body
 * @param {Object} headers 
 * @param {number[]} allowedErrorCodes
 * @param {string} baseUrl 
 * @returns Response of fetch in the form of a promise. If the promise is rejected, an error will be returned in the format { message: string, response: Response }. The response contains the full response of the fetch.
 */
async function CMTFetch(method, url, body, headers, allowedErrorCodes, baseUrl) {
    
    const fullURL = `${baseUrl}/${url.startsWith("/") ? url.substring(1) : url}` // Remove leading '/' if present

    console.log(`Fetching: ${method} ${fullURL}`)
    
    let response
    try {
        const options = { method, headers }
        if (body !== undefined) options.body = body
        response = await fetch(fullURL, { ...options, credentials: 'include'})
    } catch (error) {
        const message = `
            Error while trying to fetch: ${method} ${fullURL}
            \nRequest Body: ${JSON.stringify(body ?? "")}
            \nError: ${error}
            \nThis means the the request likely never reached the intended url, and is more likely a problem with CMT.
        `
        LogError(message)
        throw Error(message)
    }
        
    if (response.ok) {
        return response
    }

    // Create specially formatted error so consumer can access the codes easily
    const clonedResponse = response.clone();
    const message = `
      non-allowed non-OK status in response to: ${method} ${fullURL}
      \nRequest Body: ${body}
      \nResponse status: ${response.status}
      \nResponse body: ${JSON.stringify(await clonedResponse.json() ?? "")}
      \nThis means that the status was properly received by the intended url, but that the server had an issue of some kind.
    `

    // Only notify the user if the error code is not allowed,
    if(!allowedErrorCodes.includes(response.status)) {    
        LogError(message, response)
    }

    throw new CMTFetchError(message, response)
}

/**
 * Uses {@link CMTFetch}
 * 
 * @param {string} method 
 * @param {string} url 
 * @param {Object} [body]
 * @param {Object} [headers] 
 * @param {number[]} [allowedErrorCodes]
 */
export async function CMTJsonFetch(method, url, body, headers, allowedErrorCodes = []) {
    return CMTFetch(
        method,
        url,
        body ? JSON.stringify(body) : undefined,
        { ...headers, "Content-Type": "application/json" },
        allowedErrorCodes,
        API_BASE
    )
}

/**
 * Uses {@link CMTFetch}
 * 
 * @param {string} method 
 * @param {string} url 
 * @param {Object} [body]
 * @param {Object} [headers] 
 * @param {number[]} [allowedErrorCodes]
 */
export async function CMTFormFetch(method, url, body, headers, allowedErrorCodes = []) {
    return CMTFetch(
        method,
        url,
        body,
        headers,
        allowedErrorCodes,
        API_BASE
    )
}

/**
 * Uses {@link CMTFetch}
 * 
 * @param {string} method 
 * @param {string} url 
 * @param {Object} [body]
 * @param {Object} [headers] 
 * @param {number[]} [allowedErrorCodes]
 */
export async function workflowsFetch(method, url, body, headers, allowedErrorCodes = []) {
    return CMTFetch(
        method,
        url,
        body ? JSON.stringify(body) : undefined,
        { ...headers, "Content-Type": "application/json" },
        allowedErrorCodes,
        WORKFLOWS_API
    )
}