import { CMTError, CMTErrorToString, extractUserFacingError } from "@se-code-bank/cmt-shared-utilities"
import { Alert } from "react-bootstrap"

/**
 * Creates a function that takes an error, wraps it with a general user facing message, prints that error (which will include the "most specific" user facing message), and then passes in that user facing message to a callback function.
 * 
 * ### You can turn CMTFetch's catch block from this:
 * 
 * ```
 * CMTJsonFetch('DELETE', `resources/${resourceId}`)
 *      .then(refresh)
 *      .catch(error => {
 *          const wrappedError = new CMTError({ userFacingMessage: "Error deleting resource", cause: error })
 *          console.log(CMTErrorToString(wrappedError))
 *          const textToDisplay = extractUserFacingError(wrappedError)
 *          setResources([])
 *      })
 * ```
 * 
 * ### to this:
 * 
 * ```
 * CMTJsonFetch('DELETE', `resources/${resourceId}`)
 *      .then(refresh)
 *      .catch(createErrorHandler("Error deleting resource", setError))
 * ```
 * 
 * ### If your catch function is more complicated, you can leverage the callback function for other purposes this:
 * 
 * ```
 * CMTJsonFetch('DELETE', `resources/${resourceId}`)
 *      .then(refresh)
 *      .catch(createErrorHandler("Error deleting resource", userFacingMessage => {
 *          setError(userFacingMessage)
 *          setResources([])
 *          // Other error logic    
 *      }))
 * ```
 * 
 * If you find yourself wanting to specify more complex user facing messages, instead of putting complex logic in the frontend function, instead just throw different errors inside of your endpoints.
 * 
 * @param {string} userFacingMessage 
 * @param {(userFacingMessage: string) => void} [callback] 
 * @returns 
 */
export function createErrorHandler(userFacingMessage, callback) {
    return error => {
        const wrappedError = new CMTError({ userFacingMessage , cause: error })
        console.error("Error from createErrorHandler:\n", CMTErrorToString(wrappedError))
        if (callback) callback(extractUserFacingError(wrappedError))
    }
}

/**
 * Alternative to createErrorHandler for more complex logic. Best used when there is complex logic in the frontend function to determine the user facing message.
 * Normally, when you want to have complex conditions for determining the user facing message, that should be the responsibility of the backend throwing errors, but some places in this codebase would be scary to refactor.
 * 
 * @param {Error} error 
 * @param {(message: string) => void} setError 
 * @returns 
 */
export function handleError(error, setError) {
    console.error("Error from handleError:\n", CMTErrorToString(error))
    if (!setError) return

    const textToDisplay = extractUserFacingError(error)
    setError(typeof textToDisplay === "string" ? textToDisplay : JSON.stringify(textToDisplay)) // Prevent objects from messing things up
}

/**
 * Simple utility to make it easier to add a danger alert
 * @param {{ error: string }} props 
 * @returns React Bootstrap Alert
 */
export function CMTDangerAlert({ error, ...props }) {
    return error && <Alert className="my-3" variant="danger" {...props}>{error}</Alert>
}