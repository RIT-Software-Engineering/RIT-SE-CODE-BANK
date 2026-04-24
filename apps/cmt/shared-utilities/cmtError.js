/**
 * An error class that allows you to provide user facing messages which, whether thrown in the frontend or backend, should eventually show the uesr the user facing message.
 * 
 * We don't just use message, since that means errors the user isn't meant to see (TypeErrors, etc) won't make it to the user.
 * 
 * A good example of how this can work is in CMT's course POST endpoint. We have a special error thrown inside of the promise, and then a general error if anything fails.
 * If the promise throws a different error that doesn't contain a user facing message (like a TypeError), then we can return that error AND a proper user facing message to display.
 * 
 * @extends Error
 */
export class CMTError extends Error {
    /**
     * @param {Object} props
     * @param {string} [props.message] If not provided, then the userFacingMessage will be used instead.
     * @param {string} [props.userFacingMessage]
     * @param {unknown} [props.cause]
     */
    constructor({ message, userFacingMessage, cause }) {
        super(
            message || userFacingMessage || "This error is likely a wrapper error. See the cause for more info.", 
            { cause: cause ?? null } // Required to be not undefined
        )
        this.userFacingMessage = userFacingMessage
        this.cause = cause
    }
}

/**
 * Prints a developer-facing representation of this error. Meant to ensure that full error information is printed.
 */
export function CMTErrorToString(error) {
    function errorToString(error) {
        return (
            error instanceof Error
                ? [error]
                : [
                    `User Facing Message: ${error.userFacingMessage}`,
                    `Stack: ${error.stack}`,
                ]
        ).concat(error.cause && [
            `\nThis error was a direct result of this error:`,
            errorToString(error.cause)
        ]).join("\n")
    }
    return errorToString(error)
}

/**
 * Default error serialization is complete garbo, so do it manually. This literally just exports fields it's so simple. Im sure these fields are obfuscated by default for security. This is less secure. Too bad our code is open source.
 * @param {any} error 
 */
export function serializeError(error) {
    if (!error) return undefined
    return {
        message: error.message,
        userFacingMessage: error.userFacingMessage,
        stack: error.stack,
        cause: serializeError(error.cause),
    }
}

/**
 * Given an error, finds the most specific user-facing error contained in it. This means it will go up the tree of "cause"s as far as it can.
 * @param {any} error 
 */
export function extractUserFacingError(error) {
    let mostSpecificError, mostSpecificMessage, mostSpecificUserFacingMessage
    
    let currentError = error
    while (currentError) {
        mostSpecificError = currentError

        if (currentError.message)
            mostSpecificMessage = currentError.message

        if (currentError.userFacingMessage)
            mostSpecificUserFacingMessage = currentError.userFacingMessage
        
        currentError = currentError.cause
    }

    return mostSpecificUserFacingMessage ?? mostSpecificMessage ?? mostSpecificError
}