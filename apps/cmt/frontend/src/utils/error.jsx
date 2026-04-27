import { CMTError, CMTErrorToString, extractUserFacingError } from "@se-code-bank/cmt-shared-utilities"
import { Alert } from "react-bootstrap"

/**
 * ### Utility function to turn CMTFetch's catch block from this:
 * 
 * ```
 * CMTJsonFetch('DELETE', `resources/${resourceId}`)
 *      .then(refresh)
 *      .catch(error => {
 *          const wrappedError = new CMTError({ userFacingMessage: "Error deleting resource", cause: error })
 *          console.log(CMTErrorToString(wrappedError))
 *          const textToDisplay = extractUserFacingError(wrappedError)
 *          setError(textToDisplay)
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
 * If your catch function is more complicated, see {@link handleError}
 * 
 * Keep in mind that even though it is advisable to give a userFacingMessage, that in an ideal scenario there will be a more specific message presented to the user. Check out the shared-utilities package for more information about the CMTError system.
 * 
 * 
 * @param {string} userFacingMessage 
 * @param {React.Dispatch<import("react").SetStateAction<string>> | ((error: string) => void)} [setError] 
 * @returns 
 */
export function createErrorHandler(userFacingMessage, setError) {
    return error => {
        const wrappedError = new CMTError({ userFacingMessage , cause: error })
        handleError(wrappedError, setError)
    }
}

/**
 * ### Utility function to support more complex error logic. Should be used if {@link createErrorHandler} is too specific
 * 
 * ```
 * CMTJsonFetch('DELETE', `resources/${resourceId}`)
 *      .then(refresh)
 *      .catch(error => {
 *          const wrappedError = new CMTError({ userFacingMessage: "Error deleting resource", cause: error })
 *          handleError(wrappedError, set)
 *          // whatever you want
 *          // setResource(null) or whatever
 *      })
 * ```
 * 
 * If you are lazy and don't have a setError function, you can even do this! But, this means that the user *might* see
 * developer-facing errors, since you aren't providing a guaranteed user facing message.
 * 
 * ```
 * CMTJsonFetch('DELETE', `resources/${resourceId}`)
 *      .then(refresh)
 *      .catch(handleError)
 * ```
 * 
 * @param {any} error 
 * @param {React.Dispatch<import("react").SetStateAction<string>> | ((error: string) => void)} [setError] 
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