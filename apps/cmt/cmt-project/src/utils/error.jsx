import { Alert } from "react-bootstrap"

/**
 * Utility function for not filling the user's console with errors while also making error state management easier.
 * 
 * @param {string} description technical description of error. Or, generic description, if you only wish to provide one description
 * @param {Error | any} error Javascript Error, from something like a .catch. or just whatever
 * @param {React.Dispatch<import("react").SetStateAction<string>>} [setError] will set the error to either the userFacingDescription if given, or the description.
 * @param {string} [userFacingDescription] If you want to present the user with a simpler message, provide this field. 
 */
export function LogError(description, error, setError, userFacingDescription) {
    if (process.env.NODE_ENV === "DEVELOPMENT") 
        console.error(description, error)

    setError && setError(userFacingDescription ?? description)
}

/**
 * Simple utility to make it easier to add a danger alert
 * @param {{ error: string }} props 
 * @returns React Bootstrap Alert
 */
export function CMTDangerAlert({ error, ...props }) {
    return error && <Alert className="my-3" variant="danger" {...props}>{error}</Alert>
}