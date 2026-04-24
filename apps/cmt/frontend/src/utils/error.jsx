import { CMTErrorToString, extractUserFacingError } from "@se-code-bank/cmt-shared-utilities"
import { Alert } from "react-bootstrap"

/**
 * Utility function for not filling the user's console with errors while also making error state management easier.
 * 
 * @param {Error | any} error Javascript Error, from something like a .catch. or just whatever
 * @param {React.Dispatch<import("react").SetStateAction<string>>} [setError] will set the error to either the userFacingDescription if given, or the description.
 */
export function LogError(error, setError) {
    console.error("Error from LogError:", CMTErrorToString(error))
    if (!setError) return

    const textToDisplay = 
        extractUserFacingError(error)
        || error.message
        || error

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