export const API_BASE = process.env.REACT_APP_BACKEND_URL || "http://localhost:5010/api/cmt";
export const AUTH_BASE = process.env.REACT_APP_AUTH_BASE || "http://localhost:5010";

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
 * ## Examples
 * #### Simple usage
 * ```
 *  CMTFetch("POST", `/course`, course).then(() => {
 *      showSuccessNotification("Course created!") // Show notification with central notification system
 *      navigate('/courseView') // Navigate back to course list
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
 * @param {Object} [body]
 * @param {Object} [headers] 
 * @param {number[]} [allowedErrorCodes] 
 * @returns Response of fetch in the form of a promise. If the promise is rejected, an error will be returned in the format { message: string, response: Response }. The response contains the full response of the fetch.
 */
export async function CMTFetch(method, url, body, headers, allowedErrorCodes = []) {
    
    const fullURL = `${API_BASE}/${url.startsWith("/") ? url.substring(1) : url}` // Remove leading '/' if present
    const headersJSON = JSON.stringify(headers)

    console.log(`🐖 Fetching to url ${fullURL} with body ${body} and headers ${headersJSON} and method ${method}`)
    
    let response
    try {
        const options = { method, headers }
        if (body !== undefined) options.body = body
        response = await fetch(fullURL, { ...options, credentials: 'include'})
    } catch (error) {
        // TODO: Use central notification system to show error
        console.error(`🥕 Error when fetching to url ${fullURL}: ${error} with body ${body} and headers ${headersJSON} and method ${method}`)
        throw Error(`🐦‍🔥 Error when fetching to url ${fullURL}: ${error} with body ${body} and headers ${headersJSON} and method ${method}`)
    }
        
    if (response.ok) {
        return response
    }

    // Only notify the user if the error code is not allowed,
    if(!allowedErrorCodes.includes(response.status)) {    
        // TODO: Use central notification system to show error
        console.log("😨 New Error just dropped")
    }
    
    // Create specially formatted error so consumer can access the codes easily
    throw new CMTFetchError(
        `🐘 Error status ${response.status}: ${JSON.stringify(await response.json())} from url ${fullURL} with body ${body} and headers ${headersJSON} and method ${method}`, 
        response
    )
}

/**
 * Uses {@link CMTFetch}
 * 
 * @param {Object} body 
 */
export async function CMTJsonFetch(method, url, body, headers, allowedErrorCodes = []) {
    return CMTFetch(
        method,
        url,
        body ? JSON.stringify(body) : undefined,
        { ...headers, "Content-Type": "application/json" },
        allowedErrorCodes
    )
}

/**
 * Uses {@link CMTFetch}
 * 
 * @param {FormData} body
 */
export async function CMTFormFetch(method, url, body, headers, allowedErrorCodes = []) {
    return CMTFetch(
        method,
        url,
        body,
        headers,
        allowedErrorCodes
    )
}