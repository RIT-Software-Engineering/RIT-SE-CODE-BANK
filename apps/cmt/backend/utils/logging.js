import { getTimeString } from "@se-code-bank/cmt-shared-utilities"

/**
 * Prints a message with the date prefixed. Can also print a stack trace
 * @param {string} message
 * @param {boolean} doPrintTrace 
 */
export function CMTLog(message, doPrintTrace) {
    console.log(getTimeString(), "-", message, doPrintTrace ? "\n Stack trace for this log:" : "")
    if (doPrintTrace) console.trace() 
}

/**
 * Prints a message with the date prefixed. Uses `CMTLog`
 * @param {string} message 
 */
export function CMTLogInfo(message) {
    CMTLog(message, false)
}

/**
 * Prints a message with the date prefixed and a stack trace afterwards. Uses `CMTLog`
 * @param {string} message 
 */
export function CMTLogError(message) {
    CMTLog(message, true)
}