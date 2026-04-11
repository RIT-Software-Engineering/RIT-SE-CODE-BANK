export function isRegister(token) {
    return /^R[0-7]$/.test(token);
}

export function isNumber(token) {
    return /(^-?\d+$)|(^0x[0-9A-Fa-f]+$)/.test(token);
}

export function isLabel(token) {
    return /^[a-zA-Z._][a-zA-Z0-9._]*$/.test(token);
}

export function getRegisterNumber(token) {
    return Number(token[1]);
}

export function isWhitespace(char) {
    return (/\s/).test(char)
}

export function isSymbol(char) {
    return (/[ (),:#@+]/).test(char);
}

export function isStringLiteral(token) {
    return /^".*"$/.test(token);
}

