/**
 * Determines if a given value is in the format of a register.
 * @param {string} token The given string.
 * @return {boolean} The boolean result of the regex test.
 */
export function isRegister(token) {
    return /^R[0-7]$/.test(token);
}

/**
 * Determines if a given value is in the format of a number. Used to
 * allow negative number and hex formats.
 * @param {string} token The given string.
 * @return {boolean} The boolean result of the regex test.
 */
export function isNumber(token) {
    return /(^-?\d+$)|(^0x[0-9A-Fa-f]+$)/.test(token);
}

/**
 * Determines if a given value is in the format of a label. Used to
 * allow account for the pdp11 rules of formatting a label.
 * @param {string} token The given string.
 * @return {boolean} The boolean result of the regex test.
 */
export function isLabel(token) {
    return /^[a-zA-Z._][a-zA-Z0-9._]*$/.test(token);
}

/**
 * Determines the register number.
 * @param {string} token The given string.
 * @return {number} The number value of the register.
 */
export function getRegisterNumber(token) {
    return Number(token[1]);
}

/**
 * Determines if a given value is whitespace.
 * @param {string} token The given string.
 * @return {boolean} The boolean result of the regex test.
 */
export function isWhitespace(char) {
    return (/\s/).test(char)
}

/**
 * Determines if a given value is a specificed symbol.
 * @param {string} token The given string.
 * @return {boolean} The boolean result of the regex test.
 */
export function isSymbol(char) {
    return (/[ (),:#@+]/).test(char);
}

/**
 * Determines if a given value is a string literal. Must be surrounded by quotes.
 * @param {string} token The given string.
 * @return {boolean} The boolean result of the regex test.
 */
export function isStringLiteral(token) {
    return /^".*"$/.test(token);
}

