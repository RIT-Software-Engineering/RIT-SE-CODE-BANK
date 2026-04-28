import { CMTError } from "./cmtError.js";
import { getTimeString } from "./cmtLogging.js";

export const WORKFLOWS_API = (process.env.WORKFLOWS_API_URL || 'http://localhost:3001').replace(/\/$/, '')

class CMTFetchError extends CMTError {
    /**
     * Adds on a couple of convenience fields.
     * 
     * See {@link CMTError}
     * 
     * @param {Object} props
     * @param {string} [props.message] If not provided, then the userFacingMessage will be used instead.
     * @param {string} [props.userFacingMessage]
     * @param {any} [props.response]
     * @param {unknown} [props.cause]
     */
    constructor({ message, userFacingMessage, response, cause }) {
        super({ message, userFacingMessage, cause })

        this.status = response?.status
        this.response = response

        Object.setPrototypeOf(this, new.target.prototype) // Makes instanceof work better in more environments
    }
}

/**
 * Utility function for fetching.
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
 *      CMTFetch("PUT", `/course/${courseId}`, updates, {}).then(response => {
 *          showSuccessNotification("Course updated!") // Show notification with central notification system
 *          setCourseData(await response.json()) // Update page with response
 *      }).catch(error => {
 *          // Check for specific error codes.  
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
 * @param {string} baseUrl 
 * @returns Response of fetch in the form of a promise. If the promise is rejected, an error will be returned in the format { message: string, response: Response }. The response contains the full response of the fetch.
 */
export async function CMTFetch(method, url, body, headers, baseUrl) {
    
    const fullURL = `${baseUrl}/${url.startsWith("/") ? url.substring(1) : url}` // Remove leading '/' if present

    console.log(`${getTimeString()} Fetching: ${method} ${fullURL}`)
    
    let response
    try {
        const options = { method, headers }
        if (body !== undefined) options.body = body
        response = await fetch(fullURL, { ...options, credentials: 'include'})
    } catch (error) {
        // If there was an error in the fetch itself, then its definitely not a CMTError. These errors only happen if things are very broken.
        const message = [
            `Error while trying to fetch: ${method} ${fullURL}`,
            `Request Body: ${JSON.stringify(body ?? "")}`,
            `Error: ${error}`,
            `This means the the request likely never reached the intended url.`
        ].join("\n")
        throw new CMTError({ message, userFacingMessage: "Something went wrong while fetching to an external API. Please try again.", cause: error })
    }
        
    if (response.ok) {
        const json = await response.json()
        return json
    }

    // Create specially formatted error so consumer can access the codes easily
    // If its coming from the backend, then it probably went through the custom error handling middleware. Of course, just in case something goes wrong, we pass the error more plainly.
    let fancyError
    try {
        const clonedResponse = response.clone();
        const errorBody = await clonedResponse.json()
        const message = [
            `non-allowed non-OK status in response to: ${method} ${fullURL}`,
            `Request Body: ${body}`,
            `Response status: ${response.status}`,
            `Unformatted Response Body: ${JSON.stringify(errorBody, null, 4)}`,
            `\nThis means that the request was properly received by the intended url, but that the server had an issue of some kind.`
        ].join("\n")
        fancyError = new CMTFetchError({ message, cause: errorBody.error })
    } catch (error) {
        throw new CMTError({ userFacingMessage: "An unexpected response was received from the API. Please try again.", cause: error })
    }
    throw fancyError
}

/**
 * Uses {@link CMTFetch}
 * 
 * @param {string} method 
 * @param {string} url 
 * @param {Object} [body]
 * @param {Object} [headers] 
 */
export async function workflowsFetch(method, url, body, headers) {
    return CMTFetch(
        method,
        url,
        body ? JSON.stringify(body) : undefined,
        { ...headers, "Content-Type": "application/json" },
        WORKFLOWS_API
    )
}
