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
export function CMTInfo(message) {
    CMTLog(message, false)
}

/**
 * Prints a message with the date prefixed and a stack trace afterwards. Uses `CMTLog`
 * @param {string} message 
 */
export function CMTError(message) {
    CMTLog(message, true)
}

export function getTimeString() {
    const date = new Date()
    if (process.env.NODE_ENV === "development") return `${date.getMonth()}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    else return new Date().toISOString()
}